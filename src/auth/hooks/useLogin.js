// src/pages/auth/hooks/useLogin.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function useLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLoginSuccess = (session) => {
    localStorage.setItem("cts_user", JSON.stringify(session));
    const role = session.role;

    if (role === "Student") navigate("/student");
    if (role === "Program Coordinator") navigate("/coordinator");
    if (role === "Subject Method Expert") navigate("/expert");
    if (role === "Head Of Section") navigate("/hos");
    if (role === "Administrator") navigate("/admin");
  };

  const onSubmitLogin = async (e) => {
    e.preventDefault();
    console.log("Submitting login...");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_ORIGIN || 'http://localhost:3000'}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      console.log("Response received");

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();

      // Save token if needed
      localStorage.setItem("cts_token", data.token);
      localStorage.setItem("cts_refreshToken", data.refreshToken);

      // Determine role from API response (example assumes payload has role)
      const session = { email, role: data.role || "Unknown" };
      handleLoginSuccess(session);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, loading, error, onSubmitLogin };
}
