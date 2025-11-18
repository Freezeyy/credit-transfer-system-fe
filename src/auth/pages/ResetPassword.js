// src/pages/auth/pages/ResetPassword.js
import { useState } from "react";
import { Lock, ArrowLeft } from "lucide-react";

export default function ResetPassword() {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = () => {
    if (!newPw || !confirmPw) return;
    if (newPw !== confirmPw) return;
    setSuccess(true);
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

          <a href="/" className="text-indigo-600 hover:underline text-sm">
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">

        <a href="/" className="flex items-center text-sm text-gray-500 mb-6 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
        </a>

        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="text-gray-600 text-sm mb-6">Enter your new password below.</p>

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
            />
          </div>
        </div>

        <button
          onClick={handleReset}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg mt-6 hover:bg-indigo-700"
        >
          Reset Password
        </button>

      </div>
    </div>
  );
}
