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
    labels: [],
    datasets: [
      {
        label: 'PSI Values (Actual)',
        data: [],
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'PSI Values (Predicted)',
        data: [],
        borderColor: 'rgba(255,99,132,1)',
        backgroundColor: 'rgba(255,99,132,0.2)',
        fill: false,
        tension: 0.4,
      },
    ],
  });
  const [dataSentPercentage, setDataSentPercentage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fetch predicted PSI values first
      axios
        .get('http://localhost:5001/predict')
        .then((res) => {
          const forecastedPsiValues = res.data.prediction;
  
          // Update predicted data
          setGraphData((prevGraphData) => {
            const currentLabelCount = prevGraphData.labels.length;
  
            const newLabels = [
              ...prevGraphData.labels,
              ...forecastedPsiValues.map((_, idx) => `Interval ${currentLabelCount + idx + 1}`),
            ];
  
            const updatedPredictedData = [
              ...prevGraphData.datasets[1].data,
              ...forecastedPsiValues,
            ];
  
            return {
              ...prevGraphData,
              labels: newLabels,
              datasets: [
                prevGraphData.datasets[0], // Keep actual data unchanged for now
                {
                  ...prevGraphData.datasets[1],
                  data: updatedPredictedData,
                },
              ],
            };
          });
  
          // Fetch actual PSI values with a delay
          setTimeout(() => {
            axios
              .get('http://localhost:5001/current_psi?n=10')
              .then((response) => {
                const actualPsiValues = response.data.current_psi;
  
                setGraphData((prevGraphData) => {
                  const updatedActualData = [
                    ...prevGraphData.datasets[0].data,
                    ...actualPsiValues,
                  ];
  
                  return {
                    ...prevGraphData,
                    datasets: [
                      {
                        ...prevGraphData.datasets[0],
                        data: updatedActualData,
                      },
                      prevGraphData.datasets[1], // Keep predicted data unchanged
                    ],
                  };
                });
  
                // Update data sent percentage
                setDataSentPercentage((prev) => ((prev + 10) % 96));
              })
              .catch((err) => console.error('Error fetching actual PSI:', err));
          }, 5000); // Delay actual data by 5 seconds
        })
        .catch((err) => console.error('Error fetching prediction:', err));
    }, 5000);
  
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
              <p>Current PSI: {graphData.datasets[0].data.slice(-1)[0]?.toFixed(2) || 'N/A'} psi</p>
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
            <Line data={graphData} />
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
                <td>For Inspection: 12/15/2024</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LoggerDetails;
