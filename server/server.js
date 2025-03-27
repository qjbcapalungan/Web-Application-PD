require("dotenv").config();
const express = require("express");
const cors = require("cors");
const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Load CSV data
const CSV_FILE_PATH = path.join(__dirname, "inputdata2.csv");
let inputData = [];
let currentIndex = 0;

const loadCSVData = () => {
  const csvData = fs.readFileSync(CSV_FILE_PATH, "utf-8");
  const rows = csvData.split("\n").slice(1); // Skip header row
  inputData = rows.map((row) => {
    const [psi] = row.split(",");
    return parseFloat(psi);
  }).filter((value) => !isNaN(value));
};

// Load TensorFlow model
const MODEL_PATH = path.join(__dirname, "LSTM3/model.json");
let model;

const loadModel = async () => {
  model = await tf.loadLayersModel(`file://${MODEL_PATH}`);
  console.log("Model loaded successfully.");
};

// API to get current PSI value
app.get("/current_psi", (req, res) => {
  if (currentIndex >= inputData.length) {
    currentIndex = 0; // Reset index if it exceeds data length
  }

  const currentPSI = inputData[currentIndex];
  currentIndex++;
  console.log(`Current PSI: ${currentPSI}`);
  res.json({ current_psi: [currentPSI] });
});

// API to get real-time chart data
app.get("/real_time_chart", async (req, res) => {
  try {
    if (currentIndex < 5) {
      return res.status(400).json({ error: "Not enough data for prediction" });
    }

    const actualData = inputData.slice(0, currentIndex);
    const predictedData = [];
    const xPredicted = [];

    for (let i = 4; i < actualData.length; i++) {
      const recentData = actualData.slice(i - 4, i + 1);
      const tensor = tf.tensor3d([recentData], [1, 5, 1]);
      const prediction = model.predict(tensor).dataSync();
      predictedData.push(...prediction);
      xPredicted.push(i + 1);
    }

    res.json({
      actual: actualData,
      predicted: predictedData,
      xPredicted,
    });
  } catch (error) {
    console.error("Error in /real_time_chart:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  loadCSVData();
  await loadModel();
});
