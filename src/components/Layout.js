import { Link, useLocation } from "react-router-dom";
import { HomeIcon, DocumentTextIcon, ClockIcon, CalendarIcon, UserIcon } from "@heroicons/react/outline";
import useLogout from "./hooks/useLogout";


export default function Layout({ children }) {
  const { handleLogout } = useLogout();
  const user = JSON.parse(localStorage.getItem("cts_user"));
  const location = useLocation();

  const studentNavItems = [
    { name: "Dashboard", path: "/student", icon: <HomeIcon className="h-6 w-6" /> },
    { name: "Credit Transfer Application", path: "/student/application", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "Credit Transfer History", path: "/student/history", icon: <ClockIcon className="h-6 w-6" /> },
    { name: "Book Appointment", path: "/student/Appointment", icon: <CalendarIcon className="h-6 w-6" /> },
    { name: "Study Planner", path: "/student/study-planner", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "Profile", path: "/student/profile", icon: <UserIcon className="h-6 w-6" /> },
  ];

  const coordinatorNavItems = [
    { name: "Dashboard", path: "/coordinator", icon: <HomeIcon className="h-6 w-6" /> },
    { name: "Credit Transfer Application", path: "/coordinator/application", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "Appointment", path: "/coordinator/appointment", icon: <CalendarIcon className="h-6 w-6" /> },
    { name: "Profile", path: "/coordinator/profile", icon: <UserIcon className="h-6 w-6" /> },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-700 text-white p-6 flex flex-col">
        <h1 className="text-xl font-bold mb-8">CTS Dashboard</h1>

        <p className="text-indigo-200 text-sm mb-6">
          Logged in as:
          <br />
          <span className="font-semibold">{user.role}</span>
        </p>

        <div className="flex-1">
          {user.role === "Student" && studentNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center py-3 px-2 mb-1 relative hover:text-indigo-300 transition`}
              >
                {/* Left indicator bar */}
                <span className={`absolute left-0 top-0 h-full w-1 rounded-tr-lg rounded-br-lg ${isActive ? "bg-yellow-400" : ""}`}></span>
                
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            );
          })}

          {user.role === "Program Coordinator" && coordinatorNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center py-3 px-2 mb-1 relative hover:text-indigo-300 transition`}
              >
                {/* Left indicator bar */}
                <span className={`absolute left-0 top-0 h-full w-1 rounded-tr-lg rounded-br-lg ${isActive ? "bg-yellow-400" : ""}`}></span>
                
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            );
          })}


        </div>

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