
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Database connection
require("./config/db");

// Import routes
const busRoutes = require("./routes/busRoutes");
const authRoutes = require("./routes/authRoutes");

app.get("/", (req, res) => {
    res.send("SmartBus Node.js Backend is Running!");
});

// Bus APIs: GET, POST, PUT, DELETE
app.use("/api/buses", busRoutes);

// Student Authentication APIs: Register and Login
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Node.js server running on http://localhost:${PORT}`);
});
