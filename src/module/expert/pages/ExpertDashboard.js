import Layout from "../../../components/Layout";
import { Outlet } from "react-router-dom";

export default function ExpertDashboard() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
