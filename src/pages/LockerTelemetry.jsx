
import { useEffect, useState, useCallback } from "react";

import {
  getPairedLockers,
  getLockerTelemetry,
} from "../services/telemetryService";

import {
  Activity,
  RefreshCw,
  Scale,
  Lock,
  Unlock,
  DoorOpen,
  DoorClosed,
  Package,
  Wifi,
  WifiOff,
  Clock,
  BatteryCharging,
  AlertCircle,
} from "lucide-react";

// Keep your existing CSS import here if you already have one.
// Example:
// import "../styles/LockerTelemetry.css";

function LockerTelemetry() {
  const [lockers, setLockers] = useState([]);
  const [selectedLocker, setSelectedLocker] = useState("");

  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ======================================
  // GET PAIRED LOCKERS
  // ======================================

  const loadLockers = useCallback(async () => {
    try {
      const data = await getPairedLockers();
      const devices = data.devices || [];

      setLockers(devices);

      setSelectedLocker((previous) => {
        if (
          previous &&
          devices.some(
            (locker) =>
              locker.device_uuid === previous
          )
        ) {
          return previous;
        }

        return devices.length > 0
          ? devices[0].device_uuid
          : "";
      });

      if (devices.length === 0) {
        setTelemetry([]);
      }

      return devices;
    } catch (err) {
      console.error("Load lockers error:", err);

      setError(
        err.message || "Failed to load paired lockers."
      );

      return [];
    }
  }, []);

  // ======================================
  // GET LOCKER TELEMETRY HISTORY
  // ======================================

  const loadTelemetry = useCallback(
    async (deviceUuid) => {
      if (!deviceUuid) {
        setTelemetry([]);
        return;
      }

      try {
        const data = await getLockerTelemetry(
          deviceUuid,
          0,
          10
        );

        setTelemetry(data.telemetry || []);
        setError("");
      } catch (err) {
        console.error("Load telemetry error:", err);

        setError(
          err.message || "Failed to load telemetry."
        );
      }
    },
    []
  );

  // ======================================
  // INITIAL LOADING
  // ======================================

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      await loadLockers();

      setLoading(false);
    };

    initialize();
  }, [loadLockers]);

  // ======================================
  // LOAD TELEMETRY WHEN LOCKER CHANGES
  // ======================================

  useEffect(() => {
    if (!selectedLocker) {
      setTelemetry([]);
      return;
    }

    loadTelemetry(selectedLocker);
  }, [selectedLocker, loadTelemetry]);

  // ======================================
  // AUTO-REFRESH TELEMETRY EVERY 3 SECONDS
  // ======================================

  useEffect(() => {
    if (!selectedLocker) return;

    const interval = setInterval(() => {
      loadTelemetry(selectedLocker);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedLocker, loadTelemetry]);

  // ======================================
  // MANUAL REFRESH
  // ======================================

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");

    try {
      const devices = await loadLockers();

      const currentLocker = devices.find(
        (locker) =>
          locker.device_uuid === selectedLocker
      );

      const targetUuid = currentLocker
        ? selectedLocker
        : devices[0]?.device_uuid;

      if (!targetUuid) {
        setTelemetry([]);
        return;
      }

      // Fetch existing telemetry from the backend.
      // This does not send an MQTT command.
      await loadTelemetry(targetUuid);

      if (targetUuid !== selectedLocker) {
        setSelectedLocker(targetUuid);
      }
    } catch (err) {
      console.error(
        "Refresh telemetry error:",
        err
      );

      setError(
        err.message || "Unable to refresh telemetry."
      );
    } finally {
      setRefreshing(false);
    }
  };

  // ======================================
  // LATEST TELEMETRY
  // ======================================

  const latest =
    telemetry.length > 0
      ? telemetry[0]
      : null;

  const payload = latest?.payload || {};

  // ======================================
  // SENSOR VALUES
  // ======================================

  const weight = payload.object_weight_g;
  const fillPercent = payload.box_fill_percent;
  const isLocked = payload.solenoid_locked;
  const isDoorClosed = payload.door_closed;
  const powerSaving = payload.power_saving;

  // ======================================
  // ULTRASONIC DISTANCE
  // ======================================

  const distance =
    payload.ultrasonic_distance_cm ??
    payload.distance_cm ??
    payload.proximity_distance_cm ??
    payload.proximity_cm ??
    payload.object_distance_cm ??
    payload.distance ??
    null;

  // ======================================
  // FORMAT DATE
  // ======================================

  const formatDate = (date) => {
    if (!date) return "--";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "--";
    }

    return parsedDate.toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "medium",
    });
  };

  // ======================================
  // STATUS HELPER
  // ======================================

  const getStatus = (
    value,
    trueLabel,
    falseLabel
  ) => {
    if (
      value === undefined ||
      value === null
    ) {
      return {
        label: "No data",
        className: "status-unknown",
      };
    }

    return {
      label: value
        ? trueLabel
        : falseLabel,

      className: value
        ? "status-success"
        : "status-warning",
    };
  };

  const lockStatus = getStatus(
    isLocked,
    "Locked",
    "Unlocked"
  );

  const doorStatus = getStatus(
    isDoorClosed,
    "Closed",
    "Open"
  );

  const connectionStatus = latest
    ? "Online"
    : "Waiting for telemetry";

  // ======================================
  // LOADING SCREEN
  // ======================================

  if (loading) {
    return (
      <div className="telemetry-page">
        <div className="telemetry-loading">
          <RefreshCw
            className="spin"
            size={30}
          />

          <p>
            Loading locker telemetry...
          </p>
        </div>
      </div>
    );
  }

  // ======================================
  // MAIN PAGE
  // ======================================

  return (
    <div className="telemetry-page">

      {/* PAGE HEADER */}

      <div className="telemetry-header">
        <div>
          <h1>Locker Telemetry</h1>

          <p>
            Monitor sensor readings and locker hardware status.
          </p>
        </div>

        <button
          className="telemetry-refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing ? "spin" : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* LOCKER SELECTOR */}

      <div className="telemetry-toolbar">
        <div className="telemetry-device-selector">
          <label htmlFor="locker-select">
            Select Locker
          </label>

          <select
            id="locker-select"
            value={selectedLocker}
            onChange={(e) =>
              setSelectedLocker(e.target.value)
            }
          >
            {lockers.map((locker) => (
              <option
                key={locker.device_uuid}
                value={locker.device_uuid}
              >
                {locker.device_uuid}
              </option>
            ))}
          </select>
        </div>

        <div className="telemetry-connection">
          {latest ? (
            <>
              <Wifi size={18} />

              <span className="connection-online">
                {connectionStatus}
              </span>
            </>
          ) : (
            <>
              <WifiOff size={18} />

              <span className="connection-offline">
                {connectionStatus}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="telemetry-error">
          <AlertCircle size={18} />

          <span>{error}</span>
        </div>
      )}

      {/* NO PAIRED LOCKERS */}

      {lockers.length === 0 && (
        <div className="telemetry-empty">
          <Package size={45} />

          <h3>No paired lockers</h3>

          <p>
            Pair your ESP32 locker device first
            to view telemetry data.
          </p>
        </div>
      )}

      {/* NO TELEMETRY */}

      {lockers.length > 0 &&
        telemetry.length === 0 &&
        !error && (
          <div className="telemetry-empty">
            <Activity size={45} />

            <h3>No telemetry data yet</h3>

            <p>
              Waiting for your ESP32 to send sensor readings.
            </p>
          </div>
        )}

      {/* SENSOR DASHBOARD */}

      {latest && (
        <>
          {/* SENSOR CARDS */}

          <div className="telemetry-grid">

            {/* WEIGHT */}

            <div className="telemetry-card">
              <div className="telemetry-card-header">
                <div className="telemetry-icon weight-icon">
                  <Scale size={23} />
                </div>

                <span className="telemetry-label">
                  Weight Sensor
                </span>
              </div>

              <div className="telemetry-value">
                {weight !== undefined &&
                weight !== null
                  ? `${Number(
                      weight
                    ).toLocaleString()} g`
                  : "--"}
              </div>

              <div className="telemetry-description">
                Detected parcel weight
              </div>

              {weight !== undefined &&
                weight !== null && (
                  <div className="telemetry-secondary">
                    {(
                      Number(weight) / 1000
                    ).toFixed(3)}{" "}
                    kg
                  </div>
                )}
            </div>

            {/* SOLENOID LOCK */}

            <div className="telemetry-card">
              <div className="telemetry-card-header">
                <div className="telemetry-icon lock-icon">
                  {isLocked ? (
                    <Lock size={23} />
                  ) : (
                    <Unlock size={23} />
                  )}
                </div>

                <span className="telemetry-label">
                  Solenoid Lock
                </span>
              </div>

              <div className="telemetry-value">
                {lockStatus.label}
              </div>

              <div className="telemetry-description">
                Electronic lock status
              </div>

              <span
                className={`telemetry-status ${lockStatus.className}`}
              >
                {lockStatus.label}
              </span>
            </div>

            {/* REED SWITCH */}

            <div className="telemetry-card">
              <div className="telemetry-card-header">
                <div className="telemetry-icon door-icon">
                  {isDoorClosed ? (
                    <DoorClosed size={23} />
                  ) : (
                    <DoorOpen size={23} />
                  )}
                </div>

                <span className="telemetry-label">
                  Magnetic Reed Switch
                </span>
              </div>

              <div className="telemetry-value">
                {doorStatus.label}
              </div>

              <div className="telemetry-description">
                Locker door status
              </div>

              <span
                className={`telemetry-status ${doorStatus.className}`}
              >
                {doorStatus.label}
              </span>
            </div>
          </div>

          {/* ADDITIONAL INFORMATION */}

          <div className="telemetry-section">
            <h2>Locker Overview</h2>

            <div className="telemetry-overview-grid">

              {/* FILL LEVEL */}

              <div className="telemetry-overview-card">
                <div className="overview-heading">
                  <Package size={20} />

                  <span>
                    Locker Fill Level
                  </span>
                </div>

                <div className="fill-percentage">
                  {fillPercent !== undefined &&
                  fillPercent !== null
                    ? `${fillPercent}%`
                    : "--"}
                </div>

                <div className="fill-bar">
                  <div
                    className="fill-bar-inner"
                    style={{
                      width: `${
                        fillPercent !== undefined &&
                        fillPercent !== null
                          ? Math.min(
                              Math.max(
                                Number(
                                  fillPercent
                                ) || 0,
                                0
                              ),
                              100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <p>
                  Estimated locker occupancy
                </p>
              </div>

              {/* POWER SAVING */}

              <div className="telemetry-overview-card">
                <div className="overview-heading">
                  <BatteryCharging size={20} />

                  <span>Power Mode</span>
                </div>

                <div className="fill-percentage">
                  {powerSaving === undefined ||
                  powerSaving === null
                    ? "Unknown"
                    : powerSaving
                    ? "Saving"
                    : "Normal"}
                </div>

                <p>
                  ESP32 power-saving mode
                </p>
              </div>

              {/* ULTRASONIC DISTANCE */}

              <div className="telemetry-overview-card">
                <div className="overview-heading">
                  <Activity size={20} />

                  <span>
                    Ultrasonic Distance
                  </span>
                </div>

                <div className="fill-percentage">
                  {distance !== null
                    ? `${distance} cm`
                    : "--"}
                </div>

                <p>
                  Measured object distance
                </p>
              </div>

              {/* LAST UPDATE */}

              <div className="telemetry-overview-card">
                <div className="overview-heading">
                  <Clock size={20} />

                  <span>Last Update</span>
                </div>

                <div className="last-update">
                  {formatDate(
                    latest.recorded_at ||
                    latest.received_at
                  )}
                </div>

                <p>
                  Latest telemetry received
                </p>
              </div>
            </div>
          </div>

          {/* TELEMETRY HISTORY */}

          <div className="telemetry-section">
            <div className="telemetry-section-header">
              <h2>Telemetry History</h2>

              <span>
                Latest {telemetry.length} records
              </span>
            </div>

            <div className="telemetry-table-container">
              <table className="telemetry-table">
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>Weight</th>
                    <th>Lock</th>
                    <th>Door</th>
                    <th>Distance</th>
                    <th>Fill Level</th>
                  </tr>
                </thead>

                <tbody>
                  {telemetry.map((record) => {
                    const p = record.payload || {};

                    const recordDistance =
                      p.ultrasonic_distance_cm ??
                      p.distance_cm ??
                      p.proximity_distance_cm ??
                      p.proximity_cm ??
                      p.object_distance_cm ??
                      p.distance ??
                      null;

                    return (
                      <tr key={record.id}>
                        <td>
                          {formatDate(
                            record.recorded_at ||
                            record.received_at
                          )}
                        </td>

                        <td>
                          {p.object_weight_g !==
                            undefined &&
                          p.object_weight_g !== null
                            ? `${p.object_weight_g} g`
                            : "--"}
                        </td>

                        <td>
                          <span
                            className={`table-status ${
                              p.solenoid_locked ===
                                undefined ||
                              p.solenoid_locked ===
                                null
                                ? ""
                                : p.solenoid_locked
                                ? "table-locked"
                                : "table-unlocked"
                            }`}
                          >
                            {p.solenoid_locked ===
                              undefined ||
                            p.solenoid_locked ===
                              null
                              ? "Unknown"
                              : p.solenoid_locked
                              ? "Locked"
                              : "Unlocked"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`table-status ${
                              p.door_closed ===
                                undefined ||
                              p.door_closed ===
                                null
                                ? ""
                                : p.door_closed
                                ? "table-closed"
                                : "table-open"
                            }`}
                          >
                            {p.door_closed ===
                              undefined ||
                            p.door_closed ===
                              null
                              ? "Unknown"
                              : p.door_closed
                              ? "Closed"
                              : "Open"}
                          </span>
                        </td>

                        <td>
                          {recordDistance !==
                          null
                            ? `${recordDistance} cm`
                            : "--"}
                        </td>

                        <td>
                          {p.box_fill_percent !==
                            undefined &&
                          p.box_fill_percent !==
                            null
                            ? `${p.box_fill_percent}%`
                            : "--"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default LockerTelemetry;
