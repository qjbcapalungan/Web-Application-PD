import React, { useEffect, useState } from 'react';
import './css/Dataloggers.css';
import { Link } from 'react-router-dom';
import dayjs from "dayjs";

const currentDate = dayjs().format("MMMM D, YYYY");

function Dataloggers() {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [dataLoggers, setDataLoggers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch logger data from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/loggers");
        const data = await response.json();
        console.log("Fetched data:", data); // Debugging

        if (Array.isArray(data)) {
          setDataLoggers(data);
        } else {
          console.error("Invalid data format:", data);
        }
      } catch (error) {
        console.error("Error fetching data loggers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dataloggers">
      <h2>Metro Manila West Zone</h2>
      <h3 className="last-update">Last Update: {currentDate}</h3>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filters">
          {['ALL', 'GR', 'PRV', 'DM'].map((filter) => (
            <span
              key={filter}
              className={`filter-item ${selectedFilter === filter ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter} [{dataLoggers.filter(logger => filter === 'ALL' ? true : logger.type === filter).length}]
            </span>
          ))}
        </div>
      </div>

      {/* Data Logger List */}
      <div className="data-boxes">
        {loading ? (
          <p>Loading data loggers...</p>
        ) : dataLoggers.length > 0 ? (
          dataLoggers.map((logger) => (
            <div key={logger.id} className="data-box">
              <Link to={`/logger/${logger.id}`} className="data-content">
                <div className="data-left">
                  <h4>{logger.name}</h4>
                  <p>Status: {logger.actualPSI === "Inactive" ? "Inactive" : "Active"}</p>
                </div>
                <div className="data-right">
                  <p>Actual Value PSI: <strong>{logger.actualPSI}</strong></p>
                  <p>Predicted Value PSI: <strong>{logger.predictedPSI}</strong></p>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <p>No loggers found.</p>
        )}
      </div>
    </div>
  );
}

export default Dataloggers;
