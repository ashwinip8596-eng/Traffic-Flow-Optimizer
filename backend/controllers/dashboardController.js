const db = require("../config/firebase");

const getDashboard = async (req, res) => {
    try {
        const trafficSnapshot = await db
            .collection("trafficData")
            .orderBy("timestamp", "desc")
            .limit(1)
            .get();

        const directionSnapshot = await db
            .collection("directionData")
            .get();

        const signalSnapshot = await db
            .collection("signalData")
            .get();

        let traffic = null;

        if (!trafficSnapshot.empty) {
            traffic = trafficSnapshot.docs[0].data();
        }

        const direction = {
            left: 0,
            right: 0,
            straight: 0
        };

        directionSnapshot.forEach((doc) => {
            const data = doc.data();
            const name = String(data.direction).toLowerCase();

            if (name === "left") direction.left = Number(data.vehicle_count || 0);
            if (name === "right") direction.right = Number(data.vehicle_count || 0);
            if (name === "straight") direction.straight = Number(data.vehicle_count || 0);
        });

        const signals = [];

        signalSnapshot.forEach((doc) => {
            signals.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json({
            success: true,
            data: {
                traffic,
                direction,
                signals
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: error.message
        });
    }
};

module.exports = { getDashboard };