require("dotenv").config(); // Ensure you load env variables
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: "Cluster0", // Add this line to force the correct DB
});

// Logger Schemas
const simSchema = new mongoose.Schema({
  actualPSI: Number,
  predictedPSI: Number,
  timestamp: { type: Date, default: Date.now },
}, { collection: 'sim1_data' }); // Prevents automatic pluralization

const Sim1 = mongoose.model("Sim1", simSchema, "sim1_data");
const Sim2 = mongoose.model("Sim2", simSchema, "sim2_data");
const Sim3 = mongoose.model("Sim3", simSchema, "sim3_data");

// Fetch latest logger data
const getLatestData = async () => {
  try {
    const latestSim1 = await Sim1.findOne().sort({ _id: -1 });
    const latestSim2 = await Sim2.findOne().sort({ _id: -1 });
    const latestSim3 = await Sim3.findOne().sort({ _id: -1 });

    const dataLoggers = [
      {
        id: 1,
        name: "Logger 1",
        type: "GR",
        actualPSI: latestSim1 ? parseFloat(latestSim1.message) : "Inactive",
        predictedPSI: latestSim1 ? latestSim1.predictedPSI : "N/A",
      },
      {
        id: 2,
        name: "Logger 2",
        type: "PRV",
        actualPSI: latestSim2 ? parseFloat(latestSim2.message) : "Inactive",
        predictedPSI: latestSim2 ? latestSim2.predictedPSI : "N/A",
      },
      {
        id: 3,
        name: "Logger 3",
        type: "DM",
        actualPSI: latestSim3 ? parseFloat(latestSim3.message) : "Inactive",
        predictedPSI: latestSim3 ? latestSim3.predictedPSI : "N/A",
      },
    ];

    console.log("Sending data:", dataLoggers); // Debugging log
    return dataLoggers;
  } catch (error) {
    console.error("Error fetching logger data:", error);
    return [];
  }
};

// API Route to get loggers
app.get("/api/loggers", async (req, res) => {
  const data = await getLatestData();
  res.json(data);
});

// API Route to add new data (for testing)
app.post("/api/loggers/:id", async (req, res) => {
  const { id } = req.params;
  const { actualPSI, predictedPSI } = req.body;

  try {
    let SimModel;
    if (id == 1) SimModel = Sim1;
    else if (id == 2) SimModel = Sim2;
    else if (id == 3) SimModel = Sim3;
    else return res.status(400).json({ message: "Invalid logger ID" });

    const newEntry = new SimModel({ actualPSI, predictedPSI });
    await newEntry.save();

    res.status(201).json({ message: `Logger ${id} data added`, data: newEntry });
  } catch (error) {
    console.error("Error adding logger data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
