// src/components/PrivateRoute.js
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, allowed }) {
  const user = JSON.parse(localStorage.getItem("cts_user"));

  if (!user) return <Navigate to="/login" replace />;

  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
