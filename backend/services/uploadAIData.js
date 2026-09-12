const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const db = require("../config/firebase");

const readCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", () => resolve(results))
            .on("error", (error) => reject(error));
    });
};

const uploadAIData = async () => {
    try {
        const dataFolder = path.join(__dirname, "../data");

        const trafficFile = path.join(dataFolder, "traffic_data.csv");
        const directionFile = path.join(dataFolder, "direction_data.csv");
        const signalFile = path.join(dataFolder, "signal_optimization.csv");

        console.log("📂 Reading Member 1 CSV files...");

        const trafficData = await readCSV(trafficFile);
        const directionData = await readCSV(directionFile);
        const signalData = await readCSV(signalFile);

        console.log(`🚗 Traffic records: ${trafficData.length}`);
        console.log(`↔️ Direction records: ${directionData.length}`);
        console.log(`🚦 Signal records: ${signalData.length}`);

        // Upload traffic data
        for (const item of trafficData) {
            const docId = `frame_${item.frame}`;

            await db.collection("trafficData").doc(docId).set({
                timestamp: item.timestamp || "",
                frame: Number(item.frame || 0),
                cars: Number(item.cars || 0),
                motorcycles: Number(item.motorcycles || 0),
                buses: Number(item.buses || 0),
                trucks: Number(item.trucks || 0),
                current_vehicles: Number(item.current_vehicles || 0),
                unique_cars: Number(item.unique_cars || 0),
                unique_motorcycles: Number(item.unique_motorcycles || 0),
                unique_buses: Number(item.unique_buses || 0),
                unique_trucks: Number(item.unique_trucks || 0),
                unique_total: Number(item.unique_total || 0),
                left: Number(item.left || 0),
                right: Number(item.right || 0),
                straight: Number(item.straight || 0),
                density: Number(item.density || 0),
                congestion: item.congestion || ""
            });
        }

        console.log("✅ Traffic data uploaded");

        // Upload direction data
        for (const item of directionData) {
            const direction = String(item.direction || "").toLowerCase();
            const docId = `direction_${direction}`;

            await db.collection("directionData").doc(docId).set({
                direction: item.direction || "",
                vehicle_count: Number(item.vehicle_count || 0)
            });
        }

        console.log("✅ Direction data uploaded");

        // Upload signal optimization data
        for (const item of signalData) {
            const docId = `signal_${item.traffic_level || "unknown"}`;

            await db.collection("signalData").doc(docId).set({
                traffic_level: item.traffic_level || "",
                total_unique_vehicles: Number(item.total_unique_vehicles || 0),
                peak_simultaneous: Number(item.peak_simultaneous || 0),
                left_vehicles: Number(item.left_vehicles || 0),
                right_vehicles: Number(item.right_vehicles || 0),
                straight_vehicles: Number(item.straight_vehicles || 0),
                left_green: Number(item.left_green || 0),
                right_green: Number(item.right_green || 0),
                straight_green: Number(item.straight_green || 0),
                priority_direction: item.priority_direction || "",
                priority_vehicles: Number(item.priority_vehicles || 0),
                yellow_time: Number(item.yellow_time || 0),
                all_red_time: Number(item.all_red_time || 0),
                recommendation: item.recommendation || ""
            });
        }

        console.log("✅ Signal optimization data uploaded");
        console.log("🎉 ALL MEMBER 1 DATA UPLOADED SUCCESSFULLY!");

    } catch (error) {
        console.error("❌ Upload error:", error);
    }
};

module.exports = {
    uploadAIData
};