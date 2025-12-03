const API_BASE = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("cts_token");
}

// ===============================
// GET Coordinator Inbox
// ===============================
export async function getCoordinatorInbox(status = "pending") {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  const res = await fetch(`${API_BASE}/credit-applications/inbox?status=${status}`, {
    headers: { Authorization: "Bearer " + token },
  });

  if (!res.ok) return { success: false, data: [] };

  const result = await res.json();
  return { success: true, data: result.data || [] };
}

// ===============================
// UPDATE (Approve / Reject / Review / SME)
// ===============================
export async function updateApplicationStatus(id, payload) {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  const res = await fetch(`${API_BASE}/credit-applications/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    return { success: false, message: error.error || "Failed to update" };
  }

  return { success: true, data: await res.json() };
}
