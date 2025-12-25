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
  getSMEsForCourse,
} from "../../hooks/useReviewApplication";

export default function ReviewApplication() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingSubject, setProcessingSubject] = useState(null);
  const [currentSubjectResults, setCurrentSubjectResults] = useState({});
  const [smeNotes, setSmeNotes] = useState({});
  const [selectedSMEs, setSelectedSMEs] = useState({}); // { applicationSubjectId: sme_id }
  const [availableSMEs, setAvailableSMEs] = useState({}); // { course_id: [smes] }
  const [loadingSMEs, setLoadingSMEs] = useState({});

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

  async function handleCheckTemplate3ForCurrentSubject(applicationSubjectId) {
    setProcessingSubject(applicationSubjectId);
    const res = await checkTemplate3ForCurrentSubject(applicationSubjectId);
    
    if (res.success) {
      setCurrentSubjectResults(prev => ({
        ...prev,
        [applicationSubjectId]: res.data
      }));
    } else {
      alert(res.message || "Failed to check Template3");
    }
    setProcessingSubject(null);
  }

  async function handleApproveAllTemplate3(applicationSubjectId) {
    if (!window.confirm("Approve all subjects for this course via Template3?")) return;
    
    setProcessingSubject(applicationSubjectId);
    const res = await approveAllViaTemplate3(applicationSubjectId);
    
    if (res.success) {
      alert(`All subjects approved via Template3!`);
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

  async function handleSendAllToSME(applicationSubjectId) {
    const notes = smeNotes[applicationSubjectId] || "";
    const selectedSMEId = selectedSMEs[applicationSubjectId] || null;
    
    if (!window.confirm(`Send ALL subjects for this course to SME for review?\n\nThis is required because one course needs multiple past subjects.${notes ? `\n\nNotes: ${notes}` : ""}`)) return;
    
    setProcessingSubject(applicationSubjectId);
    const res = await sendAllToSME(applicationSubjectId, notes, selectedSMEId);
    
    if (res.success) {
      alert("All subjects sent to SME!");
      loadApplication();
      setSmeNotes(prev => ({ ...prev, [applicationSubjectId]: "" }));
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
    } else {
      alert(res.message || "Failed to send to SME");
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
      case "needs_sme_review": return "bg-orange-100 text-orange-800";
      case "sme_approved": return "bg-blue-100 text-blue-800";
      case "sme_rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusText(status) {
    switch (status) {
      case "pending": return "Pending Review";
      case "approved_template3": return "✓ Approved (Template3)";
      case "needs_sme_review": return "⚠ Awaiting SME";
      case "sme_approved": return "✓ SME Approved";
      case "sme_rejected": return "✗ SME Rejected";
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

      {/* Subjects Review */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Subject Mappings</h2>

        {application.newApplicationSubjects?.map((subject, idx) => {
          const currentSubjectResult = currentSubjectResults[subject.application_subject_id];
          const isProcessingCurrentSubject = processingSubject === subject.application_subject_id;
          const hasPendingSubjects = subject.pastApplicationSubjects?.some(
            p => p.approval_status === "pending"
          ) || false;

          return (
          <div key={idx} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Current Subject Header */}
            <div className="bg-blue-50 p-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {subject.course?.course_code || subject.application_subject_name}
                    {' - '}
                    {subject.course?.course_name || subject.application_subject_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Current Program Subject
                    {subject.course?.course_credit && ` • ${subject.course.course_credit} credits`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {subject.pastApplicationSubjects?.length || 0} past subject(s) mapped
                  </p>
                </div>
                
                {/* Check Template3 Button for Current Subject */}
                {hasPendingSubjects && (
                  <div className="ml-4">
                    <button
                      onClick={() => handleCheckTemplate3ForCurrentSubject(subject.application_subject_id)}
                      disabled={isProcessingCurrentSubject}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                    >
                      {isProcessingCurrentSubject ? "Checking..." : "🔍 Check Template3 for All"}
                    </button>
                  </div>
                )}
              </div>

              {/* Template3 Results Summary */}
              {currentSubjectResult && (
                <div className={`mt-4 p-4 rounded-lg ${
                  currentSubjectResult.allMatch 
                    ? "bg-green-50 border border-green-200" 
                    : currentSubjectResult.someMatch
                    ? "bg-yellow-50 border border-yellow-200"
                    : "bg-red-50 border border-red-200"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {currentSubjectResult.allMatch 
                          ? "✓ All Subjects Match Template3" 
                          : currentSubjectResult.someMatch
                          ? "⚠ Some Subjects Match Template3"
                          : "✗ No Subjects Match Template3"}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {currentSubjectResult.matchedCount} of {currentSubjectResult.totalSubjects} subjects matched
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {currentSubjectResult.allMatch && (
                        <button
                          onClick={() => handleApproveAllTemplate3(subject.application_subject_id)}
                          disabled={isProcessingCurrentSubject}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                        >
                          ✓ Approve All
                        </button>
                      )}
                      <button
                        onClick={() => handleSendAllToSME(subject.application_subject_id)}
                        disabled={isProcessingCurrentSubject}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
                      >
                        → Send All to SME
                      </button>
                    </div>
                  </div>
                  
                  {/* SME Selection and Notes */}
                  <div className="mt-3 space-y-2">
                    {subject.course?.course_id && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Select SME (Optional - will use first available if not selected)
                        </label>
                        <select
                          value={selectedSMEs[subject.application_subject_id] || ""}
                          onChange={(e) => {
                            setSelectedSMEs(prev => ({
                              ...prev,
                              [subject.application_subject_id]: e.target.value || null
                            }));
                          }}
                          onFocus={() => {
                            if (subject.course?.course_id) {
                              loadSMEsForCourse(subject.course.course_id);
                            }
                          }}
                          className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                          disabled={isProcessingCurrentSubject}
                        >
                          <option value="">Auto-select (First Available SME)</option>
                          {loadingSMEs[subject.course?.course_id] ? (
                            <option disabled>Loading SMEs...</option>
                          ) : (
                            availableSMEs[subject.course?.course_id]?.map(sme => (
                              <option key={sme.sme_id} value={sme.sme_id}>
                                {sme.lecturer?.lecturer_name || `SME #${sme.sme_id}`}
                                {sme.lecturer?.lecturer_email && ` (${sme.lecturer.lecturer_email})`}
                              </option>
                            ))
                          )}
                        </select>
                        {availableSMEs[subject.course?.course_id]?.length === 0 && !loadingSMEs[subject.course?.course_id] && (
                          <p className="text-xs text-red-600 mt-1">No active SMEs found for this course</p>
                        )}
                      </div>
                    )}
                    <div>
                      <input
                        type="text"
                        placeholder="Notes for SME (optional)"
                        value={smeNotes[subject.application_subject_id] || ""}
                        onChange={(e) => setSmeNotes(prev => ({
                          ...prev,
                          [subject.application_subject_id]: e.target.value
                        }))}
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                        disabled={isProcessingCurrentSubject}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Past Subjects */}
            <div className="divide-y">
              {subject.pastApplicationSubjects?.map((pastSubject, pastIdx) => {
                const currentSubjectResultItem = currentSubjectResult?.results?.find(
                  r => r.pastSubject_id === pastSubject.pastSubject_id
                );

                return (
                  <div key={pastIdx} className="p-4">
                    {/* Past Subject Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {pastSubject.pastSubject_code}
                          </span>
                          <span className="font-medium">
                            {pastSubject.pastSubject_name}
                          </span>
                          <span className="text-sm text-gray-600">
                            Grade: <strong>{pastSubject.pastSubject_grade}</strong>
                          </span>
                        </div>
                        
                        {pastSubject.pastSubject_syllabus_path && (
                          <a
                            href={`${process.env.REACT_APP_API_ORIGIN || 'http://localhost:3000'}${pastSubject.pastSubject_syllabus_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            📄 View Syllabus
                          </a>
                        )}
                      </div>

                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        getStatusColor(pastSubject.approval_status)
                      }`}>
                        {getStatusText(pastSubject.approval_status)}
                      </span>
                    </div>

                    {/* Template3 Check Result */}
                    {currentSubjectResultItem && (
                      <div className={`mb-4 p-4 rounded-lg ${
                        currentSubjectResultItem?.hasMatch
                          ? "bg-green-50 border border-green-200" 
                          : "bg-yellow-50 border border-yellow-200"
                      }`}>
                        {currentSubjectResultItem?.hasMatch ? (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-green-600 font-semibold">✓ Template3 Match Found</span>
                              <span className="text-sm text-gray-600">
                                {currentSubjectResultItem?.template3?.similarity_percentage || 'N/A'}% similarity
                              </span>
                            </div>
                            <div className="text-sm space-y-1">
                              <p>
                                <strong>Maps to:</strong> {currentSubjectResultItem?.template3?.course?.course_code || 'N/A'} - {currentSubjectResultItem?.template3?.course?.course_name || 'N/A'}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="text-yellow-700">
                            <strong>⚠ No Template3 Match Found</strong>
                            <p className="text-sm mt-1">This subject needs SME review</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message if pending */}
                    {pastSubject.approval_status === "pending" && (
                      <div className="text-sm text-gray-500 italic">
                        {subject.pastApplicationSubjects?.length > 1 
                          ? "Use the 'Check Template3 for All' button above to check all subjects together"
                          : "Use the 'Check Template3 for All' button above to check this subject"}
                      </div>
                    )}

                    {/* Already processed message */}
                    {pastSubject.approval_status !== "pending" && (
                      <div className="text-sm text-gray-600 italic">
                        This subject has been {pastSubject.approval_status.replace(/_/g, " ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Review Summary</h3>
        <div className="text-sm space-y-1">
          <p>
            Total Subjects: {application.newApplicationSubjects?.reduce((acc, s) => 
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
    </div>
  );
}