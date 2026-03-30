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
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function listUniTypes() {
  return api("/super-admin/uni-types");
}
export async function createUniType(payload) {
  return api("/super-admin/uni-types", { method: "POST", body: JSON.stringify(payload) });
}
export async function updateUniType(id, payload) {
  return api(`/super-admin/uni-types/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function listInstitutions() {
  return api("/super-admin/institutions");
}
export async function createInstitution(payload) {
  return api("/super-admin/institutions", { method: "POST", body: JSON.stringify(payload) });
}
export async function updateInstitution(id, payload) {
  return api(`/super-admin/institutions/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function listOldCampuses() {
  return api("/super-admin/old-campuses");
}
export async function createOldCampus(payload) {
  return api("/super-admin/old-campuses", { method: "POST", body: JSON.stringify(payload) });
}
export async function updateOldCampus(id, payload) {
  return api(`/super-admin/old-campuses/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

