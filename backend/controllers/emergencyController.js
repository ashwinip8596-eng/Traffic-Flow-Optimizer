const db = require("../config/firebase");

const getEmergency = async (req, res) => {
    try {
        const doc = await db
            .collection("dashboardData")
            .doc("current")
            .get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: "Emergency data not found"
            });
        }

        const data = doc.data();

        res.json({
            success: true,
            data: {
                detected: Boolean(data.ambulanceDetected),
                direction: data.ambulanceDirection || "NONE",
                priority: data.priority || "NORMAL"
            }
        });

    } catch (error) {
        console.error("❌ Emergency API error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch emergency data",
            error: error.message
        });
    }
};

module.exports = {
    getEmergency
};