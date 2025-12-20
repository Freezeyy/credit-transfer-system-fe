const API_BASE = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("cts_token");
}

export async function getProgramStructure() {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  const res = await fetch(`${API_BASE}/program/structure?includeCourses=true`, {
    headers: { Authorization: "Bearer " + token },
  });

  if (!res.ok) return { success: false, data: [] };
  const result = await res.json();
  return { success: true, data: result || [] };
}

export async function uploadProgramStructure(formData) {
  const token = getToken();
  if (!token) return { success: false, message: "Not authenticated" };

  const res = await fetch(`${API_BASE}/program/structure`, {
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

export async function updateCourses(payload) {
  const token = getToken();
  if (!token) return { success: false, message: "Not authenticated" };

  // Send courses array directly (no structureId needed - uses coordinator's program)
  const res = await fetch(`${API_BASE}/program/courses`, {
    method: "PUT",
    headers: { 
      Authorization: "Bearer " + token,
      "Content-Type": "application/json" // Send as JSON, not FormData
    },
    body: JSON.stringify({ courses: payload.courses }), // Send as JSON
  });

  if (!res.ok) {
    const err = await res.json();
    return { success: false, message: err.error || "Update failed" };
  }

  return { success: true, data: await res.json() };
}
