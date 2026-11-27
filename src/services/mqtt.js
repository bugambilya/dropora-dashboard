
import mqtt from "mqtt";

// ======================================
// MQTT CONFIGURATION
// ======================================

const BROKER =
  import.meta.env.VITE_MQTT_BROKER ||
  "wss://maqiatto.com:4883";

const MQTT_USERNAME =
  import.meta.env.VITE_MQTT_USERNAME;

const MQTT_PASSWORD =
  import.meta.env.VITE_MQTT_PASSWORD;

const DEVICE = MQTT_USERNAME;

export const TOPICS = {
  maintenance_req: `${DEVICE}/maintenance_req`,
  remote_req: `${DEVICE}/remote_req`,
  status_req: `${DEVICE}/status_req`,

  maintenance_res: `${DEVICE}/maintenance_res`,
  remote_res: `${DEVICE}/remote_res`,
  status_res: `${DEVICE}/status_res`,
};

// ======================================
// MQTT CLIENT
// ======================================

let client = null;
let connectingPromise = null;

const listeners = {
  maintenance_res: new Set(),
  remote_res: new Set(),
  status_res: new Set(),
};

const parsePayload = (message) => {
  const text = message.toString();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// ======================================
// CONNECT TO BROKER
// ======================================

export const connectMqtt = () => {
  if (!MQTT_USERNAME || !MQTT_PASSWORD) {
    return Promise.reject(
      new Error("MQTT credentials are not configured.")
    );
  }

  if (client?.connected) {
    return Promise.resolve(client);
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = new Promise((resolve, reject) => {
    let settled = false;

    const mqttClient = mqtt.connect(BROKER, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,

      clientId:
        `dropora_web_${Math.random()
          .toString(16)
          .slice(2, 12)}`,

      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 3000,
      keepalive: 30,
    });

    client = mqttClient;

    mqttClient.on("connect", () => {
      console.log("DROPORA MQTT connected.");

      const responseTopics = [
        TOPICS.maintenance_res,
        TOPICS.remote_res,
        TOPICS.status_res,
      ];

      mqttClient.subscribe(responseTopics, (error) => {
        if (error) {
          console.error("MQTT subscription error:", error);

          if (!settled) {
            settled = true;
            connectingPromise = null;
            reject(error);
          }

          return;
        }

        console.log("Subscribed to MQTT response topics.");

        if (!settled) {
          settled = true;
          connectingPromise = null;
          resolve(mqttClient);
        }
      });
    });

    mqttClient.on("message", (topic, message) => {
      const payload = parsePayload(message);

      console.log("MQTT RESPONSE:", topic, payload);

      Object.entries(TOPICS).forEach(([key, topicName]) => {
        if (
          key.endsWith("_res") &&
          topicName === topic
        ) {
          listeners[key].forEach((callback) => {
            try {
              callback(payload);
            } catch (error) {
              console.error("MQTT listener error:", error);
            }
          });
        }
      });
    });

    mqttClient.on("reconnect", () => {
      console.log("Reconnecting to DROPORA MQTT...");
    });

    mqttClient.on("offline", () => {
      console.warn("DROPORA MQTT offline.");
    });

    mqttClient.on("error", (error) => {
      console.error("MQTT connection error:", error);

      if (!settled) {
        settled = true;
        connectingPromise = null;
        reject(error);
      }
    });

    mqttClient.on("close", () => {
      console.warn("MQTT connection closed.");
    });
  });

  return connectingPromise;
};

// ======================================
// CONNECTION STATUS
// ======================================

export const isMqttConnected = () => {
  return Boolean(client?.connected);
};

// ======================================
// SUBSCRIBE TO RESPONSE EVENTS
// ======================================

export const onMqttMessage = (topicName, callback) => {
  if (!listeners[topicName]) {
    throw new Error(`Unknown MQTT response: ${topicName}`);
  }

  listeners[topicName].add(callback);

  return () => {
    listeners[topicName].delete(callback);
  };
};

// ======================================
// PUBLISH MESSAGE
// ======================================

export const publishMqtt = async (topicName, payload) => {
  const topic = TOPICS[topicName];

  if (!topic || !topicName.endsWith("_req")) {
    throw new Error("Invalid MQTT request topic.");
  }

  const mqttClient = await connectMqtt();

  return new Promise((resolve, reject) => {
    mqttClient.publish(
      topic,
      JSON.stringify(payload),
      { qos: 1, retain: false },
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        console.log("MQTT REQUEST:", topic, payload);
        resolve({ success: true });
      }
    );
  });
};

// ======================================
// WAIT FOR DEVICE RESPONSE
// ======================================

export const waitForMqttResponse = (
  topicName,
  predicate = () => true,
  timeout = 10000
) => {
  return new Promise((resolve, reject) => {
    let unsubscribe;

    const timer = setTimeout(() => {
      unsubscribe?.();

      reject(
        new Error("Device response timed out. Please try again.")
      );
    }, timeout);

    unsubscribe = onMqttMessage(topicName, (payload) => {
      if (!predicate(payload)) return;

      clearTimeout(timer);
      unsubscribe();
      resolve(payload);
    });
  });
};

// ======================================
// REMOTE LOCK AND SLEEP CONTROL
// ======================================

export const sendRemoteMqttCommand = async ({
  doorLocked,
  powerSaving,
}) => {
  const expected = {
    lock: doorLocked ? "locked" : "unlocked",
    sleep: powerSaving ? "on" : "off",
  };

  const responsePromise = waitForMqttResponse(
    "remote_res",
    (response) =>
      response?.lock === expected.lock &&
      response?.sleep === expected.sleep
  );

  try {
    await publishMqtt("remote_req", expected);
    return await responsePromise;
  } catch (error) {
    // Prevent an abandoned response timeout.
    responsePromise.catch(() => {});
    throw error;
  }
};

// ======================================
// REQUEST DEVICE STATUS
// ======================================

export const requestDeviceStatus = async () => {
  const responsePromise = waitForMqttResponse(
    "status_res"
  );

  try {
    await publishMqtt("status_req", {});

    return await responsePromise;
  } catch (error) {
    responsePromise.catch(() => {});
    throw error;
  }
};

// ======================================
// MAINTENANCE MODE
// ======================================

export const startMaintenance = async () => {
  await publishMqtt("maintenance_req", {
    action: "start",
  });
};

export const stopMaintenance = async () => {
  await publishMqtt("maintenance_req", {
    action: "stop",
  });
};

// ======================================
// DISCONNECT
// ======================================

export const disconnectMqtt = () => {
  if (client) {
    client.end(true);
    client = null;
    connectingPromise = null;
  }
};
