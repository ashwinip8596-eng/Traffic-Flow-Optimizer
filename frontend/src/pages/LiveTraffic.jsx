import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

function LiveTraffic() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTrafficData = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch traffic data");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Backend returned an error"
        );
      }

      setData(result.data);
    } catch (err) {
      console.error("Live Traffic API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTrafficData = async () => {
      await fetchTrafficData();
    };

    loadTrafficData();

    const interval = setInterval(() => {
      fetchTrafficData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="page">
        <h2>🚗 Live Traffic</h2>
        <p>Loading live traffic data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <h2>🚗 Live Traffic</h2>

        <div className="panel">
          <p>
            Unable to load traffic data.
          </p>

          <button
            className="refresh-button"
            onClick={fetchTrafficData}
          >
            ↻ Try Again
          </button>
        </div>
      </div>
    );
  }

  /*
   * BACKEND DASHBOARD DATA
   *
   * totalVehicles
   * peakVehicles
   * trafficLevel
   * left
   * right
   * straight
   * priorityDirection
   * ambulanceDetected
   * ambulanceDirection
   * priority
   * leftGreen
   * rightGreen
   * straightGreen
   * yellowTime
   * allRedTime
   * recommendation
   */

  const liveVehicles =
    data.peakVehicles ?? 0;

  const uniqueVehicles =
    data.totalVehicles ?? 0;

  /* TRAFFIC DIRECTIONS */

  const traffic = [
    {
      direction: "LEFT",
      vehicles: data.left ?? 0,
    },
    {
      direction: "RIGHT",
      vehicles: data.right ?? 0,
    },
    {
      direction: "STRAIGHT",
      vehicles: data.straight ?? 0,
    },
  ].map((item) => {
    const density = Math.min(
      item.vehicles * 10,
      100
    );

    let status = "Low";

    if (item.vehicles >= 7) {
      status = "High";
    } else if (item.vehicles >= 4) {
      status = "Moderate";
    }

    return {
      ...item,
      density,
      status,
    };
  });

  /* AVERAGE DENSITY */

  const averageDensity =
    traffic.length > 0
      ? Math.round(
          traffic.reduce(
            (sum, item) =>
              sum + item.density,
            0
          ) / traffic.length
        )
      : 0;

  /* CONGESTION */

  const congestion =
    data.trafficLevel || "UNKNOWN";

  /* SIGNAL PRIORITY */

  const priorityDirection =
    data.priorityDirection || "NONE";

  /* AMBULANCE */

  const ambulanceDetected =
    Boolean(data.ambulanceDetected);

  const ambulanceDirection =
    data.ambulanceDirection || "NONE";

  /* EMERGENCY GREEN */

  const recommendation =
    String(data.recommendation || "");

  let emergencyGreen = 0;

  const emergencyMatch =
    recommendation.match(
      /(\d+)\s*seconds?/i
    );

  if (emergencyMatch) {
    emergencyGreen =
      Number(emergencyMatch[1]);
  }

  /* CURRENT GREEN */

  let currentGreenTime = 0;

  if (
    ambulanceDetected &&
    emergencyGreen > 0
  ) {
    currentGreenTime =
      emergencyGreen;
  } else if (
    priorityDirection === "LEFT"
  ) {
    currentGreenTime =
      data.leftGreen ?? 0;
  } else if (
    priorityDirection === "RIGHT"
  ) {
    currentGreenTime =
      data.rightGreen ?? 0;
  } else if (
    priorityDirection === "STRAIGHT"
  ) {
    currentGreenTime =
      data.straightGreen ?? 0;
  }

  return (
    <div className="page">

      {/* HEADER */}

      <div className="page-header">

        <div>

          <h2>
            🚗 Live Traffic
          </h2>

          <p>
            Real-time vehicle detection and traffic density
          </p>

        </div>

        <div className="status">
          🟢 Live
        </div>

      </div>

      {/* SUMMARY */}

      <div className="traffic-summary">

        <div className="summary-card">

          <span>
            🚗
          </span>

          <p>
            Peak Simultaneous Vehicles
          </p>

          <h2>
            {liveVehicles}
          </h2>

        </div>

        <div className="summary-card">

          <span>
            📊
          </span>

          <p>
            Total Vehicles
          </p>

          <h2>
            {uniqueVehicles}
          </h2>

        </div>

        <div className="summary-card">

          <span>
            📈
          </span>

          <p>
            Average Density
          </p>

          <h2>
            {averageDensity}%
          </h2>

        </div>

        <div className="summary-card">

          <span>
            ⚠️
          </span>

          <p>
            Traffic Level
          </p>

          <h2>
            {congestion}
          </h2>

        </div>

      </div>

      {/* TRAFFIC TABLE */}

      <div className="traffic-table-card">

        <h3>
          Traffic by Direction
        </h3>

        <table>

          <thead>

            <tr>

              <th>
                Direction
              </th>

              <th>
                Vehicles
              </th>

              <th>
                Density
              </th>

              <th>
                Traffic Level
              </th>

            </tr>

          </thead>

          <tbody>

            {traffic.map((item) => (

              <tr
                key={item.direction}
              >

                <td>
                  <strong>
                    {item.direction}
                  </strong>
                </td>

                <td>
                  🚗 {item.vehicles}
                </td>

                <td>

                  <div className="density-container">

                    <div className="density-bar">

                      <div
                        className="density-fill"
                        style={{
                          width: `${item.density}%`,
                        }}
                      ></div>

                    </div>

                    <span>
                      {item.density}%
                    </span>

                  </div>

                </td>

                <td>

                  <span
                    className={`traffic-status ${item.status.toLowerCase()}`}
                  >
                    {item.status}
                  </span>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* SIGNAL OPTIMIZATION */}

      <div className="detection-card">

        <h3>
          🚦 Current Signal Optimization
        </h3>

        <div className="detection-content">

          <div className="camera-placeholder">

            🚦

            <p>
              Signal Status
            </p>

            <small>
              AI signal recommendation
            </small>

          </div>

          <div className="detection-info">

            <h4>
              Signal Information
            </h4>

            <p>
              Priority Direction:{" "}
              <strong>
                {priorityDirection}
              </strong>
            </p>

            <p>
              Green Time:{" "}
              <strong>
                {currentGreenTime} sec
              </strong>
            </p>

            <p>
              Yellow Time:{" "}
              <strong>
                {data.yellowTime ?? 0} sec
              </strong>
            </p>

            <p>
              All Red Time:{" "}
              <strong>
                {data.allRedTime ?? 0} sec
              </strong>
            </p>

          </div>

        </div>

      </div>

      {/* YOLO DETECTION */}

      <div className="detection-card">

        <h3>
          🤖 YOLO Vehicle Detection
        </h3>

        <div className="detection-content">

          <div className="camera-placeholder">

            📷

            <p>
              Camera Feed
            </p>

            <small>
              AI detection data is being received
            </small>

          </div>

          <div className="detection-info">

            <h4>
              Detection Results
            </h4>

            <p>
              🚗 Total Vehicles:{" "}
              <strong>
                {data.totalVehicles ?? 0}
              </strong>
            </p>

            <p>
              🚦 Peak Simultaneous Vehicles:{" "}
              <strong>
                {data.peakVehicles ?? 0}
              </strong>
            </p>

            <p>
              ↰ LEFT Vehicles:{" "}
              <strong>
                {data.left ?? 0}
              </strong>
            </p>

            <p>
              → RIGHT Vehicles:{" "}
              <strong>
                {data.right ?? 0}
              </strong>
            </p>

            <p>
              ↑ STRAIGHT Vehicles:{" "}
              <strong>
                {data.straight ?? 0}
              </strong>
            </p>

          </div>

        </div>

      </div>

      {/* EMERGENCY */}

      <div className="panel">

        <h3>
          🚑 Emergency Vehicle Status
        </h3>

        {ambulanceDetected ? (

          <div className="emergency-active">

            🚑 Ambulance detected

            <br />

            Direction:{" "}
            <strong>
              {ambulanceDirection}
            </strong>

            <br />

            Priority:{" "}
            <strong>
              EMERGENCY
            </strong>

            <br />

            Emergency Green Time:{" "}
            <strong>
              {emergencyGreen} sec
            </strong>

          </div>

        ) : (

          <p>
            No ambulance detected.
            Emergency system is on standby.
          </p>

        )}

      </div>

    </div>
  );
}

export default LiveTraffic;