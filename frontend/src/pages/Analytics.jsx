import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Backend returned an error"
        );
      }

      setData(result.data);
    } catch (err) {
      console.error("Analytics API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      await fetchAnalytics();
    };

    loadAnalytics();

    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="page">
        <h2>📊 Traffic Analytics</h2>

        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <h2>📊 Traffic Analytics</h2>

        <div className="panel">
          <p>Unable to load analytics data.</p>

          <button
            className="refresh-button"
            onClick={fetchAnalytics}
          >
            ↻ Try Again
          </button>
        </div>
      </div>
    );
  }

  const traffic = [
    {
      direction: "LEFT",
      vehicles: data.left ?? 0,
      density: Math.min((data.left ?? 0) * 10, 100),
    },
    {
      direction: "RIGHT",
      vehicles: data.right ?? 0,
      density: Math.min((data.right ?? 0) * 10, 100),
    },
    {
      direction: "STRAIGHT",
      vehicles: data.straight ?? 0,
      density: Math.min((data.straight ?? 0) * 10, 100),
    },
  ];

  const totalVehicles = data.totalVehicles ?? 0;

  const averageDensity =
    traffic.length > 0
      ? Math.round(
          traffic.reduce(
            (sum, item) => sum + item.density,
            0
          ) / traffic.length
        )
      : 0;

  const priority =
    data.priorityDirection || "NONE";

  let recommendedGreenTime = 0;

  if (priority === "LEFT") {
    recommendedGreenTime = data.leftGreen ?? 0;
  } else if (priority === "RIGHT") {
    recommendedGreenTime = data.rightGreen ?? 0;
  } else if (priority === "STRAIGHT") {
    recommendedGreenTime = data.straightGreen ?? 0;
  }

  const ambulanceDetected =
    Boolean(data.ambulanceDetected);

  const ambulanceDirection =
    data.ambulanceDirection || "NONE";

  const recommendation =
    String(data.recommendation || "");

  let emergencyGreen = 0;

  const match =
    recommendation.match(
      /(\d+)\s*seconds?/i
    );

  if (match) {
    emergencyGreen = Number(match[1]);
  }

  if (
    ambulanceDetected &&
    emergencyGreen > 0
  ) {
    recommendedGreenTime = emergencyGreen;
  }

  const displayPriority =
    ambulanceDetected &&
    ambulanceDirection !== "NONE"
      ? ambulanceDirection
      : priority;

  return (
    <div className="page">

      <div className="page-header">
        <div>
          <h2>📊 Traffic Analytics</h2>

          <p>
            Analyze traffic conditions and optimization performance
          </p>
        </div>

        <div className="status">
          🟢 Data Updated
        </div>
      </div>

      <section className="stats">

        <div className="card">
          <span className="icon">🚗</span>

          <div>
            <p>Total Vehicles</p>

            <h3>{totalVehicles}</h3>
          </div>
        </div>

        <div className="card">
          <span className="icon">🔴</span>

          <div>
            <p>Average Congestion</p>

            <h3>{averageDensity}%</h3>
          </div>
        </div>

        <div className="card">
          <span className="icon">⏱️</span>

          <div>
            <p>Before Optimization</p>

            <h3>-- sec</h3>
          </div>
        </div>

        <div className="card">
          <span className="icon">⚡</span>

          <div>
            <p>After Optimization</p>

            <h3>-- sec</h3>
          </div>
        </div>

      </section>

      <div className="panel analytics-panel">

        <h3>
          🚗 Vehicle Count by Direction
        </h3>

        <div className="analytics-bars">

          {traffic.map((item) => (
            <div
              className="analytics-row"
              key={item.direction}
            >

              <div className="analytics-label">

                <strong>
                  {item.direction}
                </strong>

                <span>
                  {item.vehicles} vehicles
                </span>

              </div>

              <div className="analytics-bar">

                <div
                  style={{
                    width: `${Math.min(
                      item.vehicles * 10,
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>
          ))}

        </div>

      </div>

      <div className="panel analytics-panel">

        <h3>
          🔴 Congestion Level
        </h3>

        <div className="analytics-bars">

          {traffic.map((item) => (
            <div
              className="analytics-row"
              key={item.direction}
            >

              <div className="analytics-label">

                <strong>
                  {item.direction}
                </strong>

                <span>
                  {item.density}%
                </span>

              </div>

              <div className="analytics-bar">

                <div
                  style={{
                    width: `${item.density}%`,
                  }}
                />

              </div>

            </div>
          ))}

        </div>

      </div>

      <div className="panel comparison-panel">

        <h3>
          ⏱️ Waiting Time Comparison
        </h3>

        <div className="comparison">

          <div className="comparison-box">

            <span>
              Before Optimization
            </span>

            <strong>
              -- sec
            </strong>

            <p>
              Average waiting time
            </p>

          </div>

          <div className="arrow">
            →
          </div>

          <div className="comparison-box optimized">

            <span>
              After Optimization
            </span>

            <strong>
              -- sec
            </strong>

            <p>
              Average waiting time
            </p>

          </div>

        </div>

        <div className="improvement">

          ⏳ Waiting-time data{" "}

          <strong>
            not available
          </strong>{" "}

          from the current backend

        </div>

      </div>

      <div className="panel">

        <h3>
          🤖 AI Optimization Performance
        </h3>

        <div className="optimization-info">

          <div>
            <p>
              Vehicles analyzed
            </p>

            <h2>
              {totalVehicles}
            </h2>
          </div>

          <div>
            <p>
              Signal priority
            </p>

            <h2>
              {displayPriority}
            </h2>
          </div>

          <div>
            <p>
              Green time
            </p>

            <h2>
              {recommendedGreenTime} sec
            </h2>
          </div>

        </div>

        <div className="ai-status">

          {ambulanceDetected
            ? "🚑 Emergency Optimization Active"
            : "🟢 AI Optimization Active"}

        </div>

      </div>

    </div>
  );
}

export default Analytics;