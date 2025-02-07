import React, { useState } from 'react';
import './css/Dataloggers.css';
import { Link } from 'react-router-dom';
import dayjs from "dayjs";

// Sample data loggers with additional PSI values
const dataLoggers = [
  { id: 1, name: 'Logger 1', status: 'Active', type: 'GR', actualPSI: 7.0, predictedPSI: 7.3 },
  { id: 2, name: 'Logger 2', status: 'Inactive', type: 'PRV', actualPSI: 6.5, predictedPSI: 6.8 },
  { id: 3, name: 'Logger 3', status: 'Active', type: 'DM', actualPSI: 8.2, predictedPSI: 8.5 }
];

const currentDate = dayjs().format("MMMM D, YYYY");

function Dataloggers() {
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Filter loggers based on selected filter
  const filteredLoggers = dataLoggers.filter((logger) => 
    selectedFilter === 'ALL' || logger.type === selectedFilter
  );

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
        {filteredLoggers.map((logger) => (
          <div key={logger.id} className="data-box">
            <Link to={`/logger/${logger.id}`} className="data-content">
              <div className="data-left">
                <h4>{logger.name}</h4>
                <p>Status: {logger.status}</p>
              </div>
              <div className="data-right">
                <p>Actual Value PSI: {logger.actualPSI}</p>
                <p>Predicted Value PSI: {logger.predictedPSI}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dataloggers;
