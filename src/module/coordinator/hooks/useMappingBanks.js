const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("cts_token");
}

async function jsonOrError(res) {
  const text = await res.text();
  try {
    return { ok: res.ok, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, data: { error: text } };
  }
}

export async function listMyMappingBanks(search = "") {
  try {
    const token = getToken();
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    const res = await fetch(`${API_BASE}/mapping-banks/my?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const parsed = await jsonOrError(res);
    if (!parsed.ok) return { success: false, message: parsed.data?.error || "Failed to load course analysis summaries" };
    return { success: true, data: parsed.data.mappingBanks || [] };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

export async function listMyPrevProgramOptions() {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/mapping-banks/my-prev-program-options`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const parsed = await jsonOrError(res);
    if (!parsed.ok) return { success: false, message: parsed.data?.error || "Failed to load options" };
    return { success: true, data: parsed.data.options || [] };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

export async function uploadMappingBank({ mb_name, old_campus_id, intake_year, prev_program, namingConvention, file }) {
  try {
    const token = getToken();
    const fd = new FormData();
    fd.append("mb_name", mb_name);
    fd.append("old_campus_id", String(old_campus_id));
    if (intake_year) fd.append("intake_year", intake_year);
    if (prev_program) fd.append("prev_program", prev_program);
    if (namingConvention) fd.append("namingConvention", namingConvention);
    fd.append("mapping_bank_pdf", file);

    const res = await fetch(`${API_BASE}/mapping-banks/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    const parsed = await jsonOrError(res);
    if (!parsed.ok) return { success: false, message: parsed.data?.error || "Upload failed" };
    return { success: true, data: parsed.data.mappingBank };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

export async function listStudents({ page = 1, limit = 10, search = "", old_campus_id = "" }) {
  try {
    const token = getToken();
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("limit", String(limit));
    if (search) q.set("search", search);
    if (old_campus_id) q.set("old_campus_id", String(old_campus_id));

    const res = await fetch(`${API_BASE}/mapping-banks/students?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const parsed = await jsonOrError(res);
    if (!parsed.ok) return { success: false, message: parsed.data?.error || "Failed to load students" };
    return { success: true, data: parsed.data.students || [], pagination: parsed.data.pagination };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

export async function assignMappingBank({ mb_id, student_ids = [], select_all_old_campus_id = "" }) {
  try {
    const token = getToken();
    const body = { mb_id };
    if (select_all_old_campus_id) body.select_all_old_campus_id = parseInt(select_all_old_campus_id, 10);
    else body.student_ids = student_ids;

    const res = await fetch(`${API_BASE}/mapping-banks/assign`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const parsed = await jsonOrError(res);
    if (!parsed.ok) return { success: false, message: parsed.data?.error || "Assign failed", data: parsed.data };
    return { success: true, data: parsed.data };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

export async function deleteMyMappingBank(mb_id) {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/mapping-banks/my/${mb_id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const parsed = await jsonOrError(res);
    if (!parsed.ok) return { success: false, message: parsed.data?.error || "Delete failed" };
    return { success: true, data: parsed.data };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

