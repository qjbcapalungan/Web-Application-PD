import React, { useState } from "react";
import "./css/Sidebar.css";
import { FaBars, FaCog, FaSignOutAlt, FaTachometerAlt } from "react-icons/fa"; // Icons for the sidebar
import { useNavigate } from "react-router-dom"; // To navigate after logout

function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate(); // Hook for navigation after logout

  // Toggle the sidebar between expanded and collapsed states
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle logout: clear session and navigate to the login page
  const handleLogout = () => {
    // Remove user session data from localStorage and sessionStorage
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");

    // Redirect the user to the login page
    navigate("/Login"); // Ensure '/login' route exists
  };

  return (
    <div className={`sidebar ${isExpanded ? "expanded" : ""}`}>
      {/* Sidebar toggle button */}
      <div className="sidebar-toggle" onClick={toggleSidebar}>
        <FaBars />
      </div>

      {/* Sidebar items */}
      <div className="sidebar-items">
        <div className="sidebar-item">
          <FaTachometerAlt className="sidebar-icon" />
          {isExpanded && <span>Dashboard</span>}
        </div>
        <div className="sidebar-item settings">
          <FaCog className="sidebar-icon" />
          {isExpanded && <span>Settings</span>}
        </div>
        <div className="sidebar-item logout" onClick={handleLogout}>
          <FaSignOutAlt className="sidebar-icon" />
          {isExpanded && <span>Log Out</span>}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
