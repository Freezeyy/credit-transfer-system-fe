import { AlertCircle } from "lucide-react";
import useLogin from "../hooks/useLogin";
import UNIKLlogo from "../../../assets/logo.png";

export default function Login() {
  const { email, setEmail, password, setPassword, loading, error, onSubmitLogin } = useLogin();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">

        <div className="text-center mb-8">
          {/* <div className="inline-block p-3 bg-indigo-600 rounded-full mb-4"> */}
            <img src={UNIKLlogo} alt="Logo" className="items-center ml-12" />
          {/* </div> */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Credit Transfer System</h1>
          <p className="text-gray-600">Sign in to your account</p>
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

            <a href="/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Forgot password?
            </a>
          </div>

          <button
            onClick={onSubmitLogin}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          Supported Roles: <span className="font-medium">Student, Program Coordinator, Subject Method Expert, Administrator</span>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 text-center">
          <strong>Test Credentials:</strong><br />
          Student: student@university.edu / student123<br />
          Coordinator: coordinator@university.edu / coordinator123<br />
          Expert: expert@university.edu / expert123<br />
          Admin: admin@university.edu / admin123
        </div>
      </div>
    </div>
  );
}
