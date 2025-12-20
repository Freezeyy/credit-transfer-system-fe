const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("cts_token");
}

// ===============================
// GET Coordinator Applications
// ===============================
export async function getCoordinatorApplications() {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await fetch(`${API_BASE}/credit-transfer/coordinator/applications`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) return { success: false, data: [] };
    const result = await res.json();
    return { success: true, data: result.applications || [] };
  } catch (error) {
    console.error("Get applications error:", error);
    return { success: false, data: [] };
  }
}

// ===============================
// REVIEW SUBJECT - Check Template3
// ===============================
export async function checkTemplate3(pastSubjectId) {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/credit-transfer/coordinator/review-subject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        pastSubjectId,
        action: "check_template3"
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, message: error.error || "Failed to check template" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Check template3 error:", error);
    return { success: false, message: error.message };
  }
}

// ===============================
// REVIEW SUBJECT - Approve via Template3
// ===============================
export async function approveViaTemplate3(pastSubjectId) {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/credit-transfer/coordinator/review-subject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        pastSubjectId,
        action: "approve_template3"
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, message: error.error || "Failed to approve" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Approve template3 error:", error);
    return { success: false, message: error.message };
  }
}

// ===============================
// REVIEW SUBJECT - Send to SME
// ===============================
export async function sendToSME(pastSubjectId, coordinatorNotes = "") {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/credit-transfer/coordinator/review-subject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        pastSubjectId,
        action: "send_to_sme",
        coordinator_notes: coordinatorNotes
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, message: error.error || "Failed to send to SME" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Send to SME error:", error);
    return { success: false, message: error.message };
  }
}

// ===============================
// TEMPLATE3 MANAGEMENT
// ===============================

// Upload Template3 PDF
export async function uploadTemplate3PDF(file) {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  try {
    const formData = new FormData();
    formData.append("template3_pdf", file);

    const res = await fetch(`${API_BASE}/template3/upload-pdf`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, message: error.error || "Failed to upload PDF" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Upload PDF error:", error);
    return { success: false, message: error.message };
  }
}

// Create Single Template3 Entry
export async function createTemplate3Entry(templateData) {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/template3`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(templateData),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, message: error.error || "Failed to create entry" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Create template3 error:", error);
    return { success: false, message: error.message };
  }
}

// Bulk Create Template3 Entries
export async function bulkCreateTemplate3(bulkData) {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/template3/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(bulkData),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, message: error.error || "Failed to bulk create" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Bulk create template3 error:", error);
    return { success: false, message: error.message };
  }
}

// ===============================
// CHECK TEMPLATE3 FOR ALL PAST SUBJECTS OF A CURRENT SUBJECT
// ===============================
export async function checkTemplate3ForCurrentSubject(applicationSubjectId) {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/credit-transfer/coordinator/check-current-subject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        applicationSubjectId,
        action: "check_template3"
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, message: error.error || "Failed to check template" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Check template3 for current subject error:", error);
    return { success: false, message: error.message };
  }
}

// ===============================
// APPROVE ALL PAST SUBJECTS VIA TEMPLATE3
// ===============================
export async function approveAllViaTemplate3(applicationSubjectId) {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/credit-transfer/coordinator/check-current-subject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        applicationSubjectId,
        action: "approve_all"
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, message: error.error || "Failed to approve" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Approve all template3 error:", error);
    return { success: false, message: error.message };
  }
}

// ===============================
// SEND ALL PAST SUBJECTS TO SME
// ===============================
export async function sendAllToSME(applicationSubjectId, coordinatorNotes = "") {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  try {
    const res = await fetch(`${API_BASE}/credit-transfer/coordinator/check-current-subject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        applicationSubjectId,
        action: "send_all_to_sme",
        coordinator_notes: coordinatorNotes
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      return { success: false, message: error.error || "Failed to send to SME" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("Send all to SME error:", error);
    return { success: false, message: error.message };
  }
}

// Get Template3 Mappings
export async function getTemplate3Mappings(filters = {}) {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  try {
    const params = new URLSearchParams();
    // Support both old and new parameter names for backward compatibility
    // Only add non-empty values to avoid sending empty strings
    if (filters.old_campus_id && filters.old_campus_id.trim()) {
      params.append("old_campus_id", filters.old_campus_id);
    }
    if (filters.old_campus_name && filters.old_campus_name.trim()) {
      params.append("old_campus_name", filters.old_campus_name);
    }
    if (filters.old_programme_name && filters.old_programme_name.trim()) {
      params.append("old_programme_name", filters.old_programme_name);
    }
    if (filters.program_id && filters.program_id.toString().trim()) {
      params.append("program_id", filters.program_id);
    }
    if (filters.program_name && filters.program_name.trim()) {
      params.append("program_name", filters.program_name);
    }
    if (filters.program_code && filters.program_code.trim()) {
      params.append("program_code", filters.program_code);
    }

    const url = `${API_BASE}/template3${params.toString() ? `?${params.toString()}` : ""}`;
    
    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) return { success: false, data: [] };
    const result = await res.json();
    return { success: true, data: result.template3s || [] };
  } catch (error) {
    console.error("Get template3 error:", error);
    return { success: false, data: [] };
  }
}