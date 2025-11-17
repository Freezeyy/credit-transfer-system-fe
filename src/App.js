// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth pages
import Login from "./pages/auth/pages/Login";
import ForgotPassword from "./pages/auth/pages/ForgotPassword";
import ResetPassword from "./pages/auth/pages/ResetPassword";

// Dashboards
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import CoordinatorDashboard from "./pages/dashboard/CoordinatorDashboard";
import ExpertDashboard from "./pages/dashboard/ExpertDashboard";
import HeadDashboard from "./pages/dashboard/HeadDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";

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
