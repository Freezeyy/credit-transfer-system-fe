import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyCreditApplication } from "../../hooks/useCTApplication";

function deriveStudentStageForSubject(newSubject) {
  const statuses = (newSubject.pastApplicationSubjects || [])
    .map((p) => String(p.approval_status || "").toLowerCase())
    .filter(Boolean);

  // If coordinator already rejected, student needs to take action (reapply).
  if (statuses.includes("rejected")) return "action_required";

  const coordinatorSide = statuses.length > 0 && statuses.every((s) => s === "pending");
  return coordinatorSide ? "in_progress" : "under_review";
}

function getCoordinatorMessageForSubject(newSubject) {
  const pasts = newSubject.pastApplicationSubjects || [];
  const rejectedWithMsg = pasts.find(
    (p) => String(p.approval_status || "").toLowerCase() === "rejected" && (p.coordinator_notes || "").trim()
  );
  if (rejectedWithMsg) return rejectedWithMsg.coordinator_notes;
  return "";
}

function subjectCanReapply(newSubject) {
  const hasRejected = (newSubject.pastApplicationSubjects || []).some(
    (p) => String(p.approval_status || "").toLowerCase() === "rejected"
  );
  return hasRejected && !!getCoordinatorMessageForSubject(newSubject);
}

export default function HistoryTable() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      const res = await getMyCreditApplication();
      if (!mounted) return;
      if (!res.success) {
        setError("Failed to load applications");
        setApplications([]);
        setLoading(false);
        return;
      }
      const sorted = (res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setApplications(sorted);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    const out = [];
    for (const app of applications) {
      for (const ns of app.newApplicationSubjects || []) {
        out.push({
          ct_id: app.ct_id,
          program: app.program,
          application_subject_id: ns.application_subject_id,
          course: ns.course,
          stage: deriveStudentStageForSubject(ns),
          message: getCoordinatorMessageForSubject(ns),
          canReapply: subjectCanReapply(ns),
        });
      }
    }
    return out;
  }, [applications]);

  if (loading) return <div className="p-6">Loading...</div>;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Credit Transfer History</h1>

      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-left text-sm font-semibold">
              <th className="p-3 border">No.</th>
              <th className="p-3 border">Application</th>
              <th className="p-3 border">UniKL course</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Coordinator Message</th>
              <th className="p-3 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 border text-center text-gray-500">
                  No applications found.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={`${r.ct_id}-${r.application_subject_id}`} className="text-sm hover:bg-gray-50">
                  <td className="p-3 border">{idx + 1}</td>
                  <td className="p-3 border">
                    <div className="font-medium text-gray-900">CT #{r.ct_id}</div>
                    <div className="text-xs text-gray-600">
                      {r.program ? `${r.program.program_code} - ${r.program.program_name}` : "—"}
                    </div>
                  </td>
                  <td className="p-3 border">
                    {r.course ? `${r.course.course_code} - ${r.course.course_name}` : "—"}
                  </td>
                  <td className="p-3 border">
                    {r.stage === "action_required" ? (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        Action Required
                      </span>
                    ) : r.stage === "in_progress" ? (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        In Progress
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Under Review
                      </span>
                    )}
                  </td>
                  <td className="p-3 border">
                    <div className="text-gray-800 whitespace-pre-wrap">{r.message || "—"}</div>
                  </td>
                  <td className="p-3 border">
                    {r.canReapply ? (
                      <button
                        className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                        onClick={() =>
                          navigate(`/student/application?reapply=1&ct_id=${r.ct_id}&application_subject_id=${r.application_subject_id}`)
                        }
                      >
                        Reapply
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

