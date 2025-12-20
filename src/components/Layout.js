import { Link, useLocation } from "react-router-dom";
import { HomeIcon, DocumentTextIcon, ClockIcon, CalendarIcon, UserIcon, MenuIcon, PencilIcon, UserGroupIcon } from "@heroicons/react/outline";
import useLogout from "./hooks/useLogout";
import { useState } from "react";

export default function Layout({ children }) {
  const { handleLogout } = useLogout();
  const user = JSON.parse(localStorage.getItem("cts_user"));
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const studentNavItems = [
    { name: "Dashboard", path: "/student", icon: <HomeIcon className="h-6 w-6" /> },
    { name: "Credit Transfer Application", path: "/student/application", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "Credit Transfer History", path: "/student/history", icon: <ClockIcon className="h-6 w-6" /> },
    { name: "Book Appointment", path: "/student/appointment", icon: <CalendarIcon className="h-6 w-6" /> },
    { name: "Study Planner", path: "/student/study-planner", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "Profile", path: "/student/profile", icon: <UserIcon className="h-6 w-6" /> },
  ];

  const coordinatorNavItems = [
    { name: "Dashboard", path: "/coordinator", icon: <HomeIcon className="h-6 w-6" /> },
    { name: "Credit Transfer Application", path: "/coordinator/application", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "View Template 3", path: "/coordinator/template3", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "Manage Program Structure / courses", path: "/coordinator/manage", icon: <PencilIcon className="h-6 w-6" /> },
    { name: "Appointment", path: "/coordinator/appointment", icon: <CalendarIcon className="h-6 w-6" /> },
    { name: "Profile", path: "/coordinator/profile", icon: <UserIcon className="h-6 w-6" /> },
  ];

  const adminNavItems = [
    { name: "Dashboard", path: "/admin", icon: <HomeIcon className="h-6 w-6" /> },
    { name: "Manage Staff", path: "/admin/staff", icon: <UserGroupIcon className="h-6 w-6" /> },
    { name: "Create Lecturer", path: "/admin/create-lecturer", icon: <UserIcon className="h-6 w-6" /> },
  ];

  const expertNavItems = [
    { name: "Dashboard", path: "/expert", icon: <HomeIcon className="h-6 w-6" /> },
    { name: "Assignments", path: "/expert/assignments", icon: <DocumentTextIcon className="h-6 w-6" /> },
  ];

  const getNavItems = () => {
    if (user.role === "Student") return studentNavItems;
    if (user.role === "Administrator") return adminNavItems;
    if (user.role === "Subject Method Expert") return expertNavItems;
    return coordinatorNavItems;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className={`${collapsed ? "w-16" : "w-64"} bg-indigo-700 text-white p-4 flex flex-col transition-width duration-300`}>
        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-4 p-2 bg-indigo-600 rounded hover:bg-indigo-500 self-end"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        {!collapsed && (
          <>
            <h1 className="text-xl font-bold mb-8">CTS Dashboard</h1>

            <p className="text-indigo-200 text-sm mb-6">
              Logged in as:
              <br />
              <span className="font-semibold">{user.role}</span>
            </p>
          </>
        )}

        <div className="flex-1">
          {navItems.map((item) => {
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
                {!collapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {!collapsed && (
          <button
            onClick={handleLogout}
            className="mt-4 bg-red-500 px-4 py-2 rounded-lg w-full hover:bg-red-600"
          >
            Logout
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 transition-all duration-300">{children}</div>
    </div>
  );
}
