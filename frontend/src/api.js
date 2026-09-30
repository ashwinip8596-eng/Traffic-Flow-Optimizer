const API_BASE_URL = "http://localhost:5000";

export { API_BASE_URL };

export async function getDashboard() {
  const response = await fetch(`${API_BASE_URL}/api/dashboard`);

  if (!response.ok) {
    throw new Error("Failed to load dashboard data");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Dashboard API error");
  }

  return result.data;
}

export async function getTraffic() {
  const response = await fetch(`${API_BASE_URL}/api/traffic`);

  if (!response.ok) {
    throw new Error("Failed to load traffic data");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Traffic API error");
  }

  return result.data;
}

export async function getDirection() {
  const response = await fetch(`${API_BASE_URL}/api/direction`);

  if (!response.ok) {
    throw new Error("Failed to load direction data");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Direction API error");
  }

  return result.data;
}

export async function getSignal() {
  const response = await fetch(`${API_BASE_URL}/api/signal`);

  if (!response.ok) {
    throw new Error("Failed to load signal data");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Signal API error");
  }

  return result.data;
}

export async function getEmergency() {
  const response = await fetch(`${API_BASE_URL}/api/emergency`);

  if (!response.ok) {
    throw new Error("Failed to load emergency data");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Emergency API error");
  }

  return result.data;
}