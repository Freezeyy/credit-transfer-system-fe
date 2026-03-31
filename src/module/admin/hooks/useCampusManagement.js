const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("cts_token");
}

async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, message: data?.error || "Request failed", data };
  return { success: true, data };
}

export async function listCampuses() {
  const res = await api("/super-admin/campuses");
  if (!res.success) return { success: false, data: [], message: res.message };
  return { success: true, data: res.data.campuses || [] };
}

export async function createCampus(payload) {
  const res = await api("/super-admin/campuses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.success) return { success: false, message: res.message };
  return { success: true, data: res.data.campus || res.data };
}

export async function updateCampus(campus_id, payload) {
  const res = await api(`/super-admin/campuses/${campus_id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.success) return { success: false, message: res.message };
  return { success: true, data: res.data.campus || res.data };
}

export async function deleteCampus(campus_id) {
  const res = await api(`/super-admin/campuses/${campus_id}`, { method: "DELETE" });
  if (!res.success) return { success: false, message: res.message, data: res.data };
  return { success: true };
}

