import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCoordinatorApplications,
  // checkTemplate3,
  // approveViaTemplate3,
  // sendToSME,
  checkTemplate3ForCurrentSubject,
  approveAllViaTemplate3,
  sendAllToSME,
  rejectAll,
  getSMEsForCourse,
  sendToHos,
  getTemplate3Evaluation,
} from "../../hooks/useReviewApplication";
import { getMyProcessWindow } from "../../../admin/hooks/useProcessWindowManagement";

function SmeEvaluationModal({ mapping, evaluation, loading, error, onClose }) {
  const topics = evaluation?.topics_comparison || [];
  const pastColsCount =
    Array.isArray(topics) && topics.length > 0 && Array.isArray(topics[0]?.pastSubjectTopics)
      ? topics[0].pastSubjectTopics.length
      : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">SME Evaluation (Courses Comparison)</h3>
            <p className="text-sm text-gray-600 mt-1 truncate">
              {mapping?.old_subject_code || "—"} → {mapping?.new_subject_code || "—"}
              {mapping?.similarity_percentage != null ? ` (${mapping.similarity_percentage}%)` : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading evaluation...</div>
          ) : error ? (
            <div className="py-10 text-center text-red-700">{error}</div>
          ) : !evaluation ? (
            <div className="py-10 text-center text-gray-500">No evaluation data available.</div>
          ) : !Array.isArray(topics) || topics.length === 0 ? (
            <div className="space-y-4">
              {evaluation?.sme_review_notes && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-700 mb-1">SME Notes</div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{evaluation.sme_review_notes}</div>
                </div>
              )}
              <div className="py-10 text-center text-gray-500">
                No stored topics comparison for this evaluation yet.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluation?.sme_review_notes && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-700 mb-1">SME Notes</div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{evaluation.sme_review_notes}</div>
                </div>
              )}

              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left w-14">No.</th>
                      <th className="p-3 text-left min-w-[260px]">UniKL course topics</th>
                      {Array.from({ length: pastColsCount }).map((_, idx) => (
                        <th key={idx} className="p-3 text-left min-w-[260px]">
                          Previous course topics{pastColsCount > 1 ? ` ${idx + 1}` : ""}
                        </th>
                      ))}
                      <th className="p-3 text-left w-40">% Similarity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topics.map((row, i) => (
                      <tr key={i} className="hover:bg-white">
                        <td className="p-3 text-gray-600">{i + 1}</td>
                        <td className="p-3">
                          <div className="text-gray-900">{row.newSubjectTopic || "—"}</div>
                        </td>
                        {Array.from({ length: pastColsCount }).map((_, idx) => (
                          <td key={idx} className="p-3">
                            <div className="text-gray-900">{row.pastSubjectTopics?.[idx]?.topic || "—"}</div>
                          </td>
                        ))}
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {typeof row.similarityPercentage === "number"
                              ? row.similarityPercentage
                              : (row.similarityPercentage ?? "—")}
                            %
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReviewApplication() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingSubject, setProcessingSubject] = useState(null);
  const [currentSubjectResults, setCurrentSubjectResults] = useState({});
  const [selectedSMEs, setSelectedSMEs] = useState({}); // { applicationSubjectId: sme_id }
  const [availableSMEs, setAvailableSMEs] = useState({}); // { course_id: [smes] }
  const [loadingSMEs, setLoadingSMEs] = useState({});
  const [showSMEModal, setShowSMEModal] = useState(null); // applicationSubjectId when modal is open
  const [selectedSubjects, setSelectedSubjects] = useState({}); // { applicationSubjectId: true }
  const [sendingToHos, setSendingToHos] = useState(false);
  const [processClosed, setProcessClosed] = useState(false);
  const [noteModal, setNoteModal] = useState(null); // { title, notes }
  const [showSmeEval, setShowSmeEval] = useState(false);
  const [smeEvalLoading, setSmeEvalLoading] = useState(false);
  const [smeEvalError, setSmeEvalError] = useState("");
  const [smeEvalMapping, setSmeEvalMapping] = useState(null);
  const [smeEvaluation, setSmeEvaluation] = useState(null);

  // Use useCallback to memoize loadApplication
  const loadApplication = useCallback(async () => {
    setLoading(true);
    const res = await getCoordinatorApplications();
    if (res.success) {
      const app = res.data.find(a => a.ct_id === parseInt(applicationId));
      setApplication(app);
    }
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  useEffect(() => {
    async function checkWindow() {
      try {
        const w = await getMyProcessWindow();
        const now = Date.now();
        const start = w.ct_start_at ? new Date(w.ct_start_at).getTime() : null;
        const end = w.ct_end_at ? new Date(w.ct_end_at).getTime() : null;
        const open = (start == null || now >= start) && (end == null || now <= end);
        setProcessClosed(!open);
      } catch {
        // default open
      }
    }
    checkWindow();
  }, []);

  const isSubjectEligibleForHos = useCallback((subject) => {
    const pasts = subject?.pastApplicationSubjects || [];
    if (!pasts || pasts.length === 0) return false;
    return pasts.every(p => ["approved_template3", "approved_sme"].includes(p.approval_status));
  }, []);

  const eligibleSubjectIds = useCallback(() => {
    const list = application?.newApplicationSubjects || [];
    return list
      .filter(isSubjectEligibleForHos)
      .map(s => s.application_subject_id);
  }, [application, isSubjectEligibleForHos]);

  const allEligibleSelected = useCallback(() => {
    const eligible = eligibleSubjectIds();
    if (eligible.length === 0) return false;
    return eligible.every(id => !!selectedSubjects[id]);
  }, [eligibleSubjectIds, selectedSubjects]);

  async function handleSendSelectedToHos() {
    if (processClosed) {
      alert("Process window is closed. This page is read-only right now.");
      return;
    }
    const ids = eligibleSubjectIds().filter(id => selectedSubjects[id]);
    if (ids.length === 0) {
      alert("Please select at least one approved course to send to HOS.");
      return;
    }
    if (!window.confirm(`Send ${ids.length} approved course(s) to Head of Section?`)) return;

    setSendingToHos(true);
    const res = await sendToHos(application.ct_id, ids);
    if (res.success) {
      alert(res.data?.message || "Sent to HOS");
      // clear selection for those sent
      setSelectedSubjects(prev => {
        const next = { ...prev };
        ids.forEach(id => delete next[id]);
        return next;
      });
    } else {
      alert(res.message || "Failed to send to HOS");
    }
    setSendingToHos(false);
  }

  // Automatically check Template3 for all subjects when application loads
  useEffect(() => {
    if (application?.newApplicationSubjects) {
      const checkAllTemplate3 = async () => {
        for (const subject of application.newApplicationSubjects) {
          // Only check if there are pending subjects
          const hasPendingSubjects = subject.pastApplicationSubjects?.some(
            p => p.approval_status === "pending"
          );
          
          if (hasPendingSubjects && subject.application_subject_id) {
            const res = await checkTemplate3ForCurrentSubject(subject.application_subject_id);
            if (res.success) {
              setCurrentSubjectResults(prev => ({
                ...prev,
                [subject.application_subject_id]: res.data
              }));
            }
          }
        }
      };
      
      checkAllTemplate3();
    }
  }, [application]);

  // async function handleCheckTemplate3ForCurrentSubject(applicationSubjectId) {
  //   setProcessingSubject(applicationSubjectId);
  //   const res = await checkTemplate3ForCurrentSubject(applicationSubjectId);
    
  //   if (res.success) {
  //     setCurrentSubjectResults(prev => ({
  //       ...prev,
  //       [applicationSubjectId]: res.data
  //     }));
  //   } else {
  //     alert(res.message || "Failed to check Template3");
  //   }
  //   setProcessingSubject(null);
  // }

  async function handleApproveAllTemplate3(applicationSubjectId) {
    if (processClosed) {
      alert("Process window is closed. This page is read-only right now.");
      return;
    }
    if (!window.confirm("Approve previous courses for this UniKL course via Template3?")) return;
    
    setProcessingSubject(applicationSubjectId);
    const res = await approveAllViaTemplate3(applicationSubjectId);
    
    if (res.success) {
      alert(`All courses approved via Template3!`);
      loadApplication();
      setCurrentSubjectResults(prev => {
        const updated = { ...prev };
        delete updated[applicationSubjectId];
        return updated;
      });
    } else {
      alert(res.message || "Failed to approve");
    }
    setProcessingSubject(null);
  }

  async function loadSMEsForCourse(courseId) {
    if (!courseId || availableSMEs[courseId]) return; // Already loaded
    
    setLoadingSMEs(prev => ({ ...prev, [courseId]: true }));
    const res = await getSMEsForCourse(courseId);
    if (res.success) {
      setAvailableSMEs(prev => ({ ...prev, [courseId]: res.data }));
    }
    setLoadingSMEs(prev => ({ ...prev, [courseId]: false }));
  }

  function handleOpenSMEModal(applicationSubjectId, courseId) {
    if (processClosed) {
      alert("Process window is closed. This page is read-only right now.");
      return;
    }
    setShowSMEModal(applicationSubjectId);
    // Load SMEs if not already loaded
    if (courseId && !availableSMEs[courseId]) {
      loadSMEsForCourse(courseId);
    }
  }

  function handleCloseSMEModal() {
    setShowSMEModal(null);
  }

  async function handleSendAllToSME(applicationSubjectId) {
    if (processClosed) {
      alert("Process window is closed. This page is read-only right now.");
      return;
    }
    const selectedSMEId = selectedSMEs[applicationSubjectId] || null;
    
    if (!window.confirm(`Send courses for this UniKL course to SME for review?\n\nThis is required because one UniKL course needs multiple previous courses.`)) return;
    
    setProcessingSubject(applicationSubjectId);
    const res = await sendAllToSME(applicationSubjectId, selectedSMEId);
    
    if (res.success) {
      alert("All courses sent to SME!");
      loadApplication();
      setSelectedSMEs(prev => {
        const updated = { ...prev };
        delete updated[applicationSubjectId];
        return updated;
      });
      setCurrentSubjectResults(prev => {
        const updated = { ...prev };
        delete updated[applicationSubjectId];
        return updated;
      });
      handleCloseSMEModal();
    } else {
      alert(res.message || "Failed to send to SME");
    }
    setProcessingSubject(null);
  }

  async function handleRejectAll(applicationSubjectId) {
    if (processClosed) {
      alert("Process window is closed. This page is read-only right now.");
      return;
    }
    const message = window.prompt("Enter rejection message to student (required):", "");
    if (!message || !message.trim()) return;
    
    setProcessingSubject(applicationSubjectId);
    const res = await rejectAll(applicationSubjectId, message.trim());
    
    if (res.success) {
      alert("Courses rejected!");
      loadApplication();
      setCurrentSubjectResults(prev => {
        const updated = { ...prev };
        delete updated[applicationSubjectId];
        return updated;
      });
    } else {
      alert(res.message || "Failed to reject");
    }
    setProcessingSubject(null);
  }

  // Removed unused functions that were causing ESLint errors:
  // - handleCheckTemplate3
  // - handleApproveTemplate3
  // - handleSendToSME

  function getStatusColor(status) {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved_template3": return "bg-green-100 text-green-800";
      case "approved_sme": return "bg-green-100 text-green-800";
      case "needs_sme_review": return "bg-orange-100 text-orange-800";
      case "sme_reviewed_rejected": return "bg-red-100 text-red-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "hos_pending": return "bg-blue-100 text-blue-800";
      case "hos_approved": return "bg-green-100 text-green-800";
      case "hos_rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusText(status, pastSubject = null) {
    switch (status) {
      case "pending": return "Pending Review";
      case "approved_template3": return "✓ Approved (Template3)";
      case "approved_sme": return "✓ Approved (SME)";
      case "needs_sme_review":
        // If a Template3 mapping already exists, this is NOT "SME is evaluating".
        // It means the mapping is already known and should be treated as Template3-approved.
        if (pastSubject?.template3_id) return "✓ Approved (Template3)";
        return "SME is evaluating";
      case "rejected": return "✗ Rejected";
      case "sme_reviewed_rejected": return "SME reviewed (below 80%)";
      case "hos_pending": return "Sent to HOS (pending)";
      case "hos_approved": return "✓ Approved (HOS)";
      case "hos_rejected": return "✗ Rejected (HOS)";
      default: return status;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading application...</div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-lg">Application not found</div>
        <button
          onClick={() => navigate("/coordinator/application")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Back to Applications
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {processClosed && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
          Process window is closed for your campus. This page is read-only.
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate("/coordinator/application")}
            className="text-blue-600 hover:underline mb-2"
          >
            ← Back to Applications
          </button>
          <h1 className="text-2xl font-bold">
            Review Application #{application.ct_id}
          </h1>
        </div>
        <span className={`px-4 py-2 rounded-lg font-semibold ${
          application.ct_status === "submitted" ? "bg-yellow-100 text-yellow-800" :
          application.ct_status === "approved" ? "bg-green-100 text-green-800" :
          "bg-blue-100 text-blue-800"
        }`}>
          {application.ct_status.toUpperCase()}
        </span>
      </div>

      {/* Student & Program Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Application Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Student Name</p>
            <p className="font-medium">{application.student?.student_name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Student Email</p>
            <p className="font-medium">{application.student?.student_email || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Program</p>
            <p className="font-medium">
              {application.program?.program_name} ({application.program?.program_code})
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Previous Institution</p>
            <p className="font-medium">{application.prev_campus_name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Previous Programme</p>
            <p className="font-medium">{application.prev_programme_name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Transcript</p>
            {application.transcript_path ? (
              <a
                href={`${process.env.REACT_APP_API_ORIGIN || 'http://localhost:3000'}${application.transcript_path}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                View Transcript →
              </a>
            ) : (
              <p className="text-gray-400">Not provided</p>
            )}
          </div>
        </div>
      </div>

      {/* Courses review */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Application Courses</h2>

        {/* Table for course mappings */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between gap-4 flex-wrap">
            <div className="text-sm text-gray-600">
              Select approved courses and send to Head of Section.
            </div>
            <button
              onClick={handleSendSelectedToHos}
              disabled={sendingToHos || processClosed}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {sendingToHos ? "Sending..." : "Send to HOS"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-4 text-center text-sm font-semibold w-16">No.</th>
                  <th className="p-4 text-center text-sm font-semibold w-16">
                    <input
                      type="checkbox"
                      checked={allEligibleSelected()}
                      disabled={processClosed}
                      onChange={(e) => {
                        const eligible = eligibleSubjectIds();
                        if (eligible.length === 0) return;
                        if (e.target.checked) {
                          setSelectedSubjects(prev => {
                            const next = { ...prev };
                            eligible.forEach(id => { next[id] = true; });
                            return next;
                          });
                        } else {
                          setSelectedSubjects(prev => {
                            const next = { ...prev };
                            eligible.forEach(id => { delete next[id]; });
                            return next;
                          });
                        }
                      }}
                      title="Tick all eligible approved courses"
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-semibold">UniKL course</th>
                  <th className="p-4 text-left text-sm font-semibold">Previous course</th>
                  <th className="p-4 text-left text-sm font-semibold">Grade</th>
                  <th className="p-4 text-left text-sm font-semibold">Status</th>
                  <th className="p-4 text-left text-sm font-semibold">SME</th>
                  <th className="p-4 text-left text-sm font-semibold">Note</th>
                  <th className="p-4 text-left text-sm font-semibold">Mappings</th>
                  <th className="p-4 text-left text-sm font-semibold">Syllabus</th>
                  <th className="p-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {application.newApplicationSubjects?.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-gray-500">
                      No application courses found
                    </td>
                  </tr>
                ) : (
                  application.newApplicationSubjects?.map((subject, idx) => {
          const currentSubjectResult = currentSubjectResults[subject.application_subject_id];
          const isProcessingCurrentSubject = processingSubject === subject.application_subject_id;
          const hasHosStage = (subject.pastApplicationSubjects || []).some(p =>
            ["hos_pending", "hos_approved", "hos_rejected"].includes(String(p.approval_status || "").toLowerCase())
          );
          const eligibleForHos = isSubjectEligibleForHos(subject) && !hasHosStage;
                    
                    const subjectSmeNotes =
                      (subject.pastApplicationSubjects || []).find((p) => (p.sme_review_notes || "").trim())
                        ?.sme_review_notes || "";

                    return subject.pastApplicationSubjects?.map((pastSubject, pastIdx) => {
                      const currentSubjectResultItem = currentSubjectResult?.results?.find(
                        r => r.pastSubject_id === pastSubject.pastSubject_id
                      );
                      // Check if Template3 match exists (either from current check or from existing template3_id)
                      const hasTemplate3Match = currentSubjectResultItem?.hasMatch || 
                        (pastSubject.template3_id && pastSubject.approval_status === "approved_template3");
                      const isFirstPastSubject = pastIdx === 0;
                      const isLastPastSubject =
                        pastIdx === ((subject.pastApplicationSubjects?.length || 1) - 1);
                      const dividerClass = pastIdx > 0 ? "border-t border-gray-200" : "";
                      const subjectRowSeparatorClass = isLastPastSubject ? "border-b-2 border-gray-200" : "";
                      const smeAssignment =
                        (subject.smeAssignments || [])
                          .slice()
                          .sort((a, b) => {
                            const ta = a?.assigned_at ? new Date(a.assigned_at).getTime() : 0;
                            const tb = b?.assigned_at ? new Date(b.assigned_at).getTime() : 0;
                            return tb - ta;
                          })[0] || null;
                      const smeName =
                        smeAssignment?.subjectMethodExpert?.lecturer?.lecturer_name ||
                        (smeAssignment?.sme_id ? `SME #${smeAssignment.sme_id}` : "—");
                      const smeDecidedPasts = (subject.pastApplicationSubjects || []).filter((p) => {
                        const st = String(p.approval_status || "").toLowerCase();
                        return st === "approved_sme" || st === "sme_reviewed_rejected";
                      });
                      const canViewSmeEvaluation = smeDecidedPasts.length > 0;
                      const template3IdForEval =
                        smeDecidedPasts.find((p) => p.template3_id)?.template3_id || null;

          return (
                        <tr
                          key={`${subject.application_subject_id}-${pastSubject.pastSubject_id}`}
                          className={`${
                            hasTemplate3Match 
                              ? "bg-green-50 hover:bg-green-100" 
                              : "hover:bg-gray-50"
                          } ${subjectRowSeparatorClass} transition-colors`}
                        >
                          {/* Index (per current subject) */}
                          {isFirstPastSubject && (
                            <td
                              className={`p-4 align-middle text-center text-sm text-gray-600 ${subjectRowSeparatorClass}`}
                              rowSpan={subject.pastApplicationSubjects?.length || 1}
                            >
                              {idx + 1}
                            </td>
                          )}
                          {/* Select (per current subject) */}
                          {isFirstPastSubject && (
                            <td
                              className={`p-4 align-middle text-center ${subjectRowSeparatorClass}`}
                              rowSpan={subject.pastApplicationSubjects?.length || 1}
                            >
                              <input
                                type="checkbox"
                                disabled={!eligibleForHos || processClosed}
                                checked={!!selectedSubjects[subject.application_subject_id]}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectedSubjects(prev => {
                                    const next = { ...prev };
                                    if (checked) next[subject.application_subject_id] = true;
                                    else delete next[subject.application_subject_id];
                                    return next;
                                  });
                                }}
                                title={
                                  eligibleForHos
                                    ? "Select to send to HOS"
                                    : hasHosStage
                                      ? "Already sent to HOS / decided"
                                      : "Only fully approved courses can be sent to HOS"
                                }
                              />
                            </td>
                          )}

                          {/* UniKL course — one cell for the whole group */}
                          {isFirstPastSubject && (
                            <td
                              className={`p-4 align-middle ${subjectRowSeparatorClass}`}
                              rowSpan={subject.pastApplicationSubjects?.length || 1}
                            >
                              <div className="text-center">
                                <p className="font-semibold text-sm">
                                  {subject.course?.course_code || subject.application_subject_name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {subject.course?.course_name || subject.application_subject_name}
                                </p>
                                {subject.course?.course_credit && (
                                  <p className="text-xs text-gray-500">
                                    {subject.course.course_credit} credits
                                  </p>
                                )}
                              </div>
                            </td>
                          )}
                          
                          {/* Previous course */}
                          <td className={`p-4 ${dividerClass} ${subjectRowSeparatorClass}`}>
                            <div>
                              <p className="font-mono text-sm font-medium">
                                {pastSubject.pastSubject_code}
                              </p>
                              <p className="text-sm text-gray-700">
                                {pastSubject.pastSubject_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {pastSubject.pastSubject_credit} credits
                              </p>
                        </div>
                          </td>
                          
                          {/* Grade */}
                          <td className={`p-4 ${dividerClass} ${subjectRowSeparatorClass}`}>
                            <span className="font-semibold text-sm">
                              {pastSubject.pastSubject_grade || "N/A"}
                            </span>
                          </td>
                          
                          {/* Status */}
                          <td className={`p-4 ${dividerClass} ${subjectRowSeparatorClass}`}>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                getStatusColor(String(pastSubject.approval_status || "").toLowerCase())
                              }`}
                            >
                              {getStatusText(String(pastSubject.approval_status || "").toLowerCase(), pastSubject)}
                            </span>
                          </td>

                          {/* SME (per current subject - rowSpan) */}
                          {isFirstPastSubject && (
                            <td
                              className={`p-4 align-middle ${subjectRowSeparatorClass}`}
                              rowSpan={subject.pastApplicationSubjects?.length || 1}
                            >
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">{smeName}</p>
                                {smeAssignment?.subjectMethodExpert?.lecturer?.lecturer_email && (
                                  <p className="text-xs text-gray-500">
                                    {smeAssignment.subjectMethodExpert.lecturer.lecturer_email}
                                  </p>
                                )}
                                {smeAssignment?.assignment_status && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {String(smeAssignment.assignment_status).replace(/_/g, " ")}
                                  </p>
                                )}
                                {canViewSmeEvaluation && (
                                  <button
                                    type="button"
                                    className="mt-2 inline-flex items-center text-xs font-medium text-indigo-700 hover:text-indigo-900 underline"
                                    onClick={async () => {
                                      // Try to show the same evaluation view used in Template3 (topics comparison).
                                      // This is only available when a Template3 mapping exists (approved SME).
                                      setSmeEvalMapping({
                                        old_subject_code: smeDecidedPasts[0]?.pastSubject_code,
                                        new_subject_code: subject.course?.course_code || subject.application_subject_name,
                                        similarity_percentage: smeDecidedPasts[0]?.similarity_percentage,
                                      });
                                      setSmeEvaluation(null);
                                      setSmeEvalError("");
                                      setShowSmeEval(true);

                                      if (!template3IdForEval) {
                                        // SME rejected path: we don't have Template3 topics_comparison stored.
                                        const p = smeDecidedPasts[0] || {};
                                        setSmeEvalError("No topics comparison stored for this SME decision.");
                                        setSmeEvaluation({
                                          sme_review_notes: (p.sme_review_notes || "").trim() || null,
                                          topics_comparison: [],
                                        });
                                        return;
                                      }

                                      setSmeEvalLoading(true);
                                      const res = await getTemplate3Evaluation(template3IdForEval);
                                      if (res.success) setSmeEvaluation(res.data);
                                      else setSmeEvalError(res.message || "Failed to load evaluation");
                                      setSmeEvalLoading(false);
                                    }}
                                  >
                                    View evaluation
                                  </button>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Note (SME) - one per current subject (rowSpan) */}
                          {isFirstPastSubject && (
                            <td className={`p-4 align-middle text-center ${subjectRowSeparatorClass}`} rowSpan={subject.pastApplicationSubjects?.length || 1}>
                              {subjectSmeNotes ? (
                                <button
                                  type="button"
                                  className="text-blue-600 hover:text-blue-800"
                                  title="View SME notes"
                                  onClick={() =>
                                    setNoteModal({
                                      title: `SME Notes — ${subject.course?.course_code || subject.application_subject_name || "Course"}`,
                                      notes: subjectSmeNotes,
                                    })
                                  }
                                >
                                  📎
                                </button>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          )}
                          
                          {/* Template3 Match */}
                          <td className={`p-4 ${dividerClass} ${subjectRowSeparatorClass}`}>
                            {hasTemplate3Match ? (
                              <div className="text-sm">
                                <p className="text-green-600 font-semibold">✓ Match Found</p>
                                {currentSubjectResultItem?.template3 && (
                                  <>
                                    <p className="text-xs text-gray-600">
                                      {currentSubjectResultItem.template3.similarity_percentage || 'N/A'}% similarity
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Maps to: {currentSubjectResultItem.template3.course?.course_code || 'N/A'}
                                    </p>
                                  </>
                                )}
                                {(() => {
                                  const t3id =
                                    currentSubjectResultItem?.template3?.template3_id ||
                                    pastSubject.template3_id ||
                                    null;
                                  if (!t3id) return null;
                                  return (
                                    <button
                                      type="button"
                                      className="mt-2 inline-flex items-center text-xs font-medium text-indigo-700 hover:text-indigo-900 underline"
                                      onClick={async () => {
                                        setSmeEvalMapping({
                                          old_subject_code: pastSubject.pastSubject_code,
                                          new_subject_code: subject.course?.course_code || subject.application_subject_name,
                                          similarity_percentage:
                                            currentSubjectResultItem?.template3?.similarity_percentage ??
                                            pastSubject.similarity_percentage ??
                                            null,
                                        });
                                        setSmeEvaluation(null);
                                        setSmeEvalError("");
                                        setShowSmeEval(true);
                                        setSmeEvalLoading(true);
                                        const res = await getTemplate3Evaluation(t3id);
                                        if (res.success) setSmeEvaluation(res.data);
                                        else setSmeEvalError(res.message || "Failed to load evaluation");
                                        setSmeEvalLoading(false);
                                      }}
                                    >
                                      View evaluation
                                    </button>
                                  );
                                })()}
                                {pastSubject.approval_status === "approved_template3" && !currentSubjectResultItem && (
                                  <p className="text-xs text-gray-500 mt-1">Previously approved</p>
                        )}
                      </div>
                            ) : currentSubjectResultItem ? (
                              <p className="text-sm text-yellow-600 font-medium">⚠ No Match</p>
                            ) : (
                              <p className="text-sm text-gray-400">No Match Found</p>
                            )}
                          </td>
                          
                          {/* Syllabus */}
                          <td className={`p-4 ${dividerClass} ${subjectRowSeparatorClass}`}>
                            {pastSubject.pastSubject_syllabus_path ? (
                              <a
                                href={`${process.env.REACT_APP_API_ORIGIN || 'http://localhost:3000'}${pastSubject.pastSubject_syllabus_path}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                📄 View
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </td>
                          
                          {/* Actions */}
                          {isFirstPastSubject && (
                            <td
                              className={`p-4 align-middle ${subjectRowSeparatorClass}`}
                              rowSpan={subject.pastApplicationSubjects?.length || 1}
                            >
                              <div className="flex flex-col gap-2 items-center">
                                {/* Approve Button - only show if Template3 match found */}
                                {hasTemplate3Match && pastSubject.approval_status === "pending" && (
                                  <button
                                    onClick={() => handleApproveAllTemplate3(subject.application_subject_id)}
                                    disabled={isProcessingCurrentSubject || processClosed}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                                    title="Approve previous courses for this UniKL course via Template3"
                                  >
                                    ✓ Approve
                                  </button>
                                )}
                                
                                {/* Reject Button */}
                                {(pastSubject.approval_status === "pending" || pastSubject.approval_status === "sme_reviewed_rejected") && (
                                  <button
                                    onClick={() => handleRejectAll(subject.application_subject_id)}
                                    disabled={isProcessingCurrentSubject || processClosed}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                                    title="Reject previous courses for this UniKL course"
                                  >
                                    ✗ Reject
                                  </button>
                                )}
                                
                                {/* Send to SME Button (only when there is something to send) */}
                                {(() => {
                                  const statuses = (subject.pastApplicationSubjects || []).map(p =>
                                    String(p.approval_status || "").toLowerCase()
                                  );
                                  const hasHosStage = statuses.some(s =>
                                    ["hos_pending", "hos_approved", "hos_rejected"].includes(s)
                                  );
                                  const isEvaluating = statuses.some(s => s === "needs_sme_review");
                                  const allApprovedBySme = statuses.length > 0 && statuses.every(s => s === "approved_sme");
                                  const shouldShow = !hasHosStage && !isEvaluating && !allApprovedBySme;
                                  return shouldShow ? (
                                  <button
                                    onClick={() => handleOpenSMEModal(subject.application_subject_id, subject.course?.course_id)}
                                    disabled={isProcessingCurrentSubject}
                                    className="px-3 py-1.5 bg-orange-600 text-white rounded text-xs font-medium hover:bg-orange-700 disabled:opacity-50"
                                    title="Send courses for this UniKL course to SME"
                                  >
                                    → Send to SME
                                  </button>
                                  ) : null;
                                })()}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    });
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Review Summary</h3>
        <div className="text-sm space-y-1">
          <p>
            Total Courses: {application.newApplicationSubjects?.reduce((acc, s) => 
              acc + (s.pastApplicationSubjects?.length || 0), 0
            )}
          </p>
          <p>
            Pending: {application.newApplicationSubjects?.reduce((acc, s) => 
              acc + (s.pastApplicationSubjects?.filter(p => p.approval_status === "pending").length || 0), 0
            )}
          </p>
          <p>
            Approved: {application.newApplicationSubjects?.reduce((acc, s) => 
              acc + (s.pastApplicationSubjects?.filter(p => p.approval_status === "approved_template3").length || 0), 0
            )}
          </p>
          <p>
            Awaiting SME: {application.newApplicationSubjects?.reduce((acc, s) => 
              acc + (s.pastApplicationSubjects?.filter(p => p.approval_status === "needs_sme_review").length || 0), 0
            )}
          </p>
        </div>
      </div>

      {/* SME Selection Modal */}
      {showSMEModal && (() => {
        const subject = application.newApplicationSubjects?.find(
          s => s.application_subject_id === showSMEModal
        );
        if (!subject) return null;
        const courseId = subject.course?.course_id;
        const isProcessing = processingSubject === showSMEModal;

        return (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleCloseSMEModal}
          >
            <div 
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Send to SME</h3>
                <button
                  onClick={handleCloseSMEModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  disabled={isProcessing}
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">UniKL course</p>
                  <p className="font-medium">
                    {subject.course?.course_code || subject.application_subject_name} - {subject.course?.course_name || subject.application_subject_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {subject.pastApplicationSubjects?.length || 0} previous course(s) will be sent for review
                  </p>
                </div>

                {courseId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select SME
                    </label>
                    <select
                      value={selectedSMEs[showSMEModal] || ""}
                      onChange={(e) => {
                        setSelectedSMEs(prev => ({
                          ...prev,
                          [showSMEModal]: e.target.value || null
                        }));
                      }}
                      className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                      disabled={isProcessing}
                    >
                      <option value="">Auto-select (First Available SME)</option>
                      {loadingSMEs[courseId] ? (
                        <option disabled>Loading SMEs...</option>
                      ) : (
                        availableSMEs[courseId]?.map(sme => (
                          <option key={sme.sme_id} value={sme.sme_id}>
                            {sme.lecturer?.lecturer_name || `SME #${sme.sme_id}`}
                            {sme.lecturer?.lecturer_email && ` (${sme.lecturer.lecturer_email})`}
                          </option>
                        ))
                      )}
                    </select>
                    {availableSMEs[courseId]?.length === 0 && !loadingSMEs[courseId] && (
                      <p className="text-xs text-red-600 mt-1">No active SMEs found for this course</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCloseSMEModal}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSendAllToSME(showSMEModal)}
                    disabled={isProcessing || processClosed}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
                  >
                    {isProcessing ? "Sending..." : "Send to SME"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SME Notes Modal */}
      {noteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setNoteModal(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-3 mb-3">
              <h3 className="text-lg font-semibold">{noteModal.title}</h3>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                onClick={() => setNoteModal(null)}
              >
                ×
              </button>
            </div>
            <div className="bg-gray-50 border rounded p-3 text-sm whitespace-pre-wrap text-gray-800 max-h-[60vh] overflow-auto">
              {noteModal.notes}
            </div>
          </div>
        </div>
      )}

      {showSmeEval && (
        <SmeEvaluationModal
          mapping={smeEvalMapping}
          evaluation={smeEvaluation}
          loading={smeEvalLoading}
          error={smeEvalError}
          onClose={() => {
            setShowSmeEval(false);
            setSmeEvalLoading(false);
            setSmeEvalError("");
            setSmeEvalMapping(null);
            setSmeEvaluation(null);
          }}
        />
      )}
    </div>
  );
}