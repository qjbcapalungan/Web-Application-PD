import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

import './css/LoggerDetails.css';

function LoggerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loggerDetails, setLoggerDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const dataLoggers = useMemo(() => [
    { id: 1, name: 'Data Logger 1', status: 'Working', type: 'GR', psi: 5.27, dataSent: 97 },
    { id: 2, name: 'Data Logger 2', status: 'Working', type: 'GR', psi: 3.14, dataSent: 85 },
    { id: 3, name: 'Data Logger 3', status: 'Working', type: 'GR', psi: 4.21, dataSent: 90 },
    { id: 4, name: 'Data Logger 4', status: 'Working', type: 'GR', psi: 5.67, dataSent: 92 },
    { id: 5, name: 'Data Logger 5', status: 'Working', type: 'GR', psi: 6.15, dataSent: 100 },
    { id: 6, name: 'Data Logger 6', status: 'Working', type: 'GR', psi: 2.89, dataSent: 60 },
    { id: 7, name: 'Data Logger 7', status: 'Working', type: 'GR', psi: 7.10, dataSent: 80 },
    { id: 8, name: 'Data Logger 8', status: 'Working', type: 'GR', psi: 4.75, dataSent: 95 },
    { id: 9, name: 'Data Logger 9', status: 'Working', type: 'GR', psi: 5.43, dataSent: 85 },
    { id: 10, name: 'Data Logger 10', status: 'Working', type: 'GR', psi: 3.67, dataSent: 78 },
    { id: 11, name: 'Data Logger 11', status: 'Working', type: 'GR', psi: 5.50, dataSent: 88 },
    { id: 12, name: 'Data Logger 12', status: 'Working', type: 'GR', psi: 4.85, dataSent: 92 },
    { id: 13, name: 'Data Logger 13', status: 'Working', type: 'GR', psi: 6.10, dataSent: 80 },
    { id: 14, name: 'Data Logger 14', status: 'Working', type: 'GR', psi: 7.35, dataSent: 99 },
    { id: 15, name: 'Data Logger 15', status: 'Working', type: 'GR', psi: 3.95, dataSent: 75 },
    { id: 16, name: 'Data Logger 16', status: 'Working', type: 'GR', psi: 4.20, dataSent: 70 },
    { id: 17, name: 'Data Logger 17', status: 'Working', type: 'GR', psi: 5.50, dataSent: 95 },
    { id: 18, name: 'Data Logger 18', status: 'Working', type: 'GR', psi: 6.00, dataSent: 90 },
    { id: 19, name: 'Data Logger 19', status: 'Working', type: 'GR', psi: 7.80, dataSent: 85 },
    { id: 20, name: 'Data Logger 20', status: 'Working', type: 'GR', psi: 3.14, dataSent: 80 },
  ]);
  
  

  useEffect(() => {
    const logger = dataLoggers.find((logger) => logger.id === parseInt(id));
    if (logger) {
      setLoggerDetails(logger);
    }
    setLoading(false);
  }, [id, dataLoggers]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!loggerDetails) {
    return <div>Logger not found</div>;
  }

  function Model({ modelPath }) {
    const { scene } = useGLTF(modelPath);
    console.log(scene); // Debugging
    return <primitive object={scene} scale={0.01} />; // Adjust scale
  }

  return (
    <div className="logger-details-container">
      <button className="back-button" onClick={() => navigate('/main')}>
        Back to Main
      </button>
      <div className="logger-left">
        <h3>{loggerDetails.name} Report</h3>
        <div className="status">
          <span>Status: </span>
          <span className={`status-indicator ${loggerDetails.status.toLowerCase()}`}>
            {loggerDetails.status.toUpperCase()}
          </span>
        </div>
        <div className="metrics">
          <div className="metric">
            <div className="circle-chart">
              <p>{loggerDetails.psi} psi</p>
            </div>
          </div>
          <div className="metric">
            <div className="data-sent">
              <p>Data Sent: {loggerDetails.dataSent}%</p>
            </div>
          </div>
        </div>
        <div className="data-sent-graph">
          <div className="graph-container">
            <img src="/Datasent.jpg" alt="Data Sent Graph" />
          </div>
        </div>
      </div>
      <div className="logger-right">
        <div className="three-d-container">
          <Canvas camera={{ position: [-5, 8, 5], fov: 15 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <Model modelPath="/untitled.glb" />
            <OrbitControls />
          </Canvas>
        </div>

        <div className="faults-table">
          <h4>Faults Information</h4>
          <table>
            <thead>
              <tr>
                <th>Active Faults</th>
                <th>Forecasted</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>No Faults Detected</td>
                <td>Battery Depletion: 12/15/2024</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LoggerDetails;
