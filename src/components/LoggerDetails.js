import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
  const [chartUrl, setChartUrl] = useState('');
  const [dataSentPercentage, setDataSentPercentage] = useState(0);
  const [forecastedFaults, setForecastedFaults] = useState('No Forecasted Faults');

  useEffect(() => {
    // Fetch logger details
    const logger = { id: parseInt(id), name: `Data Logger ${id}` };
    if (logger) {
      setLoggerDetails(logger);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // Increment current_index by calling `/current_psi` every second
    const incrementIndex = async () => {
      try {
        await axios.get('http://localhost:5001/current_psi');
      } catch (err) {
        console.error('Error fetching current PSI:', err);
      }
    };

    const interval = setInterval(incrementIndex, 1000);
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  useEffect(() => {
    // Fetch the real-time chart from the backend periodically
    const fetchChart = async () => {
      try {
        const response = await axios.get('http://localhost:5001/real_time_chart', {
          responseType: 'blob', // Expect a binary image file
        });
        const chartBlob = URL.createObjectURL(response.data);
        setChartUrl(chartBlob);
      } catch (err) {
        console.error('Error fetching chart:', err);
      }
    };

    // Fetch chart every 5 seconds
    const interval = setInterval(fetchChart, 5000);
    fetchChart(); // Initial fetch

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!loggerDetails) {
    return <div>Logger not found</div>;
  }

  function Model({ modelPath }) {
    const { scene } = useGLTF(modelPath);
    return <primitive object={scene} scale={0.01} />;
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
          <span className="status-indicator working">WORKING</span>
        </div>
        <div className="metrics">
          <div className="metric">
            <div className="circle-chart">
              <p>Data Sent: {dataSentPercentage}%</p>
            </div>
          </div>
        </div>
        <div className="data-sent-graph">
          <div className="graph-container">
            <h4>PSI Visualization</h4>
            {chartUrl ? (
              <img src={chartUrl} alt="Real-Time Chart" className="real-time-chart" />
            ) : (
              <p>Loading Chart...</p>
            )}
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
                <td>{forecastedFaults}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LoggerDetails;
