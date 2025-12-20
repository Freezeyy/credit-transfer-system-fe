const API_BASE = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("cts_token");
}

// ===============================
// GET All Lecturers
// ===============================
export async function getLecturers() {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await fetch(`${API_BASE}/admin/lecturers`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) return { success: false, data: [] };
    const result = await res.json();
    return { success: true, data: result.lecturers || [] };
  } catch (error) {
    console.error("Get lecturers error:", error);
    return { success: false, data: [] };
  }
}

// ===============================
// GET All Programs (filtered by admin's campus_id)
// ===============================
export async function getPrograms() {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await fetch(`${API_BASE}/admin/programs`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) return { success: false, data: [] };
    const result = await res.json();
    return { success: true, data: result.programs || [] };
  } catch (error) {
    console.error("Get programs error:", error);
    return { success: false, data: [] };
  }
}

// ===============================
// GET Courses for a Program
// ===============================
export async function getCoursesForProgram(programId) {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await fetch(`${API_BASE}/program/structure?includeCourses=true&program_id=${programId}`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) return { success: false, data: [] };
    const result = await res.json();
    return { success: true, data: result.courses || [] };
  } catch (error) {
    console.error("Get courses error:", error);
    return { success: false, data: [] };
  }
}

// ===============================
// GET All Campuses (we'll need to create this endpoint or get from static data)
// ===============================
export async function getAllCampuses() {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  try {
    // This endpoint might not exist yet - we may need to create it
    // For now, return empty and handle in component
    const res = await fetch(`${API_BASE}/staticdata`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) return { success: false, data: [] };
    const result = await res.json();
    return { success: true, data: result.campuses || [] };
  } catch (error) {
    console.error("Get campuses error:", error);
    return { success: false, data: [] };
  }
}

// ===============================
// GET Staff Assignments
// ===============================
export async function getStaffAssignments() {
  const token = getToken();
  if (!token) return { success: false, data: null };

  try {
    const res = await fetch(`${API_BASE}/admin/staff-assignments`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) return { success: false, data: null };
    const result = await res.json();
    return { success: true, data: result };
  } catch (error) {
    console.error("Get staff assignments error:", error);
    return { success: false, data: null };
  }
}

// ===============================
// CREATE Lecturer (no role assignment - roles assigned separately)
// ===============================
export async function createLecturer(lecturerData) {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  try {
    // Remove role_type and related fields - roles are assigned separately
    const { role_type, program_id, course_id, start_date, end_date, ...cleanData } = lecturerData;
    
    const res = await fetch(`${API_BASE}/admin/lecturer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(cleanData),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, message: error.error || "Failed to create lecturer" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Create lecturer error:", error);
    return { success: false, message: error.message };
  }
}

// ===============================
// UPDATE Lecturer Role
// ===============================
export async function updateLecturerRole(lecturerId, roleData) {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/admin/lecturer/${lecturerId}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(roleData),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, message: error.error || "Failed to update role" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Update lecturer role error:", error);
    return { success: false, message: error.message };
  }
}

// ===============================
// END Staff Role
// ===============================
export async function endStaffRole(roleType, roleId) {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/admin/end-staff-role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ role_type: roleType, role_id: roleId }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, message: error.error || "Failed to end role" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("End staff role error:", error);
    return { success: false, message: error.message };
  }
}

