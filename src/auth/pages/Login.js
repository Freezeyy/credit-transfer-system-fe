import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import useLogin from "../hooks/useLogin";
import { getLoginPortal } from "../config/loginRoles";
import UNIKLlogo from "../../assets/logo.png";

const OPEN_API_BASE = process.env.REACT_APP_API_ORIGIN || "http://localhost:3000";
const ENABLE_DB_RESET = process.env.REACT_APP_ENABLE_DB_RESET === "true";
const HAS_TOKEN_IN_ENV = !!(process.env.REACT_APP_DB_RESET_TOKEN?.trim());

export default function Login() {
  const { roleKey } = useParams();
  const portalFromConfig = getLoginPortal(roleKey);
  const { email, setEmail, password, setPassword, loading, error, onSubmitLogin, portal } =
    useLogin(roleKey);
  const [resetStatus, setResetStatus] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");

  if (!portalFromConfig || !portal) {
    return <Navigate to="/" replace />;
  }

  const handleCleanDatabase = async () => {
    setResetStatus("");
    const token = HAS_TOKEN_IN_ENV
      ? process.env.REACT_APP_DB_RESET_TOKEN.trim()
      : resetToken.trim();
    if (!token) {
      setResetStatus("Please enter the reset token.");
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch(`${OPEN_API_BASE}/maintenance/clean-database`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-reset-token": token,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset database");
      }
      setResetStatus("Database has been reset successfully.");
    } catch (e) {
      setResetStatus(`Failed to reset database: ${e.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="text-center mb-8">
          <img src={UNIKLlogo} alt="Logo" className="items-center ml-12" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2 mt-4">{portal.heading}</h1>
          <p className="text-gray-600 text-sm">{portal.subtitle}</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && onSubmitLogin(e)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="your.email@university.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && onSubmitLogin(e)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-indigo-600 mr-2" />
              <span className="text-gray-600">Remember me</span>
            </label>

            <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Forgot password?
            </Link>
          </div>

          <button
            type="button"
            onClick={onSubmitLogin}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : `Sign in as ${portal.label}`}
          </button>
        </div>

        {portal.showRegister && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Register as Student
            </Link>
          </div>
        )}

        {portal.testHint && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 text-center">
            <strong>Test account for this portal:</strong>
            <br />
            {portal.testHint}
          </div>
        )}

        {ENABLE_DB_RESET && roleKey === "admin" && (
          <div className="mt-6 pt-4 border-t border-dashed border-gray-200">
            <p className="text-xs text-gray-500 mb-2 text-center">
              Development / test only: this will wipe and reseed the database.
            </p>
            {!HAS_TOKEN_IN_ENV && (
              <>
                <label className="block text-xs text-gray-600 mb-1">Reset token</label>
                <input
                  type="password"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Enter token provided by admin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-indigo-500"
                  autoComplete="off"
                />
              </>
            )}
            <button
              type="button"
              onClick={handleCleanDatabase}
              disabled={resetLoading || (!HAS_TOKEN_IN_ENV && !resetToken.trim())}
              className="w-full py-2 px-4 rounded-lg text-sm font-medium border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetLoading ? "Cleaning Database..." : "Clean Database"}
            </button>
            {resetStatus && (
              <p className="mt-2 text-xs text-center text-gray-600">{resetStatus}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
