function getToken() {
  // Keep consistent with other hooks
  return localStorage.getItem("cts_token");
}

// Keep consistent with other hooks (call backend directly if env not set)
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Request failed");
  }
  return data;
}

export async function listMyNotifications({ limit = 30, offset = 0 } = {}) {
  return await api(`/notifications?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`, {
    method: "GET",
  });
}

export async function getMyUnreadCount() {
  return await api(`/notifications/unread-count`, { method: "GET" });
}

export async function markNotificationsRead({ noti_ids } = {}) {
  return await api(`/notifications/mark-read`, {
    method: "POST",
    body: JSON.stringify({ noti_ids }),
  });
}

export async function markAllNotificationsRead() {
  return await api(`/notifications/mark-read`, {
    method: "POST",
    body: JSON.stringify({ all: true }),
  });
}

