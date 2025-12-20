import Layout from "../../../components/Layout";
import { Outlet } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
