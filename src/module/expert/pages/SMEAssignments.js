import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSMEAssignments } from '../hooks/useSMEReview';

export default function SMEAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    const res = await getSMEAssignments();
    if (res.success) {
      setAssignments(res.data);
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      needs_sme_review: { color: 'bg-yellow-500', text: 'Pending Review' },
      approved_sme: { color: 'bg-green-500', text: 'Approved' },
      rejected: { color: 'bg-red-500', text: 'Rejected' },
      sme_reviewed_rejected: { color: 'bg-red-500', text: 'Rejected' },
      approved_template3: { color: 'bg-blue-500', text: 'Approved (Template3)' },
      hos_pending: { color: 'bg-indigo-500', text: 'Sent to HOS' },
      hos_approved: { color: 'bg-green-600', text: 'Approved (HOS)' },
      hos_rejected: { color: 'bg-red-600', text: 'Rejected (HOS)' },
    };

    const config = statusConfig[status] || statusConfig.needs_sme_review;
    
    return (
      <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading assignments...</p>
          </div>
        </div>
    );
  }

  console.log('ASIGNMENT', assignments);
  
  return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">CT Evaluations</h1>
          <p className="text-gray-600">Review subjects assigned to you for credit transfer evaluation</p>
        </div>

        {assignments.length === 0 ? (
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any subjects assigned for review yet.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous courses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment, idx) => {
                    // Expert only cares about SME outcome; HOS stage should not affect SME view.
                    const hasPending = assignment.pastSubjects.some(ps =>
                      (ps.sme_decision_status == null || ps.sme_decision_status === '') &&
                      (ps.approval_status === 'needs_sme_review' || ps.approval_status === 'pending')
                    );
                    const allSmeApproved = assignment.pastSubjects.length > 0 && assignment.pastSubjects.every(ps =>
                      ps.sme_decision_status === 'approved_sme'
                    );
                    const anySmeRejected = assignment.pastSubjects.some(ps =>
                      ps.sme_decision_status === 'rejected' || ps.sme_decision_status === 'sme_reviewed_rejected'
                    );

                    const overallStatus =
                      hasPending ? 'needs_sme_review' :
                      anySmeRejected ? 'rejected' :
                      allSmeApproved ? 'approved_sme' :
                      'needs_sme_review';
                    
                    return (
                      <tr key={assignment.application_subject_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.application?.prev_campus_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.course?.course_code || assignment.application_subject_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.course?.course_name || assignment.application_subject_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {assignment.pastSubjects.map((ps, idx) => (
                              <div key={ps.pastSubject_id} className="text-sm">
                                <span className="font-medium text-gray-900">{ps.pastSubject_code}</span>
                                <span className="text-gray-500"> - {ps.pastSubject_name}</span>
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {assignment.pastSubjects.length} previous course{assignment.pastSubjects.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(overallStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {hasPending ? (
                            <Link
                              to={`/expert/assignments/${assignment.application_subject_id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Review All
                            </Link>
                          ) : (
                            <Link
                              to={`/expert/review/${assignment.application_subject_id}`}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              View
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
  );
}

