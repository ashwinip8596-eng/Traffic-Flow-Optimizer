const db = require("./config/firebase");

const cleanupCollection = async (collectionName, keepIds) => {
    const snapshot = await db.collection(collectionName).get();

    let deleted = 0;

    for (const doc of snapshot.docs) {
        if (!keepIds.includes(doc.id)) {
            await doc.ref.delete();
            deleted++;
        }
    }

    console.log(`🧹 ${collectionName}: deleted ${deleted} old records`);
};

const cleanup = async () => {
    try {
        await cleanupCollection("trafficData", []);

        await cleanupCollection("directionData", [
            "direction_left",
            "direction_right",
            "direction_straight"
        ]);

        await cleanupCollection("signalData", [
            "signal_LOW",
            "signal_MEDIUM",
            "signal_HIGH"
        ]);

        console.log("✅ Cleanup completed!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Cleanup error:", error);
        process.exit(1);
    }
};

cleanup();