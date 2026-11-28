
import { apiRequest } from "./api";
import mqtt from "mqtt";

// ======================================
// MQTT CONFIGURATION
// ======================================

const BROKER =
  import.meta.env.VITE_MQTT_BROKER ||
  "wss://maqiatto.com:4883";

const MQTT_USERNAME = import.meta.env.VITE_MQTT_USERNAME;
const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD;

const DEVICE =
  import.meta.env.VITE_MQTT_DEVICE_TOPIC_ROOT ||
  MQTT_USERNAME;

const TOPICS = {
  maintenance_req: `${DEVICE}/maintenance_req`,
  remote_req: `${DEVICE}/remote_req`,
  status_req: `${DEVICE}/status_req`,

  maintenance_res: `${DEVICE}/maintenance_res`,
  remote_res: `${DEVICE}/remote_res`,
  status_res: `${DEVICE}/status_res`,
};

// ======================================
// MQTT CLIENT STATE
// ======================================

let mqttClient = null;
let connectionPromise = null;
let subscriptionPromise = null;

const pendingRequests = [];
const mqttListeners = new Set();

// ======================================
// MQTT EVENT SYSTEM
// ======================================

const emitMqttEvent = (event) => {
  mqttListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.error("MQTT event listener error:", error);
    }
  });
};

export const subscribeMqttEvents = (callback) => {
  if (typeof callback !== "function") {
    throw new Error("MQTT event listener must be a function.");
  }

  mqttListeners.add(callback);

  return () => {
    mqttListeners.delete(callback);
  };
};

// ======================================
// PARSE MQTT MESSAGE
// ======================================

const parseMessage = (message) => {
  const raw = message.toString().trim();

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

// ======================================
// DEVICE MODE NORMALIZER
// ======================================

export const normalizeDeviceMode = (response) => {
  let mode = response;

  if (response && typeof response === "object") {
    mode =
      response.mode ??
      response.device_mode ??
      response.status ??
      response.power_mode ??
      response.message;
  }

  if (typeof mode !== "string") {
    return null;
  }

  const normalized = mode.trim().toUpperCase();

  if (
    ["NORMAL", "SLEEP", "MAINTENANCE"].includes(normalized)
  ) {
    return normalized;
  }

  return null;
};

// ======================================
// TELEMETRY RESPONSE VALIDATION
// ======================================

const hasTelemetryFields = (response) => {
  if (
    !response ||
    typeof response !== "object" ||
    Array.isArray(response)
  ) {
    return false;
  }

  const payload =
    response.payload &&
    typeof response.payload === "object"
      ? response.payload
      : response.data &&
        typeof response.data === "object"
      ? response.data
      : response.telemetry &&
        typeof response.telemetry === "object"
      ? response.telemetry
      : response;

  const recognizedFields = [
    "object_weight_g",
    "box_fill_percent",
    "solenoid_locked",
    "door_closed",
    "power_saving",
    "ultrasonic_distance_cm",
    "distance_cm",
    "proximity_distance_cm",
    "proximity_cm",
    "object_distance_cm",
    "distance",
  ];

  return recognizedFields.some((field) =>
    Object.prototype.hasOwnProperty.call(payload, field)
  );
};

// ======================================
// HANDLE MQTT RESPONSE
// ======================================

const handleMqttMessage = (topic, message) => {
  const raw = message.toString().trim();
  const response = parseMessage(message);

  console.log("--------------------------------");
  console.log("MQTT RESPONSE TOPIC:", topic);
  console.log("MQTT RAW RESPONSE:", raw);
  console.log("MQTT PARSED RESPONSE:", response);
  console.log("MQTT RESPONSE TYPE:", typeof response);
  console.log("--------------------------------");

  emitMqttEvent({
    type: "message",
    topic,
    data: response,
    raw,
  });

  const requestIndex = pendingRequests.findIndex(
    (request) => {
      if (request.responseTopic !== topic) {
        return false;
      }

      try {
        return request.matches(response);
      } catch (error) {
        console.error("MQTT response matcher error:", error);
        return false;
      }
    }
  );

  if (requestIndex === -1) {
    return;
  }

  const request = pendingRequests.splice(requestIndex, 1)[0];

  clearTimeout(request.timeout);

  request.resolve(response);
};

// ======================================
// REJECT PENDING REQUESTS
// ======================================

const rejectPendingRequests = (message) => {
  while (pendingRequests.length > 0) {
    const request = pendingRequests.shift();

    clearTimeout(request.timeout);
    request.reject(new Error(message));
  }
};

// ======================================
// CONNECT TO MQTT
// ======================================

const ensureConnected = () => {
  if (
    !BROKER ||
    !MQTT_USERNAME ||
    !MQTT_PASSWORD ||
    !DEVICE
  ) {
    return Promise.reject(
      new Error(
        "MQTT configuration is missing. Check your .env file."
      )
    );
  }

  if (mqttClient?.connected) {
    return Promise.resolve(mqttClient);
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (!mqttClient) {
    emitMqttEvent({
      type: "connection",
      status: "CONNECTING",
    });

    mqttClient = mqtt.connect(BROKER, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,

      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 3000,
      connectTimeout: 10000,
      keepalive: 30,
    });

    mqttClient.on("message", handleMqttMessage);

    mqttClient.on("connect", () => {
      console.log("MQTT connected to Maqiatto.");

      emitMqttEvent({
        type: "connection",
        status: "CONNECTED",
      });

      emitMqttEvent({
        type: "log",
        message: "Connected to Maqiatto MQTT broker.",
      });
    });

    mqttClient.on("close", () => {
      console.warn("MQTT connection closed.");

      subscriptionPromise = null;

      emitMqttEvent({
        type: "connection",
        status: "DISCONNECTED",
      });

      rejectPendingRequests(
        "MQTT connection was interrupted. Please try again."
      );
    });

    mqttClient.on("error", (error) => {
      console.error("MQTT connection error:", error);

      emitMqttEvent({
        type: "error",
        message: error.message || "MQTT connection error.",
      });
    });

    mqttClient.on("offline", () => {
      console.warn("MQTT client is offline.");

      emitMqttEvent({
        type: "connection",
        status: "DISCONNECTED",
      });
    });

    mqttClient.on("reconnect", () => {
      console.log("Reconnecting to MQTT...");

      emitMqttEvent({
        type: "connection",
        status: "RECONNECTING",
      });
    });
  }

  const client = mqttClient;

  connectionPromise = new Promise((resolve, reject) => {
    const cleanup = () => {
      client.removeListener("connect", onConnect);
      client.removeListener("error", onError);
    };

    const onConnect = () => {
      cleanup();
      resolve(client);
    };

    const onError = (error) => {
      cleanup();
      reject(error);
    };

    client.once("connect", onConnect);
    client.once("error", onError);
  }).finally(() => {
    connectionPromise = null;
  });

  return connectionPromise;
};

// ======================================
// SUBSCRIBE TO RESPONSE TOPICS
// ======================================

const ensureSubscribed = async () => {
  const client = await ensureConnected();

  if (subscriptionPromise) {
    return subscriptionPromise;
  }

  const responseTopics = [
    TOPICS.maintenance_res,
    TOPICS.remote_res,
    TOPICS.status_res,
  ];

  subscriptionPromise = new Promise((resolve, reject) => {
    client.subscribe(
      responseTopics,
      { qos: 1 },
      (error, granted) => {
        if (error) {
          subscriptionPromise = null;
          reject(error);
          return;
        }

        console.log("Subscribed to MQTT response topics:", granted);

        emitMqttEvent({
          type: "log",
          message: "Subscribed to MQTT response topics.",
          data: responseTopics,
        });

        resolve(granted);
      }
    );
  });

  return subscriptionPromise;
};

// ======================================
// PUBLIC MQTT INITIALIZATION
// ======================================

export const connectLockerMqtt = async () => {
  await ensureSubscribed();

  return {
    success: true,
    connected: Boolean(mqttClient?.connected),
    broker: BROKER,
    device: DEVICE,
    topics: TOPICS,
  };
};

// ======================================
// PUBLISH REQUEST AND WAIT FOR RESPONSE
// ======================================

const publishAndWait = async ({
  requestTopic,
  responseTopic,
  payload,
  matches,
  timeoutMs = 10000,
}) => {
  await ensureSubscribed();

  if (!mqttClient?.connected) {
    throw new Error("MQTT is not connected.");
  }

  if (
    pendingRequests.some(
      (request) => request.responseTopic === responseTopic
    )
  ) {
    throw new Error(
      "Another command is still waiting for a device response. Please wait."
    );
  }

  return new Promise((resolve, reject) => {
    const request = {
      responseTopic,
      matches,
      resolve,
      reject,
      timeout: null,
    };

    request.timeout = setTimeout(() => {
      const index = pendingRequests.indexOf(request);

      if (index !== -1) {
        pendingRequests.splice(index, 1);
      }

      reject(
        new Error(
          `No valid response received from device on ${responseTopic}.`
        )
      );
    }, timeoutMs);

    pendingRequests.push(request);

    mqttClient.publish(
      requestTopic,
      JSON.stringify(payload),
      { qos: 1, retain: false },
      (error) => {
        if (!error) {
          console.log("MQTT REQUEST:", requestTopic, payload);

          emitMqttEvent({
            type: "log",
            message: "MQTT request published.",
            data: {
              topic: requestTopic,
              payload,
            },
          });

          return;
        }

        const index = pendingRequests.indexOf(request);

        if (index !== -1) {
          pendingRequests.splice(index, 1);
        }

        clearTimeout(request.timeout);
        reject(error);
      }
    );
  });
};

// ======================================
// GENERATE PAIRING CODE - REST
// ======================================

export const generatePairingCode = () => {
  return apiRequest("/locker/pairing-code", {
    method: "POST",
  });
};

// ======================================
// GET PAIRED LOCKERS - REST
// ======================================

export const getPairedLockers = () => {
  return apiRequest("/locker/paired", {
    method: "GET",
  });
};

// ======================================
// UNPAIR LOCKER - REST
// ======================================

export const unpairLocker = (deviceUuid) => {
  if (!deviceUuid) {
    throw new Error("Locker device UUID is required.");
  }

  return apiRequest(
    `/locker/unpair/${encodeURIComponent(deviceUuid)}`,
    {
      method: "DELETE",
    }
  );
};

// ======================================
// REMOTE LOCKER CONTROL - MQTT
// LOCK / UNLOCK / SLEEP / WAKE UP
// ======================================

export const sendRemoteCommand = ({
  deviceUuid,
  doorLocked,
  powerSaving,
}) => {
  if (!deviceUuid) {
    throw new Error("Locker device UUID is required.");
  }

  if (typeof doorLocked !== "boolean") {
    throw new Error("Door lock state must be a boolean.");
  }

  if (typeof powerSaving !== "boolean") {
    throw new Error("Power saving state must be a boolean.");
  }

  const payload = {
    lock: doorLocked ? "locked" : "unlocked",
    sleep: powerSaving ? "on" : "off",
  };

  return publishAndWait({
    requestTopic: TOPICS.remote_req,
    responseTopic: TOPICS.remote_res,
    payload,

    matches: (response) =>
      response &&
      typeof response === "object" &&
      response.lock === payload.lock &&
      response.sleep === payload.sleep,
  });
};

// ======================================
// START MAINTENANCE MODE - MQTT
// ======================================

export const startMaintenance = () => {
  return publishAndWait({
    requestTopic: TOPICS.maintenance_req,
    responseTopic: TOPICS.maintenance_res,

    payload: {
      action: "start",
    },

    matches: (response) =>
      response &&
      typeof response === "object" &&
      (
        "raw_ultrasonic" in response ||
        "raw_loadcell" in response ||
        "reed_switch" in response ||
        "master_status" in response ||
        "slave_status" in response
      ),
  });
};

// ======================================
// STOP MAINTENANCE MODE - MQTT
// ======================================

export const stopMaintenance = () => {
  return publishAndWait({
    requestTopic: TOPICS.maintenance_req,
    responseTopic: TOPICS.maintenance_res,

    payload: {
      action: "stop",
    },

    matches: (response) =>
      response &&
      typeof response === "object" &&
      (
        "raw_ultrasonic" in response ||
        "raw_loadcell" in response ||
        "reed_switch" in response ||
        "master_status" in response ||
        "slave_status" in response
      ),
  });
};

// ======================================
// REQUEST DEVICE TELEMETRY - MQTT
// Expects JSON sensor readings
// ======================================

export const requestDeviceStatus = () => {
  return publishAndWait({
    requestTopic: TOPICS.status_req,
    responseTopic: TOPICS.status_res,

    payload: {},

    matches: hasTelemetryFields,

    timeoutMs: 15000,
  });
};

// ======================================
// REQUEST DEVICE MODE - MQTT
// Expects NORMAL / SLEEP / MAINTENANCE
// ======================================

export const requestDeviceMode = () => {
  return publishAndWait({
    requestTopic: TOPICS.status_req,
    responseTopic: TOPICS.status_res,

    payload: {},

    matches: (response) =>
      normalizeDeviceMode(response) !== null,

    timeoutMs: 10000,
  });
};

// ======================================
// GET REMOTE COMMAND HISTORY - REST
// ======================================

export const getRemoteCommands = (
  deviceUuid,
  offset = 0,
  limit = 10
) => {
  if (!deviceUuid) {
    throw new Error("Locker device UUID is required.");
  }

  return apiRequest(
    `/remote/${encodeURIComponent(
      deviceUuid
    )}/commands?offset=${offset}&limit=${limit}`,
    {
      method: "GET",
    }
  );
};

// ======================================
// MQTT CONNECTION STATUS
// ======================================

export const getMqttConnectionStatus = () => {
  return mqttClient?.connected
    ? "CONNECTED"
    : "DISCONNECTED";
};

// ======================================
// DISCONNECT MQTT
// ======================================

export const disconnectLockerMqtt = () => {
  rejectPendingRequests("MQTT connection was closed.");

  if (mqttClient) {
    mqttClient.end(true);
    mqttClient = null;
  }

  connectionPromise = null;
  subscriptionPromise = null;

  emitMqttEvent({
    type: "connection",
    status: "DISCONNECTED",
  });
};
