// src/pages/auth/pages/ResetPassword.js
import { useEffect, useMemo, useState } from "react";
import { Lock, ArrowLeft } from "lucide-react";

export default function ResetPassword() {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");

  const OPEN_API_BASE = process.env.REACT_APP_API_ORIGIN || "http://localhost:3000";
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      setVerifying(true);
      setError("");
      try {
        if (!token) throw new Error("Missing reset token");
        const res = await fetch(`${OPEN_API_BASE}/verify-reset-password-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Invalid or expired token");
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Invalid or expired token");
      } finally {
        if (!cancelled) setVerifying(false);
      }
    }
    verify();
    return () => {
      cancelled = true;
    };
  }, [OPEN_API_BASE, token]);

  const handleReset = async () => {
    if (!newPw || !confirmPw) return;
    if (newPw !== confirmPw) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Missing reset token");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${OPEN_API_BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to reset password");
      }
      setSuccess(true);
    } catch (e) {
      setError(e?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">

          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-semibold mb-3">Password Reset</h2>
          <p className="text-gray-600 text-sm mb-6">
            Your password has been successfully updated.
          </p>

          <a href="/login" className="text-indigo-600 hover:underline text-sm">
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">

        <a href="/login" className="flex items-center text-sm text-gray-500 mb-6 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
        </a>

        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="text-gray-600 text-sm mb-6">Enter your new password below.</p>

        {verifying ? (
          <div className="text-sm text-gray-600">Verifying reset link...</div>
        ) : error && !success ? (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        ) : null}

        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">New Password</label>
          <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
            <Lock className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="password"
              className="w-full outline-none"
              placeholder="New password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              disabled={verifying || !!error}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Confirm Password</label>
          <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
            <Lock className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="password"
              className="w-full outline-none"
              placeholder="Confirm password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              disabled={verifying || !!error}
            />
          </div>
        </div>

        <button
          onClick={handleReset}
          disabled={verifying || !!error || loading}
          className={`w-full text-white py-3 rounded-lg mt-6 ${
            verifying || error || loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

      </div>
    </div>
  );
}
