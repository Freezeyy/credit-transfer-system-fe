import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { decideHosReview, getHosReviewDetail } from "../hooks/useHosReviews";

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const cls =
    s === "pending" ? "bg-yellow-100 text-yellow-800" :
    s === "approved" ? "bg-green-100 text-green-800" :
    s === "rejected" ? "bg-red-100 text-red-800" :
    "bg-gray-100 text-gray-800";
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>{status}</span>;
}

export default function HosReviewDetail() {
  const { hosReviewId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [review, setReview] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    const res = await getHosReviewDetail(hosReviewId);
    if (res.success) setReview(res.data);
    else setError(res.message || "Failed to load");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [hosReviewId]);

  async function decide(decision) {
    if (!review) return;
    if (review.status !== "pending") return;
    if (!window.confirm(`Mark this review as ${decision}?`)) return;
    setSubmitting(true);
    const res = await decideHosReview(review.hos_review_id, decision, notes);
    if (res.success) {
      await load();
      alert("Saved.");
    } else {
      alert(res.message || "Failed");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8">
          <button onClick={() => navigate("/hos/reviews")} className="text-blue-600 hover:underline text-sm">
            ← Back
          </button>
          <div className="mt-4 text-red-700">{error || "Not found"}</div>
        </div>
      </div>
    );
  }

  const subj = review.newApplicationSubject;
  const ct = subj?.creditTransferApplication;
  const student = ct?.student;
  const program = ct?.program;
  const course = subj?.course;
  const pasts = subj?.pastApplicationSubjects || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <button onClick={() => navigate("/hos/reviews")} className="text-blue-600 hover:underline text-sm">
              ← Back to Reviews
            </button>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Review #{review.hos_review_id}</h1>
            <div className="mt-2"><StatusPill status={review.status} /></div>
          </div>
          <div className="text-sm text-gray-600">
            <div><span className="text-gray-500">Student:</span> {student?.student_name || "—"}</div>
            <div><span className="text-gray-500">Email:</span> {student?.student_email || "—"}</div>
            <div><span className="text-gray-500">Programme:</span> {program?.program_code || "—"} {program?.program_name ? `- ${program.program_name}` : ""}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900">Current Subject</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-xs text-gray-500">Course</div>
            <div className="text-sm font-semibold text-gray-900">
              {course ? `${course.course_code} - ${course.course_name}` : (subj?.application_subject_name || "—")}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="text-xs text-gray-500">Credit</div>
            <div className="text-sm font-semibold text-gray-900">{course?.course_credit ?? "—"}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Approved Past Subjects</h2>
          <p className="text-sm text-gray-600 mt-1">These were approved by Template3/SME before reaching HOS.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left w-16">No.</th>
                <th className="p-4 text-left">Code</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Grade</th>
                <th className="p-4 text-left">Similarity</th>
                <th className="p-4 text-left">Syllabus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pasts.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No past subjects</td></tr>
              ) : (
                pasts.map((p, idx) => (
                  <tr key={p.pastSubject_id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-600">{idx + 1}</td>
                    <td className="p-4 font-mono font-semibold">{p.pastSubject_code}</td>
                    <td className="p-4">{p.pastSubject_name}</td>
                    <td className="p-4">{p.pastSubject_grade || "—"}</td>
                    <td className="p-4">{p.similarity_percentage != null ? `${p.similarity_percentage}%` : "—"}</td>
                    <td className="p-4">
                      {p.pastSubject_syllabus_path ? (
                        <a
                          href={`${process.env.REACT_APP_API_ORIGIN || "http://localhost:3000"}${p.pastSubject_syllabus_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          📄 View
                        </a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900">Decision</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
          className="mt-3 w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={4}
          disabled={review.status !== "pending"}
        />
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => decide("approved")}
            disabled={submitting || review.status !== "pending"}
            className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => decide("rejected")}
            disabled={submitting || review.status !== "pending"}
            className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Reject
          </button>
          {review.status !== "pending" && (
            <div className="text-sm text-gray-500">
              Decided at: {review.decided_at ? new Date(review.decided_at).toLocaleString() : "—"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

