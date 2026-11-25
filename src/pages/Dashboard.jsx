
import { useState, useEffect, useCallback } from "react";
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

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function Dashboard({ darkMode, setDarkMode }) {
  const navigate = useNavigate();

  // ======================================
  // PAIRED LOCKERS
  // ======================================

  const [lockers, setLockers] = useState([]);
  const [lockersLoading, setLockersLoading] = useState(true);
  const [lockersError, setLockersError] = useState("");

  // ======================================
  // TELEMETRY
  // ======================================

  const [telemetry, setTelemetry] = useState([]);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [telemetryError, setTelemetryError] = useState("");

  // ======================================
  // REMOTE CONTROL
  // ======================================

  const [isControlling, setIsControlling] = useState(false);
  const [isChangingPower, setIsChangingPower] = useState(false);

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
        throw new Error(
          "Please log in to view your paired lockers."
        );
      }

      const response = await fetch(
        `${API_BASE}/api/locker/paired`,
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
        throw new Error(
          data.error || "Unable to load paired lockers."
        );
      }

      setLockers(
        Array.isArray(data.devices) ? data.devices : []
      );
    } catch (error) {
      console.error("Fetch lockers error:", error);

      setLockersError(
        error.message || "Unable to load lockers."
      );
    } finally {
      setLockersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLockers();
  }, [fetchLockers]);

  // FIRST PAIRED LOCKER
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
        throw new Error(
          "Please log in to view telemetry."
        );
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
        throw new Error(
          data.error || "Unable to load telemetry data."
        );
      }

      setTelemetry(
        Array.isArray(data.telemetry)
          ? data.telemetry
          : []
      );
    } catch (error) {
      console.error("Fetch telemetry error:", error);

      setTelemetryError(
        error.message || "Unable to load telemetry."
      );
    } finally {
      setTelemetryLoading(false);
    }
  }, [deviceUuid]);

  // REFRESH TELEMETRY EVERY 5 SECONDS
  useEffect(() => {
    if (!deviceUuid) {
      setTelemetry([]);
      return;
    }

    fetchTelemetry();

    const interval = setInterval(() => {
      fetchTelemetry();
    }, 5000);

    return () => clearInterval(interval);
  }, [deviceUuid, fetchTelemetry]);

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

  // ACTUAL STATES FROM TELEMETRY
  const isLocked = solenoidLocked === true;
  const isPowerSaving = powerSaving === true;

  // ======================================
  // REMOTE DOOR LOCK CONTROL
  // ======================================

  const handleLockToggle = async () => {
    if (!deviceUuid) {
      setControlError("Please pair a locker first.");
      return;
    }

    if (typeof solenoidLocked !== "boolean") {
      setControlError(
        "Waiting for valid locker lock telemetry."
      );
      return;
    }

    try {
      setIsControlling(true);
      setControlError("");
      setControlMessage("");

      const data = await sendRemoteCommand({
        deviceUuid,
        doorLocked: !isLocked,
        powerSaving: isPowerSaving,
      });

      setControlMessage(
        data.message ||
          "Door lock command submitted successfully."
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
  // REMOTE POWER SAVING CONTROL
  // ======================================

  const handlePowerToggle = async () => {
    if (!deviceUuid) {
      setControlError("Please pair a locker first.");
      return;
    }

    if (typeof powerSaving !== "boolean") {
      setControlError(
        "Waiting for valid power mode telemetry."
      );
      return;
    }

    try {
      setIsChangingPower(true);
      setControlError("");
      setControlMessage("");

      const data = await sendRemoteCommand({
        deviceUuid,
        doorLocked: isLocked,
        powerSaving: !isPowerSaving,
      });

      setControlMessage(
        data.message ||
          "Power mode command submitted successfully."
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
  // PARCEL HISTORY - BACKEND CONNECTION
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

      // Sort newest deliveries first
      const sortedDeliveries = [...deliveries].sort(
        (a, b) => {
          const dateA = new Date(
            a.created_at || 0
          ).getTime();

          const dateB = new Date(
            b.created_at || 0
          ).getTime();

          return dateB - dateA;
        }
      );

      // Display only the latest four deliveries
      setParcelHistory(
        sortedDeliveries.slice(0, 4)
      );

    } catch (error) {
      console.error(
        "Dashboard parcel history error:",
        error
      );

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

  // ======================================
  // FORMAT PARCEL DATE
  // ======================================

  const formatParcelDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

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

  // ======================================
  // FORMAT PARCEL STATUS
  // ======================================

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
          .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
          ),
        type: "ready",
      }
    );
  };

  // ======================================
  // DASHBOARD UI
  // ======================================

  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <header className="header">
        <div className="header-controls">

          <div className="online-status">
            <span className="online-dot"></span>
            Online
          </div>

          {/* DARK MODE */}
          <button
            className="icon-button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </button>

        </div>
      </header>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="dashboard">

        {/* WELCOME */}
        <section className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">
              WELCOME TO
            </p>

            <h1>DROPORA</h1>

            <p className="dashboard-welcome-subtitle">
              Manage your parcels and smart lockers in one place.
            </p>
          </div>
        </section>

        {/* MAIN GRID */}
        <div className="dashboard-grid">

          {/* LOCKER CARD */}
          <section className="locker-card">

            {/* CARD HEADER */}
            <div className="card-header">

              <div>
                <p className="card-eyebrow">
                  YOUR LOCKER
                </p>

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

            {/* LOCKER STATUS */}
            <div className="locker-visual">

              <div className="locker-icon">
                {isLocked ? (
                  <Lock size={42} />
                ) : (
                  <Unlock size={42} />
                )}
              </div>

              <h3>
                {typeof solenoidLocked !== "boolean"
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

            {/* REMOTE DOOR LOCK BUTTON */}
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
                typeof solenoidLocked !== "boolean"
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

            {/* REMOTE POWER SAVING MODE */}
            <div className="power-mode-control">

              <div>
                <p className="card-eyebrow">
                  POWER MANAGEMENT
                </p>

                <h3>Power Saving Mode</h3>

                <p>
                  {typeof powerSaving !== "boolean"
                    ? "Waiting for power mode telemetry."
                    : isPowerSaving
                    ? "Power-saving mode is enabled."
                    : "Power-saving mode is disabled."}
                </p>
              </div>

              <button
                type="button"
                className={`locker-button ${
                  isPowerSaving
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
                ) : isPowerSaving ? (
                  <>
                    <Sun size={18} />
                    Disable Power Saving
                  </>
                ) : (
                  <>
                    <BatteryCharging size={18} />
                    Enable Power Saving
                  </>
                )}
              </button>

            </div>

            {/* COMMAND FEEDBACK */}
            {controlMessage && (
              <p className="control-success">
                {controlMessage}
              </p>
            )}

            {controlError && (
              <p className="control-error">
                {controlError}
              </p>
            )}

            {/* LOCKER ERRORS */}
            {lockersError && (
              <p className="control-error">
                {lockersError}
              </p>
            )}

            {telemetryError && (
              <p className="control-error">
                {telemetryError}
              </p>
            )}

            {/* TELEMETRY SUMMARY */}
            {deviceUuid && (
              <div className="locker-telemetry-summary">

                <p className="card-eyebrow">
                  LATEST TELEMETRY
                </p>

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
                      : isPowerSaving
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
                    <LoaderCircle
                      size={14}
                      className="spin"
                    />
                    Updating telemetry...
                  </p>
                )}

              </div>
            )}

            {/* PAIR DEVICE */}
            <button
              className="scan-button"
              onClick={() => navigate("/pair-locker")}
            >
              <ScanLine size={18} />
              Scan / Pair Delivery Device
            </button>

          </section>

        </div>

        {/* ======================================
            PARCEL HISTORY
        ====================================== */}

        <section className="history-card">

          <div className="card-header">

            <div>
              <p className="card-eyebrow">
                PARCEL HISTORY
              </p>

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

          {/* BACKEND DELIVERY RECORDS */}
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
                  <div
                    className="history-item"
                    key={parcel.id}
                  >

                    {/* PACKAGE ICON */}
                    <div className="history-package-icon">
                      <Package size={20} />
                    </div>

                    {/* PARCEL INFORMATION */}
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

                    {/* PARCEL STATUS */}
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

      </main>
    </div>
  );
}

export default Dashboard;
