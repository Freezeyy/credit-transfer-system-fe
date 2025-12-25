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
import SMEAssignments from "./module/expert/pages/SMEAssignments";
import ReviewSubject from "./module/expert/pages/ReviewSubject";
import HeadDashboard from "./module/hos/pages/HeadDashboard";
import AdminDashboard from "./module/admin/pages/AdminDashboard";
import ManageStaff from "./module/admin/pages/ManageStaff";
import CreateLecturer from "./module/admin/pages/CreateLecturer";

// Student pages
import BookAppointment from "./module/student/pages/Appointment/BookAppointment";
import ApplyCT from "./module/student/pages/CTApplication/ApplyCT";
import CTHistory from "./module/student/pages/CTHistory/history";

// Coordinator pages
import ViewAppointment from "./module/coordinator/pages/Appointment/ViewAppointment";
import ViewCTApplications from "./module/coordinator/pages/CTApplication/ViewCTApplications";
import ProgramStructure from "./module/coordinator/pages/Manage/ProgramStructure";
import ManageCourses from "./module/coordinator/pages/Manage/ManageCourses";
import ReviewApplication from "./module/coordinator/pages/CTApplication/ReviewApplication";
import Template3 from "./module/coordinator/pages/Manage/Template3";

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
        >

          <Route path="application" element={<ApplyCT />} />
          <Route path="history" element={<CTHistory />} />
          <Route path="appointment" element={<BookAppointment />} />
          <Route path="study-planner" element={<div>Study Planner</div>} />
          <Route path="profile" element={<div>Profile Page</div>} />
        </Route>


        <Route
          path="/coordinator"
          element={
            <PrivateRoute allowed={["Program Coordinator"]}>
              <CoordinatorDashboard />
            </PrivateRoute>
          }
        >
          <Route path="application" element={<div><ViewCTApplications /></div>} />
          <Route path="review/:applicationId" element={<div><ReviewApplication /></div>} />
          <Route path="template3" element={<Template3 />} />
          <Route path="history" element={<div>History Page</div>} />
          <Route path="appointment" element={<ViewAppointment />} />
          <Route path="program-structure" element={<ProgramStructure />} />
          <Route path="courses" element={<ManageCourses />} />
          <Route path="study-planner" element={<div>Study Planner</div>} />
          <Route path="profile" element={<div>Profile Page</div>} />
        </Route>

        <Route
          path="/expert"
          element={
            <PrivateRoute allowed={["Subject Method Expert"]}>
              <ExpertDashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<div className="p-6"><h1 className="text-2xl font-bold">Subject Method Expert Dashboard</h1><p className="text-gray-600 mt-2">Welcome to the SME dashboard. Use the navigation to view your assignments.</p></div>} />
          <Route path="assignments" element={<SMEAssignments />} />
          <Route path="review/:applicationSubjectId" element={<ReviewSubject />} />
        </Route>

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
        >
          <Route index element={<div className="p-6"><h1 className="text-2xl font-bold">Administrator Dashboard</h1><p className="text-gray-600 mt-2">Welcome to the admin dashboard. Use the navigation to manage staff and system settings.</p></div>} />
          <Route path="staff" element={<ManageStaff />} />
          <Route path="create-lecturer" element={<CreateLecturer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
