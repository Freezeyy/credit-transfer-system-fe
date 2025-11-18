import Layout from "../../../components/Layout";
import { Outlet } from "react-router-dom";

export default function CoordinatorDashboard() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

