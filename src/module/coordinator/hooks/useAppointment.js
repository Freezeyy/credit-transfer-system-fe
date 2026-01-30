const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("cts_token");
}

// Get coordinator appointments
export async function getCoordinatorAppointments() {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await fetch(`${API_BASE}/appointment/coordinator`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (!res.ok) return { success: false, data: [] };

    const result = await res.json();
    // Transform backend response to match frontend expectations
    const transformedData = (result.appointments || []).map((app) => ({
      id: app.appointment_id,
      student_id: app.student_id,
      student: app.student
        ? {
            student_name: app.student.student_name,
            student_email: app.student.student_email,
          }
        : null,
      requestedStart: app.appointment_start,
      requestedEnd: app.appointment_end,
      status: app.appointment_status,
      notes: app.appointment_notes,
    }));
    return { success: true, data: transformedData };
  } catch (error) {
    console.error("Get coordinator appointments error:", error);
    return { success: false, data: [] };
  }
}
