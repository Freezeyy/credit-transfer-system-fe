const API_BASE = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("cts_token");
}

export async function getProgramStructure() {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  const res = await fetch(`${API_BASE}/program-structures`, {
    headers: { Authorization: "Bearer " + token },
  });

  if (!res.ok) return { success: false, data: [] };
  const result = await res.json();
  return { success: true, data: result.data || [] };
}

export async function uploadProgramStructure(formData) {
  const token = getToken();
  if (!token) return { success: false, message: "Not authenticated" };

  const res = await fetch(`${API_BASE}/program-structures`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    return { success: false, message: err.error || "Upload failed" };
  }

  return { success: true, data: await res.json() };
}

export async function updateCourses(structureId, payload) {
  const token = getToken();
  if (!token) return { success: false, message: "Not authenticated" };

  const formData = new FormData();
  formData.append("courses", JSON.stringify(payload.courses));

  const res = await fetch(`${API_BASE}/program-structures/${structureId}/courses`, {
    method: "PUT",
    headers: { Authorization: "Bearer " + token },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    return { success: false, message: err.error || "Update failed" };
  }

  return { success: true, data: await res.json() };
}
