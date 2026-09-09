import { useState } from "react";
import {
  Bell,
  Box,
  Wifi,
  Lock,
  Unlock,
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck,
  Activity,
  PackageCheck,
  ChevronLeft,
} from "lucide-react";

import "./App.css";

/* =========================================================
   MOCK DATA
   ========================================================= */

const PACKAGES = [
  {
    id: "PKG-4821",
    sender: "Apple Store",
    arrived: "Today, 2:34 PM",
    weight: "1.2 kg",
    status: "waiting",
  },
  {
    id: "PKG-4855",
    sender: "Nike",
    arrived: "Today, 4:10 PM",
    weight: "0.8 kg",
    status: "waiting",
  },
  {
    id: "PKG-4790",
    sender: "Amazon",
    arrived: "Yesterday, 11:02 AM",
    weight: "2.4 kg",
    status: "collected",
  },
];


/* =========================================================
   APP
   ========================================================= */

function App() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isLocked, setIsLocked] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [showDashboard, setShowDashboard] = useState(false);

  const isDark = theme === "dark";

  const waitingPackages = PACKAGES.filter(
    (pkg) => pkg.status === "waiting"
  );

  const collectedPackages = PACKAGES.filter(
    (pkg) => pkg.status === "collected"
  );

  return (
    <div className={`app ${isDark ? "dark" : "light"}`}>

      {/* =====================================================
          HOME PAGE
          ===================================================== */}

      {!showDashboard ? (

        <HomePage
          isDark={isDark}
          setTheme={setTheme}
          onEnterDashboard={() => setShowDashboard(true)}
        />

      ) : (

        /* ===================================================
           DASHBOARD
           =================================================== */

        <div className="dashboard-page">

          {/* ================= HEADER ================= */}

          <header className="header">

            <div
              className="logo"
              onClick={() => setShowDashboard(false)}
              style={{ cursor: "pointer" }}
              title="Back to Home"
            >
              DROPORA
            </div>


            <div className="header-controls">

              {/* Online Status */}

              <div className="online-status">

                <Wifi size={16} />

                <span>
                  Online
                </span>

              </div>


              {/* Theme Toggle */}

              <button
                onClick={() =>
                  setTheme(
                    isDark
                      ? "light"
                      : "dark"
                  )
                }
                className="icon-button theme-button"
                title={
                  isDark
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
                }
              >

                {isDark ? (
                  <Sun size={20} />
                ) : (
                  <Moon size={20} />
                )}

              </button>


              {/* Notifications */}

              <button
                className="icon-button notification-button"
                onClick={() =>
                  setActiveTab("Notifications")
                }
                title="View Notifications"
              >

                <Bell size={21} />

                <span className="notification-dot" />

              </button>

            </div>

          </header>


          {/* ================= BACK TO HOME ================= */}

          <button
            className="back-home-button"
            onClick={() => setShowDashboard(false)}
          >
            <ChevronLeft size={17} />
            Back to Home
          </button>


          {/* ================= ACTION CARD ================= */}

          <section className="action-cards">

            <button
              className="receive-card"
              onClick={() =>
                setActiveTab("Packages")
              }
            >

              <div className="action-icon">

                <Box
                  size={28}
                  strokeWidth={1.8}
                />

              </div>


              <div>

                <p className="action-title">
                  Locker History
                </p>

                <p className="action-description">
                  View your Dropora packages
                </p>

              </div>

            </button>

          </section>


          {/* ================= MAIN DASHBOARD ================= */}

          <main className="dashboard">

            {/* ================= DROPORA LOCKER ================= */}

            <section className="locker-section">

              {/* Locker Header */}

              <div className="locker-header">

                <p className="locker-label">
                  DROPORA
                </p>


                <div className="connected">

                  <span className="connected-dot" />

                  Connected

                </div>

              </div>


              {/* Locker Device */}

              <div className="locker-device">

                {/* Single Compartment */}

                <div
                  className={`compartment ${
                    isLocked
                      ? "compartment-locked"
                      : "compartment-unlocked"
                  }`}
                >

                  {/* Pattern */}

                  <div className="compartment-pattern" />


                  {/* Top */}

                  <div className="compartment-top">

                    <span>
                      DROPORA
                    </span>

                  </div>


                  {/* Center */}

                  <div className="compartment-center">

                    <div
                      className={`lock-circle ${
                        isLocked
                          ? "lock-circle-green"
                          : "lock-circle-blue"
                      }`}
                    >

                      {isLocked ? (
                        <Lock size={25} />
                      ) : (
                        <Unlock size={25} />
                      )}

                    </div>


                    <span
                      className={`status-pill ${
                        isLocked
                          ? "status-locked"
                          : "status-unlocked"
                      }`}
                    >

                      {isLocked
                        ? "Locked"
                        : "Unlocked"}

                    </span>

                  </div>


                  {/* Bottom */}

                  <div className="compartment-bottom">

                    <span>
                      Main Compartment
                    </span>

                    <span
                      className={`compartment-status-dot ${
                        isLocked
                          ? "status-dot-green"
                          : "status-dot-blue"
                      }`}
                    />

                  </div>

                </div>


                {/* Lock / Unlock Button */}

                <button
                  onClick={() =>
                    setIsLocked(!isLocked)
                  }
                  className={`locker-button ${
                    isLocked
                      ? "unlock-button"
                      : "lock-button"
                  }`}
                >

                  {isLocked ? (
                    <>
                      <Unlock size={18} />
                      Unlock Dropora
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      Lock Dropora
                    </>
                  )}

                </button>

              </div>

            </section>


            {/* ================= RIGHT CONTENT ================= */}

            <section className="right-content">

              {/* Tabs */}

              <div className="tabs">

                {[
                  "Overview",
                  "Packages",
                  "Notifications",
                ].map((item) => (

                  <button
                    key={item}
                    onClick={() =>
                      setActiveTab(item)
                    }
                    className={`tab ${
                      activeTab === item
                        ? "active-tab"
                        : ""
                    }`}
                  >

                    {item}


                    {item === "Packages" &&
                      waitingPackages.length > 0 && (

                        <span className="notification-count">
                          {waitingPackages.length}
                        </span>

                      )}


                    {item === "Notifications" && (

                      <span className="notification-count">
                        2
                      </span>

                    )}

                  </button>

                ))}

              </div>


              {/* =================================================
                  OVERVIEW
                  ================================================= */}

              {activeTab === "Overview" && (

                <>

                  {/* Stat Cards */}

                  <div className="stat-grid">

                    <StatCard
                      value={
                        waitingPackages.length
                      }
                      label="Received"
                      valueColor="blue"
                      isDark={isDark}
                    />


                    <StatCard
                      value={
                        collectedPackages.length
                      }
                      label="Collected"
                      valueColor="green"
                      isDark={isDark}
                    />


                    <StatCard
                      value={
                        isLocked
                          ? "Locked"
                          : "Open"
                      }
                      label="Locker Status"
                      valueColor={
                        isLocked
                          ? "green"
                          : "blue"
                      }
                      isDark={isDark}
                    />

                  </div>


                  {/* Dropora Status */}

                  <div className="status-card">

                    <div className="status-header">

                      <h2>
                        Dropora Compartment
                      </h2>


                      <div
                        className={`locker-status ${
                          isLocked
                            ? "green-text"
                            : "blue-text"
                        }`}
                      >

                        {isLocked ? (
                          <Lock size={16} />
                        ) : (
                          <Unlock size={16} />
                        )}


                        {isLocked
                          ? "Locked"
                          : "Unlocked"}

                      </div>

                    </div>


                    {/* Package Summary */}

                    {waitingPackages.length === 0 ? (

                      <p className="compartment-empty-note">
                        No packages waiting for pickup.
                      </p>

                    ) : (

                      <>

                        <p className="compartment-summary">

                          <strong>
                            {waitingPackages.length}
                          </strong>{" "}

                          package
                          {waitingPackages.length > 1
                            ? "s"
                            : ""}{" "}

                          waiting for pickup

                        </p>


                        <div className="package-mini-list">

                          {waitingPackages.map(
                            (pkg) => (

                              <div
                                className="package-mini-row"
                                key={pkg.id}
                              >

                                <div>

                                  <p className="package-mini-id">
                                    {pkg.id}
                                  </p>

                                  <p className="package-mini-sender">
                                    {pkg.sender}
                                  </p>

                                </div>


                                <span className="package-mini-time">
                                  {pkg.arrived}
                                </span>

                              </div>

                            )
                          )}

                        </div>

                      </>

                    )}

                  </div>

                </>

              )}


              {/* =================================================
                  PACKAGES
                  ================================================= */}

              {activeTab === "Packages" && (

                PACKAGES.length === 0 ? (

                  <EmptyState
                    icon={<Box size={42} />}
                    title="Your Packages"
                    description="You don't have any packages yet."
                    isDark={isDark}
                  />

                ) : (

                  <div className="packages-panel">

                    {waitingPackages.length > 0 && (

                      <section className="package-group">

                        <h3 className="package-group-title">
                          Waiting for pickup
                        </h3>


                        <div className="package-list">

                          {waitingPackages.map(
                            (pkg) => (

                              <PackageCard
                                key={pkg.id}
                                pkg={pkg}
                                isDark={isDark}
                              />

                            )
                          )}

                        </div>

                      </section>

                    )}


                    {collectedPackages.length > 0 && (

                      <section className="package-group">

                        <h3 className="package-group-title">
                          Collected
                        </h3>


                        <div className="package-list">

                          {collectedPackages.map(
                            (pkg) => (

                              <PackageCard
                                key={pkg.id}
                                pkg={pkg}
                                isDark={isDark}
                              />

                            )
                          )}

                        </div>

                      </section>

                    )}

                  </div>

                )

              )}


              {/* =================================================
                  NOTIFICATIONS
                  ================================================= */}

              {activeTab === "Notifications" && (

                <EmptyState
                  icon={<Bell size={42} />}
                  title="Notifications"
                  description="You have 2 unread notifications."
                  isDark={isDark}
                />

              )}

            </section>

          </main>

        </div>

      )}

    </div>
  );
}


/* =========================================================
   HOME PAGE
   ========================================================= */

function HomePage({
  isDark,
  setTheme,
  onEnterDashboard,
}) {
  return (

    <div className="home-page">

      {/* ================= HEADER ================= */}

      <header className="home-header">

        <div className="home-logo">
          DROPORA
        </div>


        <div className="home-header-right">

          {/* Online */}

          <div className="home-online">

            <span className="home-online-dot" />

            System Online

          </div>


          {/* Theme */}

          <button
            className="icon-button theme-button"
            onClick={() =>
              setTheme(
                isDark
                  ? "light"
                  : "dark"
              )
            }
            title={
              isDark
                ? "Switch to Light Mode"
                : "Switch to Dark Mode"
            }
          >

            {isDark ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}

          </button>

        </div>

      </header>


      {/* ================= HERO ================= */}

      <main className="home-content">

        <section className="home-hero">

          {/* HERO TEXT */}

          <div className="home-hero-text">

            <div className="home-badge">

              <span className="home-badge-dot" />

              SMART PARCEL LOCKER

            </div>


            <h1>

              Your Packages.

              <br />

              <span>
                Safe & Secure.
              </span>

            </h1>


            <p>

              Dropora is a smart parcel locker system
              that makes receiving and managing your
              packages simple, secure, and convenient.

            </p>


            {/* BUTTONS */}

            <div className="home-buttons">

              <button
                className="home-primary-button"
                onClick={onEnterDashboard}
              >

                <span>
                  Open Dashboard
                </span>

                <ArrowRight size={19} />

              </button>


              <button
                className="home-secondary-button"
                onClick={onEnterDashboard}
              >

                View Locker

              </button>

            </div>

          </div>


          {/* ================= LOCKER VISUAL ================= */}

          <div className="home-locker-wrapper">

            <div className="home-glow" />


            <div className="home-locker">

              {/* Locker Top */}

              <div className="home-locker-top">

                <span>
                  DROPORA
                </span>

                <div className="home-locker-light" />

              </div>


              {/* Locker Body */}

              <div className="home-locker-body">

                <div className="home-locker-door">

                  <div className="home-locker-pattern" />


                  <div className="home-lock-icon">

                    <Lock size={34} />

                  </div>


                  <span className="home-lock-status">
                    LOCKED
                  </span>

                </div>

              </div>


              {/* Locker Bottom */}

              <div className="home-locker-bottom">

                <span>
                  SMART PARCEL LOCKER
                </span>

                <span className="home-locker-status-dot" />

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            FEATURES
            ================================================= */}

        <section className="home-features">

          <div className="home-section-heading">

            <span>
              WHY DROPORA?
            </span>


            <h2>
              Simple. Smart. Secure.
            </h2>


            <p>
              Everything you need to manage your
              parcels in one place.
            </p>

          </div>


          <div className="home-feature-grid">

            {/* FEATURE 1 */}

            <div className="home-feature-card">

              <div className="home-feature-icon">

                <ShieldCheck size={25} />

              </div>


              <div>

                <h3>
                  Secure Storage
                </h3>

                <p>
                  Keep your packages protected
                  inside a secure smart locker.
                </p>

              </div>

            </div>


            {/* FEATURE 2 */}

            <div className="home-feature-card">

              <div className="home-feature-icon">

                <Activity size={25} />

              </div>


              <div>

                <h3>
                  Real-Time Status
                </h3>

                <p>
                  Monitor your locker and package
                  status from the dashboard.
                </p>

              </div>

            </div>


            {/* FEATURE 3 */}

            <div className="home-feature-card">

              <div className="home-feature-icon">

                <PackageCheck size={25} />

              </div>


              <div>

                <h3>
                  Easy Package Access
                </h3>

                <p>
                  Quickly check your packages
                  and access your Dropora locker.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            CTA
            ================================================= */}

        <section className="home-cta">

          <div>

            <p className="home-cta-label">
              READY TO GET STARTED?
            </p>


            <h2>
              Manage your locker with Dropora.
            </h2>

          </div>


          <button
            className="home-cta-button"
            onClick={onEnterDashboard}
          >

            Go to Dashboard

            <ArrowRight size={18} />

          </button>

        </section>

      </main>


      {/* ================= FOOTER ================= */}

      <footer className="home-footer">

        <span>
          © 2026 DROPORA
        </span>

        <span>
          Smart Parcel Locker System
        </span>

      </footer>

    </div>

  );
}


/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  value,
  label,
  valueColor,
  isDark,
}) {

  return (

    <div className="stat-card">

      <span
        className={`stat-value ${
          valueColor === "blue"
            ? "blue-text"
            : "green-text"
        }`}
      >

        {value}

      </span>


      <span className="stat-label">

        {label}

      </span>

    </div>

  );
}


/* =========================================================
   INFO CARD
   ========================================================= */

function InfoCard({
  title,
  value,
  isDark,
}) {

  return (

    <div className="info-card">

      <p className="info-title">
        {title}
      </p>


      <p className="info-value">
        {value}
      </p>

    </div>

  );
}


/* =========================================================
   PACKAGE CARD
   ========================================================= */

function PackageCard({
  pkg,
  isDark,
}) {

  const isCollected =
    pkg.status === "collected";


  return (

    <div
      className={`package-card ${
        isCollected
          ? "package-card-collected"
          : ""
      }`}
    >

      <div className="status-header">

        <h2>
          {pkg.id}
        </h2>


        <span
          className={`package-status-tag ${
            isCollected
              ? "collected"
              : "waiting"
          }`}
        >

          {isCollected
            ? "Collected"
            : "Waiting for pickup"}

        </span>

      </div>


      <div className="info-grid">

        <InfoCard
          title="SENDER"
          value={pkg.sender}
          isDark={isDark}
        />


        <InfoCard
          title="ARRIVED"
          value={pkg.arrived}
          isDark={isDark}
        />


        <InfoCard
          title="WEIGHT"
          value={pkg.weight}
          isDark={isDark}
        />


        <InfoCard
          title="STATUS"
          value={
            isCollected
              ? "Picked Up"
              : "In Locker"
          }
          isDark={isDark}
        />

      </div>

    </div>

  );
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function EmptyState({
  icon,
  title,
  description,
  isDark,
}) {

  return (

    <div className="empty-state">

      <div className="empty-icon">

        {icon}

      </div>


      <h2>
        {title}
      </h2>


      <p>
        {description}
      </p>

    </div>

  );
}


export default App;