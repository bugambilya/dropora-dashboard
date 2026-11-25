
import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  History,
} from "lucide-react";

import { getDeliveries } from "../services/deliveryService";

function DeliveryHistory() {
  const [deliveries, setDeliveries] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH DELIVERY HISTORY
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getDeliveries();

      setDeliveries(data.deliveries || []);
    } catch (err) {
      console.error("Delivery history error:", err);

      setError(
        err.message || "Unable to load delivery history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // GET DELIVERY STATUS
  const getStatus = (delivery) =>
    String(delivery.status || "to_receive").toLowerCase();

  // SEARCH AND FILTER
  const filteredDeliveries = deliveries.filter((delivery) => {
    const tracking = String(delivery.parcel_id || "");
    const courier = String(delivery.courier_type || "");

    const searchTerm = search.toLowerCase();

    const matchesSearch =
      tracking.toLowerCase().includes(searchTerm) ||
      courier.toLowerCase().includes(searchTerm);

    const status = getStatus(delivery);

    const matchesFilter =
      filter === "All" ||
      (filter === "To Receive" && status === "to_receive") ||
      (filter === "Received" && status === "received") ||
      (filter === "Cancelled" && status === "cancelled");

    return matchesSearch && matchesFilter;
  });

  // STATUS ICON
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

  // FORMAT STATUS
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
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    );
  };

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // STATISTICS
  const totalDeliveries = deliveries.length;

  const receivedCount = deliveries.filter(
    (delivery) => getStatus(delivery) === "received"
  ).length;

  const pendingCount = deliveries.filter(
    (delivery) => getStatus(delivery) === "to_receive"
  ).length;

  return (
    <div className="delivery-history-page">
      <div className="delivery-history-container">

        {/* HEADER */}
        <div className="delivery-history-header">
          <button
            className="delivery-refresh-button"
            onClick={fetchHistory}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "delivery-loading-icon" : ""}
            />
            Refresh
          </button>
        </div>

        {/* TITLE */}
        <div className="delivery-history-title">
          <div className="delivery-history-title-icon">
            <History size={28} />
          </div>

          <div>
            <h1>Delivery History</h1>
            <p>Track and review your previous deliveries.</p>
          </div>
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
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Deliveries</option>
            <option value="To Receive">To Receive</option>
            <option value="Received">Received</option>
            <option value="Cancelled">Cancelled</option>
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

          ) : error ? (
            <div className="delivery-history-message">
              <XCircle size={30} />

              <p>{error}</p>

              <button onClick={fetchHistory}>
                Try Again
              </button>
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

              {filteredDeliveries.map((delivery) => {
                const status = getStatus(delivery);

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
                        {delivery.courier_type || "Unknown Courier"}
                      </h3>

                      <p>
                        Parcel ID: {delivery.parcel_id || "Unavailable"}
                      </p>

                      <span>
                        {formatDate(delivery.created_at)}
                      </span>

                    </div>

                    <div
                      className={`delivery-status ${status.replaceAll(
                        "_",
                        "-"
                      )}`}
                    >
                      {getStatusIcon(status)}
                      {formatStatus(status)}
                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default DeliveryHistory;
