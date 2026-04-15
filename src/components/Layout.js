import { Link, useLocation, useNavigate } from "react-router-dom";
import { HomeIcon, DocumentTextIcon, ClockIcon, CalendarIcon, UserIcon, MenuIcon, PencilIcon, UserGroupIcon, ChevronDownIcon, BellIcon } from "@heroicons/react/outline";
import useLogout from "./hooks/useLogout";
import { useEffect, useRef, useState } from "react";
import UserProfile from "./UserProfile";
import { getMyUnreadCount, listMyNotifications, markAllNotificationsRead, markNotificationsRead } from "./hooks/useNotifications";

export default function Layout({ children }) {
  const { handleLogout } = useLogout();
  const user = JSON.parse(localStorage.getItem("cts_user"));
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const [notiOpen, setNotiOpen] = useState(false);
  const notiRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNoti, setLoadingNoti] = useState(false);

  const studentNavItems = [
    { name: "Dashboard", path: "/student", icon: <HomeIcon className="h-6 w-6" /> },
    { name: "Credit Transfer Application", path: "/student/application", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "Credit Transfer History", path: "/student/history", icon: <ClockIcon className="h-6 w-6" /> },
    { name: "Book Appointment", path: "/student/appointment", icon: <CalendarIcon className="h-6 w-6" /> },
    { name: "Study Planner", path: "/student/study-planner", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "Profile", path: "/profile", icon: <UserIcon className="h-6 w-6" /> },
  ];

  const coordinatorNavItems = [
    { name: "Dashboard", path: "/coordinator", icon: <HomeIcon className="h-6 w-6" /> },
    { name: "Credit Transfer Application", path: "/coordinator/application", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "View Course Mappings", path: "/coordinator/template3", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "Program Structure", path: "/coordinator/program-structure", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "Manage Courses", path: "/coordinator/courses", icon: <PencilIcon className="h-6 w-6" /> },
    { name: "Appointment", path: "/coordinator/appointment", icon: <CalendarIcon className="h-6 w-6" /> },
    { name: "Profile", path: "/profile", icon: <UserIcon className="h-6 w-6" /> },
  ];

  const adminNavItems = [
    { name: "Dashboard", path: "/admin", icon: <HomeIcon className="h-6 w-6" /> },
    { name: "Create Accounts", path: "/admin/create-lecturer", icon: <UserIcon className="h-6 w-6" /> },
    { name: "Manage Role", path: "/admin/staff", icon: <UserGroupIcon className="h-6 w-6" /> },
    { name: "Manage Programs", path: "/admin/programs", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "Process Window", path: "/admin/process-window", icon: <ClockIcon className="h-6 w-6" /> },
    { name: "Profile", path: "/profile", icon: <UserIcon className="h-6 w-6" /> },
  ];

  const superAdminNavItems = [
    ...adminNavItems,
    { name: "Previous Institutions", path: "/admin/previous-institutions", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "Manage Campus", path: "/admin/campuses", icon: <HomeIcon className="h-6 w-6" /> },
  ];

  const expertNavItems = [
    { name: "Dashboard", path: "/expert", icon: <HomeIcon className="h-6 w-6" /> },
    { name: "CT Evaluations", path: "/expert/assignments", icon: <DocumentTextIcon className="h-6 w-6" /> },
  ];

  const hosNavItems = [
    { name: "Dashboard", path: "/hos", icon: <HomeIcon className="h-6 w-6" /> },
    { name: "Pending Reviews", path: "/hos/reviews", icon: <DocumentTextIcon className="h-6 w-6" /> },
    { name: "Profile", path: "/profile", icon: <UserIcon className="h-6 w-6" /> },
  ];

  const getNavItems = () => {
    if (user.role === "Student") return studentNavItems;
    if (user.role === "Super Admin") return superAdminNavItems;
    if (user.role === "Administrator") return adminNavItems;
    if (user.role === "Subject Method Expert") return expertNavItems;
    if (user.role === "Head Of Section") return hosNavItems;
    return coordinatorNavItems;
  };

  const navItems = getNavItems();

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notiRef.current && !notiRef.current.contains(e.target)) {
        setNotiOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const c = await getMyUnreadCount();
        if (mounted) setUnreadCount(c.unread || 0);
      } catch {
        // ignore
      }
    }
    refresh();
    const t = setInterval(refresh, 15000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  async function openNotifications() {
    setNotiOpen((v) => !v);
    if (notiOpen) return;
    setLoadingNoti(true);
    try {
      const data = await listMyNotifications({ limit: 50, offset: 0 });
      setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNoti(false);
    }
  }

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
      </div>

      {/* Main Content */}
      <div className="flex-1 transition-all duration-300 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="hidden sm:flex flex-col leading-tight min-w-0">
                  <span className="text-sm font-semibold text-gray-900 truncate">Credit Transfer System</span>
                  {/* <span className="text-xs text-gray-500 truncate">{location.pathname}</span> */}
                </div>
                <div className="sm:hidden text-sm font-semibold text-gray-900 truncate">
                  CTS
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative" ref={notiRef}>
                <button
                  type="button"
                  onClick={openNotifications}
                  className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  title="Notifications"
                >
                  <BellIcon className="h-6 w-6 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-semibold flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notiOpen && (
                  <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-900">Notifications</div>
                      <button
                        className="text-xs text-indigo-600 hover:underline"
                        onClick={async () => {
                          await markAllNotificationsRead();
                          setUnreadCount(0);
                          setNotifications((prev) => prev.map(n => ({ ...n, is_read: true })));
                        }}
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {loadingNoti ? (
                        <div className="p-4 text-sm text-gray-500">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500">No notifications yet.</div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.noti_id}
                            className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${
                              n.is_read ? "" : "bg-indigo-50/40"
                            }`}
                            onClick={async () => {
                              try {
                                if (!n.is_read) {
                                  await markNotificationsRead({ noti_ids: [n.noti_id] });
                                  setUnreadCount((c) => Math.max(0, c - 1));
                                  setNotifications((prev) => prev.map(x => x.noti_id === n.noti_id ? { ...x, is_read: true } : x));
                                }
                              } finally {
                                setNotiOpen(false);
                                if (n.link_path) navigate(n.link_path);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 w-2 h-2 rounded-full ${n.is_read ? "bg-gray-300" : "bg-indigo-600"}`} />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {n.noti_title || "Notification"}
                                </div>
                                <div className="text-sm text-gray-600 line-clamp-2">
                                  {n.noti_message || ""}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-1">
                                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="group inline-flex items-center gap-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <UserProfile className="shadow-none border-gray-100 bg-gray-50/80 hover:bg-gray-100 transition" />
                  <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-700 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
