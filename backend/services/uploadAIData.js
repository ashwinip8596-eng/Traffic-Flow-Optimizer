const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const db = require("../config/firebase");

// ==========================================
// CSV FILE PATHS
// ==========================================

const DATA_DIR = path.join(__dirname, "..", "data");

const TRAFFIC_FILE = path.join(DATA_DIR, "traffic_data.csv");
const DIRECTION_FILE = path.join(DATA_DIR, "direction_data.csv");
const SIGNAL_FILE = path.join(DATA_DIR, "signal_optimization.csv");
const AMBULANCE_FILE = path.join(DATA_DIR, "ambulance_data.csv");


// ==========================================
// READ CSV
// ==========================================

function readCSV(filePath) {

    return new Promise((resolve, reject) => {

        const results = [];

        if (!fs.existsSync(filePath)) {
            return reject(
                new Error(`Missing CSV file: ${filePath}`)
            );
        }

        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => {
                results.push(row);
            })
            .on("end", () => {
                resolve(results);
            })
            .on("error", (error) => {
                reject(error);
            });
    });
}


// ==========================================
// NUMBER CONVERSION
// ==========================================

function toNumber(value, defaultValue = 0) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : defaultValue;
}


// ==========================================
// TEXT CLEANING
// ==========================================

function cleanText(value, defaultValue = "") {

    if (
        value === undefined ||
        value === null
    ) {
        return defaultValue;
    }

    return String(value).trim();
}


// ==========================================
// BOOLEAN CONVERSION
// ==========================================

function toBoolean(value) {

    const text = cleanText(value).toUpperCase();

    return (
        text === "YES" ||
        text === "TRUE" ||
        text === "1"
    );
}


// ==========================================
// MAIN FUNCTION
// ==========================================

async function uploadAIData() {

    console.log("");
    console.log("======================================");
    console.log("UPLOADING AI DATA");
    console.log("======================================");


    // ==========================================
    // CHECK FILES
    // ==========================================

    const files = [
        TRAFFIC_FILE,
        DIRECTION_FILE,
        SIGNAL_FILE,
        AMBULANCE_FILE
    ];

    for (const file of files) {

        if (!fs.existsSync(file)) {

            throw new Error(
                `Missing CSV file: ${file}`
            );
        }

        console.log(
            `Found: ${path.basename(file)}`
        );
    }


    // ==========================================
    // READ CSV FILES
    // ==========================================

    const trafficData =
        await readCSV(TRAFFIC_FILE);

    const directionData =
        await readCSV(DIRECTION_FILE);

    const signalData =
        await readCSV(SIGNAL_FILE);

    const ambulanceData =
        await readCSV(AMBULANCE_FILE);


    console.log(
        `Traffic records   : ${trafficData.length}`
    );

    console.log(
        `Direction records : ${directionData.length}`
    );

    console.log(
        `Signal records    : ${signalData.length}`
    );

    console.log(
        `Ambulance records : ${ambulanceData.length}`
    );


    // ==========================================
    // TRAFFIC
    // ==========================================

    const latestTraffic =
        trafficData.length > 0
            ? trafficData[trafficData.length - 1]
            : {};

    let totalVehicles = 0;

    if (
        latestTraffic.unique_total !== undefined
    ) {

        totalVehicles =
            toNumber(
                latestTraffic.unique_total
            );

    } else if (
        latestTraffic.total_unique_vehicles !== undefined
    ) {

        totalVehicles =
            toNumber(
                latestTraffic.total_unique_vehicles
            );
    }


    // ==========================================
    // PEAK VEHICLES
    // ==========================================

    let peakVehicles = 0;

    for (const row of trafficData) {

        const currentVehicles =
            toNumber(
                row.current_vehicles
            );

        if (currentVehicles > peakVehicles) {
            peakVehicles = currentVehicles;
        }
    }


    // ==========================================
    // TRAFFIC LEVEL
    // ==========================================

    let trafficLevel = "LOW";

    if (peakVehicles > 20) {

        trafficLevel = "HIGH";

    } else if (peakVehicles > 8) {

        trafficLevel = "MEDIUM";
    }


    // ==========================================
    // DIRECTION
    // ==========================================

    let left = 0;
    let right = 0;
    let straight = 0;

    for (const row of directionData) {

        const direction =
            cleanText(row.direction)
                .toUpperCase();

        const count =
            toNumber(row.vehicle_count);

        if (direction === "LEFT") {

            left = count;

        } else if (direction === "RIGHT") {

            right = count;

        } else if (direction === "STRAIGHT") {

            straight = count;
        }
    }


    // ==========================================
    // SIGNAL
    // ==========================================

    const latestSignal =
        signalData.length > 0
            ? signalData[signalData.length - 1]
            : {};

    const leftGreen =
        toNumber(latestSignal.left_green);

    const rightGreen =
        toNumber(latestSignal.right_green);

    const straightGreen =
        toNumber(latestSignal.straight_green);

    const priorityDirection =
        cleanText(
            latestSignal.priority_direction,
            "NONE"
        ).toUpperCase();

    const priorityVehicles =
        toNumber(
            latestSignal.priority_vehicles
        );

    const yellowTime =
        toNumber(
            latestSignal.yellow_time,
            5
        );

    const allRedTime =
        toNumber(
            latestSignal.all_red_time,
            2
        );

    const recommendation =
        cleanText(
            latestSignal.recommendation
        );


    // ==========================================
    // AMBULANCE DETECTION
    // ==========================================

    let ambulanceDetected = false;

    let ambulanceDirection = "NONE";

    let ambulancePriority = "NORMAL";

    let ambulanceDetectedFrame = null;


    // ==========================================
    // CHECK EVERY AMBULANCE ROW
    // ==========================================

    for (const row of ambulanceData) {

        const detected =
            toBoolean(
                row.ambulance_detected
            );

        if (!detected) {
            continue;
        }


        ambulanceDetected = true;

        ambulancePriority = "EMERGENCY";


        // --------------------------------------
        // Get direction
        // --------------------------------------

        const direction =
            cleanText(
                row.direction,
                "NONE"
            ).toUpperCase();


        if (
            direction === "LEFT" ||
            direction === "RIGHT" ||
            direction === "STRAIGHT"
        ) {

            ambulanceDirection =
                direction;
        }


        // --------------------------------------
        // Save frame
        // --------------------------------------

        ambulanceDetectedFrame =
            row.frame || null;
    }


    // ==========================================
    // FINAL AMBULANCE STATE
    // ==========================================

    if (!ambulanceDetected) {

        ambulanceDirection = "NONE";

        ambulancePriority = "NORMAL";
    }


    // ==========================================
    // DEBUG OUTPUT
    // ==========================================

    console.log("");
    console.log("AMBULANCE ANALYSIS");
    console.log("--------------------------------------");

    console.log(
        `Ambulance records : ${ambulanceData.length}`
    );

    console.log(
        `Detected          : ${
            ambulanceDetected ? "YES" : "NO"
        }`
    );

    console.log(
        `Direction         : ${ambulanceDirection}`
    );

    console.log(
        `Priority          : ${ambulancePriority}`
    );

    console.log(
        `Last frame        : ${
            ambulanceDetectedFrame || "NONE"
        }`
    );

    console.log("--------------------------------------");


    // ==========================================
    // COMBINED DASHBOARD DATA
    // ==========================================

    const dashboardData = {

        totalVehicles,

        peakVehicles,

        trafficLevel,

        left,

        right,

        straight,

        priorityDirection,

        priorityVehicles,

        ambulanceDetected,

        ambulanceDirection,

        priority: ambulancePriority,

        leftGreen,

        rightGreen,

        straightGreen,

        yellowTime,

        allRedTime,

        recommendation,

        updatedAt:
            new Date().toISOString()
    };


    // ==========================================
    // SAVE DASHBOARD SUMMARY
    // ==========================================

    await db
        .collection("dashboardData")
        .doc("current")
        .set(
            dashboardData,
            {
                merge: true
            }
        );


    // ==========================================
    // SAVE AMBULANCE SUMMARY
    // ==========================================

    await db
        .collection("ambulanceData")
        .doc("current")
        .set({

            ambulance_detected:
                ambulanceDetected,

            ambulance_direction:
                ambulanceDirection,

            priority:
                ambulancePriority,

            detected_frame:
                ambulanceDetectedFrame,

            updatedAt:
                new Date().toISOString()

        });


    // ==========================================
    // FINAL OUTPUT
    // ==========================================

    console.log("");
    console.log("======================================");
    console.log("AI DATA UPLOAD COMPLETED");
    console.log("======================================");

    console.log(
        `Total vehicles      : ${totalVehicles}`
    );

    console.log(
        `Peak vehicles       : ${peakVehicles}`
    );

    console.log(
        `Traffic level       : ${trafficLevel}`
    );

    console.log(
        `Left                : ${left}`
    );

    console.log(
        `Right               : ${right}`
    );

    console.log(
        `Straight            : ${straight}`
    );

    console.log(
        `Ambulance detected  : ${
            ambulanceDetected
                ? "YES"
                : "NO"
        }`
    );

    console.log(
        `Ambulance direction : ${ambulanceDirection}`
    );

    console.log(
        `Priority            : ${ambulancePriority}`
    );

    console.log("======================================");


    // ==========================================
    // RETURN RESULT
    // ==========================================

    return {

        dashboardData,

        trafficRecords:
            trafficData.length,

        directionRecords:
            directionData.length,

        signalRecords:
            signalData.length,

        ambulanceRecords:
            ambulanceData.length
    };
}


module.exports = {
    uploadAIData
};