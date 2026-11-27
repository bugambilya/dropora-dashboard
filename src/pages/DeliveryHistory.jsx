
import { useState, useEffect, useCallback, useRef } from "react";

import {
  Package,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  History,
  Plus,
  Truck,
} from "lucide-react";

import {
  getDeliveries,
  registerDelivery,
  updateDeliveryStatus,
} from "../services/deliveryService";

function DeliveryHistory() {
  const [deliveries, setDeliveries] = useState([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // REGISTER DELIVERY FORM
  const [courierType, setCourierType] = useState("FLASH");
  const [parcelId, setParcelId] = useState("");
  const [registering, setRegistering] = useState(false);

  // STATUS UPDATE
  const [updatingId, setUpdatingId] = useState("");

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(false);

  // ======================================
  // FETCH DELIVERY HISTORY
  // ======================================
  const fetchHistory = useCallback(
    async (showLoading = false) => {
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;

      if (showLoading && isMountedRef.current) {
        setLoading(true);
      }

      try {
        const data = await getDeliveries();

        if (isMountedRef.current) {
          setDeliveries(data.deliveries || []);
          setError("");
        }
      } catch (err) {
        console.error(
          "Delivery history error:",
          err
        );

        if (isMountedRef.current) {
          setError(
            err.message ||
              "Unable to load delivery history."
          );
        }
      } finally {
        isFetchingRef.current = false;

        if (
          isMountedRef.current &&
          showLoading
        ) {
          setLoading(false);
        }
      }
    },
    []
  );

  // ======================================
  // INITIAL FETCH + AUTO REFRESH
  // ======================================
  useEffect(() => {
    isMountedRef.current = true;

    fetchHistory(true);

    const interval = setInterval(() => {
      fetchHistory(false);
    }, 3000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchHistory]);

  // ======================================
  // MANUAL REFRESH
  // ======================================
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHistory(true);
    setRefreshing(false);
  };

  // ======================================
  // REGISTER NEW DELIVERY
  // ======================================
  const handleRegisterDelivery = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const trimmedParcelId = parcelId.trim();

    if (!trimmedParcelId) {
      setError("Please enter a parcel ID.");
      return;
    }

    if (!/^\d+$/.test(trimmedParcelId)) {
      setError(
        "Parcel ID must contain numbers only."
      );
      return;
    }

    try {
      setRegistering(true);

      await registerDelivery({
        courier_type: courierType,
        parcel_id: trimmedParcelId,
      });

      setParcelId("");

      setSuccess(
        "Delivery registered successfully."
      );

      await fetchHistory(true);
    } catch (err) {
      console.error(
        "Register delivery error:",
        err
      );

      setError(
        err.message ||
          "Unable to register delivery."
      );
    } finally {
      setRegistering(false);
    }
  };

  // ======================================
  // UPDATE DELIVERY STATUS
  // ======================================
  const handleStatusUpdate = async (
    deliveryId,
    status
  ) => {
    setError("");
    setSuccess("");

    const confirmationMessage =
      status === "received"
        ? "Mark this parcel as received?"
        : "Are you sure you want to cancel this delivery?";

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    try {
      setUpdatingId(deliveryId);

      await updateDeliveryStatus(
        deliveryId,
        status
      );

      setSuccess(
        status === "received"
          ? "Delivery marked as received."
          : "Delivery cancelled successfully."
      );

      await fetchHistory(true);
    } catch (err) {
      console.error(
        "Update delivery status error:",
        err
      );

      setError(
        err.message ||
          "Unable to update delivery status."
      );
    } finally {
      setUpdatingId("");
    }
  };

  // ======================================
  // GET DELIVERY STATUS
  // ======================================
  const getStatus = (delivery) =>
    String(
      delivery.status || "to_receive"
    ).toLowerCase();

  // ======================================
  // SEARCH AND FILTER
  // ======================================
  const filteredDeliveries = deliveries.filter(
    (delivery) => {
      const tracking = String(
        delivery.parcel_id || ""
      );

      const courier = String(
        delivery.courier_type || ""
      );

      const searchTerm = search.toLowerCase();

      const matchesSearch =
        tracking
          .toLowerCase()
          .includes(searchTerm) ||
        courier
          .toLowerCase()
          .includes(searchTerm);

      const status = getStatus(delivery);

      const matchesFilter =
        filter === "All" ||
        (filter === "To Receive" &&
          status === "to_receive") ||
        (filter === "Received" &&
          status === "received") ||
        (filter === "Cancelled" &&
          status === "cancelled");

      return matchesSearch && matchesFilter;
    }
  );

  // ======================================
  // STATUS ICON
  // ======================================
  const getStatusIcon = (status) => {
    switch (status) {
      case "received":
        return <CheckCircle size={16} />;

      case "cancelled":
        return <XCircle size={16} />;

      default:
        return <Clock size={16} />;
    }
  };

  // ======================================
  // FORMAT STATUS
  // ======================================
  const formatStatus = (status) => {
    const statusLabels = {
      to_receive: "To Receive",
      received: "Received",
      cancelled: "Cancelled",
    };

    return (
      statusLabels[status] ||
      String(status)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
    );
  };

  // ======================================
  // FORMAT DATE
  // ======================================
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (
      Number.isNaN(parsedDate.getTime())
    ) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString(
      "en-PH",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  // ======================================
  // STATISTICS
  // ======================================
  const totalDeliveries = deliveries.length;

  const receivedCount = deliveries.filter(
    (delivery) =>
      getStatus(delivery) === "received"
  ).length;

  const pendingCount = deliveries.filter(
    (delivery) =>
      getStatus(delivery) === "to_receive"
  ).length;

  // ======================================
  // RENDER
  // ======================================
  return (
    <div className="delivery-history-page">
      <div className="delivery-history-container">

        {/* HEADER */}
        <div className="delivery-history-header">
          <button
            className="delivery-refresh-button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={17}
              className={
                loading || refreshing
                  ? "delivery-loading-icon"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {/* TITLE */}
        <div className="delivery-history-title">
          <div className="delivery-history-title-icon">
            <History size={28} />
          </div>

          <div>
            <h1>Delivery History</h1>

            <p>
              Track and review your deliveries.
            </p>
          </div>
        </div>

        {/* FEEDBACK */}
        {error && (
          <div className="delivery-feedback error">
            <XCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="delivery-feedback success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* REGISTER DELIVERY */}
        <div className="delivery-register-card">
          <div className="delivery-register-title">
            <div className="delivery-register-icon">
              <Plus size={22} />
            </div>

            <div>
              <h2>Register New Delivery</h2>

              <p>
                Add an incoming parcel to your delivery history.
              </p>
            </div>
          </div>

          <form
            className="delivery-register-form"
            onSubmit={handleRegisterDelivery}
          >
            <div className="delivery-form-group">
              <label htmlFor="courier-type">
                Courier
              </label>

              <select
                id="courier-type"
                value={courierType}
                onChange={(e) =>
                  setCourierType(e.target.value)
                }
                disabled={registering}
              >
                <option value="FLASH">FLASH</option>
                <option value="SPX">SPX</option>
                <option value="J&T">J&amp;T</option>
              </select>
            </div>

            <div className="delivery-form-group">
              <label htmlFor="parcel-id">
                Parcel ID
              </label>

              <input
                id="parcel-id"
                type="text"
                inputMode="numeric"
                placeholder="Enter parcel tracking number"
                value={parcelId}
                onChange={(e) =>
                  setParcelId(e.target.value)
                }
                disabled={registering}
                required
              />
            </div>

            <button
              type="submit"
              className="delivery-register-button"
              disabled={registering}
            >
              {registering ? (
                <>
                  <RefreshCw
                    size={17}
                    className="delivery-loading-icon"
                  />

                  Registering...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Register Delivery
                </>
              )}
            </button>
          </form>
        </div>

        {/* STATISTICS */}
        <div className="delivery-history-stats">

          <div className="delivery-history-stat">
            <Package size={22} />

            <div>
              <h3>{totalDeliveries}</h3>
              <p>Total Deliveries</p>
            </div>
          </div>

          <div className="delivery-history-stat">
            <CheckCircle size={22} />

            <div>
              <h3>{receivedCount}</h3>
              <p>Received</p>
            </div>
          </div>

          <div className="delivery-history-stat">
            <Clock size={22} />

            <div>
              <h3>{pendingCount}</h3>
              <p>To Receive</p>
            </div>
          </div>

        </div>

        {/* SEARCH AND FILTER */}
        <div className="delivery-history-controls">

          <div className="delivery-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search parcel ID or courier..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value)
            }
          >
            <option value="All">
              All Deliveries
            </option>

            <option value="To Receive">
              To Receive
            </option>

            <option value="Received">
              Received
            </option>

            <option value="Cancelled">
              Cancelled
            </option>
          </select>

        </div>

        {/* DELIVERY LIST */}
        <div className="delivery-history-card">

          {loading ? (
            <div className="delivery-history-message">
              <RefreshCw
                className="delivery-loading-icon"
                size={28}
              />

              <p>Loading delivery history...</p>
            </div>

          ) : filteredDeliveries.length === 0 ? (
            <div className="delivery-history-message">
              <Package size={36} />

              <h3>No deliveries found</h3>

              <p>
                Your delivery records will appear here once available.
              </p>
            </div>

          ) : (
            <div className="delivery-history-list">

              {filteredDeliveries.map(
                (delivery) => {
                  const status =
                    getStatus(delivery);

                  const isUpdating =
                    updatingId === delivery.id;

                  return (
                    <div
                      className="delivery-history-item"
                      key={delivery.id}
                    >
                      <div className="delivery-item-icon">
                        <Package size={23} />
                      </div>

                      <div className="delivery-item-details">
                        <h3>
                          {delivery.courier_type ||
                            "Unknown Courier"}
                        </h3>

                        <p>
                          Parcel ID:{" "}
                          {delivery.parcel_id ||
                            "Unavailable"}
                        </p>

                        <span>
                          {formatDate(
                            delivery.created_at
                          )}
                        </span>
                      </div>

                      <div className="delivery-history-actions">
                        <div
                          className={`delivery-status ${status.replaceAll(
                            "_",
                            "-"
                          )}`}
                        >
                          {getStatusIcon(status)}
                          {formatStatus(status)}
                        </div>

                        {/* STATUS ACTIONS */}
                        {status === "to_receive" && (
                          <div className="delivery-status-buttons">
                            <button
                              className="delivery-received-button"
                              onClick={() =>
                                handleStatusUpdate(
                                  delivery.id,
                                  "received"
                                )
                              }
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <RefreshCw
                                  size={15}
                                  className="delivery-loading-icon"
                                />
                              ) : (
                                <CheckCircle size={15} />
                              )}

                              Received
                            </button>

                            <button
                              className="delivery-cancel-button"
                              onClick={() =>
                                handleStatusUpdate(
                                  delivery.id,
                                  "cancelled"
                                )
                              }
                              disabled={isUpdating}
                            >
                              <XCircle size={15} />
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default DeliveryHistory;
