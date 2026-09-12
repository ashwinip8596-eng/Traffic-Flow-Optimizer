const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/firebase");
const { uploadAIData } = require("./services/uploadAIData");
const trafficRoutes = require("./routes/trafficRoutes");
const directionRoutes = require("./routes/directionRoutes");
const signalRoutes = require("./routes/signalRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/traffic", trafficRoutes);
app.use("/api/direction", directionRoutes);
app.use("/api/signal", signalRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Traffic Flow Optimizer Backend is running!"
    });
});
app.get("/api/upload-ai-data", async (req, res) => {
    try {
        await uploadAIData();

        res.json({
            success: true,
            message: "Member 1 data uploaded to Firestore successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to upload AI data",
            error: error.message
        });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`🚦 Traffic Flow Optimizer Backend running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
});