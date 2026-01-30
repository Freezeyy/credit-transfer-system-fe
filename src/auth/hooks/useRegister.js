// src/auth/hooks/useRegister.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";
const OPEN_API_BASE = process.env.REACT_APP_API_ORIGIN || "http://localhost:3000";

export default function useRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    program_id: "",
    campus_id: "",
    old_campus_name: "",
    prev_programme_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const onSubmitRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (!formData.program_id || !formData.campus_id) {
      setError("Please select your program and campus");
      setLoading(false);
      return;
    }

    if (!formData.old_campus_name || !formData.prev_programme_name) {
      setError("Please fill in your previous study details");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${OPEN_API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || null,
          program_id: parseInt(formData.program_id),
          campus_id: parseInt(formData.campus_id),
          old_campus_name: formData.old_campus_name,
          prev_programme_name: formData.prev_programme_name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Registration failed");
      }

      const data = await response.json();
      alert("Registration successful! Please login to continue.");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    handleChange,
    loading,
    error,
    onSubmitRegister,
  };
}

// Get programs for registration (filtered by campus_id)
export async function getProgramsForRegistration(campusId = null) {
  try {
    const url = campusId 
      ? `${OPEN_API_BASE}/staticdata?campus_id=${campusId}`
      : `${OPEN_API_BASE}/staticdata`;
    const res = await fetch(url);
    if (!res.ok) return { success: false, data: [] };
    const result = await res.json();
    return { success: true, data: result.programs || [] };
  } catch (error) {
    console.error("Get programs error:", error);
    return { success: false, data: [] };
  }
}

// Get campuses for registration
export async function getCampusesForRegistration() {
  try {
    const res = await fetch(`${OPEN_API_BASE}/staticdata`);
    if (!res.ok) return { success: false, data: [] };
    const result = await res.json();
    return { success: true, data: result.campuses || [] };
  } catch (error) {
    console.error("Get campuses error:", error);
    return { success: false, data: [] };
  }
}

// Get old campuses (previous institutions) for registration
export async function getOldCampusesForRegistration() {
  try {
    const res = await fetch(`${OPEN_API_BASE}/staticdata`);
    if (!res.ok) return { success: false, data: [] };
    const result = await res.json();
    return { success: true, data: result.oldCampuses || [] };
  } catch (error) {
    console.error("Get old campuses error:", error);
    return { success: false, data: [] };
  }
}
