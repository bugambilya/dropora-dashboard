
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
  ScanLine,
  Moon,
  Sun,
  LoaderCircle,
  BatteryCharging,
} from "lucide-react";

import { sendRemoteCommand } from "../services/locker";
import { getDeliveries } from "../services/deliveryService";
import { getSleepEvents } from "../services/sleepEventService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function Dashboard({ darkMode, setDarkMode }) {
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
  const [isChangingPower, setIsChangingPower] = useState(false);

  const [powerSavingOverride, setPowerSavingOverride] = useState(null);
  const [lockOverride, setLockOverride] = useState(null);

  const [controlError, setControlError] = useState("");
  const [controlMessage, setControlMessage] = useState("");

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

      const latestPayload = Array.isArray(data.telemetry)
        ? data.telemetry[0]?.payload || {}
        : {};

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

      setTelemetry(
        Array.isArray(data.telemetry) ? data.telemetry : []
      );
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
  // SLEEP EVENT HISTORY
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

      // Prevent overlapping requests.
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

          const existingIds = new Set(
            previous.map((event) => event.id)
          );

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

        setSleepError(
          error.message || "Unable to load sleep history."
        );
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

  // ======================================
  // SLEEP HISTORY FORMATTING
  // ======================================

  const formatSleepDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

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

    const totalSeconds = Math.max(
      0,
      Math.floor(Number(seconds))
    );

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${remainingSeconds}s`;
  };

  // ======================================
  // LATEST TELEMETRY
  // ======================================

  const latestTelemetry = telemetry[0];
  const payload = latestTelemetry?.payload || {};

  const weight = payload.object_weight_g;
  const fillPercent = payload.box_fill_percent;

  const solenoidLocked = payload.solenoid_locked;
  const doorClosed = payload.door_closed;
  const powerSaving = payload.power_saving;

  const isLocked =
    lockOverride !== null
      ? lockOverride
      : solenoidLocked === true;

  const isPowerSaving = powerSaving === true;

  const displayedPowerSaving =
    powerSavingOverride !== null
      ? powerSavingOverride
      : isPowerSaving;

  // ======================================
  // REMOTE DOOR LOCK CONTROL - MQTT
  // ======================================

  const handleLockToggle = async () => {
    if (!deviceUuid) {
      setControlError("Please pair a locker first.");
      return;
    }

    if (
      typeof solenoidLocked !== "boolean" &&
      lockOverride === null
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
        doorLocked: !isLocked,
        powerSaving: displayedPowerSaving,
      });

      setLockOverride(!isLocked);

      setControlMessage(
        data.message || "Door lock command confirmed by the device."
      );
    } catch (error) {
      console.error("Remote door control error:", error);

      setControlError(
        error.message || "Unable to send door lock command."
      );
    } finally {
      setIsControlling(false);
    }
  };

  // ======================================
  // REMOTE POWER SAVING CONTROL - MQTT
  // ======================================

  const handlePowerToggle = async () => {
    if (!deviceUuid) {
      setControlError("Please pair a locker first.");
      return;
    }

    if (typeof powerSaving !== "boolean") {
      setControlError("Waiting for valid power mode telemetry.");
      return;
    }

    try {
      setIsChangingPower(true);
      setControlError("");
      setControlMessage("");

      const nextPowerSaving = !displayedPowerSaving;

      const data = await sendRemoteCommand({
        deviceUuid,
        doorLocked: isLocked,
        powerSaving: nextPowerSaving,
      });

      setPowerSavingOverride(nextPowerSaving);

      setControlMessage(
        data.message || "Power mode command submitted successfully."
      );
    } catch (error) {
      console.error("Remote power mode error:", error);

      setControlError(
        error.message || "Unable to change power mode."
      );
    } finally {
      setIsChangingPower(false);
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

      setHistoryError(
        error.message || "Unable to load parcel history."
      );

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

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getParcelStatus = (parcel) => {
    const status = String(
      parcel.status || "to_receive"
    ).toLowerCase();

    const statusConfig = {
      to_receive: {
        label: "Ready for Collection",
        type: "ready",
      },
      received: {
        label: "Collected",
        type: "collected",
      },
      cancelled: {
        label: "Cancelled",
        type: "cancelled",
      },
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
  // DASHBOARD UI
  // ======================================

  return (
    <div className="dashboard-page">
      <header className="header">
        <div className="header-controls">
          <div className="online-status">
            <span className="online-dot"></span>
            Online
          </div>

          <button
            className="icon-button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">WELCOME TO</p>
            <h1>DROPORA</h1>
            <p className="dashboard-welcome-subtitle">
              Manage your parcels and smart lockers in one place.
            </p>
          </div>
        </section>

        <div className="dashboard-grid">
          {/* LOCKER CARD */}

          <section className="locker-card">
            <div className="card-header">
              <div>
                <p className="card-eyebrow">YOUR LOCKER</p>
                <h2>Main Compartment</h2>
              </div>

              <div className="locker-online">
                <span></span>
                {lockersLoading
                  ? "Loading..."
                  : deviceUuid
                  ? "Paired"
                  : "Not Paired"}
              </div>
            </div>

            <div className="locker-visual">
              <div className="locker-icon">
                {isLocked ? (
                  <Lock size={42} />
                ) : (
                  <Unlock size={42} />
                )}
              </div>

              <h3>
                {typeof solenoidLocked !== "boolean" &&
                lockOverride === null
                  ? "Waiting for Telemetry"
                  : isLocked
                  ? "Locker Locked"
                  : "Locker Unlocked"}
              </h3>

              <p>
                {doorClosed === true
                  ? "The compartment door is closed."
                  : doorClosed === false
                  ? "The compartment door is open."
                  : "Waiting for door status."}
              </p>
            </div>

            <button
              type="button"
              className={`locker-button ${
                isLocked ? "unlock-button" : "lock-button"
              }`}
              onClick={handleLockToggle}
              disabled={
                !deviceUuid ||
                isControlling ||
                isChangingPower ||
                (typeof solenoidLocked !== "boolean" &&
                  lockOverride === null)
              }
            >
              {isControlling ? (
                <>
                  <LoaderCircle size={18} className="spin" />
                  Sending Command...
                </>
              ) : isLocked ? (
                <>
                  <Unlock size={18} />
                  Unlock Locker
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Lock Locker
                </>
              )}
            </button>

            <div className="power-mode-control">
              <div>
                <p className="card-eyebrow">POWER MANAGEMENT</p>
                <h3>Power Saving Mode</h3>
                <p>
                  {typeof powerSaving !== "boolean"
                    ? "Waiting for power mode telemetry."
                    : displayedPowerSaving
                    ? "Power-saving mode is enabled."
                    : "Power-saving mode is disabled."}
                </p>
              </div>

              <button
                type="button"
                className={`locker-button ${
                  displayedPowerSaving
                    ? "lock-button"
                    : "unlock-button"
                }`}
                onClick={handlePowerToggle}
                disabled={
                  !deviceUuid ||
                  isChangingPower ||
                  isControlling ||
                  typeof powerSaving !== "boolean"
                }
              >
                {isChangingPower ? (
                  <>
                    <LoaderCircle size={18} className="spin" />
                    Processing...
                  </>
                ) : displayedPowerSaving ? (
                  <>
                    <Sun size={18} />
                    Wake Up
                  </>
                ) : (
                  <>
                    <BatteryCharging size={18} />
                    Enable Power Saving
                  </>
                )}
              </button>
            </div>

            {controlMessage && (
              <p className="control-success">{controlMessage}</p>
            )}

            {controlError && (
              <p className="control-error">{controlError}</p>
            )}

            {lockersError && (
              <p className="control-error">{lockersError}</p>
            )}

            {telemetryError && (
              <p className="control-error">{telemetryError}</p>
            )}

            {deviceUuid && (
              <div className="locker-telemetry-summary">
                <p className="card-eyebrow">LATEST TELEMETRY</p>

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
                  <span>Power Mode</span>
                  <strong>
                    {typeof powerSaving !== "boolean"
                      ? "Unknown"
                      : displayedPowerSaving
                      ? "Saving"
                      : "Normal"}
                  </strong>
                </div>

                {weight !== undefined && (
                  <div>
                    <span>Object Weight</span>
                    <strong>{weight} g</strong>
                  </div>
                )}

                {fillPercent !== undefined && (
                  <div>
                    <span>Box Fill Level</span>
                    <strong>{fillPercent}%</strong>
                  </div>
                )}

                {telemetryLoading && (
                  <p className="telemetry-refreshing">
                    <LoaderCircle size={14} className="spin" />
                    Updating telemetry...
                  </p>
                )}
              </div>
            )}

            <button
              className="scan-button"
              onClick={() => navigate("/pair-locker")}
            >
              <ScanLine size={18} />
              Scan / Pair Delivery Device
            </button>
          </section>

          {/* PARCEL HISTORY */}

          <section className="history-card">
            <div className="card-header">
              <div>
                <p className="card-eyebrow">PARCEL HISTORY</p>
                <h2>Received Parcels</h2>
              </div>

              <button
                className="view-history-button"
                onClick={() => navigate("/delivery-history")}
              >
                View All
                <ChevronRight size={17} />
              </button>
            </div>

            <div className="history-list">
              {historyLoading ? (
                <p className="history-empty">
                  Loading parcel history...
                </p>
              ) : historyError ? (
                <div className="history-empty">
                  <p>{historyError}</p>
                  <button
                    type="button"
                    onClick={fetchParcelHistory}
                    disabled={historyLoading}
                  >
                    Try Again
                  </button>
                </div>
              ) : parcelHistory.length === 0 ? (
                <p className="history-empty">
                  No delivery records available.
                </p>
              ) : (
                parcelHistory.map((parcel) => {
                  const status = String(
                    parcel.status || "to_receive"
                  ).toLowerCase();

                  const statusInfo = getParcelStatus(parcel);

                  return (
                    <div className="history-item" key={parcel.id}>
                      <div className="history-package-icon">
                        <Package size={20} />
                      </div>

                      <div className="history-info">
                        <h3>
                          {parcel.courier_type || "Unknown Courier"}
                        </h3>
                        <p>
                          {parcel.parcel_id || "Unavailable"}
                          {" · "}
                          {formatParcelDate(parcel.created_at)}
                        </p>
                      </div>

                      <div
                        className={`history-status ${statusInfo.type}`}
                      >
                        {status === "received" ? (
                          <CheckCircle2 size={15} />
                        ) : status === "cancelled" ? (
                          <XCircle size={15} />
                        ) : (
                          <Clock3 size={15} />
                        )}

                        {statusInfo.label}
                      </div>

                      <ChevronRight
                        className="history-arrow"
                        size={18}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* DEVICE SLEEP HISTORY */}

          <section className="sleep-history-card">
            <div className="card-header">
              <div>
                <p className="card-eyebrow">DEVICE HISTORY</p>
                <h2>Sleep History</h2>
                <p className="sleep-history-subtitle">
                  Records when your locker entered and exited sleep mode.
                </p>
              </div>

              <button
                type="button"
                className="sleep-history-refresh"
                onClick={() => fetchSleepEvents(0, false)}
                disabled={sleepLoading || !deviceUuid}
              >
                {sleepLoading && (
                  <LoaderCircle size={16} className="spin" />
                )}
                Refresh
              </button>
            </div>

            {!deviceUuid ? (
              <p className="sleep-history-message">
                Pair a locker to view its sleep history.
              </p>
            ) : sleepError ? (
              <div className="sleep-history-message sleep-history-error">
                <span>{sleepError}</span>

                <button
                  type="button"
                  onClick={() => fetchSleepEvents(0, false)}
                  disabled={sleepLoading}
                >
                  Try Again
                </button>
              </div>
            ) : sleepLoading && sleepEvents.length === 0 ? (
              <p className="sleep-history-message">
                Loading sleep history...
              </p>
            ) : sleepEvents.length === 0 ? (
              <p className="sleep-history-message">
                No sleep events recorded yet.
              </p>
            ) : (
              <div className="sleep-history-table-wrap">
                <table className="sleep-history-table">
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
                            className={`sleep-event-status ${
                              event.woke_at
                                ? "completed"
                                : "ongoing"
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
                className="sleep-history-load-more"
                onClick={() =>
                  fetchSleepEvents(
                    sleepPagination.next_offset ??
                      sleepPagination.offset +
                        sleepPagination.limit,
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
      </main>
    </div>
  );
}

export default Dashboard;
