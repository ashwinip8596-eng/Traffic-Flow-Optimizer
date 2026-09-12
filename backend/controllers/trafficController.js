const db = require("../config/firebase");

// GET latest traffic data
const getTraffic = async (req, res) => {
    try {
        const snapshot = await db
            .collection("trafficData")
            .orderBy("timestamp", "desc")
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({
                success: false,
                message: "No traffic data available"
            });
        }

        res.json({
            success: true,
            data: snapshot.docs[0].data()
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch traffic data",
            error: error.message
        });
    }
};


// POST traffic data
const addTraffic = async (req, res) => {
    try {
        const {
            totalVehicles,
            currentVehicles,
            trafficLevel
        } = req.body;

        if (
            totalVehicles === undefined ||
            currentVehicles === undefined ||
            !trafficLevel
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing required traffic fields"
            });
        }

        const trafficData = {
            totalVehicles: Number(totalVehicles),
            currentVehicles: Number(currentVehicles),
            trafficLevel: String(trafficLevel).toUpperCase(),
            timestamp: new Date().toISOString()
        };

        const docRef = await db
            .collection("trafficData")
            .add(trafficData);

        res.status(201).json({
            success: true,
            message: "Traffic data stored successfully",
            id: docRef.id,
            data: trafficData
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to store traffic data",
            error: error.message
        });
    }
};


module.exports = {
    getTraffic,
    addTraffic
};