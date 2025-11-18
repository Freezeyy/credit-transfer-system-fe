const API_BASE = "http://localhost:3000/api";

function getToken() {
    const token = localStorage.getItem("cts_token");
    return token; 
}

export async function createAppointment(payload) {
  const token = getToken(); 
  if (!token) return { success: false, message: "User not authenticated" };
    
  const res = await fetch(`${API_BASE}/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json();
    return { success: false, message: errorData.error || "Server error" };
  }
  
  return { success: true, data: await res.json() }; 
}


export async function getAppointmentHistory() {
  const token = getToken();
  if (!token) return { success: false, data: [] };
    
  const res = await fetch(`${API_BASE}/appointments/mine`, {
    headers: {
      Authorization: "Bearer " + token,
    },
  });

  if (!res.ok) {
    return { success: false, data: [] }; 
  }

  const result = await res.json();
  return { success: true, data: result.data || [] };
}


export async function getCoordinators() {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  const res = await fetch(`${API_BASE}/users?roleId=2`, {
    headers: {
      Authorization: "Bearer " + token,
    },
  });

  if (!res.ok) {
    return { success: false, data: [] };
  }

  const result = await res.json();
  return { success: true, data: result.data || [] };
}
