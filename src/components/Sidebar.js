import React, { useState, useEffect } from "react";
import "./css/Sidebar.css";
import { FaBars, FaTachometerAlt, FaQuestionCircle, FaUser, FaTimes, FaChartLine } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios for API calls

function Sidebar() {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [sensorData, setSensorData] = useState({
    sensor1: [],
    sensor2: [],
    sensor3: []
  });
  const [currentSensorIndexes, setCurrentSensorIndexes] = useState({
    sensor1: 0,
    sensor2: 0,
    sensor3: 0
  });
  const [error, setError] = useState(null);
  const [faultHistory, setFaultHistory] = useState([]);
  const [sensorTimestamps, setSensorTimestamps] = useState({
    sensor1: null,
    sensor2: null,
    sensor3: null
  });
  const [newDataAvailable, setNewDataAvailable] = useState({
    sensor1: false,
    sensor2: false,
    sensor3: false
  });

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'No timestamp available';
    // Simply format the timestamp from the API directly
    const date = new Date(timestamp);
    const formatNumber = (num) => String(num).padStart(2, '0');
    
    return `${date.getUTCFullYear()}-${formatNumber(date.getUTCMonth() + 1)}-${formatNumber(date.getUTCDate())} ${formatNumber(date.getUTCHours())}:${formatNumber(date.getUTCMinutes())}:${formatNumber(date.getUTCSeconds())}`;
  };

  // Utility function to check if data is stale (older than 15 minutes)
  const isDataStale = (timestamp) => {
    if (!timestamp) return true;

    // Convert timestamp string to Date object in Philippine time (UTC+8)
    const timestampDate = new Date(timestamp);
    const philippineTime = new Date(Date.now() + (8 * 60 * 60 * 1000)); // UTC+8

    // Get timestamps in milliseconds, adjusted for Philippine time
    const timestampMs = timestampDate.getTime();
    const currentMs = philippineTime.getTime();

    // Calculate difference in minutes
    const diffMinutes = (currentMs - timestampMs) / (1000 * 60);
    
    console.log('Timestamp (UTC):', timestampDate.toISOString());
    console.log('Current time (PHT):', philippineTime.toISOString());
    console.log('Difference in minutes:', diffMinutes);

    return diffMinutes > 15;
  };

  // Function to check if pressure indicates a fault
  const checkFault = (pressure) => {
    if (pressure === null || pressure === undefined) return false;
    return pressure < 7;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/actualsensor-data");
        const data = response.data;

        // Store timestamps
        const timestamps = {
          sensor1: data.actualsensor1?.timestamp || null,
          sensor2: data.actualsensor2?.timestamp || null,
          sensor3: data.actualsensor3?.timestamp || null
        };
        setSensorTimestamps(timestamps);

        // Check for faults in new data
        const newFaults = [];
        
        if (data.actualsensor1?.value) {
          const value = data.actualsensor1.value[0];
          if (checkFault(value)) {
            newFaults.push({
              sensor: 'Sensor 1',
              value: value,
              timestamp: data.actualsensor1.timestamp,
              type: value < 4 ? 'Critical' : 'Warning'
            });
          }
        }
        
        if (data.actualsensor2?.value) {
          const value = data.actualsensor2.value[0];
          if (checkFault(value)) {
            newFaults.push({
              sensor: 'Sensor 2',
              value: value,
              timestamp: data.actualsensor2.timestamp,
              type: value < 4 ? 'Critical' : 'Warning'
            });
          }
        }
        
        if (data.actualsensor3?.value) {
          const value = data.actualsensor3.value[0];
          if (checkFault(value)) {
            newFaults.push({
              sensor: 'Sensor 3',
              value: value,
              timestamp: data.actualsensor3.timestamp,
              type: value < 4 ? 'Critical' : 'Warning'
            });
          }
        }

        // Update fault history with new faults
        if (newFaults.length > 0) {
          setFaultHistory(prev => [...newFaults, ...prev].slice(0, 10)); // Keep last 10 faults
        }

        // Set newDataAvailable to true for sensors with fresh data
        setNewDataAvailable({
          sensor1: !isDataStale(timestamps.sensor1),
          sensor2: !isDataStale(timestamps.sensor2),
          sensor3: !isDataStale(timestamps.sensor3)
        });

        // Reset newDataAvailable after 5 seconds
        setTimeout(() => {
          setNewDataAvailable({
            sensor1: false,
            sensor2: false,
            sensor3: false
          });
        }, 5000);

        // Only set data if it's not stale
        setSensorData({
          sensor1: !isDataStale(timestamps.sensor1) ? data.actualsensor1?.value || [] : [],
          sensor2: !isDataStale(timestamps.sensor2) ? data.actualsensor2?.value || [] : [],
          sensor3: !isDataStale(timestamps.sensor3) ? data.actualsensor3?.value || [] : []
        });
      } catch (error) {
        console.error("Error fetching actual sensor data:", error);
        setError({
          title: "Connection Error",
          details: "Failed to fetch sensor data from the server"
        });
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000); // Refresh every 15 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSensorIndexes(prev => {
        // Only cycle if we have fresh data
        const newIndexes = {
          sensor1: !isDataStale(sensorTimestamps.sensor1) ? 
            (prev.sensor1 + 1) % (sensorData.sensor1.length || 1) : prev.sensor1,
          sensor2: !isDataStale(sensorTimestamps.sensor2) ? 
            (prev.sensor2 + 1) % (sensorData.sensor2.length || 1) : prev.sensor2,
          sensor3: !isDataStale(sensorTimestamps.sensor3) ? 
            (prev.sensor3 + 1) % (sensorData.sensor3.length || 1) : prev.sensor3
        };
        return newIndexes;
      });
    }, 60000); // Change every minute

    return () => clearInterval(interval);
  }, [sensorData, sensorTimestamps]);

  const getSensorStatus = (pressure) => {
    if (pressure === null || pressure === undefined || isNaN(pressure)) return 'unavailable';
    if (pressure < 4) return 'critical';
    if (pressure < 7) return 'warning';
    return 'normal';
  };

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

  const renderSensorCard = (sensorNum) => {
    const sensorKey = `sensor${sensorNum}`;
    const currentIndex = currentSensorIndexes[sensorKey];
    const values = sensorData[sensorKey];
    const isStale = isDataStale(sensorTimestamps[sensorKey]);
    const currentValue = !isStale ? values[currentIndex] : null;
    const status = getSensorStatus(currentValue);
    const isNewData = newDataAvailable[sensorKey];

    return (
      <div className={`sensor-card ${status} ${isNewData ? 'new-data' : ''}`}>
        <div className="sensor-header">
          <h4>Sensor {sensorNum}</h4>
          <span className={`status-badge ${status}`}>
            {status === 'unavailable' ? 'No Data' : status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <div className="sensor-details">
          <p>
            <strong>Status:</strong>
            {status === 'critical' ? 'Critical pressure detected' :
             status === 'warning' ? 'Low pressure warning' :
             status === 'normal' ? 'Normal operation' :
             'No data available'}
          </p>
          <p>
            <strong>Actual Pressure:</strong>
            {!isStale && currentValue ? `${currentValue.toFixed(4)} psi` : 'No data available'}
          </p>
          <p>
            <strong>Reading:</strong>
            {!isStale && values.length > 0 ? `${currentIndex + 1} of ${values.length}` : 'No data available'}
          </p>
          <p>
            <strong>Last Update:</strong>
            {formatTimestamp(sensorTimestamps[sensorKey])}
          </p>
        </div>
      </div>
    );
  };

  const renderDashboardPanel = () => (
    <div className="dashboard-panel">
      <div className="dashboard-panel-header">
        <h3><FaChartLine /> Sensor Dashboard</h3>
        <FaTimes className="close-icon" onClick={toggleDashboard} />
      </div>
      <div className="dashboard-panel-body">
        {renderSensorCard(1)}
        {renderSensorCard(2)}
        {renderSensorCard(3)}
        
        {/* Fault History Section */}
        <div className="fault-history">
          <h4>Fault History</h4>
          {faultHistory.length > 0 ? (
            faultHistory.map((fault, index) => (
              <div key={index} className={`fault-record ${fault.type.toLowerCase()}`}>
                <p><strong>{fault.sensor}</strong>: {fault.value.toFixed(4)} PSI</p>
                <p><strong>Type</strong>: {fault.type}</p>
                <p><strong>Time</strong>: {formatTimestamp(fault.timestamp)}</p>
              </div>
            ))
          ) : (
            <p>No faults recorded</p>
          )}
        </div>
      </div>
    </div>
  );

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

      {/* Error Notification Bar */}
      {error && (
        <div className="error-notification-bar">
          <div className="error-notification-content">
            <div className="error-notification-title">{error.title}</div>
            <div className="error-notification-details">{error.details}</div>
          </div>
          <div className="error-notification-close" onClick={() => setError(null)}>✕</div>
        </div>
      )}

      {/* Dashboard Panel */}
      {isDashboardOpen && renderDashboardPanel()}

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