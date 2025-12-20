import React, { useState, useEffect } from 'react';
import { getMyCreditApplication } from '../../hooks/useCTApplication';

function History() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedApp, setExpandedApp] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    const res = await getMyCreditApplication();
    if (res.success) {
      // Sort by date (newest first)
      const sorted = res.data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setApplications(sorted);
    } else {
      setError('Failed to load applications');
    }
    setLoading(false);
  };

  const toggleExpand = (ctId) => {
    setExpandedApp(expandedApp === ctId ? null : ctId);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-500', text: 'Draft' },
      submitted: { color: 'bg-blue-500', text: 'Under Review' },
      approved: { color: 'bg-green-500', text: 'Approved' },
      rejected: { color: 'bg-red-500', text: 'Rejected' },
      completed: { color: 'bg-purple-500', text: 'Completed' },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.submitted;
    
    return (
      <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getSubjectStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', text: 'Pending Review' },
      approved_template3: { color: 'bg-green-500', text: 'Approved (Template3)' },
      approved_sme: { color: 'bg-green-600', text: 'Approved (SME)' },
      rejected: { color: 'bg-red-500', text: 'Rejected' },
      needs_sme_review: { color: 'bg-orange-500', text: 'SME Review Required' },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    
    return (
      <span className={`px-2 py-1 rounded text-white text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const calculateProgress = (application) => {
    if (!application.newApplicationSubjects || application.newApplicationSubjects.length === 0) {
      return { percentage: 0, approved: 0, total: 0, pending: 0, rejected: 0 };
    }

    let total = 0;
    let approved = 0;
    let pending = 0;
    let rejected = 0;

    application.newApplicationSubjects.forEach((newSubject) => {
      if (newSubject.pastApplicationSubjects) {
        newSubject.pastApplicationSubjects.forEach((pastSubject) => {
          total++;
          const status = pastSubject.approval_status?.toLowerCase();
          if (status === 'approved_template3' || status === 'approved_sme') {
            approved++;
          } else if (status === 'rejected') {
            rejected++;
          } else {
            pending++;
          }
        });
      }
    });

    const percentage = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { percentage, approved, total, pending, rejected };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const viewFile = (filePath) => {
    if (!filePath) return;
    const fullUrl = `${process.env.REACT_APP_API_ORIGIN || 'http://localhost:3000'}${filePath}`;
    window.open(fullUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadApplications}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Application History</h1>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't submitted any credit transfer applications yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Application History</h1>
        <p className="text-gray-600">Track the status of your credit transfer applications</p>
      </div>

      <div className="space-y-4">
        {applications.map((app) => {
          const progress = calculateProgress(app);
          const isExpanded = expandedApp === app.ct_id;

          return (
            <div
              key={app.ct_id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Application Header */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => toggleExpand(app.ct_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Application #{app.ct_id}
                      </h2>
                      {getStatusBadge(app.ct_status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Program:</span>{' '}
                        {app.program?.program_name} ({app.program?.program_code})
                      </div>
                      <div>
                        <span className="font-medium">Previous Institution:</span>{' '}
                        {app.prev_campus_name || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Previous Program:</span>{' '}
                        {app.prev_programme_name || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span>{' '}
                        {formatDate(app.createdAt)}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {app.ct_status !== 'draft' && progress.total > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Overall Progress
                          </span>
                          <span className="text-sm text-gray-600">
                            {progress.approved} / {progress.total} subjects approved
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>✅ Approved: {progress.approved}</span>
                          <span>⏳ Pending: {progress.pending}</span>
                          {progress.rejected > 0 && <span>❌ Rejected: {progress.rejected}</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <svg
                      className={`w-6 h-6 text-gray-400 transition-transform ${
                        isExpanded ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  {/* Coordinator Info */}
                  {app.coordinator && (
                    <div className="mb-6 p-4 bg-white rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">Assigned Coordinator</h3>
                      <p className="text-sm text-gray-600">
                        {app.coordinator.lecturer?.lecturer_name || 'N/A'}
                      </p>
                      {app.coordinator.lecturer?.lecturer_email && (
                        <p className="text-sm text-gray-500">
                          {app.coordinator.lecturer.lecturer_email}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Transcript */}
                  {app.transcript_path && (
                    <div className="mb-6 p-4 bg-white rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">Transcript</h3>
                      <button
                        onClick={() => viewFile(app.transcript_path)}
                        className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center gap-1"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.352 7.704 4 12 4c4.296 0 8.268 3.352 9.542 8-1.274 4.648-5.246 8-9.542 8-4.296 0-8.268-3.352-9.542-8z"
                          />
                        </svg>
                        View Transcript
                      </button>
                    </div>
                  )}

                  {/* Notes */}
                  {app.ct_notes && (
                    <div className="mb-6 p-4 bg-white rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{app.ct_notes}</p>
                    </div>
                  )}

                  {/* Subjects Breakdown */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">Subject Details</h3>
                    {app.newApplicationSubjects && app.newApplicationSubjects.length > 0 ? (
                      <div className="space-y-4">
                        {app.newApplicationSubjects.map((newSubject) => {
                          const pastSubjects = newSubject.pastApplicationSubjects || [];
                          const hasMultiplePastSubjects = pastSubjects.length > 1;
                          
                          // Determine overall status for current subject
                          const getCurrentSubjectStatus = () => {
                            if (pastSubjects.length === 0) return null;
                            
                            const statuses = pastSubjects.map(p => p.approval_status?.toLowerCase());
                            const hasPending = statuses.some(s => s === 'pending' || s === 'needs_sme_review');
                            const allApproved = statuses.every(s => s === 'approved_template3' || s === 'approved_sme');
                            const hasRejected = statuses.some(s => s === 'rejected');
                            
                            if (allApproved) return 'approved';
                            if (hasRejected) return 'rejected';
                            if (hasPending) return 'pending';
                            return 'pending';
                          };

                          const currentSubjectStatus = getCurrentSubjectStatus();

                          return (
                          <div
                            key={newSubject.application_subject_id}
                            className="bg-white rounded-lg p-4 border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800">
                                  {newSubject.course?.course_code || newSubject.application_subject_name}
                                  {' - '}
                                  {newSubject.course?.course_name || newSubject.application_subject_name}
                                </h4>
                                {newSubject.course?.course_credit && (
                                  <span className="text-sm text-gray-500">
                                    {newSubject.course.course_credit} credits
                                  </span>
                                )}
                              </div>
                              {/* Show status badge at current subject level if multiple past subjects */}
                              {hasMultiplePastSubjects && currentSubjectStatus && (
                                <div className="ml-4">
                                  {getSubjectStatusBadge(currentSubjectStatus === 'approved' ? 'approved_template3' : currentSubjectStatus)}
                                </div>
                              )}
                            </div>

                            {pastSubjects.length > 0 ? (
                              <div className="space-y-3">
                                {pastSubjects.map((pastSubject) => (
                                  <div
                                    key={pastSubject.pastSubject_id}
                                    className="bg-gray-50 rounded p-3 border border-gray-100"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium text-gray-800">
                                            {pastSubject.pastSubject_code}
                                          </span>
                                          <span className="text-gray-600">
                                            - {pastSubject.pastSubject_name}
                                          </span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          Grade: {pastSubject.pastSubject_grade || 'N/A'}
                                        </div>
                                      </div>
                                      {/* Only show individual status badge if single past subject */}
                                      {!hasMultiplePastSubjects && (
                                        <div className="ml-4">
                                          {getSubjectStatusBadge(pastSubject.approval_status)}
                                        </div>
                                      )}
                                    </div>

                                    {/* Status Details - Show for all past subjects */}
                                    {pastSubject.approval_status && (
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        {pastSubject.template3_id && (
                                          <p className="text-xs text-gray-500 mb-1">
                                            ✓ Matched with Template3 (ID: {pastSubject.template3_id})
                                          </p>
                                        )}
                                        {pastSubject.similarity_percentage && (
                                          <p className="text-xs text-gray-500 mb-1">
                                            Similarity: {pastSubject.similarity_percentage}%
                                          </p>
                                        )}
                                        {pastSubject.coordinator_notes && (
                                          <div className="mt-2">
                                            <p className="text-xs font-medium text-gray-700 mb-1">
                                              Coordinator Notes:
                                            </p>
                                            <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                              {pastSubject.coordinator_notes}
                                            </p>
                                          </div>
                                        )}
                                        {pastSubject.sme_review_notes && (
                                          <div className="mt-2">
                                            <p className="text-xs font-medium text-gray-700 mb-1">
                                              SME Review Notes:
                                            </p>
                                            <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                              {pastSubject.sme_review_notes}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Show status message for multiple past subjects */}
                                    {hasMultiplePastSubjects && pastSubject.approval_status === 'pending' && (
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-xs text-gray-500 italic">
                                          All past subjects for this course are being reviewed together
                                        </p>
                                      </div>
                                    )}

                                    {/* Syllabus */}
                                    {pastSubject.pastSubject_syllabus_path && (
                                      <div className="mt-2">
                                        <button
                                          onClick={() =>
                                            viewFile(pastSubject.pastSubject_syllabus_path)
                                          }
                                          className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                        >
                                          <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M2.458 12C3.732 7.352 7.704 4 12 4c4.296 0 8.268 3.352 9.542 8-1.274 4.648-5.246 8-9.542 8-4.296 0-8.268-3.352-9.542-8z"
                                            />
                                          </svg>
                                          View Syllabus
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">
                                No past subjects mapped
                              </p>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No subjects in this application</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default History;
