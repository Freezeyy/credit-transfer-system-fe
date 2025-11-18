import useLogout from "./hooks/useLogout";
import {
  HomeIcon,
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  LogoutIcon,
} from "@heroicons/react/outline";
import { Link } from "react-router-dom";

export default function Layout({ children }) {
    const { handleLogout } = useLogout();
    const user = JSON.parse(localStorage.getItem("cts_user"));

    const studentNavItems = [
        { name: "Dashboard", path: "/student", icon: <HomeIcon className="h-6 w-6" /> },
        {
          name: "Credit Transfer Application",
          path: "/student/application",
          icon: <DocumentTextIcon className="h-6 w-6" />,
        },
        {
          name: "Credit Transfer History",
          path: "/student/history",
          icon: <ClockIcon className="h-6 w-6" />,
        },
        {
          name: "Book Appointment",
          path: "/student/appointment",
          icon: <CalendarIcon className="h-6 w-6" />,
        },
        {
          name: "Study Planner",
          path: "/student/study-planner",
          icon: <DocumentTextIcon className="h-6 w-6" />,
        },
        { name: "Profile", path: "/student/profile", icon: <UserIcon className="h-6 w-6" /> },
        { name: "Logout", path: "/logout", icon: <LogoutIcon className="h-6 w-6" /> },
      ];


  return (
    <div className="min-h-screen flex bg-gray-100">
      
      {/* Sidebar */}
      <div className="w-64 bg-indigo-700 text-white p-6">
        <h1 className="text-xl font-bold mb-8">CTS Dashboard</h1>

        <p className="text-indigo-200 text-sm mb-6">
          Logged in as:
          <br />
          <span className="font-semibold">{user.role}</span>
        </p>
          {user.role === "Student" && (
            studentNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center py-3 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition"
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))
          )}
        <button
          onClick={handleLogout}
          className="mt-4 bg-red-500 px-4 py-2 rounded-lg w-full hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
