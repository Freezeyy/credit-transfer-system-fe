// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";

// Auth pages
import Landing from "./auth/pages/Landing";
import Login from "./auth/pages/Login";
import Register from "./auth/pages/Register";
import ForgotPassword from "./auth/pages/ForgotPassword";
import ResetPassword from "./auth/pages/ResetPassword";

// Dashboards
import StudentDashboard from "./module/student/pages/StudentDashboard";
import CoordinatorDashboard from "./module/coordinator/pages/CoordinatorDashboard";
import ExpertDashboard from "./module/expert/pages/ExpertDashboard";
import { ExpertDashboardContent } from "./module/expert/pages/ExpertDashboard";
import SMEAssignments from "./module/expert/pages/SMEAssignments";
import ReviewSubject from "./module/expert/pages/ReviewSubject";
import HosDashboard from "./module/hos/pages/HosDashboard";
import HosDashboardContent from "./module/hos/pages/HosDashboardContent";
import HosReviewsList from "./module/hos/pages/HosReviewsList";
import HosReviewDetail from "./module/hos/pages/HosReviewDetail";
import AdminDashboard from "./module/admin/pages/AdminDashboard";
import ManageStaff from "./module/admin/pages/ManageStaff";
import CreateLecturer from "./module/admin/pages/CreateLecturer";
import PreviousInstitutions from "./module/admin/pages/PreviousInstitutions";
import ManagePrograms from "./module/admin/pages/ManagePrograms";
import ManageCampus from "./module/admin/pages/ManageCampus";
import ProcessWindowSettings from "./module/admin/pages/ProcessWindowSettings";
import ManageCoursesAdmin from "./module/admin/pages/ManageCoursesAdmin";

// Student pages
import { StudentDashboardContent } from "./module/student/pages/StudentDashboard";
import BookAppointment from "./module/student/pages/Appointment/BookAppointment";
import ApplyCT from "./module/student/pages/CTApplication/ApplyCT";
import CTHistory from "./module/student/pages/CTHistory/historyTable";
import CourseAnalysisBrowse from "./module/student/pages/CourseAnalysisBrowse";

// Coordinator pages
import { CoordinatorDashboardContent } from "./module/coordinator/pages/CoordinatorDashboard";
import ViewAppointment from "./module/coordinator/pages/Appointment/ViewAppointment";
import ViewCTApplications from "./module/coordinator/pages/CTApplication/ViewCTApplications";
import ProgramStructure from "./module/coordinator/pages/Manage/ProgramStructure";
import ManageCourses from "./module/coordinator/pages/Manage/ManageCourses";
import ReviewApplication from "./module/coordinator/pages/CTApplication/ReviewApplication";
import Template3 from "./module/coordinator/pages/Manage/Template3";
import MappingBanks from "./module/coordinator/pages/Manage/MappingBanks";

// Protected route
import PrivateRoute from "./components/PrivateRoute";
import ProfilePage from "./components/ProfilePage";
import Layout from "./components/Layout";

function AdminIndexRedirect() {
  const user = JSON.parse(localStorage.getItem("cts_user") || "null");
  const role = user?.role;
  if (role === "Program Coordinator") return <Navigate to="/coordinator" replace />;
  if (role === "Subject Method Expert") return <Navigate to="/expert" replace />;
  if (role === "Head Of Section") return <Navigate to="/hos" replace />;
  // Admin-only (or unknown) can stay on admin dashboard
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Administrator Dashboard</h1>
      <p className="text-gray-600 mt-2">
        Welcome to the admin dashboard. Use the navigation to manage staff and system settings.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected dashboards */}
        <Route
          path="/profile"
          element={
            <PrivateRoute
              allowed={[
                "Student",
                "Program Coordinator",
                "Subject Method Expert",
                "Head Of Section",
                "Administrator",
                "Super Admin",
              ]}
            >
              <Layout>
                <ProfilePage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/student"
          element={
            <PrivateRoute allowed={["Student"]}>
              <StudentDashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<StudentDashboardContent />} />
          <Route path="application" element={<ApplyCT />} />
          <Route path="history" element={<CTHistory />} />
          <Route path="course-analysis" element={<CourseAnalysisBrowse />} />
          <Route path="appointment" element={<BookAppointment />} />
          <Route path="profile" element={<Navigate to="/profile" replace />} />
        </Route>


        <Route
          path="/coordinator"
          element={
            <PrivateRoute allowed={["Program Coordinator"]}>
              <CoordinatorDashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<CoordinatorDashboardContent />} />
          <Route path="application" element={<div><ViewCTApplications /></div>} />
          <Route path="review/:applicationId" element={<div><ReviewApplication /></div>} />
          <Route path="template3" element={<Template3 />} />
          <Route path="mapping-banks" element={<MappingBanks />} />
          <Route path="history" element={<div>History Page</div>} />
          <Route path="appointment" element={<ViewAppointment />} />
          <Route path="program-structure" element={<ProgramStructure />} />
          <Route path="courses" element={<ManageCourses />} />
          <Route path="profile" element={<Navigate to="/profile" replace />} />
        </Route>

        <Route
          path="/expert"
          element={
            <PrivateRoute allowed={["Subject Method Expert"]}>
              <ExpertDashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<ExpertDashboardContent />} />
          <Route path="assignments" element={<SMEAssignments />} />
          <Route path="assignments/:applicationSubjectId" element={<ReviewSubject />} />
        </Route>

        <Route
          path="/hos"
          element={
            <PrivateRoute allowed={["Head Of Section"]}>
              <HosDashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<HosDashboardContent />} />
          <Route path="reviews" element={<HosReviewsList />} />
          <Route path="reviews/:hosReviewId" element={<HosReviewDetail />} />
        </Route>

        <Route
          path="/admin"
          element={
            <PrivateRoute allowed={["Administrator", "Super Admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<AdminIndexRedirect />} />
          <Route path="staff" element={<ManageStaff />} />
          <Route path="create-lecturer" element={<CreateLecturer />} />
          <Route path="previous-institutions" element={<PreviousInstitutions />} />
          <Route path="programs" element={<ManagePrograms />} />
          <Route path="courses" element={<ManageCoursesAdmin />} />
          <Route path="process-window" element={<ProcessWindowSettings />} />
          <Route
            path="campuses"
            element={
              <PrivateRoute allowed={["Super Admin"]}>
                <ManageCampus />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
