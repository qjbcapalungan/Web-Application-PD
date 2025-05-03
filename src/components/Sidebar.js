import React, { useState, useEffect, useContext } from "react";
import "./css/Sidebar.css";
import { FaBars, FaTachometerAlt, FaQuestionCircle, FaUser, FaTimes, FaChartLine } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios for API calls
import { useForecastData } from '../hooks/useForecastData';
import { SensorContext } from "../context/SensorContext";

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
  const { currentSensorIndexes, setCurrentSensorIndexes } = useContext(SensorContext);
  const [error, setError] = useState(null);
  const [faultHistory, setFaultHistory] = useState([]);

  // State to store actual sensor values
  const [actualSensorValues, setActualSensorValues] = useState({
    actualsensor1: null,
    actualsensor2: null,
    actualsensor3: null,
  });

  // State to store all actual sensor data arrays
  const [actualSensorData, setActualSensorData] = useState({
    actualsensor1: [],
    actualsensor2: [],
    actualsensor3: [],
  });

  const forecastData = useForecastData();

  useEffect(() => {
    const updateSensorValues = () => {
      setActualSensorValues({
        actualsensor1: actualSensorData.actualsensor1[currentSensorIndexes.actualsensor1] ?? null,
        actualsensor2: actualSensorData.actualsensor2[currentSensorIndexes.actualsensor2] ?? null,
        actualsensor3: actualSensorData.actualsensor3[currentSensorIndexes.actualsensor3] ?? null
      });
    };

    updateSensorValues();
  }, [actualSensorData, currentSensorIndexes]);

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
        value: Number(pressure),  // Convert to number explicitly
        isForecasted: isForecast
      };
    }
    return false;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://178.128.48.126:8081/api/actualsensor-data");
        const data = response.data;

        const timestamps = {
          sensor1: data.actualsensor1?.timestamp || null,
          sensor2: data.actualsensor2?.timestamp || null,
          sensor3: data.actualsensor3?.timestamp || null
        };
        setSensorTimestamps(timestamps);

        const newFaults = [];
        const newActualValues = {
          actualsensor1: null,
          actualsensor2: null,
          actualsensor3: null
        };
        const newActualData = {
          actualsensor1: [],
          actualsensor2: [],
          actualsensor3: []
        };
        
        for (let i = 1; i <= 3; i++) {
          const sensorKey = `actualsensor${i}`;
          const sensorData = data[sensorKey];
          
          if (sensorData?.value) {
            const value = Array.isArray(sensorData.value) ? sensorData.value[0] : sensorData.value;
            newActualValues[sensorKey] = value;
            newActualData[sensorKey] = Array.isArray(sensorData.value) ? sensorData.value : [sensorData.value];
            
            const fault = checkFault(value);
            if (fault) {
              newFaults.push({
                sensor: `Sensor ${i}`,
                value: value,
                timestamp: sensorData.timestamp,
                type: fault.type,
                isForecasted: false
              });
            }
          }
        }

        setActualSensorValues(newActualValues);
        setActualSensorData(newActualData);

        Object.entries(forecastData).forEach(([key, value]) => {
          if (value !== null) {
            const fault = checkFault(value, true);
            if (fault) {
              newFaults.push({
                sensor: `Sensor ${key.slice(-1)}`,
                value: value,
                timestamp: new Date().toISOString(),
                type: fault.type,
                isForecasted: true
              });
            }
          }
        });

        if (newFaults.length > 0) {
          setFaultHistory(prev => [...newFaults, ...prev]);
        }

        setNewDataAvailable({
          sensor1: !isDataStale(timestamps.sensor1),
          sensor2: !isDataStale(timestamps.sensor2),
          sensor3: !isDataStale(timestamps.sensor3)
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
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [forecastData]);

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
    const values = isForecasted ? null : actualSensorData[sensorKey];
    const isStale = isDataStale(sensorTimestamps[`sensor${sensorNum}`]);
    const currentValue = !isStale ? 
      (isForecasted ? forecastData[`sensor${sensorNum}`] : actualSensorValues[sensorKey]) : 
      null;
    const status = getSensorStatus(currentValue);
    const isNewData = newDataAvailable[`sensor${sensorNum}`];

    const formatValue = (value) => {
      if (value === null || value === undefined || isNaN(value)) return 'No data available';
      return `${Number(value).toFixed(4)} psi`;
    };

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
            {!isStale ? formatValue(currentValue) : 'No data available'}
          </p>
          {!isForecasted && values && values.length > 0 && (
            <p>
              <strong>Reading:</strong>
              {!isStale ? `${currentSensorIndexes[sensorKey] + 1} of ${values.length}` : 'No data available'}
            </p>
          )}
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
                  <strong>{fault.isForecasted ? 'Forecasted ' : ''}{fault.sensor}</strong>: 
                  {typeof fault.value === 'number' ? fault.value.toFixed(4) : 'N/A'} PSI
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