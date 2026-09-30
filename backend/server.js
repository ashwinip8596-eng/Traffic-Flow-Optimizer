const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/firebase");
const { uploadAIData } = require("./services/uploadAIData");

const trafficRoutes = require("./routes/trafficRoutes");
const directionRoutes = require("./routes/directionRoutes");
const signalRoutes = require("./routes/signalRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/traffic", trafficRoutes);
app.use("/api/direction", directionRoutes);
app.use("/api/signal", signalRoutes);
app.use("/api/signals", signalRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/emergency", emergencyRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend is running"
    });
});

// ==========================================
// UPLOAD AI DATA
// ==========================================

app.post("/api/upload-ai-data", async (req, res) => {
    try {

        const result = await uploadAIData();

        res.json({
            success: true,
            message: "AI data uploaded successfully",
            data: result
        });

    } catch (error) {

        console.error("AI upload error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to upload AI data",
            error: error.message
        });
    }
});

// ==========================================
// ROOT
// ==========================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Traffic Flow Optimizer Backend is running"
    });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log("======================================");
    console.log("TRAFFIC FLOW OPTIMIZER BACKEND");
    console.log("======================================");
    console.log(`Server running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log(`Dashboard: http://localhost:${PORT}/api/dashboard`);
    console.log(`Emergency: http://localhost:${PORT}/api/emergency`);
    console.log(`Traffic: http://localhost:${PORT}/api/traffic`);
    console.log(`Direction: http://localhost:${PORT}/api/direction`);
    console.log(`Signal: http://localhost:${PORT}/api/signal`);
    console.log("======================================");

});