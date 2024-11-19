require("dotenv").config({ path: "./config.env" }); // Load environment variables
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Debugging: Log the MongoDB URI
console.log("MongoDB URI:", process.env.MONGO_URI);

// Validate MongoDB URI
if (!process.env.MONGO_URI) {
  console.error("MongoDB URI is missing. Check your config.env file.");
  process.exit(1);
}

// Connect to MongoDB
mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

// User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));