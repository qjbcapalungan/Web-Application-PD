import React, { useState } from "react";
import "./css/Sidebar.css";
import { FaBars, FaTachometerAlt, FaQuestionCircle, FaUser, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false); // Modal state
  const navigate = useNavigate();

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
    if (isProfileOpen) {
      setIsProfileOpen(false); // Close profile panel if the sidebar collapses
    }
  };

  // Toggle profile dropdown beside the sidebar
  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/Login");
  };

  // Toggle help modal
  const toggleHelpModal = () => {
    setIsHelpModalOpen(!isHelpModalOpen);
  };

  return (
    <div className="sidebar-container">
      {/* Sidebar */}
      <div className={`sidebar ${isExpanded ? "expanded" : ""}`}>
        <div className="sidebar-toggle" onClick={toggleSidebar}>
          <FaBars />
        </div>

        {/* Sidebar items */}
        <div className="sidebar-items">
          {/* Profile Section */}
          <div className="sidebar-item profile-section" onClick={toggleProfile}>
            <FaUser className="sidebar-icon" />
            {isExpanded && <span>Profile</span>}
          </div>

          {/* Sidebar menu items */}
          <div className="sidebar-item">
            <FaTachometerAlt className="sidebar-icon" />
            {isExpanded && <span>Dashboard</span>}
          </div>
          <div className="sidebar-item" onClick={toggleHelpModal}>
            <FaQuestionCircle className="sidebar-icon" />
            {isExpanded && <span>About Us</span>}
          </div>
        </div>
      </div>

      {/* Profile Panel (Beside the sidebar) */}
      {isProfileOpen && (
        <div className="profile-panel">
          <div className="profile-panel-header">
            <h3>Profile</h3>
            <FaTimes className="close-icon" onClick={toggleProfile} />
          </div>
          <div className="profile-panel-body">
            <div className="avatar-large">U</div>
            <p className="username">USER</p>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Team 61</h3>
              <FaTimes className="close-icon" onClick={toggleHelpModal} />
            </div>
            <div className="modal-body">
              <p><strong>Team Members:</strong></p>
              <ul>
                <li>James Victor Capalungan</li>
                <li>Denver Mateo</li>
                <li>Willam Laurence Ramos</li>
                <li>Christian Joseph Pangan</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
