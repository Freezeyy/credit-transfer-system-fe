import { Link, Navigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import useLogin from "../hooks/useLogin";
import { getLoginPortal } from "../config/loginRoles";
import UNIKLlogo from "../../assets/logo.png";

export default function Login() {
  const { roleKey } = useParams();
  const portalFromConfig = getLoginPortal(roleKey);
  const { email, setEmail, password, setPassword, loading, error, onSubmitLogin, portal } =
    useLogin(roleKey);

  if (!portalFromConfig || !portal) {
    return <Navigate to="/" replace />;
  }

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
            className="btn btn-primary btn-lg w-full cts-action"
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
      </div>
    </div>
  );
}
