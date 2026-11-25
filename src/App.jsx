
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./pages/DashboardLayout";
import PairLocker from "./pages/PairLocker";
import LockerManagement from "./pages/LockerManagement.jsx";
import DeliveryHistory from "./pages/DeliveryHistory";
import LockerTelemetry from "./pages/LockerTelemetry";

function App() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  // APPLY DARK MODE
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark-mode",
      darkMode
    );

    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  return (
    <div className={darkMode ? "app dark" : "app light"}>

      <BrowserRouter>
        <Routes>

          {/* HOME */}
          <Route
            path="/"
            element={
              <Home
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            }
          />

          {/* AUTHENTICATION */}
          <Route
            path="/login"
            element={
              <Login
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            }
          />

          <Route
            path="/signup"
            element={
              <SignUp
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            }
          />

          {/* SHARED DASHBOARD LAYOUT */}
          <Route element={<DashboardLayout />}>

            {/* DASHBOARD */}
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                />
              }
            />

            {/* LOCKER MANAGEMENT */}
            <Route
              path="/lockers"
              element={<LockerManagement />}
            />

            {/* LOCKER TELEMETRY */}
            <Route
              path="/locker-telemetry"
              element={<LockerTelemetry />}
            />

            {/* PAIR LOCKER */}
            <Route
              path="/pair-locker"
              element={<PairLocker />}
            />

            {/* DELIVERY HISTORY */}
            <Route
              path="/delivery-history"
              element={
                <DeliveryHistory
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                />
              }
            />

          </Route>

        </Routes>
      </BrowserRouter>

    </div>
  );
}

export default App;
