import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Users,
  UserCircle,
  FileCheck,
  Shield,
  ShieldCheck,
  BookOpen,
  ClipboardCheck,
  Building2,
} from "lucide-react";
import UNIKLlogo from "../../assets/logo.png";
import { loginPathForRoleKey } from "../config/loginRoles";

function RoleTile({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-[7.5rem] flex-1 flex-shrink-0 flex-col items-center justify-center gap-2 border-r border-white/20 px-3 py-6 text-white transition-colors last:border-r-0 hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/50 sm:min-w-0 sm:gap-3 sm:px-4 sm:py-7"
    >
      <Icon
        className="h-12 w-12 stroke-[1.25] text-white transition-transform group-hover:scale-105 sm:h-14 sm:w-14"
        aria-hidden
      />
      <span className="text-sm font-semibold tracking-wide sm:text-base">{label}</span>
    </button>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const goLogin = (roleKey) => navigate(loginPathForRoleKey(roleKey));

  const features = [
    {
      icon: <FileCheck className="w-8 h-8 text-indigo-600" />,
      title: "Credit Transfer Applications",
      description: "Submit and track your credit transfer applications seamlessly",
    },
    {
      icon: <Users className="w-8 h-8 text-indigo-600" />,
      title: "Expert Review System",
      description: "Subject Matter Experts review and approve credit transfers",
    },
    {
      icon: <Shield className="w-8 h-8 text-indigo-600" />,
      title: "Template3 Matching",
      description: "Automated matching system for faster approvals",
    },
    {
      icon: <BookOpen className="w-8 h-8 text-indigo-600" />,
      title: "Program Management",
      description: "Comprehensive program and course management tools",
    },
  ];

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src={UNIKLlogo} alt="UNIKL Logo" className="h-10" />
              <span className="text-xl font-bold text-gray-800">Credit Transfer System</span>
            </div>
            {/* <div className="flex items-center space-x-4">
              <button
                onClick={() => goLogin("student")}
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/register")}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <span>Register</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div> */}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-0">
        <div className="text-center pb-10">
          <div className="inline-block p-4 bg-indigo-100 rounded-full mb-6">
            <GraduationCap className="w-16 h-16 text-indigo-600" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Credit Transfer
            <span className="text-indigo-600"> System</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your academic credit transfer process with our comprehensive platform.
            Submit applications, track progress, and get expert reviews all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* <button
              onClick={() => goLogin("student")}
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center space-x-2 text-lg shadow-lg hover:shadow-xl"
            >
              <span>Sign In</span>
              <ArrowRight className="w-5 h-5" />
            </button> */}
            <button
              onClick={() => navigate("/register")}
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center space-x-2 text-lg border-2 border-indigo-600"
            >
              <span>Register Now</span>
            </button>
          </div>
        </div>

        {/* Role-specific sign-in pages (same API; validates role after login) */}
        <div className="mx-auto max-w-6xl overflow-hidden rounded-t-xl bg-indigo-700 shadow-lg">
          <div className="flex overflow-x-auto sm:overflow-visible">
            <RoleTile icon={GraduationCap} label="Student" onClick={() => goLogin("student")} />
            <RoleTile icon={UserCircle} label="Coordinator" onClick={() => goLogin("coordinator")} />
            <RoleTile icon={ClipboardCheck} label="SME" onClick={() => goLogin("sme")} />
            <RoleTile icon={Building2} label="HOS" onClick={() => goLogin("hos")} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage credit transfers efficiently
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      {/* <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose Our System?
              </h2>
              <p className="text-gray-600 mb-6">
                Our Credit Transfer System is designed to make the process of transferring
                academic credits as smooth and efficient as possible for students, coordinators,
                and experts alike.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Started Today</h3>
                <p className="text-gray-600 mb-6">
                  Join students and staff who are already using our system to manage
                  credit transfers efficiently.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => goLogin("student")}
                    className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate("/register")}
                    className="flex-1 bg-white text-indigo-600 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors border-2 border-indigo-600"
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={UNIKLlogo} alt="UNIKL Logo" className="h-8" />
                <span className="text-xl font-bold">Credit Transfer System</span>
              </div>
              <p className="text-gray-400">
                Streamlining academic credit transfers for universities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button onClick={() => goLogin("student")} className="hover:text-white transition-colors">
                    Sign In
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/register")}
                    className="hover:text-white transition-colors"
                  >
                    Register
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/forgot-password")}
                    className="hover:text-white transition-colors"
                  >
                    Forgot Password
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <p className="text-gray-400">
                For assistance, please contact your program coordinator or system administrator.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm text-center sm:text-left">
              &copy; {new Date().getFullYear()} Credit Transfer System. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <button
                type="button"
                onClick={() => goLogin("admin")}
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Shield className="h-4 w-4" aria-hidden />
                Admin
              </button>
              <button
                type="button"
                onClick={() => goLogin("superadmin")}
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Super Admin
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
