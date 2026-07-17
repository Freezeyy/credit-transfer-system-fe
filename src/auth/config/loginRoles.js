/** Portal keys used in URLs: /login/:roleKey */

export const LOGIN_PORTALS = {
  student: {
    roleKey: "student",
    label: "Student",
    heading: "Student Sign In",
    subtitle: "Sign in to submit and track your credit transfer applications.",
    expectedRoles: ["Student"],
    showRegister: true,
  },
  coordinator: {
    roleKey: "coordinator",
    label: "Program Coordinator",
    heading: "Coordinator Sign In",
    subtitle: "Sign in to review applications and manage your programme.",
    expectedRoles: ["Program Coordinator"],
    showRegister: false,
  },
  sme: {
    roleKey: "sme",
    label: "Subject Matter Expert",
    heading: "SME Sign In",
    subtitle: "Sign in to review subject equivalencies and syllabus mappings.",
    expectedRoles: ["Subject Method Expert"],
    showRegister: false,
  },
  hos: {
    roleKey: "hos",
    label: "Head of Section",
    heading: "HOS Sign In",
    subtitle: "Sign in to approve credit transfer decisions for your section.",
    expectedRoles: ["Head Of Section"],
    showRegister: false,
  },
  admin: {
    roleKey: "admin",
    label: "Administrator",
    heading: "Administrator Sign In",
    subtitle:
      "Sign in for campus administration. You will land on admin tools (no separate dashboard unless you also hold Coordinator, SME, or HOS).",
    expectedRoles: ["Administrator"],
    allowAdminFlag: true,
    showRegister: false,
  },
  superadmin: {
    roleKey: "superadmin",
    label: "Super Admin",
    heading: "Super Admin Sign In",
    subtitle:
      "Sign in for full system administration. You will land on admin tools (no separate dashboard unless you also hold Coordinator, SME, or HOS).",
    expectedRoles: ["Super Admin"],
    requireSuperAdmin: true,
    showRegister: false,
  },
};

const FUNCTIONAL_ROLE_KEYS = ["coordinator", "sme", "hos"];

export function getLoginPortal(roleKey) {
  if (!roleKey) return null;
  return LOGIN_PORTALS[roleKey.toLowerCase()] || null;
}

export function loginPathForRoleKey(roleKey) {
  return `/login/${roleKey}`;
}

/** All functional roles a session holds (falls back to the single primary role). */
export function sessionRoles(session) {
  if (!session) return [];
  if (Array.isArray(session.roles) && session.roles.length > 0) return session.roles;
  return session.role ? [session.role] : [];
}

/**
 * Returns true if the session from the API is allowed on this portal.
 * A lecturer may hold several functional roles at once (e.g. HOS + SME), so we
 * check the full roles list rather than a single primary role.
 * Admin / super admin may use their elevated portal regardless of functional role.
 */
export function sessionMatchesPortal(session, portal) {
  if (!portal || !session) return false;
  const roles = sessionRoles(session);

  if (portal.requireSuperAdmin) {
    return !!session.is_superadmin || roles.includes("Super Admin");
  }

  if (portal.allowAdminFlag) {
    return !!session.is_admin || !!session.is_superadmin || roles.includes("Administrator");
  }

  if (portal.expectedRoles?.some((r) => roles.includes(r))) {
    return true;
  }

  return false;
}

/**
 * Resolves the active role for a session based on the portal (tile) used to sign in.
 * For functional portals, the active role is the one the user actually holds that
 * matches the portal — so a HOS + SME lecturer who signs in via the SME tile
 * becomes an active SME, not forced into HOS by priority.
 */
export function resolveActiveRole(session, portal) {
  const roles = sessionRoles(session);

  // Admin / Super Admin tiles activate the admin role (not a functional role),
  // so signing in as admin shows only admin views.
  if (portal?.requireSuperAdmin && session.is_superadmin) return "Super Admin";
  if (portal?.allowAdminFlag && (session.is_admin || session.is_superadmin)) {
    return session.is_superadmin ? "Super Admin" : "Administrator";
  }

  if (portal?.expectedRoles) {
    const match = portal.expectedRoles.find(
      (r) => FUNCTIONAL_ROLE_KEYS_BY_LABEL.has(r) && roles.includes(r),
    );
    if (match) return match;
  }
  return session.role;
}

const FUNCTIONAL_ROLE_KEYS_BY_LABEL = new Set([
  "Program Coordinator",
  "Subject Method Expert",
  "Head Of Section",
]);

export function wrongPortalMessage(portal, actualRole) {
  if (portal.allowAdminFlag) {
    return `This sign-in page is for administrators. Your account is “${actualRole}”. Use the matching role tile on the home page, or contact your administrator if you need admin access.`;
  }
  if (portal.requireSuperAdmin) {
    return `This sign-in page is for super administrators. Your account is “${actualRole}”. Use the correct role tile on the home page.`;
  }
  if (FUNCTIONAL_ROLE_KEYS.includes(portal.roleKey)) {
    return `This sign-in page is for ${portal.label} accounts. Your account is “${actualRole}”. Choose the correct role on the home page, or use Admin / Super Admin if you have that access.`;
  }
  return `This account is registered as “${actualRole}”, not ${portal.label}. Please use the correct sign-in page from the home screen.`;
}
