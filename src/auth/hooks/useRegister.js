// src/auth/hooks/useRegister.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const OPEN_API_BASE = process.env.REACT_APP_API_ORIGIN || "http://localhost:3000";

export default function useRegister() {
  const [formData, setFormData] = useState({
    student_identifier: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    program_id: "",
    campus_id: "",
    uni_type_id: "",
    institution_id: "",
    old_campus_id: "",
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
    if (!formData.student_identifier || !formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
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

    if (!formData.uni_type_id || !formData.institution_id || !formData.old_campus_id || !formData.prev_programme_name) {
      setError("Please fill in your previous study details");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${OPEN_API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_identifier: formData.student_identifier.trim(),
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || null,
          program_id: parseInt(formData.program_id),
          campus_id: parseInt(formData.campus_id),
          uni_type_id: parseInt(formData.uni_type_id),
          institution_id: parseInt(formData.institution_id),
          old_campus_id: parseInt(formData.old_campus_id),
          prev_programme_name: formData.prev_programme_name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Registration failed");
      }

      await response.json();
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

export async function getUniTypesForRegistration() {
  try {
    const res = await fetch(`${OPEN_API_BASE}/uni-types`);
    if (!res.ok) return { success: false, data: [] };
    const result = await res.json();
    return { success: true, data: result.uniTypes || [] };
  } catch (error) {
    console.error("Get uni types error:", error);
    return { success: false, data: [] };
  }
}

export async function getInstitutionsForRegistration(uniTypeId) {
  try {
    const url = uniTypeId
      ? `${OPEN_API_BASE}/institutions?uni_type_id=${uniTypeId}`
      : `${OPEN_API_BASE}/institutions`;
    const res = await fetch(url);
    if (!res.ok) return { success: false, data: [] };
    const result = await res.json();
    return { success: true, data: result.institutions || [] };
  } catch (error) {
    console.error("Get institutions error:", error);
    return { success: false, data: [] };
  }
}

export async function getOldCampusesByInstitutionForRegistration(institutionId) {
  try {
    if (!institutionId) return { success: true, data: [] };
    const res = await fetch(`${OPEN_API_BASE}/old-campuses?institution_id=${institutionId}`);
    if (!res.ok) return { success: false, data: [] };
    const result = await res.json();
    return { success: true, data: result.oldCampuses || [] };
  } catch (error) {
    console.error("Get old campuses by institution error:", error);
    return { success: false, data: [] };
  }
}
