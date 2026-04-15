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
    // Always load all; we filter client-side so counts are accurate
    const res = await getCoordinatorInbox("");
    if (res.success) {
      setApps(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  function deriveAppStatus(app) {
    const subjects = app.newApplicationSubjects || [];
    const statuses = subjects.flatMap(s => (s.pastApplicationSubjects || []).map(p => String(p.approval_status || "").toLowerCase()));
    if (statuses.length === 0) return (app.status || app.ct_status || "submitted");

    const any = (arr) => statuses.some(s => arr.includes(s));
    const all = (arr) => statuses.every(s => arr.includes(s));

    // Final stage: HOS decision persisted into approval_status
    if (any(["hos_rejected", "rejected"])) return "rejected";
    if (all(["hos_approved"])) return "approved";

    // In progress
    if (any(["hos_pending"])) return "under_review";
    if (any(["needs_sme_review"])) return "awaiting_sme";
    if (any(["approved_sme", "approved_template3", "hos_approved"])) return "under_review";

    // Fresh submission
    if (all(["pending"])) return "submitted";
    return "under_review";
  }

  function deriveCurrentSubjectStatus(subject) {
    const statuses = (subject?.pastApplicationSubjects || []).map(p => String(p.approval_status || "").toLowerCase());
    if (statuses.length === 0) return "submitted";

    const any = (arr) => statuses.some(s => arr.includes(s));
    const all = (arr) => statuses.every(s => arr.includes(s));

    if (any(["hos_rejected", "rejected"])) return "rejected";
    if (all(["hos_approved"])) return "approved";
    if (any(["hos_pending"])) return "under_review";
    if (any(["needs_sme_review"])) return "awaiting_sme";
    if (any(["approved_sme", "approved_template3", "hos_approved"])) return "under_review";
    if (all(["pending"])) return "submitted";
    return "under_review";
  }

  function getStatusLabel(status) {
    switch (status) {
      case "submitted": return "Needs review";
      case "under_review": return "In progress";
      case "awaiting_sme": return "Awaiting SME";
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      default: return String(status || "").replace(/_/g, " ");
    }
  }

  // Filter applications by derived status
  const filteredApps = apps.filter(app => {
    if (statusFilter === "all") return true;
    return deriveAppStatus(app) === statusFilter;
  });

  // Count by derived status
  const statusCounts = apps.reduce((acc, app) => {
    const s = deriveAppStatus(app);
    acc[s] = (acc[s] || 0) + 1;
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

      {/* Single filter: clickable stats */}
      {apps.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-3">
          <button
            onClick={() => setStatusFilter("all")}
            className={`text-left rounded-lg p-4 border transition ${
              statusFilter === "all" ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
          >
            <p className={`text-sm font-medium ${statusFilter === "all" ? "text-gray-200" : "text-gray-600"}`}>All</p>
            <p className="text-2xl font-bold">{apps.length}</p>
          </button>

          <button
            onClick={() => setStatusFilter("submitted")}
            className={`text-left rounded-lg p-4 border transition ${
              statusFilter === "submitted" ? "bg-yellow-100 border-yellow-300" : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
          >
            <p className="text-sm text-yellow-700 font-medium">Needs Review</p>
            <p className="text-2xl font-bold text-yellow-800">{statusCounts.submitted || 0}</p>
          </button>

          <button
            onClick={() => setStatusFilter("under_review")}
            className={`text-left rounded-lg p-4 border transition ${
              statusFilter === "under_review" ? "bg-blue-100 border-blue-300" : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
          >
            <p className="text-sm text-blue-700 font-medium">In Progress</p>
            <p className="text-2xl font-bold text-blue-800">{statusCounts.under_review || 0}</p>
          </button>

          <button
            onClick={() => setStatusFilter("awaiting_sme")}
            className={`text-left rounded-lg p-4 border transition ${
              statusFilter === "awaiting_sme" ? "bg-orange-100 border-orange-300" : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
          >
            <p className="text-sm text-orange-700 font-medium">With SME</p>
            <p className="text-2xl font-bold text-orange-800">{statusCounts.awaiting_sme || 0}</p>
          </button>

          <button
            onClick={() => setStatusFilter("approved")}
            className={`text-left rounded-lg p-4 border transition ${
              statusFilter === "approved" ? "bg-green-100 border-green-300" : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
          >
            <p className="text-sm text-green-700 font-medium">Approved</p>
            <p className="text-2xl font-bold text-green-800">{statusCounts.approved || 0}</p>
          </button>

          <button
            onClick={() => setStatusFilter("rejected")}
            className={`text-left rounded-lg p-4 border transition ${
              statusFilter === "rejected" ? "bg-red-100 border-red-300" : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
          >
            <p className="text-sm text-red-700 font-medium">Rejected</p>
            <p className="text-2xl font-bold text-red-800">{statusCounts.rejected || 0}</p>
          </button>
        </div>
      )}

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
                      {(() => {
                        const subjects = app.newApplicationSubjects || [];
                        if (subjects.length === 0) {
                          const s = deriveAppStatus(app);
                          return (
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(s)}`}>
                              {getStatusLabel(s).toUpperCase()}
                            </span>
                          );
                        }

                        const breakdown = subjects.reduce((acc, subj) => {
                          const s = deriveCurrentSubjectStatus(subj);
                          acc[s] = (acc[s] || 0) + 1;
                          return acc;
                        }, {});

                        const order = ["submitted", "awaiting_sme", "under_review", "approved", "rejected"];
                        const items = order.filter(k => breakdown[k]).map(k => ({ status: k, count: breakdown[k] }));

                        return (
                          <div className="flex flex-col gap-1">
                            {items.map(item => (
                              <div key={item.status} className="flex items-center gap-2">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusColor(item.status)}`}>
                                  {getStatusLabel(item.status).toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {item.count} subject{item.count !== 1 ? "s" : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
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

      {/* (removed duplicate quick stats) */}
    </div>
  );
}