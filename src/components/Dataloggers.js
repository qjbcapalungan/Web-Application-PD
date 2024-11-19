import React, { useState } from 'react';
import './css/Dataloggers.css';
import { FaFilter } from 'react-icons/fa';
import LoggerDetails from './LoggerDetails';
import { Link } from 'react-router-dom';

// Sample data loggers with type information for filtering
const dataLoggers = [
  { id: 1, name: 'Logger 1', status: 'Active', type: 'GR', dataPoints: [12, 19, 3, 5] },
  { id: 2, name: 'Logger 2', status: 'Inactive', type: 'PRV', dataPoints: [15, 12, 8, 10] },
  { id: 3, name: 'Logger 3', status: 'Active', type: 'DM', dataPoints: [10, 9, 5, 7] },
  { id: 4, name: 'Logger 4', status: 'Inactive', type: 'GR', dataPoints: [17, 14, 9, 6] },
  { id: 5, name: 'Logger 5', status: 'Active', type: 'GR', dataPoints: [20, 25, 15, 18] },
  { id: 6, name: 'Logger 6', status: 'Active', type: 'GR', dataPoints: [22, 28, 12, 10] },
  { id: 7, name: 'Logger 7', status: 'Inactive', type: 'PRV', dataPoints: [30, 20, 14, 16] },
  { id: 8, name: 'Logger 8', status: 'Active', type: 'DM', dataPoints: [7, 12, 18, 22] },
  { id: 9, name: 'Logger 9', status: 'Inactive', type: 'GR', dataPoints: [8, 11, 5, 4] },
  { id: 10, name: 'Logger 10', status: 'Active', type: 'PRV', dataPoints: [15, 19, 20, 18] },
  { id: 11, name: 'Logger 11', status: 'Inactive', type: 'GR', dataPoints: [3, 5, 2, 7] },
  { id: 12, name: 'Logger 12', status: 'Active', type: 'PRV', dataPoints: [12, 15, 13, 10] },
  { id: 13, name: 'Logger 13', status: 'Inactive', type: 'DM', dataPoints: [9, 5, 8, 10] },
  { id: 14, name: 'Logger 14', status: 'Active', type: 'DM', dataPoints: [16, 17, 11, 14] },
  { id: 15, name: 'Logger 15', status: 'Active', type: 'GR', dataPoints: [18, 22, 13, 17] },
  { id: 16, name: 'Logger 16', status: 'Inactive', type: 'PRV', dataPoints: [25, 24, 21, 20] },
  { id: 17, name: 'Logger 17', status: 'Active', type: 'DM', dataPoints: [10, 13, 14, 16] },
  { id: 18, name: 'Logger 18', status: 'Inactive', type: 'GR', dataPoints: [8, 7, 6, 9] },
  { id: 19, name: 'Logger 19', status: 'Active', type: 'PRV', dataPoints: [17, 19, 18, 20] },
  { id: 20, name: 'Logger 20', status: 'Inactive', type: 'GR', dataPoints: [5, 6, 7, 4] },
];

function Dataloggers() {
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Filter loggers based on selected filter
  const filteredLoggers = dataLoggers.filter((logger) => {
    if (selectedFilter === 'ALL') {
      return true;
    }
    return logger.type === selectedFilter;
  });

  return (
    <div className="dataloggers">
      <h2>Malabon-Valenzuela (MVL)</h2>
      <h3 className="last-update">Last Update: Nov 19, 2024</h3>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filters">
          {['ALL', 'GR', 'PRV', 'DM'].map((filter) => (
            <span
              key={filter}
              className={`filter-item ${selectedFilter === filter ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter} [{dataLoggers.filter((logger) => filter === 'ALL' ? true : logger.type === filter).length}]
            </span>
          ))}
        </div>
        <div className="filter-icon">
          <FaFilter size={20} />
        </div>
      </div>

      {/* Data Logger List */}
      <div className="data-boxes">
        {filteredLoggers.map((logger) => (
          <div key={logger.id} className="data-box">
            <Link to={`/logger/${logger.id}`}>
              <h4>{logger.name}</h4>
              <p>Status: {logger.status}</p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dataloggers;
