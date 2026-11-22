import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Lock,
  History,
  Plus,
  LogOut,
  Box,
} from "lucide-react";

import "../App.css";

function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
    navigate("/login");
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

          <NavLink
            to="/dashboard"
            end
            className={navClass}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/lockers"
            className={navClass}
          >
            <Lock size={20} />
            <span>My Lockers</span>
          </NavLink>

          <NavLink
            to="/delivery-history"
            className={navClass}
          >
            <History size={20} />
            <span>Delivery History</span>
          </NavLink>

          <NavLink
            to="/pair-locker"
            className={navClass}
          >
            <Plus size={20} />
            <span>Pair Locker</span>
          </NavLink>

        </nav>

        {/* PUSH LOGOUT TO BOTTOM */}
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

      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-page-content">
        <Outlet />
      </main>

    </div>
  );
}

export default DashboardLayout;