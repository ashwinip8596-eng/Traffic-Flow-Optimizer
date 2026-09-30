import { useEffect, useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
} from "react-router-dom";

import "./App.css";

import { API_BASE_URL } from "./api";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

import LiveTraffic from "./pages/LiveTraffic";
import TrafficSignals from "./pages/TrafficSignals";
import Analytics from "./pages/Analytics";
import Emergency from "./pages/Emergency";


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     FETCH DASHBOARD
  ======================================================= */

  const fetchDashboardData = async () => {

    try {

      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/dashboard`
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned HTTP ${response.status}`
        );
      }

      const result = await response.json();

      console.log("Dashboard API:", result);

      if (!result.success) {
        throw new Error(
          result.message || "Backend returned an error"
        );
      }

      /*
        Backend returns:

        {
          success: true,
          data: {
            totalVehicles,
            trafficLevel,
            left,
            right,
            straight,
            priorityDirection,
            ambulanceDetected,
            ambulanceDirection,
            ...
          }
        }

        Therefore we store result.data directly.
      */

      setDashboardData(result.data);

    } catch (err) {

      console.error(
        "Dashboard API Error:",
        err
      );

      setError(err.message);

    } finally {

      setLoading(false);

    }
  };


  /* =======================================================
     LOAD + AUTO REFRESH
  ======================================================= */

  useEffect(() => {

    const loadDashboardData = async () => {
      await fetchDashboardData();
    };

    loadDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => {
      clearInterval(interval);
    };

  }, []);


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading && !dashboardData) {

    return (
      <div className="page">

        <div className="panel">

          <h2>
            Loading Dashboard...
          </h2>

          <p>
            Connecting to the Traffic Flow Optimizer backend...
          </p>

        </div>

      </div>
    );

  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (!dashboardData) {

    return (
      <div className="page">

        <div className="panel">

          <h2>
            ⚠️ Backend Connection Error
          </h2>

          <p>
            Unable to load dashboard data.
          </p>

          <p>
            Backend:
            {" "}
            http://localhost:5000
          </p>

          {error && (
            <p>
              Error:
              {" "}
              {error}
            </p>
          )}

          <button
            className="refresh-button"
            onClick={fetchDashboardData}
          >
            ↻ Try Again
          </button>

        </div>

      </div>
    );

  }


  /* =======================================================
     BACKEND DATA
  ======================================================= */

  const totalVehicles =
    dashboardData.totalVehicles ?? 0;

  const peakVehicles =
    dashboardData.peakVehicles ?? 0;

  const trafficLevel =
    dashboardData.trafficLevel || "UNKNOWN";

  const leftVehicles =
    dashboardData.left ?? 0;

  const rightVehicles =
    dashboardData.right ?? 0;

  const straightVehicles =
    dashboardData.straight ?? 0;

  const normalPriorityDirection =
    dashboardData.priorityDirection ||
    "NONE";

  const ambulanceDetected =
    Boolean(
      dashboardData.ambulanceDetected
    );

  const ambulanceDirection =
    dashboardData.ambulanceDirection ||
    "NONE";


  /* =======================================================
     PRIORITY DIRECTION
  ======================================================= */

  const priorityDirection =
    ambulanceDetected &&
    ambulanceDirection !== "NONE"
      ? ambulanceDirection
      : normalPriorityDirection;


  /* =======================================================
     SIGNAL TIMES
  ======================================================= */

  const leftGreen =
    dashboardData.leftGreen ?? 0;

  const rightGreen =
    dashboardData.rightGreen ?? 0;

  const straightGreen =
    dashboardData.straightGreen ?? 0;

  const yellowTime =
    dashboardData.yellowTime ?? 0;

  const allRedTime =
    dashboardData.allRedTime ?? 0;


  /* =======================================================
     RECOMMENDATION
  ======================================================= */

  const recommendation =
    dashboardData.recommendation ||
    "No recommendation available.";


  /* =======================================================
     EMERGENCY GREEN TIME
  ======================================================= */

  let emergencyGreenTime = 0;

  const emergencyMatch =
    recommendation.match(
      /(\d+)\s*seconds?/i
    );

  if (emergencyMatch) {

    emergencyGreenTime =
      Number(
        emergencyMatch[1]
      );

  }


  /* =======================================================
     CURRENT GREEN TIME
  ======================================================= */

  let currentGreenTime = 0;

  if (
    ambulanceDetected &&
    emergencyGreenTime > 0
  ) {

    currentGreenTime =
      emergencyGreenTime;

  } else if (
    priorityDirection === "LEFT"
  ) {

    currentGreenTime =
      leftGreen;

  } else if (
    priorityDirection === "RIGHT"
  ) {

    currentGreenTime =
      rightGreen;

  } else if (
    priorityDirection === "STRAIGHT"
  ) {

    currentGreenTime =
      straightGreen;

  }


  /* =======================================================
     TRAFFIC DATA
  ======================================================= */

  const trafficData = [

    {
      direction: "LEFT",
      vehicles: leftVehicles,
    },

    {
      direction: "RIGHT",
      vehicles: rightVehicles,
    },

    {
      direction: "STRAIGHT",
      vehicles: straightVehicles,
    },

  ];


  /* =======================================================
     SIGNAL STATES
  ======================================================= */

  const leftIsGreen =
    priorityDirection === "LEFT";

  const rightIsGreen =
    priorityDirection === "RIGHT";

  const straightIsGreen =
    priorityDirection === "STRAIGHT";


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = () => {

    setLoading(true);

    fetchDashboardData();

  };


  /* =======================================================
     DASHBOARD UI
  ======================================================= */

  return (

    <div className="page">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="page-header">

        <div>

          <p className="eyebrow">
            SMART CITY • AI TRAFFIC SYSTEM
          </p>

          <h2>
            Traffic Dashboard
          </h2>

          <p>
            Real-time traffic monitoring and intelligent
            signal optimization
          </p>

        </div>


        <div className="header-actions">

          <span className="status">

            <span className="status-dot"></span>

            System Online

          </span>


          <button
            className="refresh-button"
            onClick={handleRefresh}
          >
            ↻ Refresh
          </button>

        </div>

      </header>


      {/* =================================================
          STAT CARDS
      ================================================= */}

      <section className="stats">


        {/* VEHICLES */}

        <div className="stat-card">

          <div className="stat-icon blue">
            🚗
          </div>

          <div>

            <p>
              Vehicles Detected
            </p>

            <h3>
              {totalVehicles}
            </h3>

            <span className="stat-note">
              Total unique vehicles
            </span>

          </div>

        </div>


        {/* CONGESTION */}

        <div className="stat-card">

          <div className="stat-icon red">
            🚦
          </div>

          <div>

            <p>
              Traffic Level
            </p>

            <h3 className="warning-text">
              {trafficLevel}
            </h3>

            <span className="stat-note">
              Current traffic condition
            </span>

          </div>

        </div>


        {/* PEAK */}

        <div className="stat-card">

          <div className="stat-icon orange">
            📊
          </div>

          <div>

            <p>
              Peak Vehicles
            </p>

            <h3>
              {peakVehicles}
            </h3>

            <span className="stat-note">
              Maximum simultaneous vehicles
            </span>

          </div>

        </div>


        {/* SIGNALS */}

        <div className="stat-card">

          <div className="stat-icon green">
            🟢
          </div>

          <div>

            <p>
              Active Signals
            </p>

            <h3>
              3
            </h3>

            <span className="stat-note">
              Signal directions
            </span>

          </div>

        </div>

      </section>


      {/* =================================================
          MAIN GRID
      ================================================= */}

      <section className="dashboard-grid">


        {/* =================================================
            LIVE JUNCTION
        ================================================= */}

        <div className="panel junction-panel">

          <div className="panel-heading">

            <div>

              <h3>
                🚦 Live Traffic Junction
              </h3>

              <p>
                Current traffic signal condition
              </p>

            </div>

            <span className="live-badge">
              LIVE
            </span>

          </div>


          <div className="junction">

            <div className="road road-vertical"></div>

            <div className="road road-horizontal"></div>

            <div className="lane-mark lane-top"></div>

            <div className="lane-mark lane-bottom"></div>

            <div className="lane-mark lane-left"></div>

            <div className="lane-mark lane-right"></div>


            {/* STRAIGHT */}

            <div className="direction north">

              <strong>
                STRAIGHT
              </strong>

              <span
                className={
                  straightIsGreen
                    ? "signal green-light"
                    : "signal red-light"
                }
              >
                ●
              </span>

            </div>


            {/* LEFT */}

            <div className="direction west">

              <strong>
                LEFT
              </strong>

              <span
                className={
                  leftIsGreen
                    ? "signal green-light"
                    : "signal red-light"
                }
              >
                ●
              </span>

            </div>


            {/* RIGHT */}

            <div className="direction east">

              <span
                className={
                  rightIsGreen
                    ? "signal green-light"
                    : "signal red-light"
                }
              >
                ●
              </span>

              <strong>
                RIGHT
              </strong>

            </div>


            {/* JUNCTION */}

            <div className="direction south">

              <span className="signal red-light">
                ●
              </span>

              <strong>
                JUNCTION
              </strong>

            </div>


            <div className="traffic-center">
              🚦
            </div>

          </div>


          {/* SIGNAL INFO */}

          <div className="signal-info">

            <div className="signal-info-box">

              <p>
                Priority Direction
              </p>

              <h2>

                <span className="green-text">
                  ●
                </span>

                {" "}

                {priorityDirection}

              </h2>

            </div>


            <div className="signal-info-box">

              <p>
                Green Time
              </p>

              <h2>
                {currentGreenTime} seconds
              </h2>

            </div>

          </div>

        </div>


        {/* =================================================
            AI OPTIMIZATION
        ================================================= */}

        <div className="panel">

          <div className="panel-heading">

            <div>

              <h3>
                🤖 AI Optimization
              </h3>

              <p>
                Signal timing recommendation
              </p>

            </div>

          </div>


          <div className="ai-box">

            <span className="ai-label">
              CURRENT RECOMMENDATION
            </span>


            <h2>

              {ambulanceDetected
                ? "🚑 AMBULANCE EMERGENCY"
                : `${priorityDirection} direction has priority`}

            </h2>


            <p className="ai-description">

              {recommendation}

            </p>


            <div className="recommendation">

              <span>
                Recommended Green Time
              </span>

              <strong>
                {currentGreenTime} sec
              </strong>

            </div>


            <div className="recommendation">

              <span>
                Yellow Time
              </span>

              <strong>
                {yellowTime} sec
              </strong>

            </div>


            <div className="recommendation">

              <span>
                All Red Time
              </span>

              <strong>
                {allRedTime} sec
              </strong>

            </div>


            {ambulanceDetected && (

              <div className="recommendation">

                <span>
                  Ambulance Direction
                </span>

                <strong>
                  {ambulanceDirection}
                </strong>

              </div>

            )}


            <div className="ai-status">

              <span>
                ●
              </span>

              {" "}

              {ambulanceDetected
                ? "Emergency Optimization Active"
                : "Optimization Active"}

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          TRAFFIC BY DIRECTION
      ================================================= */}

      <section className="panel traffic-panel">

        <div className="panel-heading">

          <div>

            <h3>
              🚗 Traffic by Direction
            </h3>

            <p>
              Vehicle count and traffic information
            </p>

          </div>

        </div>


        <div className="traffic-directions">

          {trafficData.map((item) => (

            <div
              className="direction-card"
              key={item.direction}
            >

              <div className="direction-card-top">

                <strong>
                  {item.direction}
                </strong>

                <span>
                  {item.vehicles} vehicles
                </span>

              </div>


              <div className="bar">

                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.min(
                      item.vehicles * 10,
                      100
                    )}%`,
                  }}
                />

              </div>


              <small>
                {item.vehicles} vehicles
              </small>

            </div>

          ))}

        </div>

      </section>


      {/* =================================================
          INFORMATION BOXES
      ================================================= */}

      <section className="dashboard-info">


        {/* AI */}

        <div className="info-box">

          <span>
            🤖
          </span>

          <div>

            <strong>
              AI Optimization
            </strong>

            <p>

              Priority direction:
              {" "}
              {priorityDirection}.

              {" "}

              Green time:
              {" "}
              {currentGreenTime}
              {" "}
              seconds.

            </p>

          </div>

        </div>


        {/* SIGNAL */}

        <div className="info-box">

          <span>
            🚦
          </span>

          <div>

            <strong>
              Signal Status
            </strong>

            <p>

              Left:
              {" "}
              {leftGreen}s

              {" | "}

              Right:
              {" "}
              {rightGreen}s

              {" | "}

              Straight:
              {" "}
              {straightGreen}s

            </p>


            {ambulanceDetected && (

              <p>

                Emergency override:
                {" "}

                <strong>
                  {ambulanceDirection}
                </strong>

                {" "}
                for
                {" "}

                <strong>
                  {currentGreenTime}s
                </strong>

              </p>

            )}

          </div>

        </div>


        {/* EMERGENCY */}

        <div className="info-box">

          <span>
            🚑
          </span>

          <div>

            <strong>
              Emergency System
            </strong>

            <p>

              {ambulanceDetected

                ? `Ambulance detected. Direction: ${ambulanceDirection}. Emergency priority is active.`

                : "No ambulance detected. Emergency system is on standby."

              }

            </p>

          </div>

        </div>

      </section>


    </div>

  );

}


/* =========================================================
   APP LAYOUT
========================================================= */

function AppLayout() {

  const handleLogout = () => {

    alert(
      "Logout functionality will be connected with Firebase later."
    );

  };


  const navItems = [

    {
      path: "/",
      label: "Dashboard",
      icon: "🏠",
      end: true,
    },

    {
      path: "/live-traffic",
      label: "Live Traffic",
      icon: "🚗",
    },

    {
      path: "/traffic-signals",
      label: "Traffic Signals",
      icon: "🚦",
    },

    {
      path: "/analytics",
      label: "Analytics",
      icon: "📊",
    },

    {
      path: "/emergency",
      label: "Emergency",
      icon: "🚑",
    },

  ];


  return (

    <div className="app">


      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-logo">

          <div className="logo-symbol">
            🚦
          </div>

          <div>

            <h1>
              Traffic Flow
            </h1>

            <p>
              Optimizer
            </p>

          </div>

        </div>


        <div className="sidebar-section-title">
          MAIN MENU
        </div>


        <nav className="sidebar-nav">

          {navItems.map((item) => (

            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                isActive
                  ? "nav-link active"
                  : "nav-link"
              }
            >

              <span>
                {item.icon}
              </span>

              {item.label}

            </NavLink>

          ))}

        </nav>


        <div className="sidebar-bottom">

          <div className="sidebar-help">

            <span>
              💡
            </span>

            <div>

              <strong>
                AI Powered
              </strong>

              <p>
                Smart traffic management
              </p>

            </div>

          </div>


          <button
            className="logout"
            onClick={handleLogout}
          >
            ↪ Logout
          </button>

        </div>

      </aside>


      {/* MAIN */}

      <main className="main-content">

        <Routes>

          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/live-traffic"
            element={<LiveTraffic />}
          />

          <Route
            path="/traffic-signals"
            element={<TrafficSignals />}
          />

          <Route
            path="/analytics"
            element={<Analytics />}
          />

          <Route
            path="/emergency"
            element={<Emergency />}
          />

          <Route
            path="*"
            element={

              <div className="not-found">

                <h2>
                  404
                </h2>

                <p>
                  Page not found
                </p>

                <Link to="/">
                  ← Back to Dashboard
                </Link>

              </div>

            }
          />

        </Routes>

      </main>

    </div>

  );

}


/* =========================================================
   ROOT APP
========================================================= */

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/*"
          element={<AppLayout />}
        />

      </Routes>

    </BrowserRouter>

  );

}


export default App;