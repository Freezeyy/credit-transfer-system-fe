import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DocumentDownloadIcon } from "@heroicons/react/outline";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getCoordinatorInbox,
} from "../../hooks/useViewCTApplications";

/** Legacy whole-application hint when there are no subject rows (prefer per-subject matching when possible). */
function deriveAppStatus(app) {
  const subjects = app.newApplicationSubjects || [];
  const statuses = subjects.flatMap((s) =>
    (s.pastApplicationSubjects || []).map((p) => String(p.approval_status || "").toLowerCase()),
  );
  if (statuses.length === 0) return app.status || app.ct_status || "submitted";

  const any = (arr) => statuses.some((s) => arr.includes(s));
  const all = (arr) => statuses.every((s) => arr.includes(s));

  if (any(["hos_rejected", "rejected", "sme_reviewed_rejected"])) return "sme_rejected";
  if (all(["hos_approved"])) return "approved";
  if (any(["needs_sme_review"])) return "awaiting_sme";
  if (any(["approved_sme"])) return "sme_approved";
  if (all(["pending"])) return "submitted";
  return "submitted";
}

/** Per UniKL course line — used for inbox filters/counts so multi-course CT apps behave correctly. */
function deriveCurrentSubjectStatus(subject) {
  const statuses = (subject?.pastApplicationSubjects || []).map((p) =>
    String(p.approval_status || "").toLowerCase(),
  );
  if (statuses.length === 0) return "submitted";

  const any = (arr) => statuses.some((s) => arr.includes(s));
  const all = (arr) => statuses.every((s) => arr.includes(s));

  if (any(["hos_rejected", "rejected", "sme_reviewed_rejected"])) return "sme_rejected";
  if (all(["hos_approved"])) return "approved";
  // Sent to Head of Section, decision pending — was previously mis-labelled as “Needs review”
  if (any(["hos_pending"])) return "awaiting_hos";
  if (any(["needs_sme_review"])) return "awaiting_sme";
  if (any(["approved_sme"])) return "sme_approved";
  if (any(["approved_template3"])) return "submitted";
  if (all(["pending"])) return "submitted";
  return "submitted";
}

const INBOX_FILTERS = [
  "submitted",
  "awaiting_sme",
  "awaiting_hos",
  "sme_approved",
  "sme_rejected",
  "approved",
];

function appMatchesSubjectStatusFilter(app, statusFilter) {
  if (statusFilter === "all") return true;
  const subjects = app.newApplicationSubjects || [];
  if (subjects.length === 0) {
    return deriveAppStatus(app) === statusFilter;
  }
  return subjects.some((subj) => deriveCurrentSubjectStatus(subj) === statusFilter);
}

function computeInboxStatusCounts(applicationList) {
  const counts = {};
  INBOX_FILTERS.forEach((k) => {
    counts[k] = 0;
  });
  applicationList.forEach((app) => {
    INBOX_FILTERS.forEach((key) => {
      if (appMatchesSubjectStatusFilter(app, key)) counts[key] += 1;
    });
  });
  return counts;
}

/** Rows: one line per UniKL course (new application subject) that is fully HOS-approved. */
function collectApprovedCourseRows(applications, deriveSubjectStatusFn) {
  const rows = [];
  for (const app of applications) {
    const student = app.student || {};
    const studentName = student.student_name || app.student_name || "";
    const studentIdentifierRaw = student.student_identifier;
    const studentIdentifier =
      studentIdentifierRaw != null && String(studentIdentifierRaw).trim() !== ""
        ? String(studentIdentifierRaw).trim()
        : "";
    for (const subj of app.newApplicationSubjects || []) {
      if (deriveSubjectStatusFn(subj) !== "approved") continue;
      const courseCode = subj.course?.course_code || "";
      const courseName = subj.course?.course_name || subj.application_subject_name || "";
      rows.push({ studentName, studentIdentifier, courseCode, courseName });
    }
  }
  rows.sort((a, b) => {
    const n = String(a.studentName).localeCompare(String(b.studentName), undefined, {
      sensitivity: "base",
    });
    if (n !== 0) return n;
    const idCmp = String(a.studentIdentifier).localeCompare(String(b.studentIdentifier), undefined, {
      sensitivity: "base",
    });
    if (idCmp !== 0) return idCmp;
    return String(a.courseCode).localeCompare(String(b.courseCode), undefined, {
      sensitivity: "base",
    });
  });
  return rows;
}

function downloadApprovedReportPdf(rows) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const dateStr = new Date().toLocaleString();
  const slugDate = new Date().toISOString().slice(0, 10);

  doc.setFontSize(16);
  doc.setTextColor(33, 37, 41);
  doc.text("Approved credit transfer — UniKL courses", 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(90, 97, 105);
  doc.text(
    "Head of Section approved lines (current filter). Columns: Student Name, Student Identifier, Course Code, Course Name.",
    14,
    23
  );
  doc.text(`Generated: ${dateStr}`, 14, 28);
  doc.setTextColor(0, 0, 0);

  const body = rows.map((r) => [
    r.studentName ?? "",
    String(r.studentIdentifier ?? ""),
    r.courseCode ?? "",
    r.courseName ?? "",
  ]);

  autoTable(doc, {
    startY: 33,
    head: [["Student Name", "Student Identifier", "Course Code", "Course Name"]],
    body,
    styles: { fontSize: 9, cellPadding: 2.5, overflow: "linebreak" },
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 24 },
      2: { cellWidth: 28 },
      3: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(`credit-transfer-approved-report-${slugDate}.pdf`);
}

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

  function getStatusLabel(status) {
    switch (status) {
      case "submitted": return "Needs review";
      case "awaiting_sme": return "Awaiting SME";
      case "awaiting_hos": return "With HOS";
      case "approved": return "Approved";
      case "sme_approved": return "SME Approved";
      case "sme_rejected": return "SME Rejected";
      default: return String(status || "").replace(/_/g, " ");
    }
  }

  // Match if any UniKL course line is in this state (one application may appear under several filters).
  const filteredApps = apps.filter((app) => appMatchesSubjectStatusFilter(app, statusFilter));

  const approvedExportRows = useMemo(
    () => collectApprovedCourseRows(filteredApps, deriveCurrentSubjectStatus),
    [filteredApps]
  );

  function handleDownloadApprovedReport() {
    if (approvedExportRows.length === 0) return;
    downloadApprovedReportPdf(approvedExportRows);
  }

  const statusCounts = computeInboxStatusCounts(apps);

  function getStatusColor(status) {
    switch (status) {
      case "submitted": return "bg-yellow-100 text-yellow-800";
      case "awaiting_sme": return "bg-orange-100 text-orange-800";
      case "awaiting_hos": return "bg-indigo-100 text-indigo-800";
      case "approved": return "bg-green-100 text-green-800";
      case "sme_approved": return "bg-emerald-100 text-emerald-800";
      case "sme_rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Credit Transfer Applications</h1>
        <p className="text-gray-600">Review and manage student applications</p>
        <p className="text-sm text-gray-500 mt-2 max-w-3xl">
          Filter chips count applications that have <span className="font-medium text-gray-700">at least one</span> UniKL course in that stage.
          Large applications may appear under several columns at once (e.g. some courses approved, others still in review).
        </p>
      </div>

      {/* Single filter: clickable stats */}
      {apps.length > 0 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
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
            onClick={() => setStatusFilter("awaiting_sme")}
            className={`text-left rounded-lg p-4 border transition ${
              statusFilter === "awaiting_sme" ? "bg-orange-100 border-orange-300" : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
          >
            <p className="text-sm text-orange-700 font-medium">With SME</p>
            <p className="text-2xl font-bold text-orange-800">{statusCounts.awaiting_sme || 0}</p>
          </button>

          <button
            onClick={() => setStatusFilter("awaiting_hos")}
            className={`text-left rounded-lg p-4 border transition ${
              statusFilter === "awaiting_hos"
                ? "bg-indigo-100 border-indigo-300"
                : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
          >
            <p className="text-sm text-indigo-800 font-medium">With HOS</p>
            <p className="text-2xl font-bold text-indigo-900">{statusCounts.awaiting_hos || 0}</p>
          </button>

          <button
            onClick={() => setStatusFilter("sme_approved")}
            className={`text-left rounded-lg p-4 border transition ${
              statusFilter === "sme_approved" ? "bg-emerald-100 border-emerald-300" : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
          >
            <p className="text-sm text-emerald-700 font-medium">SME Approved</p>
            <p className="text-2xl font-bold text-emerald-800">{statusCounts.sme_approved || 0}</p>
          </button>

          <button
            onClick={() => setStatusFilter("sme_rejected")}
            className={`text-left rounded-lg p-4 border transition ${
              statusFilter === "sme_rejected" ? "bg-red-100 border-red-300" : "bg-white hover:bg-gray-50 border-gray-200"
            }`}
          >
            <p className="text-sm text-red-700 font-medium">SME Rejected</p>
            <p className="text-2xl font-bold text-red-800">{statusCounts.sme_rejected || 0}</p>
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
        </div>
      )}

      {statusFilter === "approved" && !loading && apps.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-green-200 bg-green-50/80 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-green-900">Approved credit transfer rows</p>
            <p className="text-xs text-green-800/90 mt-0.5">
              Download every fully approved UniKL course line ({approvedExportRows.length} row
              {approvedExportRows.length !== 1 ? "s" : ""}) matching this filter.
            </p>
          </div>
          <button
            type="button"
            disabled={approvedExportRows.length === 0}
            onClick={handleDownloadApprovedReport}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DocumentDownloadIcon className="h-5 w-5 shrink-0" />
            Download report (PDF)
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
              <th className="p-4 text-left text-sm font-semibold">Previous Study</th>
              <th className="p-4 text-left text-sm font-semibold">Courses</th>
              <th className="p-4 text-left text-sm font-semibold">Status</th>
              <th className="p-4 text-left text-sm font-semibold">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  Loading applications...
                </td>
              </tr>
            ) : filteredApps.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
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
                        <p className="font-medium text-sm">{app.prev_campus_name}</p>
                        <p className="text-xs text-gray-500">{app.prev_programme_name}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                        {totalSubjects} course{totalSubjects !== 1 ? "s" : ""}
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

                        const order = [
                          "submitted",
                          "awaiting_sme",
                          "awaiting_hos",
                          "sme_approved",
                          "sme_rejected",
                          "approved",
                        ];
                        const items = order.filter(k => breakdown[k]).map(k => ({ status: k, count: breakdown[k] }));

                        return (
                          <div className="flex flex-col gap-1">
                            {items.map(item => (
                              <div key={item.status} className="flex items-center gap-2">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusColor(item.status)}`}>
                                  {getStatusLabel(item.status).toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {item.count} course{item.count !== 1 ? "s" : ""}
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