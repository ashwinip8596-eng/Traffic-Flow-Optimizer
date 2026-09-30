const db = require("../config/firebase");

// ==========================================
// GET CURRENT DASHBOARD DATA
// ==========================================

const getDashboard = async (req, res) => {

    try {

        const dashboardDoc = await db
            .collection("dashboardData")
            .doc("current")
            .get();

        // ==========================================
        // NO DATA YET
        // ==========================================

        if (!dashboardDoc.exists) {

            return res.json({
                success: true,
                data: {
                    totalVehicles: 0,
                    peakVehicles: 0,
                    trafficLevel: "LOW",

                    left: 0,
                    right: 0,
                    straight: 0,

                    priorityDirection: "NONE",

                    ambulanceDetected: false,
                    ambulanceDirection: "NONE",
                    priority: "NORMAL",

                    leftGreen: 0,
                    rightGreen: 0,
                    straightGreen: 0,

                    yellowTime: 5,
                    allRedTime: 2,

                    recommendation:
                        "No AI data uploaded yet."
                }
            });
        }

        // ==========================================
        // GET DATA
        // ==========================================

        const data = dashboardDoc.data();

        // ==========================================
        // RETURN DATA
        // ==========================================

        res.json({
            success: true,
            data: {

                totalVehicles:
                    Number(data.totalVehicles || 0),

                peakVehicles:
                    Number(data.peakVehicles || 0),

                trafficLevel:
                    data.trafficLevel || "LOW",

                left:
                    Number(data.left || 0),

                right:
                    Number(data.right || 0),

                straight:
                    Number(data.straight || 0),

                priorityDirection:
                    data.priorityDirection || "NONE",

                ambulanceDetected:
                    Boolean(data.ambulanceDetected),

                ambulanceDirection:
                    data.ambulanceDirection || "NONE",

                priority:
                    data.priority || "NORMAL",

                leftGreen:
                    Number(data.leftGreen || 0),

                rightGreen:
                    Number(data.rightGreen || 0),

                straightGreen:
                    Number(data.straightGreen || 0),

                yellowTime:
                    Number(data.yellowTime || 5),

                allRedTime:
                    Number(data.allRedTime || 2),

                recommendation:
                    data.recommendation || ""
            }
        });

    } catch (error) {

        console.error(
            "Dashboard API error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load dashboard data",
            error: error.message
        });
    }
};

module.exports = {
    getDashboard
};