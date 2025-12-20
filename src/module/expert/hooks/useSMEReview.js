const API_BASE = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("cts_token");
}

// ===============================
// GET SME Assignments
// ===============================
export async function getSMEAssignments() {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await fetch(`${API_BASE}/credit-transfer/sme/assignments`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) return { success: false, data: [] };
    const result = await res.json();
    return { success: true, data: result.assignments || [] };
  } catch (error) {
    console.error("Get SME assignments error:", error);
    return { success: false, data: [] };
  }
}

// ===============================
// GET Subject Details (by application_subject_id - current subject)
// ===============================
export async function getSubjectDetails(applicationSubjectId) {
  const token = getToken();
  if (!token) return { success: false, data: null };

  try {
    const res = await fetch(`${API_BASE}/credit-transfer/sme/subject/${applicationSubjectId}`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, message: error.error || "Failed to get subject details" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Get subject details error:", error);
    return { success: false, message: error.message };
  }
}

// ===============================
// REVIEW Subject (Submit Review for all past subjects together)
// ===============================
export async function reviewSubject(applicationSubjectId, reviewData) {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/credit-transfer/sme/review-subject/${applicationSubjectId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(reviewData),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, message: error.error || "Failed to submit review" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Review subject error:", error);
    return { success: false, message: error.message };
  }
}

