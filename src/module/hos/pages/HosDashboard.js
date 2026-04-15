import Layout from "../../../components/Layout";
import { Outlet } from "react-router-dom";

export default function HosDashboard() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

