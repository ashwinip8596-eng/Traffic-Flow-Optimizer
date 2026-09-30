const express = require("express");

const router = express.Router();

const db = require("../config/firebase");

// ==========================================
// GET EMERGENCY / AMBULANCE DATA
// ==========================================

router.get("/", async (req, res) => {

    try {

        const snapshot = await db
            .collection("dashboardData")
            .doc("current")
            .get();

        // ==========================================
        // NO DASHBOARD DATA
        // ==========================================

        if (!snapshot.exists) {

            return res.json({
                success: true,
                data: {
                    detected: false,
                    direction: "NONE",
                    priority: "NORMAL"
                }
            });
        }

        const data = snapshot.data();

        // ==========================================
        // RETURN AMBULANCE INFORMATION
        // ==========================================

        res.json({
            success: true,
            data: {

                detected:
                    Boolean(data.ambulanceDetected),

                direction:
                    data.ambulanceDirection || "NONE",

                priority:
                    data.priority || "NORMAL"
            }
        });

    } catch (error) {

        console.error(
            "Emergency API error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load emergency data",
            error: error.message
        });
    }
});

module.exports = router;