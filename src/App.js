// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth pages
import Login from "./auth/pages/Login";
import ForgotPassword from "./auth/pages/ForgotPassword";
import ResetPassword from "./auth/pages/ResetPassword";

// Dashboards
import StudentDashboard from "./module/student/pages/StudentDashboard";
import CoordinatorDashboard from "./module/coordinator/pages/CoordinatorDashboard";
import ExpertDashboard from "./module/expert/pages/ExpertDashboard";
import HeadDashboard from "./module/hos/pages/HeadDashboard";
import AdminDashboard from "./module/admin/pages/AdminDashboard";

// Protected route
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected dashboards */}
        <Route
          path="/student"
          element={
            <PrivateRoute allowed={["Student"]}>
              <StudentDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/coordinator"
          element={
            <PrivateRoute allowed={["Program Coordinator"]}>
              <CoordinatorDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/expert"
          element={
            <PrivateRoute allowed={["Subject Method Expert"]}>
              <ExpertDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/hos"
          element={
            <PrivateRoute allowed={["Head Of Section"]}>
              <HeadDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute allowed={["Administrator"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
