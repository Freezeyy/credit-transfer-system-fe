const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("cts_token");
}

async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, message: data?.error || "Request failed", data };
  return { success: true, data };
}

export async function getHosReviewStats() {
  const res = await api("/hos/reviews/stats");
  if (!res.success) {
    return {
      success: false,
      data: null,
      message: res.message || res.data?.error || "Failed to load stats",
    };
  }
  return {
    success: true,
    data: {
      stats: res.data.stats || null,
      pipeline: res.data.pipeline || null,
    },
  };
}

export async function listHosReviews(status = "pending") {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  const res = await api(`/hos/reviews?${params.toString()}`);
  if (!res.success) return { success: false, data: [], message: res.message };
  return { success: true, data: res.data.reviews || [] };
}

export async function getHosReviewDetail(hosReviewId) {
  const res = await api(`/hos/reviews/${hosReviewId}`);
  if (!res.success) return { success: false, data: null, message: res.message };
  return { success: true, data: res.data.review || res.data };
}

export async function decideHosReview(hosReviewId, decision, hos_notes = "") {
  const res = await api(`/hos/reviews/${hosReviewId}/decide`, {
    method: "POST",
    body: JSON.stringify({ decision, hos_notes }),
  });
  if (!res.success) return { success: false, message: res.message, data: res.data };
  return { success: true, data: res.data.review || res.data };
}

