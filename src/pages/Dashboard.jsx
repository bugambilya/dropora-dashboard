
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  Package,
  CheckCircle2,
  Clock3,
  Search,
  Bell,
  Lock,
  Unlock,
  ChevronRight,
  ScanLine,
  Moon,
  Sun,
  X,
  LoaderCircle,
  BatteryCharging,
} from "lucide-react";

import { sendRemoteCommand } from "../services/locker";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function Dashboard({ darkMode, setDarkMode }) {
  const navigate = useNavigate();

  const [trackingNumber, setTrackingNumber] = useState("");

  const [showNotifications, setShowNotifications] = useState(false);

  // NOTIFICATIONS
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Parcel Ready for Pickup",
      message:
        "Your Apple Store parcel (DRO-4821) is ready for collection.",
      time: "2 mins ago",
      read: false,
    },
    {
      id: 2,
      title: "Locker Connected",
      message:
        "Your Dropora locker is back online and connected.",
      time: "1 hour ago",
      read: false,
    },
  ]);

  // PAIRED LOCKERS
  const [lockers, setLockers] = useState([]);
  const [lockersLoading, setLockersLoading] = useState(true);
  const [lockersError, setLockersError] = useState("");

  // TELEMETRY
  const [telemetry, setTelemetry] = useState([]);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [telemetryError, setTelemetryError] = useState("");

  // REMOTE CONTROL
  const [isControlling, setIsControlling] = useState(false);
  const [isChangingPower, setIsChangingPower] = useState(false);

  const [controlError, setControlError] = useState("");
  const [controlMessage, setControlMessage] = useState("");

  const notificationRef = useRef(null);

  const unreadCount = notifications.filter(
    (n) => !n.read
  ).length;

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
        data.message || "Door lock command submitted successfully."
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
  // CLOSE NOTIFICATION WHEN CLICKING OUTSIDE
  // ======================================

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // ======================================
  // TOGGLE NOTIFICATIONS
  // ======================================

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);

    if (!showNotifications) {
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
        }))
      );
    }
  };

  // ======================================
  // PARCEL DATA
  // ======================================

  const parcelHistory = [
    {
      id: "DRO-4821",
      sender: "Apple Store",
      date: "Sept 22, 2026",
      status: "Ready for Collection",
      statusType: "ready",
    },
    {
      id: "DRO-3917",
      sender: "Shopee",
      date: "Sept 15, 2026",
      status: "Collected",
      statusType: "collected",
    },
    {
      id: "DRO-2841",
      sender: "Lazada",
      date: "Sept 8, 2026",
      status: "Collected",
      statusType: "collected",
    },
    {
      id: "DRO-1732",
      sender: "Amazon",
      date: "Aug 29, 2026",
      status: "Collected",
      statusType: "collected",
    },
  ];

  // ======================================
  // TRACK PARCEL
  // ======================================

  const handleTrack = (e) => {
    e.preventDefault();

    if (!trackingNumber.trim()) {
      return;
    }

    alert(`Tracking parcel: ${trackingNumber}`);
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

          {/* NOTIFICATIONS */}
          <div
            className="notification-wrapper"
            ref={notificationRef}
          >
            <button
              className="notification-button"
              onClick={toggleNotifications}
              aria-label="Notifications"
            >
              <Bell size={19} />

              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-panel">

                <div className="notification-panel-header">
                  <h3>Notifications</h3>

                  <button
                    className="notification-close"
                    onClick={() =>
                      setShowNotifications(false)
                    }
                    aria-label="Close notifications"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="notification-panel-list">
                  {notifications.length === 0 ? (
                    <p className="notification-empty">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((note) => (
                      <div
                        className="notification-item"
                        key={note.id}
                      >
                        <div className="notification-item-icon">
                          <Package size={16} />
                        </div>

                        <div className="notification-item-content">
                          <h4>{note.title}</h4>
                          <p>{note.message}</p>
                          <span>{note.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}
          </div>

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

        {/* TRACK PARCEL */}
        <section className="track-search-card">

          <div className="track-search-content">

            <div className="section-icon">
              <Search size={22} />
            </div>

            <div>
              <h2>Track Your Parcel</h2>

              <p>
                Enter your Dropora tracking number to check your parcel status.
              </p>
            </div>

          </div>

          <form
            onSubmit={handleTrack}
            className="track-search-form"
          >

            <div className="tracking-input-wrapper">
              <Search size={18} />

              <input
                type="text"
                placeholder="Enter tracking number e.g. DRO-4821"
                value={trackingNumber}
                onChange={(e) =>
                  setTrackingNumber(e.target.value)
                }
              />
            </div>

            <button
              type="submit"
              className="track-button"
            >
              Track Parcel
            </button>

          </form>

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
                  isPowerSaving ? "lock-button" : "unlock-button"
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

        {/* PARCEL HISTORY */}
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

          <div className="history-list">

            {parcelHistory.map((parcel) => (
              <div
                className="history-item"
                key={parcel.id}
              >

                <div className="history-package-icon">
                  <Package size={20} />
                </div>

                <div className="history-info">
                  <h3>{parcel.sender}</h3>

                  <p>
                    {parcel.id} · {parcel.date}
                  </p>
                </div>

                <div
                  className={`history-status ${parcel.statusType}`}
                >
                  {parcel.statusType === "collected" ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <Clock3 size={15} />
                  )}

                  {parcel.status}
                </div>

                <ChevronRight
                  className="history-arrow"
                  size={18}
                />

              </div>
            ))}

          </div>

        </section>

      </main>
    </div>
  );
}

export default Dashboard;
