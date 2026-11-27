import { apiRequest } from "./api";
import mqtt from "mqtt";

// ======================================
// MQTT CONFIGURATION
// ======================================

const BROKER = import.meta.env.VITE_MQTT_BROKER;
const MQTT_USERNAME = import.meta.env.VITE_MQTT_USERNAME;
const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD;

const DEVICE =
  import.meta.env.VITE_MQTT_DEVICE_TOPIC_ROOT || MQTT_USERNAME;

const TOPICS = {
  maintenance_req: `${DEVICE}/maintenance_req`,
  remote_req: `${DEVICE}/remote_req`,
  status_req: `${DEVICE}/status_req`,
  maintenance_res: `${DEVICE}/maintenance_res`,
  remote_res: `${DEVICE}/remote_res`,
  status_res: `${DEVICE}/status_res`,
};

let mqttClient = null;
let connectionPromise = null;
let subscriptionPromise = null;

const pendingRequests = [];

// ======================================
// PARSE MQTT MESSAGE
// ======================================

const parseMessage = (message) => {
  const text = message.toString();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// ======================================
// HANDLE MQTT RESPONSE
// ======================================

const handleMqttMessage = (topic, message) => {
  const response = parseMessage(message);

  const requestIndex = pendingRequests.findIndex(
    (request) =>
      request.responseTopic === topic &&
      request.matches(response)
  );

  if (requestIndex === -1) return;

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
  if (!BROKER || !MQTT_USERNAME || !MQTT_PASSWORD || !DEVICE) {
    return Promise.reject(
      new Error("MQTT configuration is missing. Check your .env file.")
    );
  }

  if (mqttClient?.connected) {
    return Promise.resolve(mqttClient);
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (!mqttClient) {
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

    mqttClient.on("close", () => {
      subscriptionPromise = null;
      rejectPendingRequests(
        "MQTT connection was interrupted. Please try again."
      );
    });

    mqttClient.on("error", (error) => {
      console.error("MQTT connection error:", error);
    });

    mqttClient.on("offline", () => {
      console.warn("MQTT client is offline.");
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
    client.subscribe(responseTopics, { qos: 1 }, (error) => {
      if (error) {
        subscriptionPromise = null;
        reject(error);
        return;
      }

      resolve();
    });
  });

  return subscriptionPromise;
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
        new Error(`No response received from device on ${responseTopic}.`)
      );
    }, timeoutMs);

    pendingRequests.push(request);

    mqttClient.publish(
      requestTopic,
      JSON.stringify(payload),
      { qos: 1, retain: false },
      (error) => {
        if (!error) return;

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
    { method: "DELETE" }
  );
};

// ======================================
// REMOTE LOCKER CONTROL - MQTT
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
    payload: { action: "start" },
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
    payload: { action: "stop" },
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
// REQUEST DEVICE STATUS - MQTT
// ======================================

export const requestDeviceStatus = () => {
  return publishAndWait({
    requestTopic: TOPICS.status_req,
    responseTopic: TOPICS.status_res,
    payload: {},
    matches: (response) =>
      ["NORMAL", "SLEEP", "MAINTENANCE"].includes(
        String(response).trim().toUpperCase()
      ),
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
    `/remote/${encodeURIComponent(deviceUuid)}/commands?offset=${offset}&limit=${limit}`,
    { method: "GET" }
  );
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
};