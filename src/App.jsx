
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import PairLocker from "./pages/PairLocker";
import LockerManagement from "./pages/LockerManagement.jsx";
import DeliveryHistory from "./pages/DeliveryHistory";

function App() {
  const [darkMode, setDarkMode] = useState(false);

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

          <Route
            path="/verify-email"
            element={
              <VerifyEmail
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            }
          />

          <Route
            path="/forgot-password"
            element={
              <ForgotPassword
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            }
          />

          {/* MAIN DASHBOARD */}
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
            path="/pair-locker"
            element={<PairLocker />}
              />
          <Route
          path="/lockers"
          element={<LockerManagement />}
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

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
