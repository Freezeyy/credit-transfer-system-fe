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

/** List course analysis summaries uploaded for your UniKL programme (self-service catalogue). */
export async function browseCourseAnalysisSummaries({ search = "", matchMyCampus = false } = {}) {
  try {
    const token = getToken();
    const q = new URLSearchParams();
    if (search && String(search).trim()) q.set("search", String(search).trim());
    if (matchMyCampus) q.set("match_my_campus", "1");

    const res = await fetch(`${API_BASE}/mapping-banks/student/browse?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const parsed = await jsonOrError(res);
    if (!parsed.ok) {
      return {
        success: false,
        message: parsed.data?.error || "Failed to load course analysis summaries",
      };
    }
    return { success: true, data: parsed.data.mappingBanks || [] };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

export async function getMyMappingBanks() {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/mapping-banks/student/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const parsed = await jsonOrError(res);
    if (!parsed.ok) return { success: false, message: parsed.data?.error || "Failed to load course analysis summaries" };
    return { success: true, data: parsed.data.mappingBanks || [] };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

