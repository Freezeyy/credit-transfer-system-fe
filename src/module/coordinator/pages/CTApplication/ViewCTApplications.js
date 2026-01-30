import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCoordinatorInbox,
} from "../../hooks/useViewCTApplications";

export default function ViewCTApplications() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use useCallback to memoize loadApplications
  const loadApplications = useCallback(async () => {
    setLoading(true);
    const res = await getCoordinatorInbox(statusFilter === "all" ? "" : statusFilter);
    if (res.success) {
      setApps(res.data);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Filter applications by status
  const filteredApps = apps; // Already filtered by API

  // Count by status - need to get all for accurate counts
  const statusCounts = apps.reduce((acc, app) => {
    acc[app.ct_status || app.status] = (acc[app.ct_status || app.status] || 0) + 1;
    return acc;
  }, {});

  function getStatusColor(status) {
    switch (status) {
      case "submitted": return "bg-yellow-100 text-yellow-800";
      case "under_review": return "bg-blue-100 text-blue-800";
      case "awaiting_sme": return "bg-orange-100 text-orange-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Credit Transfer Applications</h1>
        <p className="text-gray-600">Review and manage student applications</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({apps.length})
          </button>
          <button
            onClick={() => setStatusFilter("submitted")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "submitted"
                ? "bg-yellow-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Submitted ({statusCounts.submitted || 0})
          </button>
          <button
            onClick={() => setStatusFilter("under_review")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "under_review"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Under Review ({statusCounts.under_review || 0})
          </button>
          <button
            onClick={() => setStatusFilter("awaiting_sme")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "awaiting_sme"
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Awaiting SME ({statusCounts.awaiting_sme || 0})
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "approved"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Approved ({statusCounts.approved || 0})
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "rejected"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Rejected ({statusCounts.rejected || 0})
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4 text-left text-sm font-semibold">ID</th>
              <th className="p-4 text-left text-sm font-semibold">Student</th>
              <th className="p-4 text-left text-sm font-semibold">Program</th>
              <th className="p-4 text-left text-sm font-semibold">Previous Study</th>
              <th className="p-4 text-left text-sm font-semibold">Subjects</th>
              <th className="p-4 text-left text-sm font-semibold">Status</th>
              <th className="p-4 text-left text-sm font-semibold">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  Loading applications...
                </td>
              </tr>
            ) : filteredApps.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  No applications found
                </td>
              </tr>
            ) : (
              filteredApps.map((app, index) => {
                const totalSubjects = app.subjects?.length || 
                  app.newApplicationSubjects?.reduce(
                    (acc, s) => acc + (s.pastApplicationSubjects?.length || 0), 
                    0
                  );
                const displayId = index + 1;

                return (
                  <tr
                    key={app.id || app.ct_id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/coordinator/review/${app.id || app.ct_id}`)}
                  >
                    <td className="p-4">
                      <span className="font-mono text-sm">#{displayId}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{app.student_name || app.student?.student_name}</p>
                        <p className="text-sm text-gray-500">{app.student_email || app.student?.student_email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{app.program_code || app.program?.program_code}</p>
                        <p className="text-sm text-gray-500">{app.program_name || app.program?.program_name}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm">{app.prev_campus_name}</p>
                        <p className="text-xs text-gray-500">{app.prev_programme_name}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                        {totalSubjects} subject{totalSubjects !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        getStatusColor(app.status || app.ct_status)
                      }`}>
                        {(app.status || app.ct_status).replace(/_/g, " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Stats */}
      {apps.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-sm text-yellow-600 font-medium">Needs Review</p>
            <p className="text-2xl font-bold text-yellow-800">
              {statusCounts.submitted || 0}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">In Progress</p>
            <p className="text-2xl font-bold text-blue-800">
              {statusCounts.under_review || 0}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-orange-600 font-medium">With SME</p>
            <p className="text-2xl font-bold text-orange-800">
              {statusCounts.awaiting_sme || 0}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-600 font-medium">Approved</p>
            <p className="text-2xl font-bold text-green-800">
              {statusCounts.approved || 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}