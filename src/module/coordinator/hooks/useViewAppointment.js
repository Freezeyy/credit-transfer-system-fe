const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

function getToken() {
    const token = localStorage.getItem("cts_token");
    return token; 
}

export async function getAppointmentHistory() {
    const token = getToken();
    if (!token) return { success: false, data: [] };
    
    const res = await fetch(`${API_BASE}/appointment/coordinator`, {
        headers: {
            Authorization: "Bearer " + token,
        },
    });
    
    if (!res.ok) {
        return { success: false, data: [] }; 
    }
    
    const result = await res.json();
    // Transform backend response to match frontend expectations
    const transformedData = (result.appointments || []).map(app => ({
        id: app.appointment_id,
        student: app.student ? {
            name: app.student.student_name,
            email: app.student.student_email,
            phone: app.student.student_phone,
        } : null,
        requestedStart: app.appointment_start,
        requestedEnd: app.appointment_end,
        status: app.appointment_status === 'scheduled' ? 'pending' : app.appointment_status,
        notes: app.appointment_notes,
    }));
    return { success: true, data: transformedData };
}


export async function updateAppointmentStatus(appointmentId, payload) {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  // Transform payload to match backend API
  const requestBody = {
    appointment_status: payload.status,
    appointment_notes: payload.notes || null,
  };

  const res = await fetch(`${API_BASE}/appointment/${appointmentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorData = await res.json();
    return { success: false, message: errorData.error || "Server error" };
  }

  const result = await res.json();
  return { success: true, data: result.appointment || result };
}
