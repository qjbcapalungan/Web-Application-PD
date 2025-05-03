const express = require("express");
const mqtt = require("mqtt");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { MongoClient } = require("mongodb"); // Import MongoDB client

const app = express();
app.use(cors({
  origin: "http://178.128.48.126:8080",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));
const port = 5000;

// Store valve states
const valveStates = {
  valve1: null,
  valve2: null,
  valve3: null,
  valve4: null,
};

// MongoDB setup
const mongoUri = "mongodb+srv://DenverMateo:admin123@Cluster0.jschv.mongodb.net/?"; // Replace with your MongoDB URI
const dbName = "Cluster0"; // Replace with your database name
let db;

// Add this function at the top level
async function fetchAndEmitSensorData(io) {
  try {
    const currentTime = new Date();
    const twoMinutesAgo = new Date(currentTime.getTime() - 2 * 60 * 1000);

    const sim1Data = await db.collection("sim1_data")
      .findOne(
        { timestamp: { $gte: twoMinutesAgo } },
        { sort: { timestamp: -1 } }
      );
    const sim2Data = await db.collection("sim2_data")
      .findOne(
        { timestamp: { $gte: twoMinutesAgo } },
        { sort: { timestamp: -1 } }
      );
    const sim3Data = await db.collection("sim3_data")
      .findOne(
        { timestamp: { $gte: twoMinutesAgo } },
        { sort: { timestamp: -1 } }
      );

    const formatSensorData = (data) => {
      if (!data) return null;
      const values = Array.isArray(data.psi_values) ? data.psi_values : [data.psi_values];
      return {
        value: values,
        timestamp: data.timestamp
      };
    };

    const actualSensorData = {
      actualsensor1: formatSensorData(sim1Data),
      actualsensor2: formatSensorData(sim2Data),
      actualsensor3: formatSensorData(sim3Data)
    };

    io.emit('sensor-update', actualSensorData);
  } catch (error) {
    console.error("Error fetching sensor data:", error);
  }
}

MongoClient.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
    console.log("Connected to MongoDB");
    
    // Set up periodic sensor data updates
    setInterval(() => fetchAndEmitSensorData(io), 60000); // Check every minute
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });

// MQTT client setup
const mqttClient = mqtt.connect("mqtt://192.168.100.234"); // Updated to use Mosquitto broker

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  mqttClient.subscribe("switch/state", (err) => { // Updated topic
    if (err) {
      console.error("Failed to subscribe to topic:", err);
    } else {
      console.log("Subscribed to topic: switch/state");
    }
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://178.128.48.126:8080", // Allow requests from the frontend
    methods: ["GET", "POST"], // Allow these HTTP methods
    allowedHeaders: ["Content-Type"], // Allow specific headers
// Allow credentials (cookies, authorization headers, etc.)
  },
});

io.on("connection", (socket) => {
  console.log("A client connected");
  socket.emit("valve-update", { ...valveStates }); // Send the initial valve states to the client
  
  // Send initial sensor data when client connects
  fetchAndEmitSensorData(io);
});

mqttClient.on("message", (topic, message) => {
  if (topic === "switch/state") {
    const msg = message.toString();
    console.log(`Received MQTT message: ${msg}`);

    const match = msg.match(/Switch (\d+): (ON|OFF)/);
    if (match) {
      const switchNumber = parseInt(match[1], 10);
      const state = match[2];
      if (switchNumber >= 1 && switchNumber <= 4) {
        const valveKey = `valve${switchNumber}`;
        
        // Set to loading state first
        valveStates[valveKey] = null;
        io.emit("valve-update", { ...valveStates });
        
        // Update to new state after a brief delay
        setTimeout(() => {
          valveStates[valveKey] = state === "ON" ? "Closed" : "Open   ";
          io.emit("valve-update", { ...valveStates });
          console.log(`Updated ${valveKey} to ${valveStates[valveKey]}`);
        }, 100);
      }
    } else {
      console.error("MQTT message format is invalid:", msg);
    }
  }
});

// Add CORS middleware to allow frontend to fetch data


// API endpoint to fetch valve data
app.get("/api/valve-data", (req, res) => {
  res.json(valveStates);
});

// API endpoint to fetch actual sensor data
app.get("/api/actualsensor-data", async (req, res) => {
  try {
    const currentTime = new Date();
    const twoMinutesAgo = new Date(currentTime.getTime() - 2 * 60 * 1000);

    const collections = ['sim1_data', 'sim2_data', 'sim3_data'];
    const sensorData = await Promise.all(collections.map(async (collection) => {
      const data = await db.collection(collection)
        .find({ timestamp: { $gte: twoMinutesAgo } })
        .sort({ timestamp: -1 })
        .limit(15)  // Get last 15 readings
        .toArray();
      
      console.log(`${collection} data count:`, data.length);
      return data;
    }));

    const formatSensorData = (data) => {
      if (!data || data.length === 0) {
        console.log("No data available for sensor");
        return { value: [], timestamp: null };
      }
      
      // Extract PSI values from all documents
      const values = data.map(doc => doc.psi_values).flat();
      console.log("Extracted values:", values);
      
      return {
        value: values.map(v => Number(v)),
        timestamp: data[0].timestamp  // Use most recent timestamp
      };
    };

    const actualSensorData = {
      actualsensor1: formatSensorData(sensorData[0]),
      actualsensor2: formatSensorData(sensorData[1]),
      actualsensor3: formatSensorData(sensorData[2]),
      metadata: {
        last_update: new Date().toISOString(),
        data_window: "2 minutes",
        counts: {
          sensor1: sensorData[0]?.length || 0,
          sensor2: sensorData[1]?.length || 0,
          sensor3: sensorData[2]?.length || 0
        }
      }
    };

    console.log("Sending sensor data:", JSON.stringify(actualSensorData, null, 2));
    res.json(actualSensorData);
  } catch (error) {
    console.error("Error fetching actual sensor data:", error);
    res.status(500).json({ 
      error: "Failed to fetch actual sensor data",
      details: error.message
    });
  }
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
