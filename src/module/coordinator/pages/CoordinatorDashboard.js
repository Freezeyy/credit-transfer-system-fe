import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../../components/Layout";
import { Outlet } from "react-router-dom";
import { getCoordinatorInbox } from "../hooks/useViewCTApplications";
import { getCoordinatorAppointments } from "../hooks/useAppointment";
import { computeInboxStatusCounts, deriveAppStatus } from "../utils/ctInboxStatus";
import {
  DocumentTextIcon,
  CalendarIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/outline";

function CoordinatorDashboardContent() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    submitted: 0,
    awaiting_sme: 0,
    awaiting_hos: 0,
    sme_approved: 0,
    sme_rejected: 0,
    approved: 0,
    total: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Load all applications for stats
    const appsRes = await getCoordinatorInbox("all");
    if (appsRes.success) {
      const apps = appsRes.data || [];
      setApplications(apps.slice(0, 5)); // Show latest 5

      const counts = computeInboxStatusCounts(apps);
      setStats({
        submitted: counts.submitted || 0,
        awaiting_sme: counts.awaiting_sme || 0,
        awaiting_hos: counts.awaiting_hos || 0,
        sme_approved: counts.sme_approved || 0,
        sme_rejected: counts.sme_rejected || 0,
        approved: counts.approved || 0,
        total: apps.length,
      });
    }

    // Load appointments
    const apptRes = await getCoordinatorAppointments();
    if (apptRes.success) {
      const appts = apptRes.data || [];
      // Filter upcoming appointments
      const upcoming = appts
        .filter((a) => a.status === "scheduled" || a.status === "pending")
        .slice(0, 3);
      setAppointments(upcoming);
    }

    setLoading(false);
  };

  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    const statusMap = {
      submitted: "bg-yellow-100 text-yellow-800",
      awaiting_sme: "bg-orange-100 text-orange-800",
      awaiting_hos: "bg-indigo-100 text-indigo-800",
      sme_approved: "bg-emerald-100 text-emerald-800",
      sme_rejected: "bg-red-100 text-red-800",
      approved: "bg-green-100 text-green-800",
      draft: "bg-gray-100 text-gray-800",
    };
    return statusMap[s] || "bg-gray-100 text-gray-800";
  };

  const formatDerivedStatusLabel = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "submitted":
        return "Needs review";
      case "awaiting_sme":
        return "SME";
      case "awaiting_hos":
        return "HOS";
      case "sme_approved":
        return "SME approved";
      case "sme_rejected":
        return "SME rejected";
      case "approved":
        return "Approved";
      default:
        return String(status || "Unknown").replace(/_/g, " ");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Coordinator Dashboard</h1>
        <p className="text-indigo-100">
          Manage credit transfer applications and program structure
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/coordinator/application"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-indigo-200 hover:border-indigo-400"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Review Applications
              </h3>
              <p className="text-gray-600 text-sm">
                {stats.submitted} need coordinator review (at least one course)
              </p>
            </div>
            <DocumentTextIcon className="h-12 w-12 text-indigo-600" />
          </div>
        </Link>

        <Link
          to="/coordinator/program-structure"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-blue-200 hover:border-blue-400"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Program Structure
              </h3>
              <p className="text-gray-600 text-sm">
                Manage program structure
              </p>
            </div>
            <DocumentTextIcon className="h-12 w-12 text-blue-600" />
          </div>
        </Link>

        <Link
          to="/coordinator/appointment"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-green-200 hover:border-green-400"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Appointments
              </h3>
              <p className="text-gray-600 text-sm">
                {appointments.length} upcoming
              </p>
            </div>
            <CalendarIcon className="h-12 w-12 text-green-600" />
          </div>
        </Link>
      </div>

      {/* Statistics — same per-course derivation as the applications inbox */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-400">
          <p className="text-sm text-gray-600 mb-1">Total apps</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-400">
          <p className="text-sm text-gray-600 mb-1">Needs review</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.submitted}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-400">
          <p className="text-sm text-gray-600 mb-1">SME Reviewing</p>
          <p className="text-2xl font-bold text-orange-700">{stats.awaiting_sme}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-400">
          <p className="text-sm text-gray-600 mb-1">HOS Reviewing</p>
          <p className="text-2xl font-bold text-indigo-800">{stats.awaiting_hos}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-emerald-400">
          <p className="text-sm text-gray-600 mb-1">SME approved</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.sme_approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-400">
          <p className="text-sm text-gray-600 mb-1">SME rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats.sme_rejected}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-400">
          <p className="text-sm text-gray-600 mb-1">HOS approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2 text-indigo-600" />
              Recent Applications
            </h2>
            <Link
              to="/coordinator/application"
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              View All <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No applications to review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.ct_id || app.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/coordinator/review/${app.ct_id || app.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {app.student?.student_name || `Student #${app.student_id}`}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(app.createdAt)} • Application
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        deriveAppStatus(app)
                      )}`}
                    >
                      {formatDerivedStatusLabel(deriveAppStatus(app)).toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2 text-blue-600" />
              Upcoming Appointments
            </h2>
            <Link
              to="/coordinator/appointment"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              View All <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {appt.student?.student_name || `Student #${appt.student_id}`}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(appt.requestedStart)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appt.status === "scheduled"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {appt.status?.toUpperCase() || "PENDING"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Priority Alerts */}
      {stats.submitted > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 mr-3" />
            <div>
              <p className="text-yellow-800 font-medium">
                {stats.submitted} application{stats.submitted !== 1 ? "s" : ""}{" "}
                {stats.submitted === 1 ? "has" : "have"} at least one course needing coordinator review
              </p>
              <Link
                to="/coordinator/application"
                className="text-yellow-600 hover:text-yellow-800 text-sm underline mt-1 inline-block"
              >
                Review now →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoordinatorDashboard() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export { CoordinatorDashboardContent };