import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../../components/Layout";
import { Outlet } from "react-router-dom";
import { getSMEAssignments } from "../hooks/useSMEReview";
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/outline";

function ExpertDashboardContent() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await getSMEAssignments();
    if (res.success) {
      const allAssignments = res.data || [];
      setAssignments(allAssignments.slice(0, 5)); // Show latest 5

      // Calculate stats
      const statsData = {
        pending: allAssignments.filter(
          (a) => a.approval_status === "needs_sme_review"
        ).length,
        approved: allAssignments.filter(
          (a) => a.approval_status === "approved_sme"
        ).length,
        rejected: allAssignments.filter(
          (a) => a.approval_status === "rejected"
        ).length,
        total: allAssignments.length,
      };
      setStats(statsData);
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    const statusMap = {
      needs_sme_review: "bg-yellow-100 text-yellow-800",
      approved_sme: "bg-green-100 text-green-800",
      approved_template3: "bg-blue-100 text-blue-800",
      rejected: "bg-red-100 text-red-800",
    };
    return statusMap[status] || statusMap.needs_sme_review;
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
        <h1 className="text-3xl font-bold mb-2">SME Dashboard</h1>
        <p className="text-indigo-100">
          Review subject equivalencies and syllabus mappings
        </p>
      </div>

      {/* Quick Action */}
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-indigo-200 hover:border-indigo-400 transition-shadow">
        <Link
          to="/expert/assignments"
          className="flex items-center justify-between"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Review Assignments
            </h3>
            <p className="text-gray-600 text-sm">
              {stats.pending} assignment{stats.pending !== 1 ? "s" : ""} pending
              your review
            </p>
          </div>
          <DocumentTextIcon className="h-12 w-12 text-indigo-600" />
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-400">
          <p className="text-sm text-gray-600 mb-1">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
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

      {/* Recent Assignments */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <DocumentTextIcon className="h-6 w-6 mr-2 text-indigo-600" />
            Recent Assignments
          </h2>
          <Link
            to="/expert/assignments"
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            View All <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No assignments to review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.sme_assignment_id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() =>
                  navigate(
                    `/expert/assignments/${assignment.application_subject_id}`
                  )
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {assignment.current_subject_name || "Subject Review"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Application #{assignment.application_id} •{" "}
                      {assignment.past_subject_name || "Past Subject"}
                    </p>
                    {assignment.student_name && (
                      <p className="text-xs text-gray-500 mt-1">
                        Student: {assignment.student_name}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      assignment.approval_status
                    )}`}
                  >
                    {assignment.approval_status
                      ?.replace(/_/g, " ")
                      .toUpperCase() || "PENDING"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Priority Alerts */}
      {stats.pending > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 mr-3" />
            <div>
              <p className="text-yellow-800 font-medium">
                {stats.pending} assignment{stats.pending !== 1 ? "s" : ""} need{stats.pending === 1 ? "s" : ""} your review
              </p>
              <Link
                to="/expert/assignments"
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

export default function ExpertDashboard() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export { ExpertDashboardContent };
