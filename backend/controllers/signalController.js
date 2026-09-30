const db = require("../config/firebase");

const getSignal = async (req, res) => {
    try {
        const snapshot = await db
            .collection("signalData")
            .get();

        if (snapshot.empty) {
            return res.status(404).json({
                success: false,
                message: "No signal data available"
            });
        }

        const signals = [];

        snapshot.forEach((doc) => {
            signals.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json({
            success: true,
            data: signals
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch signal data",
            error: error.message
        });
    }
};

module.exports = {
    getSignal
};