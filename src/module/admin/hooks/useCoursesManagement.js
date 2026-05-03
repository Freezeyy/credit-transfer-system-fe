const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("cts_token");
}

export async function listCourses({ campusId = "", programId = "" } = {}) {
  const token = getToken();
  if (!token) return { success: false, data: [], message: "Not authenticated" };

  const sp = new URLSearchParams();
  if (campusId) sp.set("campus_id", String(campusId));
  if (programId) sp.set("program_id", String(programId));

  try {
    const res = await fetch(`${API_BASE}/admin/courses?${sp.toString()}`, {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, data: [], message: data.error || "Failed to load courses" };
    return { success: true, data: data.courses || [] };
  } catch (e) {
    return { success: false, data: [], message: e.message || "Network error" };
  }
}

export async function createCourse(payload) {
  const token = getToken();
  if (!token) return { success: false, message: "Not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/admin/courses`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, message: data.error || "Failed to create course" };
    return { success: true, data: data.course };
  } catch (e) {
    return { success: false, message: e.message || "Network error" };
  }
}

export async function updateCourse(courseId, payload) {
  const token = getToken();
  if (!token) return { success: false, message: "Not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, message: data.error || "Failed to update course" };
    return { success: true, data: data.course };
  } catch (e) {
    return { success: false, message: e.message || "Network error" };
  }
}

export async function deleteCourse(courseId) {
  const token = getToken();
  if (!token) return { success: false, message: "Not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/admin/courses/${courseId}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, message: data.error || "Failed to delete course", details: data.details };
    return { success: true, data };
  } catch (e) {
    return { success: false, message: e.message || "Network error" };
  }
}

export async function setProgramCourses(programId, courseIds) {
  const token = getToken();
  if (!token) return { success: false, message: "Not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/admin/programs/${programId}/courses`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ course_ids: courseIds }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, message: data.error || "Failed to update program courses" };
    return { success: true, data };
  } catch (e) {
    return { success: false, message: e.message || "Network error" };
  }
}

