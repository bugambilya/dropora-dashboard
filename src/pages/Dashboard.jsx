
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  Package,
  CheckCircle2,
  Clock3,
  XCircle,
  RefreshCw,
  History,
  Lock,
  Unlock,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react";

import { sendRemoteCommand } from "../services/locker";
import { getDeliveries } from "../services/deliveryService";


const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function getCommandErrorMessage(error) {
  return (
    error?.message ||
    error?.response?.data?.message ||
    "The command could not be completed."
  );
}

function getDeliveryStatus(status) {
  switch (status) {
    case "received":
      return {
        label: "Received",
        icon: CheckCircle2,
        className: "received",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        icon: XCircle,
        className: "cancelled",
      };

    case "to_receive":
    default:
      return {
        label: "To Receive",
        icon: Clock3,
        className: "pending",
      };
  }
}

function formatDate(dateString) {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString();
}

function Dashboard() {
  const navigate = useNavigate();

  // ======================================
  // STATE
  // ======================================

  const [deviceUuid, setDeviceUuid] = useState(null);

  const [telemetry, setTelemetry] = useState(null);

  const [deliveries, setDeliveries] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isLockerOnline, setIsLockerOnline] = useState(false);

  const [lockOverride, setLockOverride] = useState(null);
  const [powerSavingOverride, setPowerSavingOverride] = useState(null);

  const [isLockLoading, setIsLockLoading] = useState(false);
  const [isSleepLoading, setIsSleepLoading] = useState(false);

  const [controlSuccess, setControlSuccess] = useState("");
  const [controlError, setControlError] = useState("");

  // ======================================
  // AUTH TOKEN
  // ======================================

  const getAccessToken = () => {
    return localStorage.getItem("accessToken");
  };

  // ======================================
  // FETCH PAIRED LOCKER
  // ======================================

  const fetchPairedLocker = useCallback(async () => {
    try {
      const token = getAccessToken();

      const response = await fetch(`${API_BASE}/api/locker/paired`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch paired locker.");
      }

      const data = await response.json();

      const lockers = Array.isArray(data)
        ? data
        : data.lockers || data.pairedLockers || [];

      const pairedLocker = lockers[0];

      if (pairedLocker?.device_uuid) {
        setDeviceUuid(pairedLocker.device_uuid);
      } else {
        setDeviceUuid(null);
      }
    } catch (error) {
      console.error("Error fetching paired locker:", error);
      setDeviceUuid(null);
    }
  }, []);

  // ======================================
  // FETCH TELEMETRY
  // ======================================

  const fetchTelemetry = useCallback(
    async (showRefresh = false) => {
      if (!deviceUuid) {
        setTelemetry(null);
        setIsLockerOnline(false);
        setIsLoading(false);
        return;
      }

      try {
        if (showRefresh) {
          setIsRefreshing(true);
        }

        const token = getAccessToken();

        const response = await fetch(
          `${API_BASE}/api/telemetry/${deviceUuid}?offset=0&limit=10`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch locker telemetry.");
        }

        const data = await response.json();

        const telemetryData =
          data.telemetry ||
          data.latestTelemetry ||
          data.data ||
          data;

        setTelemetry(telemetryData);
        setIsLockerOnline(true);

        // Clear optimistic lock state once telemetry confirms it.
        if (
          lockOverride !== null &&
          telemetryData.solenoid_locked === lockOverride
        ) {
          setLockOverride(null);
        }

        // Clear optimistic sleep state once telemetry confirms it.
        if (
          powerSavingOverride !== null &&
          telemetryData.power_saving === powerSavingOverride
        ) {
          setPowerSavingOverride(null);
        }
      } catch (error) {
        console.error("Error fetching telemetry:", error);
        setIsLockerOnline(false);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [deviceUuid, lockOverride, powerSavingOverride]
  );

  // ======================================
  // FETCH DELIVERY HISTORY
  // ======================================

  const fetchDeliveryHistory = useCallback(async () => {
    try {
      const response = await getDeliveries();

      const deliveryData =
        response?.deliveries ||
        response?.data?.deliveries ||
        response?.data ||
        response;

      if (Array.isArray(deliveryData)) {
        const sortedDeliveries = [...deliveryData].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        setDeliveries(sortedDeliveries);
      } else {
        setDeliveries([]);
      }
    } catch (error) {
      console.error("Error fetching delivery history:", error);
      setDeliveries([]);
    }
  }, []);

  // ======================================
  // INITIAL LOAD
  // ======================================

  useEffect(() => {
    fetchPairedLocker();
    fetchDeliveryHistory();
  }, [fetchPairedLocker, fetchDeliveryHistory]);

  // ======================================
  // REFRESH TELEMETRY EVERY 3 SECONDS
  // ======================================

  useEffect(() => {
    if (!deviceUuid) return;

    fetchTelemetry();

    const interval = setInterval(() => {
      fetchTelemetry();
    }, 3000);

    return () => clearInterval(interval);
  }, [deviceUuid, fetchTelemetry]);

  // ======================================
  // MANUAL REFRESH
  // ======================================

  const handleRefresh = async () => {
    await fetchTelemetry(true);
    await fetchDeliveryHistory();
  };

  // ======================================
  // TELEMETRY VALUES
  // ======================================

  const telemetryLocked = telemetry?.solenoid_locked === true;

  const telemetryPowerSaving = telemetry?.power_saving === true;

  const isLocked =
    lockOverride !== null ? lockOverride : telemetryLocked;

  const isPowerSaving =
    powerSavingOverride !== null
      ? powerSavingOverride
      : telemetryPowerSaving;

  const objectWeight = telemetry?.object_weight_g ?? 0;

  const boxFillPercent = telemetry?.box_fill_percent ?? 0;

  const doorClosed = telemetry?.door_closed === true;

  // ======================================
  // REMOTE LOCK / UNLOCK
  // ======================================

  const handleLockToggle = async () => {
    if (!deviceUuid || isLockLoading) return;

    setControlSuccess("");
    setControlError("");
    setIsLockLoading(true);

    const nextLockedState = !isLocked;

    try {
      await sendRemoteCommand({
        deviceUuid,
        doorLocked: nextLockedState,
        powerSaving: isPowerSaving,
      });

      setLockOverride(nextLockedState);

      setControlSuccess(
        nextLockedState
          ? "Locker locked successfully."
          : "Locker unlocked successfully."
      );
    } catch (error) {
      console.error("Lock command failed:", error);

      setControlError(getCommandErrorMessage(error));
    } finally {
      setIsLockLoading(false);
    }
  };

  // ======================================
  // SLEEP MODE / POWER SAVING
  // ======================================

  const handleSleepToggle = async () => {
    if (!deviceUuid || isSleepLoading) return;

    setControlSuccess("");
    setControlError("");
    setIsSleepLoading(true);

    const nextSleepState = !isPowerSaving;

    try {
      await sendRemoteCommand({
        deviceUuid,
        doorLocked: isLocked,
        powerSaving: nextSleepState,
      });

      setPowerSavingOverride(nextSleepState);

      setControlSuccess(
        nextSleepState
          ? "Sleep Mode enabled."
          : "Sleep Mode disabled. Locker is awake."
      );
    } catch (error) {
      console.error("Sleep Mode command failed:", error);

      setControlError(getCommandErrorMessage(error));
    } finally {
      setIsSleepLoading(false);
    }
  };

  // ======================================
  // NAVIGATION
  // ======================================

  const handleViewHistory = () => {
    navigate("/delivery-history");
  };

  // ======================================
  // RENDER
  // ======================================

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <header className="header">
        <div>
          <h1>Dashboard</h1>
          <p>Monitor and control your locker.</p>
        </div>

        <div className="header-controls">
          <div className="online-status">
            {isLockerOnline ? (
              <>
                <Wifi size={16} />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff size={16} />
                <span>Offline</span>
              </>
            )}
          </div>

          <button
            className="icon-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh dashboard"
          >
            <RefreshCw
              size={18}
              className={isRefreshing ? "refresh-spin" : ""}
            />
          </button>
        </div>
      </header>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard">
        <section className="dashboard-welcome">
          <h2>Welcome back!</h2>
          <p>
            Manage your locker, check its status, and monitor your deliveries.
          </p>
        </section>

        <div className="dashboard-grid">
          {/* LOCKER CARD */}
          <section className="locker-card">
            <div className="card-header">
              <div>
                <p className="card-eyebrow">YOUR LOCKER</p>
                <h2>Smart Locker</h2>
              </div>

              <div className="locker-online">
                <span
                  className={
                    isLockerOnline ? "status-dot online" : "status-dot offline"
                  }
                />
                {isLockerOnline ? "Connected" : "Disconnected"}
              </div>
            </div>

            <div className="locker-visual">
              <div className="locker-icon">
                {isLocked ? (
                  <Lock size={48} />
                ) : (
                  <Unlock size={48} />
                )}
              </div>

              <h3>{isLocked ? "Locker Locked" : "Locker Unlocked"}</h3>

              <p>
                {isLocked
                  ? "Your locker is secured."
                  : "Your locker is currently unlocked."}
              </p>

              <button
                className={`locker-button ${
                  isLocked ? "unlock-button" : "lock-button"
                }`}
                onClick={handleLockToggle}
                disabled={!deviceUuid || !isLockerOnline || isLockLoading}
              >
                {isLockLoading ? (
                  <>
                    <RefreshCw size={16} className="refresh-spin" />
                    Processing...
                  </>
                ) : isLocked ? (
                  <>
                    <Unlock size={16} />
                    Unlock Locker
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Lock Locker
                  </>
                )}
              </button>
            </div>

            {/* SLEEP MODE CONTROL */}
            <div className="power-mode-control">
              <div className="power-mode-info">
                <div className="power-mode-icon">
                  {isPowerSaving ? (
                    <Moon size={22} />
                  ) : (
                    <Sun size={22} />
                  )}
                </div>

                <div>
                  <h3>Sleep Mode</h3>
                  <p>
                    {isPowerSaving
                      ? "Sleep Mode is enabled."
                      : "Sleep Mode is disabled."}
                  </p>
                </div>
              </div>

              <button
                className="locker-button"
                onClick={handleSleepToggle}
                disabled={!deviceUuid || !isLockerOnline || isSleepLoading}
              >
                {isSleepLoading ? (
                  <>
                    <RefreshCw size={16} className="refresh-spin" />
                    Processing...
                  </>
                ) : isPowerSaving ? (
                  <>
                    <Sun size={16} />
                    Wake Up
                  </>
                ) : (
                  <>
                    <Moon size={16} />
                    Enter Sleep Mode
                  </>
                )}
              </button>
            </div>

            {/* COMMAND FEEDBACK */}
            {controlSuccess && (
              <div className="control-success">
                <CheckCircle2 size={16} />
                <span>{controlSuccess}</span>
              </div>
            )}

            {controlError && (
              <div className="control-error">
                <AlertCircle size={16} />
                <span>{controlError}</span>
              </div>
            )}

            {/* TELEMETRY */}
            <div className="locker-telemetry-summary">
              <div>
                <span>Object Weight</span>
                <strong>{Number(objectWeight).toFixed(1)} g</strong>
              </div>

              <div>
                <span>Box Fill</span>
                <strong>{Number(boxFillPercent).toFixed(0)}%</strong>
              </div>

              <div>
                <span>Door</span>
                <strong>{doorClosed ? "Closed" : "Open"}</strong>
              </div>
            </div>

            {isRefreshing && (
              <p className="telemetry-refreshing">
                <RefreshCw size={14} className="refresh-spin" />
                Updating telemetry...
              </p>
            )}

            {!deviceUuid && !isLoading && (
              <p className="control-error">
                No paired locker found. Please pair your locker first.
              </p>
            )}
          </section>

          {/* DELIVERY HISTORY CARD */}
          <section className="history-card">
            <div className="card-header">
              <div>
                <p className="card-eyebrow">RECENT ACTIVITY</p>
                <h2>Delivery History</h2>
              </div>

              <button
                className="view-history-button"
                onClick={handleViewHistory}
              >
                View All
                <History size={16} />
              </button>
            </div>

            {isLoading ? (
              <div className="history-empty">
                <RefreshCw size={20} className="refresh-spin" />
                <p>Loading delivery history...</p>
              </div>
            ) : deliveries.length === 0 ? (
              <div className="history-empty">
                <Package size={32} />
                <p>No deliveries yet.</p>
              </div>
            ) : (
              <div className="history-list">
                {deliveries.slice(0, 4).map((delivery) => {
                  const status = getDeliveryStatus(delivery.status);
                  const StatusIcon = status.icon;

                  return (
                    <div
                      className="history-item"
                      key={delivery.id}
                    >
                      <div className="history-package-icon">
                        <Package size={20} />
                      </div>

                      <div className="history-info">
                        <strong>
                          {delivery.courier_type || "Delivery"}
                        </strong>

                        <span>
                          Parcel ID: {delivery.parcel_id || "N/A"}
                        </span>

                        <small>{formatDate(delivery.created_at)}</small>
                      </div>

                      <div
                        className={`history-status ${status.className}`}
                      >
                        <StatusIcon size={14} />
                        <span>{status.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              className="scan-button"
              onClick={() => navigate("/register-delivery")}
            >
              <Package size={16} />
              Register New Delivery
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
