/** Functional roles that have their own dashboard home. */
export const FUNCTIONAL_ROLE_HOME = {
  Student: "/student",
  "Program Coordinator": "/coordinator",
  "Subject Method Expert": "/expert",
  "Head Of Section": "/hos",
};

export function hasFunctionalDashboard(role) {
  return (
    role === "Program Coordinator" ||
    role === "Subject Method Expert" ||
    role === "Head Of Section"
  );
}

export function isPureAdminSession(session) {
  if (!session) return false;
  const adminAccess = !!session.is_admin || !!session.is_superadmin;
  if (!adminAccess) return false;
  return !hasFunctionalDashboard(session.role);
}

/** First admin tool page — no standalone admin dashboard for admin-only staff. */
export function defaultAdminLandingPath() {
  return "/admin/staff";
}

/** Post-login destination: functional dashboard, or admin tools when admin-only. */
export function defaultHomePath(session) {
  if (!session) return null;
  if (session.role === "Student") return FUNCTIONAL_ROLE_HOME.Student;
  if (hasFunctionalDashboard(session.role)) {
    return FUNCTIONAL_ROLE_HOME[session.role];
  }
  if (isPureAdminSession(session)) return defaultAdminLandingPath();
  return null;
}
