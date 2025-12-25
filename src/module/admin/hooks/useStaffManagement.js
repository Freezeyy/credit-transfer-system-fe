const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("cts_token");
}

// ===============================
// GET All Lecturers (with pagination and search)
// ===============================
export async function getLecturers(page = 1, search = '') {
  const token = getToken();
  if (!token) return { success: false, data: [], pagination: null };

  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', '10');
    if (search.trim()) {
      params.append('search', search.trim());
    }

    const res = await fetch(`${API_BASE}/admin/lecturers?${params.toString()}`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) return { success: false, data: [], pagination: null };
    const result = await res.json();
    return { 
      success: true, 
      data: result.lecturers || [],
      pagination: result.pagination || null
    };
  } catch (error) {
    console.error("Get lecturers error:", error);
    return { success: false, data: [], pagination: null };
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
// GET All Courses (for admin's campus - for SME assignment)
// ===============================
export async function getAllCourses() {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await fetch(`${API_BASE}/admin/courses`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) return { success: false, data: [] };
    const result = await res.json();
    return { success: true, data: result.courses || [] };
  } catch (error) {
    console.error("Get all courses error:", error);
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
      return { success: false, message: error.error || "Failed to create account" };
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

