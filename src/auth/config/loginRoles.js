/** Portal keys used in URLs: /login/:roleKey */

export const LOGIN_PORTALS = {
  student: {
    roleKey: "student",
    label: "Student",
    heading: "Student Sign In",
    subtitle: "Sign in to submit and track your credit transfer applications.",
    expectedRoles: ["Student"],
    showRegister: true,
    testHint: "student@university.edu / student123",
  },
  coordinator: {
    roleKey: "coordinator",
    label: "Program Coordinator",
    heading: "Coordinator Sign In",
    subtitle: "Sign in to review applications and manage your programme.",
    expectedRoles: ["Program Coordinator"],
    showRegister: false,
    testHint: "coordinator@university.edu / coordinator123",
  },
  sme: {
    roleKey: "sme",
    label: "Subject Matter Expert",
    heading: "SME Sign In",
    subtitle: "Sign in to review subject equivalencies and syllabus mappings.",
    expectedRoles: ["Subject Method Expert"],
    showRegister: false,
    testHint: "expert@university.edu / expert123",
  },
  hos: {
    roleKey: "hos",
    label: "Head of Section",
    heading: "HOS Sign In",
    subtitle: "Sign in to approve credit transfer decisions for your section.",
    expectedRoles: ["Head Of Section"],
    showRegister: false,
    testHint: "hos@university.edu / hos123",
  },
  admin: {
    roleKey: "admin",
    label: "Administrator",
    heading: "Administrator Sign In",
    subtitle:
      "Sign in for campus administration. Staff with admin access who are also Coordinator, SME, or HOS may use this page or their role page.",
    expectedRoles: ["Administrator"],
    allowAdminFlag: true,
    showRegister: false,
    testHint: "admin@university.edu / admin123",
  },
  superadmin: {
    roleKey: "superadmin",
    label: "Super Admin",
    heading: "Super Admin Sign In",
    subtitle:
      "Sign in for full system administration. Super admins who also hold Coordinator, SME, or HOS roles may use this page or their role page.",
    expectedRoles: ["Super Admin"],
    requireSuperAdmin: true,
    showRegister: false,
    testHint: "superadmin@university.edu / superadmin123",
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

/**
 * Returns true if the session from the API is allowed on this portal.
 * Admin / super admin may use their elevated portal regardless of functional role
 * (e.g. Coordinator + is_admin → admin page and coordinator page).
 */
export function sessionMatchesPortal(session, portal) {
  if (!portal || !session) return false;
  const role = session.role;

  if (portal.requireSuperAdmin) {
    return !!session.is_superadmin || role === "Super Admin";
  }

  if (portal.allowAdminFlag) {
    return !!session.is_admin || role === "Administrator";
  }

  if (portal.expectedRoles?.includes(role)) {
    return true;
  }

  return false;
}

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
