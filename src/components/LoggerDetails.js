import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import './css/LoggerDetails.css';

function LoggerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loggerDetails, setLoggerDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const dataLoggers = useMemo(() => [
    { id: 1, name: 'Data Logger 1', status: 'Working', type: 'GR', psi: 5.27, dataSent: 97 },
    // Add other loggers here
  ], []);

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
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <Model modelPath="/untitled.glb" />
            <OrbitControls />
          </Canvas>
        </div>
      </div>
    </div>
  );
}

export default LoggerDetails;
