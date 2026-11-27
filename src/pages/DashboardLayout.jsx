
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Lock,
  History,
  Plus,
  LogOut,
  Box,
  Activity,
  Trash2,
} from "lucide-react";

import {
  logoutUser,
  deleteAccount,
} from "../services/api";

function DashboardLayout() {
  const navigate = useNavigate();

  // LOGOUT
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("token");
      localStorage.removeItem("userId");

      navigate("/login");
    }
  };

  // DELETE ACCOUNT
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your Dropora account? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await deleteAccount();

      alert("Your account has been deleted successfully.");

      navigate("/signup");
    } catch (error) {
      console.error("Delete account error:", error);

      alert(
        error.message || "Unable to delete your account."
      );
    }
  };

  const navClass = ({ isActive }) =>
    `sidebar-link ${isActive ? "active" : ""}`;

  return (
    <div className="dashboard-body">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">

        {/* BRAND */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Box size={26} strokeWidth={2} />
          </div>

          <div className="sidebar-brand-text">
            <strong>DROPORA</strong>
            <small>SMART LOCKER</small>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="sidebar-navigation">

          {/* DASHBOARD */}
          <NavLink
            to="/dashboard"
            end
            className={navClass}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          {/* MY LOCKERS */}
          <NavLink
            to="/lockers"
            className={navClass}
          >
            <Lock size={20} />
            <span>My Lockers</span>
          </NavLink>

          {/* LOCKER TELEMETRY */}
          <NavLink
            to="/locker-telemetry"
            className={navClass}
          >
            <Activity size={20} />
            <span>Locker Telemetry</span>
          </NavLink>

          {/* DELIVERY HISTORY */}
          <NavLink
            to="/delivery-history"
            className={navClass}
          >
            <History size={20} />
            <span>Delivery History</span>
          </NavLink>

          {/* PAIR LOCKER */}
          <NavLink
            to="/pair-locker"
            className={navClass}
          >
            <Plus size={20} />
            <span>Pair Locker</span>
          </NavLink>

        </nav>

        {/* PUSH ACTIONS TO BOTTOM */}
        <div className="sidebar-spacer" />

        {/* LOGOUT */}
        <button
          type="button"
          className="sidebar-link sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>

        {/* DELETE ACCOUNT */}
        <button
          type="button"
          className="sidebar-link sidebar-delete-account"
          onClick={handleDeleteAccount}
        >
          <Trash2 size={20} />
          <span>Delete Account</span>
        </button>

      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-page-content">
        <Outlet />
      </main>

    </div>
  );
}

export default DashboardLayout;
