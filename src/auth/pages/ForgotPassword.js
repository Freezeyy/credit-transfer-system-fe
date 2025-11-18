// src/pages/auth/pages/ForgotPassword.js
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!email) return;
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">

          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-semibold mb-3">Check your email</h2>
          <p className="text-gray-600 text-sm mb-6">
            A password reset link has been sent to <strong>{email}</strong>.
          </p>

          <a href="/" className="text-indigo-600 hover:underline text-sm">
            Back to login
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

        <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
        <p className="text-gray-600 text-sm mb-6">Enter your email and we’ll send you a reset link.</p>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Email Address</label>
          <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500">
            <Mail className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="email"
              className="w-full outline-none"
              placeholder="your.email@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleSend}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg mt-6 hover:bg-indigo-700"
        >
          Send Reset Link
        </button>

      </div>
    </div>
  );
}
