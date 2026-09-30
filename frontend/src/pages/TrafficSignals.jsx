import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

function TrafficSignals() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSignalData = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch signal data"
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message ||
            "Backend returned an error"
        );
      }

      setData(result.data);
    } catch (err) {
      console.error(
        "Traffic Signals API Error:",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSignalData = async () => {
      await fetchSignalData();
    };

    loadSignalData();

    const interval = setInterval(() => {
      fetchSignalData();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="page">

        <h2>
          🚦 Traffic Signals
        </h2>

        <p>
          Loading signal data...
        </p>

      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">

        <h2>
          🚦 Traffic Signals
        </h2>

        <div className="panel">

          <p>
            Unable to load signal data.
          </p>

          <button
            className="refresh-button"
            onClick={fetchSignalData}
          >
            ↻ Try Again
          </button>

        </div>

      </div>
    );
  }

  const priority =
    data.priorityDirection ||
    "NONE";

  const ambulanceDetected =
    Boolean(data.ambulanceDetected);

  const ambulanceDirection =
    data.ambulanceDirection ||
    "NONE";

  const displayPriority =
    ambulanceDetected &&
    ambulanceDirection !== "NONE"
      ? ambulanceDirection
      : priority;

  const recommendation =
    String(
      data.recommendation || ""
    );

  let emergencyGreen = 0;

  const emergencyMatch =
    recommendation.match(
      /(\d+)\s*seconds?/i
    );

  if (emergencyMatch) {
    emergencyGreen =
      Number(emergencyMatch[1]);
  }

  const signalDirections = [
    {
      direction: "LEFT",

      active:
        displayPriority === "LEFT",

      time:
        ambulanceDetected &&
        displayPriority === "LEFT" &&
        emergencyGreen > 0
          ? emergencyGreen
          : data.leftGreen ?? 0,
    },

    {
      direction: "RIGHT",

      active:
        displayPriority === "RIGHT",

      time:
        ambulanceDetected &&
        displayPriority === "RIGHT" &&
        emergencyGreen > 0
          ? emergencyGreen
          : data.rightGreen ?? 0,
    },

    {
      direction: "STRAIGHT",

      active:
        displayPriority === "STRAIGHT",

      time:
        ambulanceDetected &&
        displayPriority === "STRAIGHT" &&
        emergencyGreen > 0
          ? emergencyGreen
          : data.straightGreen ?? 0,
    },
  ];

  const currentSignal =
    signalDirections.find(
      (signal) => signal.active
    ) || {
      direction: "NONE",
      time: 0,
    };

  return (
    <div className="page">

      <div className="page-header">

        <div>

          <h2>
            🚦 Traffic Signals
          </h2>

          <p>
            Monitor and visualize the current traffic signal status
          </p>

        </div>

        <div className="status">
          🟢 System Active
        </div>

      </div>

      {ambulanceDetected && (

        <div className="panel">

          <h3>
            🚑 Emergency Override Active
          </h3>

          <p>
            Ambulance detected in the{" "}
            <strong>
              {ambulanceDirection}
            </strong>{" "}
            direction.
          </p>

          <p>
            Emergency green time:{" "}
            <strong>
              {emergencyGreen} seconds
            </strong>
          </p>

        </div>

      )}

      <div className="signal-layout">

        <div className="panel signal-junction">

          <h3>
            Live Junction
          </h3>

          <div className="big-junction">

            <div className="big-direction north-signal">

              <strong>
                STRAIGHT
              </strong>

              <span>
                {signalDirections[2].active
                  ? "🟢"
                  : "🔴"}
              </span>

            </div>

            <div className="big-direction west-signal">

              <strong>
                LEFT
              </strong>

              <span>
                {signalDirections[0].active
                  ? "🟢"
                  : "🔴"}
              </span>

            </div>

            <div className="junction-center">
              🚦
            </div>

            <div className="big-direction east-signal">

              <span>
                {signalDirections[1].active
                  ? "🟢"
                  : "🔴"}
              </span>

              <strong>
                RIGHT
              </strong>

            </div>

            <div className="big-direction south-signal">

              <span>
                🔴
              </span>

              <strong>
                JUNCTION
              </strong>

            </div>

          </div>

        </div>

        <div className="panel">

          <h3>
            Current Signal
          </h3>

          <div className="current-signal">

            <div className="signal-light">
              🟢
            </div>

            <h2>
              {currentSignal.direction}
            </h2>

            <p>
              Current Green Signal
            </p>

            <div className="timer">
              {currentSignal.time}
            </div>

            <p>
              seconds
            </p>

          </div>

        </div>

      </div>

      <div className="panel">

        <h3>
          Signal Status
        </h3>

        <div className="signal-cards">

          {signalDirections.map(
            (signal) => (

              <div
                key={signal.direction}
                className={`signal-card ${
                  signal.active
                    ? "active-signal"
                    : ""
                }`}
              >

                <h3>
                  {signal.direction}
                </h3>

                <span>
                  {signal.active
                    ? "🟢 GREEN"
                    : "🔴 RED"}
                </span>

                <p>
                  {signal.active
                    ? `${signal.time} seconds`
                    : "Waiting"}
                </p>

              </div>

            )
          )}

        </div>

      </div>

      <div className="panel ai-signal-panel">

        <h3>
          🤖 AI Signal Optimization
        </h3>

        <div className="optimization-info">

          <div>

            <p>
              Traffic priority
            </p>

            <h2>
              {displayPriority}
            </h2>

          </div>

          <div>

            <p>
              Recommended green time
            </p>

            <h2>
              {currentSignal.time} seconds
            </h2>

          </div>

          <div>

            <p>
              Yellow time
            </p>

            <h2>
              {data.yellowTime ?? 0} seconds
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

export default TrafficSignals;