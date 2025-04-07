import React, { useState, useEffect } from "react";
import "./css/Sidebar.css";
import { FaBars, FaTachometerAlt, FaQuestionCircle, FaUser, FaTimes, FaChartLine } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [sensorData, setSensorData] = useState([
    { id: 1, forecast: "Normal", pressure: "7 psi", timestamp: new Date() },
    { id: 2, forecast: "Warning", pressure: "7 psi", timestamp: new Date() },
    { id: 3, forecast: "Critical", pressure: "7 psi", timestamp: new Date() }
  ]);
  const navigate = useNavigate();

  // Update sensor data periodically
  useEffect(() => {
    if (isDashboardOpen) {
      const interval = setInterval(() => {
        setSensorData(prevData => 
          prevData.map(sensor => ({
            ...sensor,
            timestamp: new Date()
          }))
        );
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isDashboardOpen]);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
    if (isProfileOpen) setIsProfileOpen(false);
    if (isDashboardOpen) setIsDashboardOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    if (isDashboardOpen) setIsDashboardOpen(false);
  };

  const toggleDashboard = () => {
    setIsDashboardOpen(!isDashboardOpen);
    if (isProfileOpen) setIsProfileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/Login");
  };

  const toggleHelpModal = () => {
    setIsHelpModalOpen(!isHelpModalOpen);
    if (isDashboardOpen) setIsDashboardOpen(false);
  };

  return (
    <div className="sidebar-container">
      {/* Sidebar */}
      <div className={`sidebar ${isExpanded ? "expanded" : ""}`}>
        <div className="sidebar-toggle" onClick={toggleSidebar}>
          <FaBars />
        </div>

        <div className="sidebar-items">
          <div className="sidebar-item profile-section" onClick={toggleProfile}>
            <FaUser className="sidebar-icon" />
            {isExpanded && <span>Profile</span>}
          </div>

          <div className="sidebar-item" onClick={toggleDashboard}>
            <FaTachometerAlt className="sidebar-icon" />
            {isExpanded && <span>Dashboard</span>}
          </div>
          <div className="sidebar-item" onClick={toggleHelpModal}>
            <FaQuestionCircle className="sidebar-icon" />
            {isExpanded && <span>About Us</span>}
          </div>
        </div>
      </div>

      {/* Dashboard Panel */}
      {isDashboardOpen && (
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h3><FaChartLine /> Sensor Dashboard</h3>
            <FaTimes className="close-icon" onClick={toggleDashboard} />
          </div>
          <div className="dashboard-panel-body">
            {sensorData.map((sensor) => (
              <div key={sensor.id} className={`sensor-card ${sensor.forecast.toLowerCase()}`}>
                <div className="sensor-header">
                  <h4>Sensor {sensor.id}</h4>
                  <span className={`status-badge ${sensor.forecast.toLowerCase()}`}>
                    {sensor.forecast}
                  </span>
                </div>
                <div className="sensor-details">
                  <p><strong>Forecast:</strong> {sensor.forecast} pressure detected</p>
                  <p><strong>Actual Pressure:</strong> {sensor.pressure}</p>
                  <p><strong>Time:</strong> {sensor.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Panel */}
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