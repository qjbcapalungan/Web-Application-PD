import React, { useState } from 'react';
import './css/Dataloggers.css';
import { FaFilter } from 'react-icons/fa';

// Sample data loggers with type information for filtering
const dataLoggers = [
  { id: 1, name: 'Logger 1', status: 'Active', type: 'GR' },
  { id: 2, name: 'Logger 2', status: 'Inactive', type: 'PRV' },
  { id: 3, name: 'Logger 3', status: 'Active', type: 'DM' },
  { id: 4, name: 'Logger 4', status: 'Inactive', type: 'GR' },
  { id: 5, name: 'Logger 5', status: 'Active', type: 'GR' },
  { id: 6, name: 'Logger 6', status: 'Active', type: 'GR' },
  { id: 7, name: 'Logger 7', status: 'Inactive', type: 'PRV' },
  { id: 8, name: 'Logger 8', status: 'Active', type: 'DM' },
  { id: 9, name: 'Logger 9', status: 'Inactive', type: 'GR' },
  { id: 10, name: 'Logger 10', status: 'Active', type: 'PRV' },
  { id: 11, name: 'Logger 11', status: 'Inactive', type: 'GR' },
  { id: 12, name: 'Logger 12', status: 'Active', type: 'PRV' },
  { id: 13, name: 'Logger 13', status: 'Inactive', type: 'DM' },
  { id: 14, name: 'Logger 14', status: 'Active', type: 'DM' },
  { id: 15, name: 'Logger 15', status: 'Active', type: 'GR' },
  { id: 16, name: 'Logger 16', status: 'Inactive', type: 'PRV' },
  { id: 17, name: 'Logger 17', status: 'Active', type: 'DM' },
  { id: 18, name: 'Logger 18', status: 'Inactive', type: 'GR' },
  { id: 19, name: 'Logger 19', status: 'Active', type: 'PRV' },
  { id: 20, name: 'Logger 20', status: 'Inactive', type: 'GR' },
];

function Dataloggers() {
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // State to track the selected filter

  // Function to filter data loggers based on the selected filter
  const filteredLoggers = dataLoggers.filter((logger) => {
    if (selectedFilter === 'ALL') {
      return true; // Show all loggers if 'ALL' is selected
    }
    return logger.type === selectedFilter; // Show loggers based on the selected type
  });

  return (
    <div className="dataloggers">
      <h2>Malabon-Valenzuela (MVL)</h2>

      {/* Last Update Section */}
      <h3 className="last-update">Last Update: Nov 19, 2024</h3>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filters">
          {['ALL', 'GR', 'PRV', 'DM'].map((filter) => (
            <span
              key={filter}
              className={`filter-item ${
                selectedFilter === filter ? 'active' : ''
              }`}
              onClick={() => setSelectedFilter(filter)} // Update filter on click
            >
              {filter} [{dataLoggers.filter((logger) =>
                filter === 'ALL' ? true : logger.type === filter).length}]
            </span>
          ))}
        </div>
        <div className="filter-icon">
          <FaFilter size={20} />
        </div>
      </div>

      {/* Main Content: Filtered data loggers */}
      <div className="data-boxes">
        {filteredLoggers.map((logger) => (
          <div key={logger.id} className="data-box">
            <h4>{logger.name}</h4>
            <p>Status: {logger.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dataloggers;
