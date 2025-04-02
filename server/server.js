const express = require("express");
const mqtt = require("mqtt");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const port = 5000;

// Store valve states
const valveStates = {
  valve1: null,
  valve2: null,
  valve3: null,
  valve4: null,
};

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

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});