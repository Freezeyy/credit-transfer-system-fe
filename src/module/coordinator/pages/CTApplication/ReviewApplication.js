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
  const [showSMEModal, setShowSMEModal] = useState(null); // applicationSubjectId when modal is open

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

  function handleOpenSMEModal(applicationSubjectId, courseId) {
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
      handleCloseSMEModal();
    } else {
      alert(res.message || "Failed to send to SME");
    }
    setProcessingSubject(null);
  }

  async function handleRejectAll(applicationSubjectId) {
    if (!window.confirm("Reject all subjects for this course? This action cannot be undone.")) return;
    
    setProcessingSubject(applicationSubjectId);
    const res = await rejectAll(applicationSubjectId, "Rejected by coordinator");
    
    if (res.success) {
      alert("Subjects rejected!");
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
        <h2 className="text-lg font-semibold">Application Subjects</h2>

        {/* Table for Subject Mappings */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold">Current Subject</th>
                  <th className="p-4 text-left text-sm font-semibold">Past Subject</th>
                  <th className="p-4 text-left text-sm font-semibold">Grade</th>
                  <th className="p-4 text-left text-sm font-semibold">Status</th>
                  <th className="p-4 text-left text-sm font-semibold">Mappings</th>
                  <th className="p-4 text-left text-sm font-semibold">Syllabus</th>
                  <th className="p-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {application.newApplicationSubjects?.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      No application subjects found
                    </td>
                  </tr>
                ) : (
                  application.newApplicationSubjects?.map((subject, idx) => {
          const currentSubjectResult = currentSubjectResults[subject.application_subject_id];
          const isProcessingCurrentSubject = processingSubject === subject.application_subject_id;
                    
                    return subject.pastApplicationSubjects?.map((pastSubject, pastIdx) => {
                      const currentSubjectResultItem = currentSubjectResult?.results?.find(
                        r => r.pastSubject_id === pastSubject.pastSubject_id
                      );
                      // Check if Template3 match exists (either from current check or from existing template3_id)
                      const hasTemplate3Match = currentSubjectResultItem?.hasMatch || 
                        (pastSubject.template3_id && pastSubject.approval_status === "approved_template3");
                      const isFirstPastSubject = pastIdx === 0;

          return (
                        <tr
                          key={`${subject.application_subject_id}-${pastSubject.pastSubject_id}`}
                          className={`${
                            hasTemplate3Match 
                              ? "bg-green-50 hover:bg-green-100" 
                              : "hover:bg-gray-50"
                          } transition-colors`}
                        >
                          {/* Current Subject - only show on first row */}
                          <td className="p-4">
                            {isFirstPastSubject && (
                      <div>
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
                    )}
                          </td>
                          
                          {/* Past Subject */}
                          <td className="p-4">
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
                          <td className="p-4">
                            <span className="font-semibold text-sm">
                              {pastSubject.pastSubject_grade || "N/A"}
                            </span>
                          </td>
                          
                          {/* Status */}
                          <td className="p-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(pastSubject.approval_status)
                      }`}>
                        {getStatusText(pastSubject.approval_status)}
                      </span>
                          </td>
                          
                          {/* Template3 Match */}
                          <td className="p-4">
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
                          <td className="p-4">
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
                          <td className="p-4">
                            <div className="flex flex-col gap-2">
                              {/* Action buttons - only show for first past subject of each current subject */}
                              {isFirstPastSubject && (
                                <>
                                  {/* Approve Button - only show if Template3 match found */}
                                  {hasTemplate3Match && pastSubject.approval_status === "pending" && (
                                    <button
                                      onClick={() => handleApproveAllTemplate3(subject.application_subject_id)}
                                      disabled={isProcessingCurrentSubject}
                                      className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                                      title="Approve all subjects for this course via Template3"
                                    >
                                      ✓ Approve All
                                    </button>
                                  )}
                                  
                                  {/* Reject Button */}
                    {pastSubject.approval_status === "pending" && (
                                    <button
                                      onClick={() => handleRejectAll(subject.application_subject_id)}
                                      disabled={isProcessingCurrentSubject}
                                      className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                                      title="Reject all subjects for this course"
                                    >
                                      ✗ Reject All
                                    </button>
                                  )}
                                  
                                  {/* Send to SME Button */}
                                  <button
                                    onClick={() => handleOpenSMEModal(subject.application_subject_id, subject.course?.course_id)}
                                    disabled={isProcessingCurrentSubject}
                                    className="px-3 py-1.5 bg-orange-600 text-white rounded text-xs font-medium hover:bg-orange-700 disabled:opacity-50"
                                    title="Send all subjects for this course to SME"
                                  >
                                    → Send to SME
                                  </button>
                                </>
                    )}
                  </div>
                          </td>
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
                  <p className="text-sm text-gray-600 mb-2">Current Subject</p>
                  <p className="font-medium">
                    {subject.course?.course_code || subject.application_subject_name} - {subject.course?.course_name || subject.application_subject_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {subject.pastApplicationSubjects?.length || 0} past subject(s) will be sent for review
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes for SME (optional)
                  </label>
                  <textarea
                    value={smeNotes[showSMEModal] || ""}
                    onChange={(e) => setSmeNotes(prev => ({
                      ...prev,
                      [showSMEModal]: e.target.value
                    }))}
                    className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                    rows="3"
                    placeholder="Add any notes or instructions for the SME..."
                    disabled={isProcessing}
                  />
                </div>

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
                    disabled={isProcessing}
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
    </div>
  );
}