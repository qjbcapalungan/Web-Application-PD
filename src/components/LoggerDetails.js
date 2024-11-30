import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Line } from 'react-chartjs-2';
import { faker } from '@faker-js/faker';
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
        fill: true,
        tension: 0.4,
      },
    ],
  });
  const [dataSentPercentage, setDataSentPercentage] = useState(0);
  const [currentPsi, setCurrentPsi] = useState(
    Array.from({ length: 20 }, () =>
      parseFloat(faker.number.float({ min: 2.5, max: 8.0, precision: 0.01 }))
    )
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const newFakePsiValues = currentPsi.map(() =>
        parseFloat(faker.number.float({ min: 2.5, max: 8.0, precision: 0.01 }))
      );

      axios
        .post('http://localhost:5001/predict', { inputs: newFakePsiValues })
        .then((response) => {
          const forecastedPsiValues = response.data.prediction;

          setGraphData((prevGraphData) => {
            const newLabels = [
              ...prevGraphData.labels,
              `Interval ${prevGraphData.labels.length + 1}`,
            ];
            const intervalCount = newLabels.length;

            // Update Data Sent Percentage
            const newPercentage = (intervalCount % 96) / 96 * 100;
            setDataSentPercentage(Math.floor(newPercentage));

            return {
              labels: newLabels,
              datasets: [
                {
                  ...prevGraphData.datasets[0],
                  data: [...prevGraphData.datasets[0].data, ...newFakePsiValues],
                },
                {
                  ...prevGraphData.datasets[1],
                  data: [
                    ...prevGraphData.datasets[1].data,
                    ...forecastedPsiValues,
                  ],
                },
              ],
            };
          });

          setCurrentPsi(newFakePsiValues);
        })
        .catch((error) => {
          console.error('Error fetching prediction:', error);
        });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentPsi]);

  useEffect(() => {
    const logger = { id: parseInt(id), name: `Data Logger ${id}`, psi: currentPsi[id - 1] };
    if (logger) {
      setLoggerDetails(logger);
    }
    setLoading(false);
  }, [id, currentPsi]);

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
              <p>{loggerDetails.psi.toFixed(2)} psi</p>
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
