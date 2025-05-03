import React, { useState, useEffect } from "react";
import "./css/Sidebar.css";
import { FaBars, FaTachometerAlt, FaQuestionCircle, FaUser, FaTimes, FaChartLine } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios for API calls
import { useForecastData } from '../hooks/useForecastData';
import { useSensorData } from '../contexts/SensorDataContext';

function Sidebar() {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
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
  const [error, setError] = useState(null);

  const { 
    actualSensorValues, 
    setActualSensorValues, // Add this
    currentIndexes,
    lastUpdate,
    isLoading,
    faultHistory,
    setFaultHistory,
    updateSensorData // Add this
  } = useSensorData();

  const forecastData = useForecastData();

  const formatTimestamp = (timestamp, isForecasted = false) => {
    if (!timestamp) return 'No timestamp available';
    const date = new Date(timestamp);
    
    // Add exactly 30 minutes for forecasted values
    if (isForecasted) {
      date.setMinutes(date.getMinutes() + 30);
    }
    
    const formatNumber = (num) => String(num).padStart(2, '0');
    return `${date.getUTCFullYear()}-${formatNumber(date.getUTCMonth() + 1)}-${formatNumber(date.getUTCDate())} ${formatNumber(date.getUTCHours())}:${formatNumber(date.getUTCMinutes())}:${formatNumber(date.getUTCSeconds())}`;
  };

  const isDataStale = (timestamp) => {
    if (!timestamp) return true;

    const timestampDate = new Date(timestamp);
    const philippineTime = new Date(Date.now() + (8 * 60 * 60 * 1000)); // UTC+8

    const timestampMs = timestampDate.getTime();
    const currentMs = philippineTime.getTime();

    const diffMinutes = (currentMs - timestampMs) / (1000 * 60);
    
    console.log('Timestamp (UTC):', timestampDate.toISOString());
    console.log('Current time (PHT):', philippineTime.toISOString());
    console.log('Difference in minutes:', diffMinutes);

    return diffMinutes > 15;
  };

  const checkFault = (pressure, isForecast = false) => {
    if (pressure === null || pressure === undefined) return false;
    if (pressure < 7) {
      return {
        type: pressure < 4 ? 'Critical' : 'Warning',
        value: pressure,
        isForecasted: isForecast
      };
    }
    return false;
  };

  useEffect(() => {
    if (isLoading) return;
    
    // Update sidebar data displays
    // ...existing sidebar update logic...
  }, [actualSensorValues, lastUpdate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://178.128.48.126:8081/api/actualsensor-data");
        const data = response.data;
        
        // Use the updateSensorData function from context instead
        updateSensorData(data);

        // Check for faults
        Object.entries(data).forEach(([sensor, sensorData]) => {
          if (sensorData?.value) {
            const value = sensorData.value[currentIndexes[sensor]] || null;
            const fault = checkFault(value);
            if (fault) {
              setFaultHistory(prev => {
                const newFault = {
                  ...fault,
                  sensor,
                  timestamp: sensorData.timestamp
                };
                return [...prev, newFault].slice(-50);
              });
            }
          }
        });
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Fetch every minute
    return () => clearInterval(interval);
  }, [currentIndexes, updateSensorData, setFaultHistory]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndexes(prev => {
        // Only cycle if we have fresh data and values exist
        const newIndexes = {
          actualsensor1: !isDataStale(sensorTimestamps.sensor1) && actualSensorValues.actualsensor1 ? 
            (prev.actualsensor1 + 1) % actualSensorValues.actualsensor1.length : prev.actualsensor1,
          actualsensor2: !isDataStale(sensorTimestamps.sensor2) && actualSensorValues.actualsensor2 ? 
            (prev.actualsensor2 + 1) % actualSensorValues.actualsensor2.length : prev.actualsensor2,
          actualsensor3: !isDataStale(sensorTimestamps.sensor3) && actualSensorValues.actualsensor3 ? 
            (prev.actualsensor3 + 1) % actualSensorValues.actualsensor3.length : prev.actualsensor3
        };

        // Update actual values based on new indexes
        setActualSensorValues(prev => ({
          actualsensor1: actualSensorValues.actualsensor1[newIndexes.actualsensor1] ?? null,
          actualsensor2: actualSensorValues.actualsensor2[newIndexes.actualsensor2] ?? null,
          actualsensor3: actualSensorValues.actualsensor3[newIndexes.actualsensor3] ?? null
        }));

        return newIndexes;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [actualSensorValues, sensorTimestamps]);

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

  const renderSensorCard = (sensorNum, isForecasted = false) => {
    const sensorKey = isForecasted ? `sensor${sensorNum}` : `actualsensor${sensorNum}`;
    const currentIndex = currentIndexes[sensorKey];
    const isStale = isDataStale(sensorTimestamps[`sensor${sensorNum}`]);
    const currentValue = !isStale ? 
      (isForecasted ? forecastData[`sensor${sensorNum}`] : actualSensorValues[sensorKey]) : 
      null;
    const status = getSensorStatus(currentValue);
    const isNewData = newDataAvailable[`sensor${sensorNum}`];

    return (
      <div className={`sensor-card ${status} ${isNewData ? 'new-data' : ''} ${isForecasted ? 'forecasted-card' : ''}`}>
        <div className="sensor-header">
          <h4>{isForecasted ? 'Forecasted' : ''} Sensor {sensorNum}</h4>
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
            <strong>Value:</strong>
            {!isStale && currentValue ? `${currentValue.toFixed(4)} psi` : 'No data available'}
          </p>
          <p>
            <strong>{isForecasted ? 'Expected Time:' : 'Last Update:'}</strong>
            {formatTimestamp(sensorTimestamps[`sensor${sensorNum}`], isForecasted)}
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
        {renderSensorCard(1, true)}
        {renderSensorCard(2)}
        {renderSensorCard(2, true)}
        {renderSensorCard(3)}
        {renderSensorCard(3, true)}
        
        <div className="fault-history">
          <h4>Fault History</h4>
          {faultHistory.length > 0 ? (
            faultHistory.map((fault, index) => (
              <div key={index} className={`fault-record ${fault.type.toLowerCase()}`}>
                <p>
                  <strong>{fault.isForecasted ? 'Forecasted ' : ''}{fault.sensor}</strong>: {fault.value.toFixed(4)} PSI
                </p>
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

      {error && (
        <div className="error-notification-bar">
          <div className="error-notification-content">
            <div className="error-notification-title">{error.title}</div>
            <div className="error-notification-details">{error.details}</div>
          </div>
          <div className="error-notification-close" onClick={() => setError(null)}>✕</div>
        </div>
      )}

      {isDashboardOpen && renderDashboardPanel()}

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