import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

function Emergency() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEmergencyData = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/emergency`
      );

      if (!response.ok) {
        throw new Error(
          `Backend error: ${response.status}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message ||
            "Failed to load emergency data"
        );
      }

      setData(result.data);
    } catch (err) {
      console.error(
        "Emergency API Error:",
        err
      );

      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadEmergencyData = async () => {
      await fetchEmergencyData();
    };

    loadEmergencyData();

    const interval = setInterval(() => {
      fetchEmergencyData();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="page">

        <h2>
          🚑 Emergency Response
        </h2>

        <div className="panel">
          <p>
            Loading emergency information...
          </p>
        </div>

      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page">

        <h2>
          🚑 Emergency Response
        </h2>

        <div className="panel">

          <p>
            Unable to load emergency information.
          </p>

          <p>
            <strong>Error:</strong> {error}
          </p>

          <button
            className="refresh-button"
            onClick={fetchEmergencyData}
          >
            ↻ Try Again
          </button>

        </div>

      </div>
    );
  }

  const ambulanceDetected =
    Boolean(data?.detected);

  const ambulanceDirection =
    String(
      data?.direction || "NONE"
    ).toUpperCase();

  const priority =
    String(
      data?.priority || "NORMAL"
    ).toUpperCase();

  const emergencyActive =
    ambulanceDetected &&
    priority === "EMERGENCY";

  return (
    <div className="page">

      <div className="page-header">

        <div>

          <h2>
            🚑 Emergency Response
          </h2>

          <p>
            Emergency vehicle monitoring and AI signal priority
          </p>

        </div>

        <div className="emergency-status">

          {emergencyActive
            ? "🟢 EMERGENCY DETECTED"
            : "⚪ NO EMERGENCY DETECTED"}

        </div>

      </div>

      <section className="emergency-grid">

        <div className="emergency-card">

          <span className="emergency-icon">
            🚑
          </span>

          <div>

            <p>
              Ambulance Detection
            </p>

            <h2>
              {ambulanceDetected
                ? "YES"
                : "NO"}
            </h2>

          </div>

        </div>

        <div className="emergency-card">

          <span className="emergency-icon">
            🧭
          </span>

          <div>

            <p>
              Ambulance Direction
            </p>

            <h2>
              {ambulanceDirection}
            </h2>

          </div>

        </div>

        <div className="emergency-card">

          <span className="emergency-icon">
            🚦
          </span>

          <div>

            <p>
              Priority
            </p>

            <h2>
              {priority}
            </h2>

          </div>

        </div>

        <div className="emergency-card">

          <span className="emergency-icon">
            ⚡
          </span>

          <div>

            <p>
              Emergency Status
            </p>

            <h2>
              {emergencyActive
                ? "ACTIVE"
                : "NORMAL"}
            </h2>

          </div>

        </div>

      </section>

      <section className="panel">

        <h3>
          🚑 AI Emergency Detection
        </h3>

        <div className="emergency-info">

          <div>

            <p>
              Ambulance Detected
            </p>

            <strong>
              {ambulanceDetected
                ? "🟢 YES"
                : "⚪ NO"}
            </strong>

          </div>

          <div>

            <p>
              Ambulance Direction
            </p>

            <strong>
              {ambulanceDirection}
            </strong>

          </div>

          <div>

            <p>
              Emergency Priority
            </p>

            <strong>
              {priority}
            </strong>

          </div>

          <div>

            <p>
              Status
            </p>

            <strong>
              {emergencyActive
                ? "🚨 EMERGENCY ACTIVE"
                : "NORMAL"}
            </strong>

          </div>

        </div>

      </section>

      <section className="panel">

        <h3>
          🤖 AI Emergency Recommendation
        </h3>

        {emergencyActive ? (

          <div className="emergency-active">

            🚑 Ambulance detected.

            <br />

            Ambulance direction:

            {" "}

            <strong>
              {ambulanceDirection}
            </strong>

            <br />

            Emergency priority:

            {" "}

            <strong>
              ACTIVE
            </strong>

            <br />

            Signal system should prioritize:

            {" "}

            <strong>
              {ambulanceDirection}
            </strong>

          </div>

        ) : (

          <div className="emergency-active">

            ⚪ No ambulance detected.

            <br />

            Normal traffic signal optimization is active.

          </div>

        )}

      </section>

      <section className="panel">

        <h3>
          🚦 Emergency Signal Status
        </h3>

        <div className="signal-cards">

          <div className="signal-card">

            <h3>
              LEFT
            </h3>

            <span>
              {emergencyActive &&
              ambulanceDirection === "LEFT"
                ? "🟢 EMERGENCY GREEN"
                : "🔴 NORMAL"}
            </span>

            <p>
              {emergencyActive &&
              ambulanceDirection === "LEFT"
                ? "Emergency priority"
                : "Normal signal operation"}
            </p>

          </div>

          <div className="signal-card">

            <h3>
              RIGHT
            </h3>

            <span>
              {emergencyActive &&
              ambulanceDirection === "RIGHT"
                ? "🟢 EMERGENCY GREEN"
                : "🔴 NORMAL"}
            </span>

            <p>
              {emergencyActive &&
              ambulanceDirection === "RIGHT"
                ? "Emergency priority"
                : "Normal signal operation"}
            </p>

          </div>

          <div className="signal-card">

            <h3>
              STRAIGHT
            </h3>

            <span>
              {emergencyActive &&
              ambulanceDirection === "STRAIGHT"
                ? "🟢 EMERGENCY GREEN"
                : "🔴 NORMAL"}
            </span>

            <p>
              {emergencyActive &&
              ambulanceDirection === "STRAIGHT"
                ? "Emergency priority"
                : "Normal signal operation"}
            </p>

          </div>

        </div>

      </section>

      <section className="panel">

        <p>
          🔄 Emergency data automatically refreshes every 30 seconds.
        </p>

        <button
          className="refresh-button"
          onClick={fetchEmergencyData}
        >
          ↻ Refresh Now
        </button>

      </section>

    </div>
  );
}

export default Emergency;