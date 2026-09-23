import React from "react";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Lock,
  Package,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Wifi,
  Moon,
  Sun
} from "lucide-react";

import { Link } from "react-router-dom";

function Home({ darkMode, setDarkMode }) {
  return (
    <div className="app home-page">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="home-header">

        {/* Logo */}
        <Link
          to="/"
          className="home-logo"
          style={{ textDecoration: "none" }}
        >
          DROPORA
        </Link>

        {/* Header Right */}
         <div className="home-header-right">

         <div className="home-online">
          <span className="home-online-dot"></span>
              System Online
        </div>

         <button
           className="icon-button"
           onClick={() => setDarkMode(!darkMode)}
           aria-label="Toggle dark mode"
         >
           {darkMode ? (
             <Sun size={18} />
           ) : (
             <Moon size={18} />
           )}
             </button>

         <Link
           to="/login"
           className="home-login-button"
         >
           Login
         </Link>

         <Link
          to="/signup"
          className="home-signup-button"
        >
         Sign Up
        </Link>

        </div>
      </header>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      <main className="home-content">

        {/* =================================================
            HERO
        ================================================= */}
        <section className="home-hero">

          {/* Hero Text */}
          <div className="home-hero-text">

            <div className="home-badge">
              <span className="home-badge-dot"></span>
              SMART PARCEL LOCKER
            </div>

            <h1>
              Your packages.
              <br />
              <span>Securely delivered.</span>
            </h1>

            <p>
              Dropora is a smart parcel locker system designed
              to make receiving packages safer, easier, and
              more convenient. Receive your deliveries even
              when you are not available.
            </p>

            {/* Hero Buttons */}
            <div className="home-buttons">

              <Link
                to="/signup"
                className="home-primary-button"
              >
                Get Started
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/login"
                className="home-secondary-button"
              >
                Access Locker
                <Lock size={16} />
              </Link>

            </div>

          </div>


          {/* =================================================
              LOCKER VISUAL
          ================================================= */}
          <div className="home-locker-wrapper">

            {/* Glow */}
            <div className="home-glow"></div>

            {/* Locker */}
            <div className="home-locker">

              {/* Locker Top */}
              <div className="home-locker-top">

                <span>DROPORA</span>

                <span className="home-locker-light"></span>

              </div>


              {/* Locker Body */}
              <div className="home-locker-body">

                <div className="home-locker-door">

                  {/* Pattern */}
                  <div className="home-locker-pattern"></div>

                  {/* Lock */}
                  <div className="home-lock-icon">
                    <Lock size={32} />
                  </div>

                  {/* Status */}
                  <div className="home-lock-status">
                    LOCKED & SECURE
                  </div>

                </div>

              </div>


              {/* Locker Bottom */}
              <div className="home-locker-bottom">

                <span>SMART PARCEL SYSTEM</span>

                <span className="home-locker-status-dot"></span>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            FEATURES
        ================================================= */}
        <section className="home-features">

          <div className="home-section-heading">

            <span>WHY DROPORA?</span>

            <h2>
              Built for smarter deliveries.
            </h2>

            <p>
              Everything you need to manage your packages
              securely and conveniently.
            </p>

          </div>


          <div className="home-feature-grid">

            {/* Feature 1 */}
            <div className="home-feature-card">

              <div className="home-feature-icon">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h3>Secure Storage</h3>

                <p>
                  Your packages remain safely locked inside
                  the Dropora compartment until you are ready
                  to collect them.
                </p>
              </div>

            </div>


            {/* Feature 2 */}
            <div className="home-feature-card">

              <div className="home-feature-icon">
                <ScanLine size={22} />
              </div>

              <div>
                <h3>QR Code Access</h3>

                <p>
                  Scan your delivery code to quickly access
                  your package without complicated steps.
                </p>
              </div>

            </div>


            {/* Feature 3 */}
            <div className="home-feature-card">

              <div className="home-feature-icon">
                <Wifi size={22} />
              </div>

              <div>
                <h3>Connected System</h3>

                <p>
                  Monitor your smart locker and package
                  status through the connected Dropora system.
                </p>
              </div>

            </div>


            {/* Feature 4 */}
            <div className="home-feature-card">

              <div className="home-feature-icon">
                <Package size={22} />
              </div>

              <div>
                <h3>Package Tracking</h3>

                <p>
                  Keep track of packages waiting inside your
                  locker and review their delivery information.
                </p>
              </div>

            </div>


            {/* Feature 5 */}
            <div className="home-feature-card">

              <div className="home-feature-icon">
                <Smartphone size={22} />
              </div>

              <div>
                <h3>Easy Access</h3>

                <p>
                  Access your locker dashboard from a simple
                  and easy-to-use interface.
                </p>
              </div>

            </div>


            {/* Feature 6 */}
            <div className="home-feature-card">

              <div className="home-feature-icon">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <h3>Reliable Delivery</h3>

                <p>
                  Know when your package arrives and collect
                  it when it is convenient for you.
                </p>
              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            CALL TO ACTION
        ================================================= */}
        <section className="home-cta">

          <div>

            <span className="home-cta-label">
              READY TO GET STARTED?
            </span>

            <h2>
              Make your deliveries smarter.
            </h2>

          </div>

          <Link
            to="/signup"
            className="home-cta-button"
          >
            Create Account
            <ArrowRight size={16} />
          </Link>

        </section>


      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}
      <footer className="home-footer">

        <span>
          © 2026 Dropora
        </span>

        <span>
          Smart Parcel Locker System
        </span>

      </footer>

    </div>
  );
}

export default Home;