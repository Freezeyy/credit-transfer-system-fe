const API_BASE = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("cts_token");
}

// ===============================
// GET Coordinator Inbox
// ===============================
export async function getCoordinatorInbox(status = "submitted") {
  const token = getToken();
  if (!token) return { success: false, data: [] };

  // New API endpoint
  const res = await fetch(`${API_BASE}/credit-transfer/coordinator/applications`, {
    headers: { Authorization: "Bearer " + token },
  });

  if (!res.ok) return { success: false, data: [] };

  const result = await res.json();
  
  // Transform the new API response to match component expectations
  const transformedData = (result.applications || [])
    .filter(app => !status || app.ct_status === status)
    .map(app => ({
      id: app.ct_id,
      student_name: app.student?.student_name || "Unknown",
      student_email: app.student?.student_email,
      student_phone: app.student?.student_phone,
      program_code: app.program?.program_code || "N/A",
      program_name: app.program?.program_name,
      status: app.ct_status,
      notes: app.ct_notes,
      prev_campus_name: app.prev_campus_name,
      prev_programme_name: app.prev_programme_name,
      transcript_path: app.transcript_path,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      // Transform subjects to match component structure
      subjects: (app.newApplicationSubjects || []).map(subj => ({
        current_subject: subj.application_subject_name,
        pastSubjects: (subj.pastApplicationSubjects || []).map(past => ({
          code: past.pastSubject_code,
          name: past.pastSubject_name,
          grade: past.pastSubject_grade,
          syllabus_path: past.pastSubject_syllabus_path,
          original_filename: past.original_filename
        }))
      }))
    }));

  return { success: true, data: transformedData };
}

// ===============================
// UPDATE (Approve / Reject / Review / SME)
// ===============================
export async function updateApplicationStatus(id, payload) {
  const token = getToken();
  if (!token) return { success: false, message: "User not authenticated" };

  // Map old status values to new API format if needed
  const statusMap = {
    'pending': 'submitted',
    'under_review': 'under_review',
    'awaiting_sme': 'awaiting_sme',
    'approved': 'approved',
    'rejected': 'rejected'
  };

  const mappedPayload = {
    ...payload,
    status: statusMap[payload.status] || payload.status
  };

  // Update to new API endpoint
  const res = await fetch(`${API_BASE}/credit-transfer/coordinator/applications/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(mappedPayload),
  });

  if (!res.ok) {
    const error = await res.json();
    return { success: false, message: error.error || "Failed to update" };
  }

  return { success: true, data: await res.json() };
}