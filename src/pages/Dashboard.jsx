import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  Package,
  CheckCircle2,
  Clock3,
  XCircle,
  Lock,
  Unlock,
  ChevronRight,
  Moon,
  LoaderCircle,
  Radio,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

import {
  sendRemoteCommand,
  startMaintenance,
  stopMaintenance,
  requestDeviceStatus,
  normalizeDeviceMode,
  subscribeMqttEvents,
  connectLockerMqtt,
} from "../services/locker";

import { getDeliveries } from "../services/deliveryService";
import { getSleepEvents } from "../services/sleepEventService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function Dashboard({ darkMode }) {
  const navigate = useNavigate();

  // ======================================
  // LOCKER STATE
  // ======================================

  const [lockers, setLockers] = useState([]);
  const [lockersLoading, setLockersLoading] = useState(true);
  const [lockersError, setLockersError] = useState("");

  const [telemetry, setTelemetry] = useState([]);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [telemetryError, setTelemetryError] = useState("");

  const [isControlling, setIsControlling] = useState(false);
  const [isChangingMode, setIsChangingMode] = useState(false);

  const [powerSavingOverride, setPowerSavingOverride] = useState(null);
  const [lockOverride, setLockOverride] = useState(null);
  const [deviceMode, setDeviceMode] = useState("NORMAL");

  const [controlError, setControlError] = useState("");
  const [controlMessage, setControlMessage] = useState("");

  // Remote request selections. Clicking a row changes the requested
  // state; the Send Remote Request button sends both selected values.
  const [remoteDraft, setRemoteDraft] = useState({
    doorLocked: null,
    powerSaving: null,
  });

  // ======================================
  // MQTT STATE
  // ======================================

  const [mqttConnection, setMqttConnection] = useState("DISCONNECTED");
  const [mqttMessages, setMqttMessages] = useState([]);
  const [mqttStatusLoading, setMqttStatusLoading] = useState(false);
  const [mqttStatusError, setMqttStatusError] = useState("");

  const addMqttLog = useCallback((type, message) => {
    const entry = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMqttMessages((previous) => [entry, ...previous].slice(0, 30));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeMqttEvents((event) => {
      if (event.type === "connection") {
        setMqttConnection(event.status);
      }

      if (event.type === "message") {
        addMqttLog("response", {
          topic: event.topic,
          response: event.data,
          raw: event.raw,
        });
      }

      if (event.type === "log") {
        addMqttLog("info", {
          message: event.message,
          data: event.data,
        });
      }

      if (event.type === "error") {
        addMqttLog("error", {
          message: event.message,
        });
      }
    });

    return unsubscribe;
  }, [addMqttLog]);

  // ======================================
  // FETCH PAIRED LOCKERS
  // ======================================

  const fetchLockers = useCallback(async () => {
    try {
      setLockersLoading(true);
      setLockersError("");

      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Please log in to view your paired lockers.");
      }

      const response = await fetch(`${API_BASE}/api/locker/paired`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load paired lockers.");
      }

      setLockers(Array.isArray(data.devices) ? data.devices : []);
    } catch (error) {
      console.error("Fetch lockers error:", error);
      setLockersError(error.message || "Unable to load lockers.");
    } finally {
      setLockersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLockers();
  }, [fetchLockers]);

  const deviceUuid = lockers[0]?.device_uuid;

  // ======================================
  // INITIALIZE MQTT
  // ======================================

  useEffect(() => {
    if (!deviceUuid) return;

    let active = true;

    const initializeMqtt = async () => {
      try {
        const result = await connectLockerMqtt();

        if (active) {
          console.log("DROPORA MQTT initialized:", result);
        }
      } catch (error) {
        if (active) {
          console.error("MQTT initialization error:", error);
          addMqttLog("error", {
            message: error.message || "Unable to connect to MQTT.",
          });
        }
      }
    };

    initializeMqtt();

    return () => {
      active = false;
    };
  }, [deviceUuid, addMqttLog]);

  // ======================================
  // DEVICE STATUS
  // ======================================

  const applyDeviceStatus = useCallback((response) => {
    const mode = normalizeDeviceMode(response);

    if (!mode) return;

    setDeviceMode(mode);

    if (mode === "SLEEP") {
      setPowerSavingOverride(true);
    } else if (mode === "NORMAL") {
      setPowerSavingOverride(false);
    }
  }, []);

  const handleRequestStatus = async () => {
    if (!deviceUuid) {
      setMqttStatusError("Please pair a locker first.");
      return;
    }

    try {
      setMqttStatusLoading(true);
      setMqttStatusError("");

      addMqttLog("request", {
        topic: "status_req",
        payload: {},
      });

      const response = await requestDeviceStatus();
      applyDeviceStatus(response);

      addMqttLog("success", {
        message: "Device status received.",
        response,
      });
    } catch (error) {
      console.error("MQTT status request error:", error);

      setMqttStatusError(
        error.message || "Unable to retrieve device status."
      );

      addMqttLog("error", {
        message: error.message || "Status request failed.",
      });
    } finally {
      setMqttStatusLoading(false);
    }
  };

  useEffect(() => {
    if (!deviceUuid) return;

    let active = true;

    const requestInitialStatus = async () => {
      try {
        const response = await requestDeviceStatus();

        if (active) {
          applyDeviceStatus(response);
        }
      } catch (error) {
        if (active) {
          console.warn("Initial MQTT status request:", error.message);
        }
      }
    };

    requestInitialStatus();

    return () => {
      active = false;
    };
  }, [deviceUuid, applyDeviceStatus]);

  // ======================================
  // FETCH TELEMETRY
  // ======================================

  const fetchTelemetry = useCallback(async () => {
    if (!deviceUuid) {
      setTelemetry([]);
      return;
    }

    try {
      setTelemetryLoading(true);
      setTelemetryError("");

      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Please log in to view telemetry.");
      }

      const response = await fetch(
        `${API_BASE}/api/telemetry/${encodeURIComponent(
          deviceUuid
        )}?offset=0&limit=10`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load telemetry data.");
      }

      const records = Array.isArray(data.telemetry)
        ? data.telemetry
        : [];

      const latestPayload = records[0]?.payload || {};

      setPowerSavingOverride((requestedMode) =>
        requestedMode !== null &&
        latestPayload.power_saving === requestedMode
          ? null
          : requestedMode
      );

      setLockOverride((requestedLock) =>
        requestedLock !== null &&
        latestPayload.solenoid_locked === requestedLock
          ? null
          : requestedLock
      );

      if (typeof latestPayload.power_saving === "boolean") {
        setDeviceMode((currentMode) => {
          if (currentMode === "MAINTENANCE") return currentMode;
          return latestPayload.power_saving ? "SLEEP" : "NORMAL";
        });
      }

      setTelemetry(records);
    } catch (error) {
      console.error("Fetch telemetry error:", error);
      setTelemetryError(error.message || "Unable to load telemetry.");
    } finally {
      setTelemetryLoading(false);
    }
  }, [deviceUuid]);

  useEffect(() => {
    if (!deviceUuid) {
      setTelemetry([]);
      return;
    }

    fetchTelemetry();

    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, [deviceUuid, fetchTelemetry]);

  // ======================================
  // SLEEP HISTORY
  // ======================================

  const [sleepEvents, setSleepEvents] = useState([]);
  const [sleepLoading, setSleepLoading] = useState(false);
  const [sleepError, setSleepError] = useState("");

  const [sleepPagination, setSleepPagination] = useState({
    offset: 0,
    limit: 10,
    total: 0,
    has_more: false,
    next_offset: null,
  });

  const sleepRequestRef = useRef(false);

  const fetchSleepEvents = useCallback(
    async (offset = 0, append = false) => {
      if (!deviceUuid) {
        setSleepEvents([]);
        setSleepPagination({
          offset: 0,
          limit: 10,
          total: 0,
          has_more: false,
          next_offset: null,
        });
        return;
      }

      if (sleepRequestRef.current) return;

      sleepRequestRef.current = true;

      try {
        setSleepLoading(true);
        setSleepError("");

        const data = await getSleepEvents(deviceUuid, offset, 10);

        const events = Array.isArray(data.sleep_events)
          ? data.sleep_events
          : [];

        setSleepEvents((previous) => {
          if (!append) return events;

          const existingIds = new Set(previous.map((event) => event.id));

          return [
            ...previous,
            ...events.filter((event) => !existingIds.has(event.id)),
          ];
        });

        setSleepPagination(
          data.pagination || {
            offset,
            limit: 10,
            total: events.length,
            has_more: false,
            next_offset: null,
          }
        );
      } catch (error) {
        console.error("Fetch sleep history error:", error);
        setSleepError(error.message || "Unable to load sleep history.");
      } finally {
        sleepRequestRef.current = false;
        setSleepLoading(false);
      }
    },
    [deviceUuid]
  );

  useEffect(() => {
    if (!deviceUuid) {
      setSleepEvents([]);
      setSleepError("");
      setSleepPagination({
        offset: 0,
        limit: 10,
        total: 0,
        has_more: false,
        next_offset: null,
      });
      return;
    }

    fetchSleepEvents(0, false);

    const interval = setInterval(() => {
      fetchSleepEvents(0, false);
    }, 10000);

    return () => clearInterval(interval);
  }, [deviceUuid, fetchSleepEvents]);

  const formatSleepDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSleepDuration = (seconds) => {
    if (
      seconds === null ||
      seconds === undefined ||
      !Number.isFinite(Number(seconds))
    ) {
      return "In progress";
    }

    const totalSeconds = Math.max(0, Math.floor(Number(seconds)));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
    return `${remainingSeconds}s`;
  };

  // ======================================
  // LATEST TELEMETRY VALUES
  // ======================================

  const latestTelemetry = telemetry[0];
  const payload = latestTelemetry?.payload || {};

  const solenoidLocked = payload.solenoid_locked;
  const doorClosed = payload.door_closed;
  const powerSaving = payload.power_saving;

  const weight = payload.object_weight_g;
  const fillPercent = payload.box_fill_percent;

  const isLocked =
    lockOverride !== null ? lockOverride : solenoidLocked === true;

  const displayedPowerSaving =
    powerSavingOverride !== null
      ? powerSavingOverride
      : powerSaving === true;

  const requestedLock =
    remoteDraft.doorLocked !== null
      ? remoteDraft.doorLocked
      : isLocked;

  const requestedSleep =
    remoteDraft.powerSaving !== null
      ? remoteDraft.powerSaving
      : displayedPowerSaving;

  // ======================================
  // REMOTE CONTROL
  // ======================================

  const toggleRequestedLock = () => {
    setRemoteDraft((previous) => ({
      ...previous,
      doorLocked: !requestedLock,
    }));
  };

  const toggleRequestedSleep = () => {
    setRemoteDraft((previous) => ({
      ...previous,
      powerSaving: !requestedSleep,
    }));
  };

  const handleRemoteRequest = async () => {
    if (!deviceUuid) {
      setControlError("Please pair a locker first.");
      return;
    }

    if (
      typeof solenoidLocked !== "boolean" &&
      lockOverride === null &&
      remoteDraft.doorLocked === null
    ) {
      setControlError("Waiting for valid locker lock telemetry.");
      return;
    }

    try {
      setIsControlling(true);
      setControlError("");
      setControlMessage("");

      const data = await sendRemoteCommand({
        deviceUuid,
        doorLocked: requestedLock,
        powerSaving: requestedSleep,
      });

      setLockOverride(requestedLock);
      setPowerSavingOverride(requestedSleep);
      setDeviceMode(requestedSleep ? "SLEEP" : "NORMAL");

      setRemoteDraft({
        doorLocked: null,
        powerSaving: null,
      });

      setControlMessage(
        data?.message || "Remote request acknowledged by the device."
      );

      addMqttLog("request", {
        topic: "remote_req",
        payload: {
          door_locked: requestedLock,
          power_saving: requestedSleep,
        },
      });

      fetchTelemetry();
    } catch (error) {
      console.error("Remote request error:", error);
      setControlError(error.message || "Unable to send remote request.");

      addMqttLog("error", {
        message: error.message || "Remote request failed.",
      });
    } finally {
      setIsControlling(false);
    }
  };

  // ======================================
  // MAINTENANCE CONTROL
  // ======================================

  const handleMaintenanceStart = async () => {
    if (!deviceUuid) {
      setControlError("Please pair a locker first.");
      return;
    }

    try {
      setIsChangingMode(true);
      setControlError("");
      setControlMessage("");

      const data = await startMaintenance(deviceUuid);

      setDeviceMode("MAINTENANCE");
      setControlMessage(data?.message || "Maintenance mode started.");

      addMqttLog("request", {
        topic: "maintenance_req",
        payload: { action: "start" },
      });
    } catch (error) {
      console.error("Maintenance start error:", error);
      setControlError(error.message || "Unable to start maintenance mode.");
    } finally {
      setIsChangingMode(false);
    }
  };

  const handleMaintenanceStop = async () => {
    if (!deviceUuid) {
      setControlError("Please pair a locker first.");
      return;
    }

    try {
      setIsChangingMode(true);
      setControlError("");
      setControlMessage("");

      const data = await stopMaintenance(deviceUuid);

      setDeviceMode("NORMAL");
      setControlMessage(data?.message || "Maintenance mode stopped.");

      addMqttLog("request", {
        topic: "maintenance_req",
        payload: { action: "stop" },
      });
    } catch (error) {
      console.error("Maintenance stop error:", error);
      setControlError(error.message || "Unable to stop maintenance mode.");
    } finally {
      setIsChangingMode(false);
    }
  };

  // ======================================
  // PARCEL HISTORY
  // ======================================

  const [parcelHistory, setParcelHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const fetchParcelHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const data = await getDeliveries();

      const deliveries = Array.isArray(data.deliveries)
        ? data.deliveries
        : [];

      const sortedDeliveries = [...deliveries].sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );

      setParcelHistory(sortedDeliveries.slice(0, 4));
    } catch (error) {
      console.error("Dashboard parcel history error:", error);
      setHistoryError(error.message || "Unable to load parcel history.");
      setParcelHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParcelHistory();
  }, [fetchParcelHistory]);

  const formatParcelDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "Date unavailable";

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getParcelStatus = (parcel) => {
    const status = String(parcel.status || "to_receive").toLowerCase();

    const statusConfig = {
      to_receive: { label: "Ready for Collection", type: "ready" },
      received: { label: "Collected", type: "collected" },
      cancelled: { label: "Cancelled", type: "cancelled" },
    };

    return (
      statusConfig[status] || {
        label: status
          .replaceAll("_", " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase()),
        type: "ready",
      }
    );
  };

  // ======================================
  // MQTT DISPLAY HELPERS
  // ======================================

  const mqttStatusClass =
    mqttConnection === "CONNECTED"
      ? "connected"
      : mqttConnection === "RECONNECTING" ||
        mqttConnection === "CONNECTING"
      ? "reconnecting"
      : "disconnected";

  const clearMqttMessages = () => setMqttMessages([]);

  const formatMqttMessage = (message) => {
    if (typeof message === "string") return message;
    return JSON.stringify(message, null, 2);
  };

  // ======================================
  // DASHBOARD UI
  // ======================================

  return (
    <div className={`dropora-dashboard ${darkMode ? "dark" : ""}`}>
      <div className="dropora-shell">
        {/* HEADER */}

        <header className="dropora-header">
          <div className="dropora-brand">DROPORA</div>

          <span className={`dropora-connection ${mqttStatusClass}`}>
            {mqttConnection === "CONNECTED"
              ? "CONNECTED"
              : mqttConnection === "CONNECTING" ||
                mqttConnection === "RECONNECTING"
              ? "CONNECTING"
              : "DISCONNECTED"}
          </span>
        </header>

        <h1 className="dropora-title">Smart Locker Dashboard</h1>

        {/* STATUS CARDS */}

        <section className="dropora-status-grid">
          <article className="dropora-status-card">
            <Lock size={19} className="dropora-card-icon" />

            <p>Locker Status</p>

            <strong>
              {typeof solenoidLocked !== "boolean" &&
              lockOverride === null
                ? "Waiting..."
                : isLocked
                ? "Locked"
                : "Unlocked"}
            </strong>
          </article>

          <article className="dropora-status-card">
            <Moon size={20} className="dropora-card-icon" />

            <p>Power Mode</p>

            <strong>
              {typeof powerSaving !== "boolean" &&
              powerSavingOverride === null
                ? "Waiting..."
                : displayedPowerSaving
                ? "Sleep"
                : "Normal"}
            </strong>
          </article>
        </section>

        {/* REMOTE CONTROL */}

        <section className="dropora-panel">
          <h2>Remote Control</h2>

          <button
            type="button"
            className="dropora-control-row"
            onClick={toggleRequestedLock}
            disabled={!deviceUuid || isControlling || isChangingMode}
          >
            <span>{requestedLock ? "Lock" : "Unlock"}</span>

            <span
              className={`dropora-state-pill ${
                requestedLock ? "active" : "inactive"
              }`}
            >
              {requestedLock ? "Locked" : "Unlocked"}
            </span>
          </button>

          <button
            type="button"
            className="dropora-control-row"
            onClick={toggleRequestedSleep}
            disabled={!deviceUuid || isControlling || isChangingMode}
          >
            <span>{requestedSleep ? "Sleep" : "Normal Mode"}</span>

            <span
              className={`dropora-state-pill ${
                requestedSleep ? "active" : "inactive"
              }`}
            >
              {requestedSleep ? "On" : "Off"}
            </span>
          </button>

          <button
            type="button"
            className="dropora-send-button"
            onClick={handleRemoteRequest}
            disabled={
              !deviceUuid ||
              isControlling ||
              isChangingMode ||
              (typeof solenoidLocked !== "boolean" &&
                lockOverride === null &&
                remoteDraft.doorLocked === null)
            }
          >
            {isControlling ? (
              <>
                <LoaderCircle size={17} className="spin" />
                Sending Request...
              </>
            ) : (
              "Send Remote Request"
            )}
          </button>

          {!deviceUuid && !lockersLoading && (
            <p className="dropora-inline-message">
              No paired locker. Pair your device to use remote control.
            </p>
          )}
        </section>

        {/* MAINTENANCE CONTROL */}

        <section className="dropora-panel">
          <h2>Maintenance Control</h2>

          <div className="dropora-maintenance-actions">
            <button
              type="button"
              className="dropora-maintenance-start"
              onClick={handleMaintenanceStart}
              disabled={
                !deviceUuid ||
                isChangingMode ||
                isControlling ||
                deviceMode === "MAINTENANCE"
              }
            >
              {isChangingMode && deviceMode !== "MAINTENANCE" ? (
                <LoaderCircle size={17} className="spin" />
              ) : (
                "Start"
              )}
            </button>

            <button
              type="button"
              className="dropora-maintenance-stop"
              onClick={handleMaintenanceStop}
              disabled={
                !deviceUuid ||
                isChangingMode ||
                isControlling ||
                deviceMode !== "MAINTENANCE"
              }
            >
              {isChangingMode && deviceMode === "MAINTENANCE" ? (
                <LoaderCircle size={17} className="spin" />
              ) : (
                "Stop"
              )}
            </button>
          </div>

          {deviceMode === "MAINTENANCE" && (
            <p className="dropora-inline-message">
              Maintenance mode is active.
            </p>
          )}
        </section>

        {/* MQTT ACTIVITY LOG */}

        <section className="dropora-panel dropora-mqtt-panel">
          <div className="dropora-mqtt-heading">
            <h2>MQTT Activity Log</h2>

            {mqttMessages.length > 0 && (
              <button
                type="button"
                className="dropora-clear-log"
                onClick={clearMqttMessages}
              >
                Clear
              </button>
            )}
          </div>

          <div className="dropora-mqtt-log">
            {mqttMessages.length === 0 ? (
              <>
                <p>Connected to Maqiatto</p>
                <p>Subscribed to response topics</p>
                <p>Waiting for device responses...</p>
              </>
            ) : (
              mqttMessages.map((entry) => (
                <div
                  className={`dropora-log-entry ${entry.type}`}
                  key={entry.id}
                >
                  <span className="dropora-log-time">
                    {entry.timestamp}
                  </span>

                  <span className="dropora-log-message">
                    {formatMqttMessage(entry.message)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="dropora-mqtt-footer">
            <span className={`dropora-mqtt-dot ${mqttStatusClass}`} />
            {mqttConnection === "CONNECTED"
              ? "Connected to Maqiatto"
              : mqttConnection === "CONNECTING" ||
                mqttConnection === "RECONNECTING"
              ? "Connecting to Maqiatto..."
              : "MQTT disconnected"}
          </div>
        </section>

        {/* FEEDBACK / ERRORS */}

        {(controlMessage ||
          controlError ||
          lockersError ||
          telemetryError ||
          mqttStatusError) && (
          <section className="dropora-feedback">
            {controlMessage && (
              <p className="dropora-feedback-success">{controlMessage}</p>
            )}

            {[
              controlError,
              lockersError,
              telemetryError,
              mqttStatusError,
            ]
              .filter(Boolean)
              .map((message, index) => (
                <p className="dropora-feedback-error" key={index}>
                  {message}
                </p>
              ))}
          </section>
        )}

        {/* DEVICE DETAILS */}

        <section className="dropora-panel dropora-extra-panel">
          <div className="dropora-section-heading">
            <div>
              <h2>Device Details</h2>
              <p>Latest information reported by your locker.</p>
            </div>

            <button
              type="button"
              className="dropora-small-button"
              onClick={fetchTelemetry}
              disabled={!deviceUuid || telemetryLoading}
            >
              {telemetryLoading ? (
                <LoaderCircle size={15} className="spin" />
              ) : (
                <RefreshCw size={15} />
              )}
              Refresh
            </button>
          </div>

          <div className="dropora-details-grid">
            <div>
              <span>Door Status</span>
              <strong>
                {doorClosed === true
                  ? "Closed"
                  : doorClosed === false
                  ? "Open"
                  : "Unknown"}
              </strong>
            </div>

            <div>
              <span>Object Weight</span>
              <strong>
                {weight !== undefined && weight !== null
                  ? `${weight} g`
                  : "—"}
              </strong>
            </div>

            <div>
              <span>Box Fill Level</span>
              <strong>
                {fillPercent !== undefined && fillPercent !== null
                  ? `${fillPercent}%`
                  : "—"}
              </strong>
            </div>

            <div>
              <span>Device Mode</span>
              <strong>
                {deviceMode === "MAINTENANCE"
                  ? "Maintenance"
                  : deviceMode === "SLEEP"
                  ? "Sleep"
                  : "Normal"}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="dropora-secondary-button"
            onClick={() => navigate("/pair-locker")}
          >
            Pair Another Locker
          </button>

          <button
            type="button"
            className="dropora-secondary-button"
            onClick={handleRequestStatus}
            disabled={!deviceUuid || mqttStatusLoading}
          >
            {mqttStatusLoading ? "Requesting..." : "Request Device Status"}
          </button>
        </section>

        {/* PARCEL HISTORY */}

        <section className="dropora-panel dropora-extra-panel">
          <div className="dropora-section-heading">
            <div>
              <h2>Received Parcels</h2>
              <p>Your latest delivery records.</p>
            </div>

            <button
              type="button"
              className="dropora-small-button"
              onClick={() => navigate("/delivery-history")}
            >
              View All
              <ChevronRight size={16} />
            </button>
          </div>

          {historyLoading ? (
            <p className="dropora-history-message">Loading parcel history...</p>
          ) : historyError ? (
            <div className="dropora-history-message">
              <p>{historyError}</p>
              <button
                type="button"
                className="dropora-small-button"
                onClick={fetchParcelHistory}
              >
                Try Again
              </button>
            </div>
          ) : parcelHistory.length === 0 ? (
            <p className="dropora-history-message">
              No delivery records available.
            </p>
          ) : (
            <div className="dropora-parcel-list">
              {parcelHistory.map((parcel) => {
                const status = String(
                  parcel.status || "to_receive"
                ).toLowerCase();

                const statusInfo = getParcelStatus(parcel);

                return (
                  <div className="dropora-parcel-item" key={parcel.id}>
                    <div className="dropora-parcel-icon">
                      <Package size={19} />
                    </div>

                    <div className="dropora-parcel-info">
                      <strong>
                        {parcel.courier_type || "Unknown Courier"}
                      </strong>

                      <span>
                        {parcel.parcel_id || "Unavailable"}
                        {" · "}
                        {formatParcelDate(parcel.created_at)}
                      </span>
                    </div>

                    <span
                      className={`dropora-parcel-status ${statusInfo.type}`}
                    >
                      {status === "received" ? (
                        <CheckCircle2 size={14} />
                      ) : status === "cancelled" ? (
                        <XCircle size={14} />
                      ) : (
                        <Clock3 size={14} />
                      )}
                      {statusInfo.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SLEEP HISTORY */}

        <section className="dropora-panel dropora-extra-panel">
          <div className="dropora-section-heading">
            <div>
              <h2>Sleep History</h2>
              <p>Records when your locker entered and exited sleep mode.</p>
            </div>

            <button
              type="button"
              className="dropora-small-button"
              onClick={() => fetchSleepEvents(0, false)}
              disabled={sleepLoading || !deviceUuid}
            >
              {sleepLoading ? (
                <LoaderCircle size={15} className="spin" />
              ) : (
                <RefreshCw size={15} />
              )}
              Refresh
            </button>
          </div>

          {!deviceUuid ? (
            <p className="dropora-history-message">
              Pair a locker to view its sleep history.
            </p>
          ) : sleepError ? (
            <div className="dropora-history-message">
              <p>{sleepError}</p>
              <button
                type="button"
                className="dropora-small-button"
                onClick={() => fetchSleepEvents(0, false)}
                disabled={sleepLoading}
              >
                Try Again
              </button>
            </div>
          ) : sleepLoading && sleepEvents.length === 0 ? (
            <p className="dropora-history-message">
              Loading sleep history...
            </p>
          ) : sleepEvents.length === 0 ? (
            <p className="dropora-history-message">
              No sleep events recorded yet.
            </p>
          ) : (
            <div className="dropora-table-wrap">
              <table className="dropora-table">
                <thead>
                  <tr>
                    <th>Sleep Time</th>
                    <th>Wake Time</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {sleepEvents.map((event) => (
                    <tr key={event.id}>
                      <td data-label="Sleep Time">
                        {formatSleepDate(event.slept_at)}
                      </td>

                      <td data-label="Wake Time">
                        {formatSleepDate(event.woke_at)}
                      </td>

                      <td data-label="Duration">
                        {formatSleepDuration(event.duration_seconds)}
                      </td>

                      <td data-label="Status">
                        <span
                          className={`dropora-parcel-status ${
                            event.woke_at ? "collected" : "ready"
                          }`}
                        >
                          {event.woke_at ? "Awake" : "Sleeping"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {sleepPagination.has_more && (
            <button
              type="button"
              className="dropora-secondary-button"
              onClick={() =>
                fetchSleepEvents(
                  sleepPagination.next_offset ??
                    sleepPagination.offset + sleepPagination.limit,
                  true
                )
              }
              disabled={sleepLoading}
            >
              {sleepLoading ? "Loading..." : "Load More"}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;