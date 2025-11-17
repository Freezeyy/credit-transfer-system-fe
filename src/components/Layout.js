import useLogout from "./hooks/useLogout";

export default function Layout({ children }) {
    const { handleLogout } = useLogout();
    const user = JSON.parse(localStorage.getItem("cts_user"));


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
