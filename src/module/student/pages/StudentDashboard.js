// src/pages/dashboard/StudentDashboard.js
import Layout from "../../../components/Layout";
import { Outlet } from "react-router-dom";

export default function StudentDashboard() {

  return (
    <Layout>
    <div className="flex h-screen bg-gray-100">

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet /> {/* Render nested routes here */}
      </main>
    </div>

    </Layout>
  );
}
