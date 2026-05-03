// src/components/PrivateRoute.js
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, allowed }) {
  const user = JSON.parse(localStorage.getItem("cts_user"));

  if (!user) return <Navigate to="/login" replace />;

  if (allowed) {
    const isAdminAccess = !!user.is_admin || !!user.is_superadmin;
    const wantsAdmin = allowed.includes("Administrator") || allowed.includes("Super Admin");
    const ok =
      allowed.includes(user.role) ||
      // allow admin access even if the primary functional role isn't "Administrator"
      (wantsAdmin && isAdminAccess) ||
      // super admin implies admin
      (allowed.includes("Administrator") && !!user.is_superadmin);

    if (!ok) return <Navigate to="/login" replace />;
  }

  return children;
}
