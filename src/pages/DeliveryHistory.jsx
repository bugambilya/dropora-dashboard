
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Search,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RefreshCw,
  History,
} from "lucide-react";

import "../App.css";

function DeliveryHistory() {
  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("accessToken");

      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE}/api/deliveries/history`,
        { headers }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Unable to load delivery history."
        );
      }

      // Supports either an array or common API response formats.
      const records = Array.isArray(data)
        ? data
        : data.deliveries || data.history || data.data || [];

      setDeliveries(records);

    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatus = (delivery) =>
    String(delivery.status || "Pending").toLowerCase();

  const filteredDeliveries = deliveries.filter((delivery) => {
    const tracking = String(
      delivery.trackingNumber ||
      delivery.tracking_number ||
      delivery.trackingId ||
      ""
    );

    const courier = String(delivery.courier || "");

    const matchesSearch =
      tracking.toLowerCase().includes(search.toLowerCase()) ||
      courier.toLowerCase().includes(search.toLowerCase());

    const status = getStatus(delivery);

    const matchesFilter =
      filter === "All" ||
      (filter === "Delivered" && status === "delivered") ||
      (filter === "Pending" && status === "pending") ||
      (filter === "In Transit" &&
        ["in_transit", "in transit", "in-transit"].includes(status));

    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
        return <CheckCircle size={16} />;

      case "in_transit":
      case "in transit":
      case "in-transit":
        return <Truck size={16} />;

      case "cancelled":
        return <XCircle size={16} />;

      default:
        return <Clock size={16} />;
    }
  };

  const formatStatus = (status) => {
    return String(status || "Pending")
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

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

  return (
    <div className="delivery-history-page">

      <div className="delivery-history-container">

        {/* Header */}
        <div className="delivery-history-header">

          <button
            className="delivery-refresh-button"
            onClick={fetchHistory}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

        </div>

        {/* Title */}
        <div className="delivery-history-title">
          <div className="delivery-history-title-icon">
            <History size={28} />
          </div>

          <div>
            <h1>Delivery History</h1>
            <p>Track and review your previous deliveries.</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="delivery-history-stats">

          <div className="delivery-history-stat">
            <Package size={22} />
            <div>
              <h3>{deliveries.length}</h3>
              <p>Total Deliveries</p>
            </div>
          </div>

          <div className="delivery-history-stat">
            <CheckCircle size={22} />
            <div>
              <h3>
                {deliveries.filter(
                  (d) => getStatus(d) === "delivered"
                ).length}
              </h3>
              <p>Delivered</p>
            </div>
          </div>

          <div className="delivery-history-stat">
            <Clock size={22} />
            <div>
              <h3>
                {deliveries.filter(
                  (d) => getStatus(d) === "pending"
                ).length}
              </h3>
              <p>Pending</p>
            </div>
          </div>

        </div>

        {/* Search and Filter */}
        <div className="delivery-history-controls">

          <div className="delivery-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search tracking number or courier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Deliveries</option>
            <option value="Delivered">Delivered</option>
            <option value="Pending">Pending</option>
            <option value="In Transit">In Transit</option>
          </select>

        </div>

        {/* Delivery List */}
        <div className="delivery-history-card">

          {loading ? (
            <div className="delivery-history-message">
              <RefreshCw className="delivery-loading-icon" size={28} />
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

              {filteredDeliveries.map((delivery, index) => {
                const status = getStatus(delivery);

                return (
                  <div
                    className="delivery-history-item"
                    key={delivery.id || delivery._id || index}
                  >

                    <div className="delivery-item-icon">
                      <Package size={23} />
                    </div>

                    <div className="delivery-item-details">

                      <h3>
                        {delivery.courier || "Unknown Courier"}
                      </h3>

                      <p>
                        Tracking Number:{" "}
                        {delivery.trackingNumber ||
                          delivery.tracking_number ||
                          delivery.trackingId ||
                          "Unavailable"}
                      </p>

                      <span>
                        {formatDate(
                          delivery.deliveredAt ||
                          delivery.delivered_at ||
                          delivery.createdAt ||
                          delivery.created_at
                        )}
                      </span>

                    </div>

                    <div className={`delivery-status ${status.replaceAll(" ", "-")}`}>
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
