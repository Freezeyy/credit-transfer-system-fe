const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("cts_token");
}

async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: "Bearer " + token,
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

export async function getMyProcessWindow() {
  return await api(`/process-window/me`, { method: "GET" });
}

export async function getCampusProcessWindow(campus_id) {
  const q = campus_id ? `?campus_id=${encodeURIComponent(campus_id)}` : "";
  return await api(`/admin/process-window${q}`, { method: "GET" });
}

export async function saveCampusProcessWindow(payload) {
  return await api(`/admin/process-window`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

