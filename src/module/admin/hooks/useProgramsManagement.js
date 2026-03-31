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
  if (!res.ok) {
    return { success: false, message: data?.error || "Request failed", data };
  }
  return { success: true, data };
}

export async function listPrograms() {
  const res = await api("/admin/programs");
  if (!res.success) return { success: false, data: [] , message: res.message };
  return { success: true, data: res.data.programs || [] };
}

export async function createProgram(payload) {
  const res = await api("/admin/programs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.success) return { success: false, message: res.message };
  return { success: true, data: res.data.program || res.data };
}

export async function updateProgram(program_id, payload) {
  const res = await api(`/admin/programs/${program_id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.success) return { success: false, message: res.message };
  return { success: true, data: res.data.program || res.data };
}

export async function deleteProgram(program_id) {
  const res = await api(`/admin/programs/${program_id}`, { method: "DELETE" });
  if (!res.success) return { success: false, message: res.message };
  return { success: true };
}

