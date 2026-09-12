const db = require("../config/firebase");

const getDirection = async (req, res) => {
    try {
        const snapshot = await db
            .collection("directionData")
            .get();

        if (snapshot.empty) {
            return res.status(404).json({
                success: false,
                message: "No direction data available"
            });
        }

        const directionData = {
            left: 0,
            right: 0,
            straight: 0
        };

        snapshot.forEach((doc) => {
            const data = doc.data();

            const direction = String(data.direction).toLowerCase();
            const count = Number(data.vehicle_count || 0);

            if (direction === "left") {
                directionData.left = count;
            }

            if (direction === "right") {
                directionData.right = count;
            }

            if (direction === "straight") {
                directionData.straight = count;
            }
        });

        res.json({
            success: true,
            data: directionData
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch direction data",
            error: error.message
        });
    }
};

module.exports = {
    getDirection
};