// src/pages/dashboard/StudentDashboard.js
import Layout from "../../../components/Layout";
import { Outlet } from "react-router-dom";

export default function StudentDashboard() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

