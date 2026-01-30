import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../../components/Layout";
import { Outlet } from "react-router-dom";
import { getCoordinatorInbox } from "../hooks/useViewCTApplications";
import { getCoordinatorAppointments } from "../hooks/useAppointment";
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  UsersIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/outline";

function CoordinatorDashboardContent() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    underReview: 0,
    awaitingSME: 0,
    approved: 0,
    rejected: 0,
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

      // Calculate stats
      const statsData = {
        pending: apps.filter((a) => a.ct_status === "submitted").length,
        underReview: apps.filter((a) => a.ct_status === "under_review").length,
        awaitingSME: apps.filter((a) => a.ct_status === "awaiting_sme").length,
        approved: apps.filter((a) => a.ct_status === "approved").length,
        rejected: apps.filter((a) => a.ct_status === "rejected").length,
        total: apps.length,
      };
      setStats(statsData);
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
    const statusMap = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      awaiting_sme: "bg-orange-100 text-orange-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return statusMap[status?.toLowerCase()] || statusMap.submitted;
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
                {stats.pending + stats.underReview} pending review
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-400">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-400">
          <p className="text-sm text-gray-600 mb-1">Under Review</p>
          <p className="text-2xl font-bold text-yellow-600">
            {stats.underReview}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-400">
          <p className="text-sm text-gray-600 mb-1">Awaiting SME</p>
          <p className="text-2xl font-bold text-orange-600">
            {stats.awaitingSME}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-400">
          <p className="text-sm text-gray-600 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-400">
          <p className="text-sm text-gray-600 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-400">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
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
                        {formatDate(app.createdAt)} • Application #{app.ct_id || app.id}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        app.ct_status || app.status
                      )}`}
                    >
                      {(app.ct_status || app.status || "draft")
                        .replace(/_/g, " ")
                        .toUpperCase()}
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
      {stats.pending > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 mr-3" />
            <div>
              <p className="text-yellow-800 font-medium">
                {stats.pending} application{stats.pending !== 1 ? "s" : ""} need{stats.pending === 1 ? "s" : ""} your review
              </p>
              <Link
                to="/coordinator/application?status=submitted"
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