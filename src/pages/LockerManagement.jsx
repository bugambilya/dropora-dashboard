
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  RefreshCw,
  Trash2,
  Plus,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";

import "../App.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function LockerManagement() {
  const navigate = useNavigate();

  const [lockers, setLockers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [unpairingUuid, setUnpairingUuid] = useState(null);

  const fetchLockers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("You are not logged in. Please log in again.");
      }

      const response = await fetch(
        `${API_BASE}/locker/paired`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to retrieve paired lockers."
        );
      }

      setLockers(
        Array.isArray(data.devices) ? data.devices : []
      );

    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLockers();
  }, [fetchLockers]);

  const handleUnpair = async (deviceUuid) => {
    const confirmed = window.confirm(
      "Are you sure you want to unpair this locker?"
    );

    if (!confirmed) return;

    try {
      setUnpairingUuid(deviceUuid);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("You are not logged in. Please log in again.");
      }

      const response = await fetch(
        `${API_BASE}/locker/unpair/${encodeURIComponent(deviceUuid)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Unable to unpair locker."
        );
      }

      setLockers((previous) =>
        previous.filter(
          (locker) => locker.device_uuid !== deviceUuid
        )
      );

      window.alert("Locker successfully unpaired.");

    } catch (err) {
      setError(err.message || "Unable to unpair locker.");
    } finally {
      setUnpairingUuid(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Unknown";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown";
    }

    return parsedDate.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="locker-management-page">
      <div className="locker-management-container">

        {/* HEADER */}
        <header className="locker-management-header">
          <div className="locker-header-title">
            <div>
              <h1>My Locker</h1>
              <p>
                Manage your connected DROPORA smart lockers.
              </p>
            </div>

            <button
              className="locker-refresh-button"
              onClick={() => fetchLockers(true)}
              disabled={refreshing || loading}
            >
              <RefreshCw
                size={17}
                className={refreshing ? "locker-spinning" : ""}
              />
              Refresh
            </button>
          </div>
        </header>

        {/* SUMMARY */}
        <section className="locker-summary-card">
          <div className="locker-summary-icon">
            <Lock size={25} />
          </div>

          <div>
            <span>Paired Lockers</span>
            <h2>{lockers.length}</h2>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="locker-error-message">
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="locker-loading">
            <LoaderCircle
              size={30}
              className="locker-spinning"
            />
            <p>Loading your lockers...</p>
          </div>
        ) : lockers.length === 0 ? (
          /* EMPTY STATE */
          <section className="locker-empty-state">
            <div className="locker-empty-icon">
              <Lock size={35} />
            </div>

            <h2>No Paired Lockers</h2>

            <p>
              You haven't paired a DROPORA locker with your
              account yet. Pair a device to start managing it here.
            </p>

            <button
              className="locker-primary-button"
              onClick={() => navigate("/pair-locker")}
            >
              <Plus size={18} />
              Pair a Locker
            </button>
          </section>
        ) : (
          /* LOCKER LIST */
          <section className="locker-list-section">
            <div className="locker-list-heading">
              <div>
                <h2>Connected Devices</h2>
                <p>Your paired DROPORA lockers.</p>
              </div>

              <button
                className="locker-primary-button"
                onClick={() => navigate("/pair-locker")}
              >
                <Plus size={17} />
                Pair Another
              </button>
            </div>

            <div className="locker-device-list">
              {lockers.map((locker) => (
                <article
                  className="locker-device-card"
                  key={locker.id || locker.device_uuid}
                >
                  <div className="locker-device-main">
                    <div className="locker-device-icon">
                      <Lock size={25} />
                    </div>

                    <div className="locker-device-information">
                      <h3>DROPORA Smart Locker</h3>

                      <p className="locker-device-uuid">
                        Device ID: {locker.device_uuid}
                      </p>

                      <p className="locker-paired-date">
                        <CalendarDays size={15} />
                        Paired: {formatDate(locker.paired_at)}
                      </p>
                    </div>
                  </div>

                  <div className="locker-device-actions">
                    <span className="locker-connected-status">
                      <CheckCircle2 size={15} />
                      Paired
                    </span>

                    <button
                      className="locker-unpair-button"
                      onClick={() =>
                        handleUnpair(locker.device_uuid)
                      }
                      disabled={
                        unpairingUuid === locker.device_uuid
                      }
                    >
                      {unpairingUuid === locker.device_uuid ? (
                        <LoaderCircle
                          size={16}
                          className="locker-spinning"
                        />
                      ) : (
                        <Trash2 size={16} />
                      )}

                      {unpairingUuid === locker.device_uuid
                        ? "Unpairing..."
                        : "Unpair"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}

export default LockerManagement;
