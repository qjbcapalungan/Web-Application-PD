import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Line } from 'react-chartjs-2';
import './chartConfig'; // Importing the file ensures components are registered
import './css/LoggerDetails.css';

function LoggerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loggerDetails, setLoggerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState({
    currentLabels: [],
    predictedLabels: [],
    currentData: [],
    predictedData: [],
  });
  const [dataSentPercentage, setDataSentPercentage] = useState(0);
  const [forecastedFaults, setForecastedFaults] = useState('No Forecasted Faults');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch current PSI values
        const currentRes = await axios.get('http://localhost:5001/current_psi');
        const initialCurrentPsiValues = currentRes.data.current_psi;

        // Fetch predicted PSI values
        const predictedRes = await axios.get('http://localhost:5001/predict');
        const initialPredictedPsiValues = predictedRes.data.prediction || [];

        setGraphData({
          currentLabels: initialCurrentPsiValues.map((_, idx) => `Interval ${idx + 1}`),
          predictedLabels: initialPredictedPsiValues.map((_, idx) => `Future Interval ${idx + 1}`),
          currentData: initialCurrentPsiValues,
          predictedData: initialPredictedPsiValues,
        });
      } catch (err) {
        console.error('Error fetching initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
  const fetchInitialData = async () => {
    try {
      // Fetch predicted PSI values first
      const predictedRes = await axios.get('http://localhost:5001/predict');
      const initialPredictedPsiValues = predictedRes.data.prediction || [];

      // Fetch current PSI values
      const currentRes = await axios.get('http://localhost:5001/current_psi');
      const initialCurrentPsiValues = currentRes.data.current_psi;

      setGraphData({
        predictedLabels: initialPredictedPsiValues.map((_, idx) => `Future Interval ${idx + 1}`),
        currentLabels: initialCurrentPsiValues.map((_, idx) => `Interval ${idx + 1}`),
        predictedData: initialPredictedPsiValues,
        currentData: initialCurrentPsiValues,
      });
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchInitialData();
}, []);

useEffect(() => {
  let currentIndex = 0; // Keeps track of the sequence (0: predicted, 1: actual)
  
  const interval = setInterval(async () => {
    try {
      if (currentIndex % 2 === 0) {
        // Fetch predicted PSI values first
        const predictedRes = await axios.get('http://localhost:5001/predict');
        const newPredictedPsiValues = predictedRes.data.prediction || [];

        setGraphData((prev) => {
          const predictionStartIdx = prev.currentLabels.length + 1; // Start predictions from the next interval
          return {
            ...prev,
            predictedLabels: [
              ...prev.predictedLabels,
              ...newPredictedPsiValues.map((_, idx) => `Future Interval ${predictionStartIdx + idx}`),
            ],
            predictedData: [...prev.predictedData, ...newPredictedPsiValues],
          };
        });
      } else {
        // Fetch current PSI values
        const currentRes = await axios.get('http://localhost:5001/current_psi');
        const newCurrentPsiValues = currentRes.data.current_psi || [];

        setGraphData((prev) => ({
          ...prev,
          currentLabels: [
            ...prev.currentLabels,
            ...newCurrentPsiValues.map((_, idx) => `Interval ${prev.currentData.length + idx + 1}`),
          ],
          currentData: [...prev.currentData, ...newCurrentPsiValues],
        }));

        // Update data sent percentage only after fetching actual values
        setDataSentPercentage((prev) => ((prev + 10) % 96));
      }

      // Alternate between prediction and actual fetching
      currentIndex = (currentIndex + 1) % 2;
    } catch (err) {
      console.error('Error updating data:', err);
    }
  }, 5000); // Fetch every 5 seconds

  return () => clearInterval(interval);
}, []);


  

  useEffect(() => {
    const logger = { id: parseInt(id), name: `Data Logger ${id}` };
    if (logger) {
      setLoggerDetails(logger);
    }
    setLoading(false);
  }, [id]);

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
              <p>
                Current PSI: {graphData.currentData.slice(-1)[0]?.toFixed(2) || 'N/A'} psi
              </p>
            </div>
          </div>
          <div className="metric">
            <div className="data-sent">
              <p>Data Sent: {dataSentPercentage}%</p>
            </div>
          </div>
        </div>
        <div className="data-sent-graph">
          <div className="graph-container">
            <h4>Predicted PSI Values</h4>
            <Line
              data={{
                labels: graphData.predictedLabels,
                datasets: [
                  {
                    label: 'PSI Values (Predicted)',
                    data: graphData.predictedData,
                    borderColor: 'rgba(255,99,132,1)',
                    backgroundColor: 'rgba(255,99,132,0.2)',
                    fill: false,
                    tension: 0.4,
                  },
                ],
              }}
            />
          </div>
          <div className="graph-container">
            <h4>Current PSI Values</h4>
            <Line
              data={{
                labels: graphData.currentLabels,
                datasets: [
                  {
                    label: 'PSI Values (Current)',
                    data: graphData.currentData,
                    borderColor: 'rgba(75,192,192,1)',
                    backgroundColor: 'rgba(75,192,192,0.2)',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
            />
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