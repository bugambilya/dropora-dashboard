import { useState, useRef, useEffect } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock3,
  Search,
  MapPin,
  Box,
  Bell,
  Lock,
  Unlock,
  ChevronRight,
  ScanLine,
  Moon,
  Sun,
  X
} from "lucide-react";

function Dashboard({ darkMode, setDarkMode }) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
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

  const notificationRef = useRef(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // close the dropdown when clicking anywhere outside it
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);

    // mark everything read once the panel is opened
    if (!showNotifications) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

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

  <div className="logo">
    <div className="logo-icon">
      <Box size={22} />
    </div>

    <div>
      <h2>DROPORA</h2>
      <span>SMART LOCKER</span>
    </div>
  </div>

  {/* RIGHT SIDE CONTROLS */}
  <div className="header-controls">

    {/* Online */}
    <div className="online-status">
      <span className="online-dot"></span>
      Online
    </div>

    {/* Dark Mode */}
    <button
      className="icon-button"
      onClick={() => setDarkMode(!darkMode)}
      aria-label="Toggle dark mode"
    >
      {darkMode ? <Sun size={19} /> : <Moon size={19} />}
    </button>

    {/* Notification */}
    <div className="notification-wrapper" ref={notificationRef}>
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
              onClick={() => setShowNotifications(false)}
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
                <div className="notification-item" key={note.id}>
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

      {/* MAIN */}
      <main className="dashboard">
        {/* WELCOME */}
        <section className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow"></p>
            <h1>DROPORA</h1>
    
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

          <form onSubmit={handleTrack} className="track-search-form">
            <div className="tracking-input-wrapper">
              <Search size={18} />
              <input
                type="text"
                placeholder="Enter tracking number e.g. DRO-4821"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>

            <button type="submit" className="track-button">
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
                <p className="card-eyebrow">CURRENT PARCEL</p>
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
                <p>Tracking: {currentParcel.tracking}</p>
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
                <p className="card-eyebrow">YOUR LOCKER</p>
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

              <h3>{isLocked ? "Locker Locked" : "Locker Open"}</h3>

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

            <button className="scan-button">
              <ScanLine size={18} />
              Scan Delivery Code
            </button>
          </section>
        </div>

        {/* HISTORY */}
        <section className="history-card">
          <div className="card-header">
            <div>
              <p className="card-eyebrow">PARCEL HISTORY</p>
              <h2>Received Parcels</h2>
            </div>

            <button className="view-history-button">
              View All
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="history-list">
            {parcelHistory.map((parcel) => (
              <div className="history-item" key={parcel.id}>
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