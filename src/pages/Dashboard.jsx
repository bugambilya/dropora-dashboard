
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock3,
  Search,
  MapPin,
  Bell,
  Lock,
  Unlock,
  ChevronRight,
  ScanLine,
  Moon,
  Sun,
  X,
  RefreshCw,
  AlertCircle,
  LoaderCircle,
  Wifi,
  Activity,
  Scale,
  Radar,
  DoorClosed,
  DoorOpen,
  BatteryCharging,
  Plus,
} from "lucide-react";

import "../App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function Dashboard({ darkMode, setDarkMode }) {
  const navigate = useNavigate();

  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLocked, setIsLocked] = useState(true);

  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Parcel Ready for Pickup",
      message: "Your Apple Store parcel (DRO-4821) is ready for collection.",
      time: "2 mins ago",
      read: false,
    },
    {
      id: 2,
      title: "Locker Connected",
      message: "Your Dropora locker is back online and connected.",
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

  const notificationRef = useRef(null);

  const unreadCount = notifications.filter(
    (n) => !n.read
  ).length;

  // FETCH PAIRED LOCKERS
  const fetchLockers = async () => {
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
        `${API_BASE}/api/lockers/paired`,
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
      setLockersError(
        error.message || "Unable to load lockers."
      );
    } finally {
      setLockersLoading(false);
    }
  };

  useEffect(() => {
    fetchLockers();
  }, []);

  // GET FIRST PAIRED LOCKER UUID
  const deviceUuid = lockers[0]?.device_uuid;

  // FETCH TELEMETRY
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
      setTelemetryError(
        error.message || "Unable to load telemetry."
      );
    } finally {
      setTelemetryLoading(false);
    }
  }, [deviceUuid]);

  // AUTOMATIC TELEMETRY REFRESH EVERY 5 SECONDS
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

  // LATEST TELEMETRY DATA
  const latestTelemetry = telemetry[0];
  const payload = latestTelemetry?.payload || {};

  // ULTRASONIC DISTANCE
  const distance =
    payload.ultrasonic_distance_cm ??
    payload.distance_cm ??
    payload.proximity_distance_cm ??
    payload.proximity_cm ??
    payload.object_distance_cm ??
    payload.distance ??
    null;

  // TELEMETRY VALUES
  const weight = payload.object_weight_g;
  const fillPercent = payload.box_fill_percent;
  const solenoidLocked = payload.solenoid_locked;
  const doorClosed = payload.door_closed;
  const powerSaving = payload.power_saving;

  // CLOSE NOTIFICATION DROPDOWN WHEN CLICKING OUTSIDE
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

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  // TOGGLE NOTIFICATIONS
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

  // SAMPLE PARCEL DATA
  const currentParcel = {
    tracking: "DRO-4821",
    sender: "Apple Store",
    status: "Arrived at Dropora Locker",
    time: "Today, 2:34 PM",
  };

  const trackingSteps = [
    {
      title: "Order Confirmed",
      description: "Your order has been confirmed.",
      date: "Sept 20, 9:30 AM",
      completed: true,
    },
    {
      title: "Package Picked Up",
      description: "Package was collected from the sender.",
      date: "Sept 20, 2:15 PM",
      completed: true,
    },
    {
      title: "Distribution Center",
      description: "Package arrived at the distribution center.",
      date: "Sept 21, 8:42 AM",
      completed: true,
    },
    {
      title: "Out for Delivery",
      description: "Package is on its way to your Dropora locker.",
      date: "Sept 22, 10:10 AM",
      completed: true,
    },
    {
      title: "Arrived at Dropora Locker",
      description: "Package is waiting inside your locker.",
      date: "Sept 22, 2:34 PM",
      completed: true,
      current: true,
    },
    {
      title: "Collected",
      description: "Waiting for you to collect the package.",
      date: "Pending",
      completed: false,
    },
  ];

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

  // TRACK PARCEL
  const handleTrack = (e) => {
    e.preventDefault();

    if (!trackingNumber.trim()) {
      return;
    }

    alert(`Tracking parcel: ${trackingNumber}`);
  };

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

        {/* STAT CARDS */}
        <section className="stat-cards">

          <div className="stat-card">
            <div className="stat-card-icon">
              <Package size={24} />
            </div>

            <div className="stat-card-content">
              <span>Total Parcels</span>
              <strong>4</strong>
              <small>Received</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon">
              <Truck size={24} />
            </div>

            <div className="stat-card-content">
              <span>In Transit</span>
              <strong>0</strong>
              <small>On the way</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon">
              <Clock3 size={24} />
            </div>

            <div className="stat-card-content">
              <span>Ready</span>
              <strong>1</strong>
              <small>Waiting for collection</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon">
              <CheckCircle2 size={24} />
            </div>

            <div className="stat-card-content">
              <span>Collected</span>
              <strong>3</strong>
              <small>Successfully received</small>
            </div>
          </div>

        </section>

        {/* MY LOCKERS SECTION */}
        <section className="dashboard-lockers-section">

          <div className="dashboard-section-heading">
            <div>
              <p className="card-eyebrow">
                DEVICE MANAGEMENT
              </p>

              <h2>My Lockers</h2>

              <p>
                View and manage your paired DROPORA devices.
              </p>
            </div>

            <button
              className="locker-manage-all-button"
              onClick={() => navigate("/lockers")}
            >
              Manage All
              <ChevronRight size={17} />
            </button>
          </div>

          {lockersLoading ? (
            <div className="dashboard-locker-message">
              <LoaderCircle
                className="dashboard-spin"
                size={22}
              />
              Loading your lockers...
            </div>
          ) : lockersError ? (
            <div className="dashboard-locker-message dashboard-locker-error">
              <AlertCircle size={20} />

              <span>{lockersError}</span>

              <button onClick={fetchLockers}>
                Retry
              </button>
            </div>
          ) : lockers.length === 0 ? (
            <div className="dashboard-no-lockers">

              <div className="dashboard-no-lockers-icon">
                <Lock size={27} />
              </div>

              <div>
                <h3>No paired lockers yet</h3>
                <p>
                  Pair your DROPORA device to manage it here.
                </p>
              </div>

              <button
                className="dashboard-pair-button"
                onClick={() => navigate("/pair-locker")}
              >
                <Plus size={17} />
                Pair Locker
              </button>

            </div>
          ) : (
            <div className="dashboard-locker-list">

              {lockers.map((locker) => (
                <div
                  className="dashboard-locker-item"
                  key={locker.id}
                >

                  <div className="dashboard-locker-icon">
                    <Lock size={24} />
                  </div>

                  <div className="dashboard-locker-info">
                    <h3>DROPORA Smart Locker</h3>

                    <p>
                      Device ID: {locker.device_uuid}
                    </p>

                    <small>
                      Paired:{" "}
                      {locker.paired_at
                        ? new Date(
                            locker.paired_at
                          ).toLocaleString()
                        : "Unknown"}
                    </small>
                  </div>

                  <div className="dashboard-locker-status">
                    <span>
                      <Wifi size={14} />
                      Paired
                    </span>
                  </div>

                </div>
              ))}

            </div>
          )}

          <button
            className="dashboard-locker-refresh"
            onClick={fetchLockers}
            disabled={lockersLoading}
          >
            <RefreshCw size={15} />
            Refresh locker list
          </button>

        </section>

        {/* TELEMETRY MONITORING */}
        <section className="dashboard-telemetry-section">

          <div className="dashboard-section-heading">

            <div>
              <p className="card-eyebrow">
                IOT MONITORING
              </p>

              <h2>Locker Telemetry</h2>

              <p>
                Real-time sensor readings from your DROPORA device.
              </p>
            </div>

            <button
              className="locker-manage-all-button"
              onClick={fetchTelemetry}
              disabled={telemetryLoading || !deviceUuid}
            >
              <RefreshCw
                size={16}
                className={
                  telemetryLoading
                    ? "dashboard-spin"
                    : ""
                }
              />
              Refresh
            </button>

          </div>

          {!deviceUuid ? (
            <div className="dashboard-telemetry-message">
              <Lock size={22} />

              <div>
                <h3>No locker connected</h3>
                <p>
                  Pair a DROPORA locker to view its sensor readings.
                </p>
              </div>
            </div>
          ) : telemetryLoading && telemetry.length === 0 ? (
            <div className="dashboard-telemetry-message">
              <LoaderCircle
                size={22}
                className="dashboard-spin"
              />
              <span>Loading telemetry data...</span>
            </div>
          ) : telemetryError ? (
            <div className="dashboard-telemetry-message dashboard-telemetry-error">
              <AlertCircle size={20} />

              <span>{telemetryError}</span>

              <button onClick={fetchTelemetry}>
                Retry
              </button>
            </div>
          ) : telemetry.length === 0 ? (
            <div className="dashboard-telemetry-message">
              <Activity size={22} />

              <div>
                <h3>No telemetry data available</h3>
                <p>
                  Waiting for your device to send sensor readings.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* SENSOR CARDS */}
              <div className="dashboard-telemetry-grid">

                {/* WEIGHT SENSOR */}
                <div className="dashboard-telemetry-card">

                  <div className="dashboard-telemetry-card-header">
                    <div className="dashboard-telemetry-icon">
                      <Scale size={22} />
                    </div>

                    <span className="dashboard-telemetry-label">
                      WEIGHT SENSOR
                    </span>
                  </div>

                  <div className="dashboard-telemetry-value">
                    {weight !== undefined && weight !== null
                      ? Number(weight).toLocaleString()
                      : "--"}
                    <span>g</span>
                  </div>

                  <p className="dashboard-telemetry-description">
                    Object weight detected
                  </p>

                </div>

                {/* ULTRASONIC SENSOR */}
                <div className="dashboard-telemetry-card">

                  <div className="dashboard-telemetry-card-header">
                    <div className="dashboard-telemetry-icon">
                      <Radar size={22} />
                    </div>

                    <span className="dashboard-telemetry-label">
                      ULTRASONIC SENSOR
                    </span>
                  </div>

                  <div className="dashboard-telemetry-value">
                    {distance !== undefined && distance !== null
                      ? Number(distance).toFixed(2)
                      : "--"}
                    <span>cm</span>
                  </div>

                  <p className="dashboard-telemetry-description">
                    Distance measurement
                  </p>

                </div>

                {/* SOLENOID LOCK */}
                <div className="dashboard-telemetry-card">

                  <div className="dashboard-telemetry-card-header">
                    <div className="dashboard-telemetry-icon">
                      {solenoidLocked === true ? (
                        <Lock size={22} />
                      ) : solenoidLocked === false ? (
                        <Unlock size={22} />
                      ) : (
                        <Lock size={22} />
                      )}
                    </div>

                    <span className="dashboard-telemetry-label">
                      SOLENOID LOCK
                    </span>
                  </div>

                  <div className="dashboard-telemetry-status-value">
                    {solenoidLocked === true
                      ? "Locked"
                      : solenoidLocked === false
                      ? "Unlocked"
                      : "Unknown"}
                  </div>

                  <p className="dashboard-telemetry-description">
                    Lock mechanism status
                  </p>

                </div>

                {/* REED SWITCH */}
                <div className="dashboard-telemetry-card">

                  <div className="dashboard-telemetry-card-header">
                    <div className="dashboard-telemetry-icon">
                      {doorClosed === true ? (
                        <DoorClosed size={22} />
                      ) : doorClosed === false ? (
                        <DoorOpen size={22} />
                      ) : (
                        <DoorClosed size={22} />
                      )}
                    </div>

                    <span className="dashboard-telemetry-label">
                      REED SWITCH
                    </span>
                  </div>

                  <div className="dashboard-telemetry-status-value">
                    {doorClosed === true
                      ? "Closed"
                      : doorClosed === false
                      ? "Open"
                      : "Unknown"}
                  </div>

                  <p className="dashboard-telemetry-description">
                    Compartment door status
                  </p>

                </div>

              </div>

              {/* TELEMETRY OVERVIEW */}
              <div className="dashboard-telemetry-overview">

                {/* BOX FILL LEVEL */}
                <div className="dashboard-telemetry-overview-card">

                  <div className="dashboard-telemetry-overview-header">
                    <div>
                      <h3>Locker Fill Level</h3>
                      <p>Estimated compartment occupancy</p>
                    </div>

                    <Activity size={20} />
                  </div>

                  <div className="dashboard-fill-value">
                    {fillPercent !== undefined && fillPercent !== null
                      ? `${fillPercent}%`
                      : "--"}
                  </div>

                  <div className="dashboard-fill-bar">
                    <div
                      className="dashboard-fill-progress"
                      style={{
                        width: `${
                          fillPercent !== undefined &&
                          fillPercent !== null
                            ? Math.min(
                                Math.max(Number(fillPercent), 0),
                                100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                </div>

                {/* POWER SAVING */}
                <div className="dashboard-telemetry-overview-card">

                  <div className="dashboard-telemetry-overview-header">
                    <div>
                      <h3>Power Saving</h3>
                      <p>Device energy mode</p>
                    </div>

                    <BatteryCharging size={20} />
                  </div>

                  <div className="dashboard-telemetry-status-value">
                    {powerSaving === true
                      ? "Enabled"
                      : powerSaving === false
                      ? "Disabled"
                      : "Unknown"}
                  </div>

                  <div
                    className={`dashboard-telemetry-status-pill ${
                      powerSaving === true
                        ? "active"
                        : powerSaving === false
                        ? "inactive"
                        : ""
                    }`}
                  >
                    {powerSaving === true
                      ? "Energy-saving mode active"
                      : powerSaving === false
                      ? "Normal operating mode"
                      : "No status available"}
                  </div>

                </div>

              </div>

              {/* LAST UPDATE */}
              <div className="dashboard-telemetry-last-update">

                <Clock3 size={16} />

                <span>
                  Last updated:{" "}
                  {latestTelemetry?.recorded_at
                    ? new Date(
                        latestTelemetry.recorded_at
                      ).toLocaleString()
                    : latestTelemetry?.created_at
                    ? new Date(
                        latestTelemetry.created_at
                      ).toLocaleString()
                    : latestTelemetry?.received_at
                    ? new Date(
                        latestTelemetry.received_at
                      ).toLocaleString()
                    : "Unknown"}
                </span>

                <span className="dashboard-telemetry-auto-refresh">
                  <span className="online-dot"></span>
                  Auto-refreshing every 5 seconds
                </span>

              </div>

            </>
          )}

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

          {/* CURRENT PARCEL */}
          <section className="tracking-card">

            <div className="card-header">

              <div>
                <p className="card-eyebrow">
                  CURRENT PARCEL
                </p>

                <h2>Where is my parcel?</h2>
              </div>

              <div className="tracking-icon">
                <Truck size={21} />
              </div>

            </div>

            <div className="parcel-summary">

              <div className="parcel-icon">
                <Package size={27} />
              </div>

              <div className="parcel-info">
                <h3>{currentParcel.sender}</h3>

                <p>
                  Tracking: {currentParcel.tracking}
                </p>
              </div>

              <span className="parcel-status ready">
                Ready
              </span>

            </div>

            {/* TIMELINE */}
            <div className="tracking-timeline">

              {trackingSteps.map((step, index) => (
                <div
                  className={`tracking-step ${
                    step.completed ? "completed" : ""
                  } ${step.current ? "current" : ""}`}
                  key={step.title}
                >

                  <div className="timeline-marker">
                    {step.completed ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <div className="empty-marker"></div>
                    )}
                  </div>

                  {index < trackingSteps.length - 1 && (
                    <div className="timeline-line"></div>
                  )}

                  <div className="timeline-content">

                    <div className="timeline-title-row">
                      <h4>{step.title}</h4>
                      <span>{step.date}</span>
                    </div>

                    <p>{step.description}</p>

                    {step.current && (
                      <div className="current-location">
                        <MapPin size={14} />
                        Dropora Locker · Main Compartment
                      </div>
                    )}

                  </div>

                </div>
              ))}

            </div>

          </section>

          {/* LOCKER CARD */}
          <section className="locker-card">

            <div className="card-header">

              <div>
                <p className="card-eyebrow">
                  YOUR LOCKER
                </p>

                <h2>Main Compartment</h2>
              </div>

              <div className="locker-online">
                <span></span>
                Connected
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
                {isLocked ? "Locker Locked" : "Locker Open"}
              </h3>

              <p>
                {isLocked
                  ? "Your parcel is safely secured."
                  : "The compartment is currently unlocked."}
              </p>

            </div>

            <button
              className={`locker-button ${
                isLocked ? "unlock-button" : "lock-button"
              }`}
              onClick={() => setIsLocked(!isLocked)}
            >
              {isLocked ? (
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
