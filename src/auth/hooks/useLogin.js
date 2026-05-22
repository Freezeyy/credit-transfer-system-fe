import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getLoginPortal,
  sessionMatchesPortal,
  wrongPortalMessage,
  loginPathForRoleKey,
} from "../config/loginRoles";

export default function useLogin(roleKey) {
  const portal = getLoginPortal(roleKey);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLoginSuccess = (session) => {
    if (portal && !sessionMatchesPortal(session, portal)) {
      setError(wrongPortalMessage(portal, session.role));
      localStorage.removeItem("cts_token");
      localStorage.removeItem("cts_refreshToken");
      localStorage.removeItem("cts_user");
      return;
    }

    localStorage.setItem("cts_user", JSON.stringify(session));
    const role = session.role;

    if (role === "Student") navigate("/student");
    else if (role === "Program Coordinator") navigate("/coordinator");
    else if (role === "Subject Method Expert") navigate("/expert");
    else if (role === "Head Of Section") navigate("/hos");
    else if (role === "Super Admin" || session.is_superadmin) navigate("/admin");
    else if (role === "Administrator" || session.is_admin) navigate("/admin");
    else setError("Your account does not have an active dashboard. Contact your administrator.");
  };

  const onSubmitLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_ORIGIN || "http://localhost:3000"}/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();

      localStorage.setItem("cts_token", data.token);
      localStorage.setItem("cts_refreshToken", data.refreshToken);

      const session = {
        email,
        role: data.role || "Unknown",
        name: data.name || email.split("@")[0],
        userType: data.userType,
        is_admin: !!data.is_admin,
        is_superadmin: !!data.is_superadmin,
        campus_id: data.campus_id ?? null,
        campus_name: data.campus_name ?? null,
      };
      handleLoginSuccess(session);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    portal,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    onSubmitLogin,
    loginPathForRoleKey,
  };
}
