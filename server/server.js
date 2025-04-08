const express = require("express");
const mqtt = require("mqtt");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { MongoClient } = require("mongodb"); // Import MongoDB client

const app = express();
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

MongoClient.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
    console.log("Connected to MongoDB");
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
    origin: "http://localhost:3000", // Allow requests from the frontend
    methods: ["GET", "POST"], // Allow these HTTP methods
    allowedHeaders: ["Content-Type"], // Allow specific headers
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  },
});

io.on("connection", (socket) => {
  console.log("A client connected");
  socket.emit("valve-update", { ...valveStates }); // Send the initial valve states to the client
});

mqttClient.on("message", (topic, message) => {
  if (topic === "switch/state") {
    const msg = message.toString();
    console.log(`Received MQTT message: ${msg}`); // Debugging: Log the received message

    const match = msg.match(/Switch (\d+): (ON|OFF)/);
    if (match) {
      const switchNumber = parseInt(match[1], 10);
      const state = match[2];
      if (switchNumber >= 1 && switchNumber <= 4) {
        valveStates[`valve${switchNumber}`] = state === "ON" ? "Open" : "Closed";
        console.log(`Updated valve${switchNumber} to ${valveStates[`valve${switchNumber}`]}`); // Debugging: Log the updated state
        io.emit("valve-update", { ...valveStates }); // Emit the updated state to the frontend
      }
    } else {
      console.error("MQTT message format is invalid:", msg); // Debugging: Log invalid messages
    }
  }
});

// Add CORS middleware to allow frontend to fetch data
app.use(cors());

// API endpoint to fetch valve data
app.get("/api/valve-data", (req, res) => {
  res.json(valveStates);
});

// API endpoint to fetch actual sensor data
app.get("/api/actualsensor-data", async (req, res) => {
  try {
    const sim1Data = await db.collection("sim1_data").findOne({}, { sort: { timestamp: -1 } });
    const sim2Data = await db.collection("sim2_data").findOne({}, { sort: { timestamp: -1 } });
    const sim3Data = await db.collection("sim3_data").findOne({}, { sort: { timestamp: -1 } });

    const actualSensorData = {
      actualsensor1: sim1Data ? sim1Data.psi_values : null,
      actualsensor2: sim2Data ? sim2Data.psi_values : null,
      actualsensor3: sim3Data ? sim3Data.psi_values : null,
    };

    res.json(actualSensorData);
  } catch (error) {
    console.error("Error fetching actual sensor data:", error);
    res.status(500).json({ error: "Failed to fetch actual sensor data" });
  }
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
