import React, { useEffect, useState, useCallback } from "react";
import { alertDialog, confirmDialog } from "../../../utils/dialog";
import { useNavigate, useParams } from "react-router-dom";
import { decideHosReview, getHosReviewDetail, getCourseSyllabusUrl } from "../hooks/useHosReviews";
import { getTemplate3Evaluation } from "../../coordinator/hooks/useReviewApplication";
import SmeEvaluationModal from "../../../components/SmeEvaluationModal";
import {
  findPrimaryPastForSmeEval,
  findTemplate3IdForEvaluation,
  subjectHasViewableSmeEvaluation,
} from "../../../utils/smeEvaluationAccess";

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
  const [showSmeEval, setShowSmeEval] = useState(false);
  const [smeEvalLoading, setSmeEvalLoading] = useState(false);
  const [smeEvalError, setSmeEvalError] = useState("");
  const [smeEvalMapping, setSmeEvalMapping] = useState(null);
  const [smeEvaluation, setSmeEvaluation] = useState(null);
  const [showUniklSyllabus, setShowUniklSyllabus] = useState(false);
  const [uniklSyllabusUrl, setUniklSyllabusUrl] = useState("");
  const [loadingUniklSyllabus, setLoadingUniklSyllabus] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await getHosReviewDetail(hosReviewId);
    if (res.success) setReview(res.data);
    else setError(res.message || "Failed to load");
    setLoading(false);
  }, [hosReviewId]);

  useEffect(() => {
    load();
  }, [load]);

  const uniklSyllabusPath = review?.newApplicationSubject?.course?.syllabus || null;

  useEffect(() => {
    if (!showUniklSyllabus || !uniklSyllabusPath) {
      setUniklSyllabusUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
      setLoadingUniklSyllabus(false);
      return;
    }

    let cancelled = false;
    setLoadingUniklSyllabus(true);
    getCourseSyllabusUrl(uniklSyllabusPath).then((url) => {
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      setUniklSyllabusUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setLoadingUniklSyllabus(false);
    });

    return () => {
      cancelled = true;
    };
  }, [showUniklSyllabus, uniklSyllabusPath]);

  useEffect(() => {
    return () => {
      if (uniklSyllabusUrl) URL.revokeObjectURL(uniklSyllabusUrl);
    };
  }, [uniklSyllabusUrl]);

  function toggleUniklSyllabus() {
    if (!uniklSyllabusPath) {
      void alertDialog({
        message:
          "No UniKL syllabus has been uploaded for this course yet. The programme coordinator can add it under Manage Courses.",
        variant: "warning",
      });
      return;
    }
    setShowUniklSyllabus((prev) => !prev);
  }

  async function decide(decision) {
    if (!review) return;
    if (review.status !== "pending") return;
    if (!(await confirmDialog({ message: `Mark this review as ${decision}?` }))) return;
    setSubmitting(true);
    const res = await decideHosReview(review.hos_review_id, decision, notes);
    if (res.success) {
      await load();
      await alertDialog({ message: "Saved.", variant: 'success' });
    } else {
      await alertDialog({ message: String(res.message || "Failed"), variant: 'error' });
    }
    setSubmitting(false);
  }

  async function openSmeEvaluation(pasts, course, subj) {
    if (!subjectHasViewableSmeEvaluation(pasts)) return;

    const template3IdForEval = findTemplate3IdForEvaluation(pasts);
    const primary = findPrimaryPastForSmeEval(pasts);
    const avgSimilarity =
      primary?.similarity_percentage ??
      pasts.find((p) => p.similarity_percentage != null)?.similarity_percentage ??
      primary?.template3?.similarity_percentage ??
      null;

    setSmeEvalMapping({
      old_subject_code: pasts.map((p) => p.pastSubject_code).filter(Boolean).join(", ") || primary?.pastSubject_code,
      new_subject_code: course?.course_code || subj?.application_subject_name,
      new_subject_name: course?.course_name || subj?.application_subject_name,
      past_courses: pasts.map((p) => ({
        code: p.pastSubject_code,
        name: p.pastSubject_name })),
      similarity_percentage: avgSimilarity,
    });
    setSmeEvaluation(null);
    setSmeEvalError("");
    setShowSmeEval(true);

    if (!template3IdForEval) {
      const notesText = (primary?.sme_review_notes || primary?.template3?.sme_review_notes || "").trim();
      setSmeEvalError(notesText ? "" : "No topics comparison stored for this SME decision.");
      setSmeEvaluation({
        sme_review_notes: notesText || null,
        topics_comparison: [],
      });
      return;
    }

    setSmeEvalLoading(true);
    const res = await getTemplate3Evaluation(template3IdForEval);
    if (res.success) setSmeEvaluation(res.data);
    else setSmeEvalError(res.message || "Failed to load evaluation");
    setSmeEvalLoading(false);
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
  const pastRowSpan = pasts.length || 1;

  const primaryPastForEval = findPrimaryPastForSmeEval(pasts);
  const smeReviewed = pasts.some((p) => {
    const d = String(p.sme_decision_status || "").toLowerCase();
    return d === "approved_sme" || d === "sme_reviewed_rejected";
  });
  const approvedViaTemplate3Only = pasts.some(
    (p) => String(p.approval_status || "").toLowerCase() === "approved_template3" && !p.sme_decision_status
  );
  const canViewSmeEvaluation = subjectHasViewableSmeEvaluation(pasts);
  const bundleSimilarity =
    primaryPastForEval?.similarity_percentage ??
    pasts.find((p) => p.similarity_percentage != null)?.similarity_percentage ??
    null;

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
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-900">UniKL course</h2>
          {course && (
            <button
              type="button"
              onClick={toggleUniklSyllabus}
              className={`btn btn-sm cts-action ${
                showUniklSyllabus
                  ? "btn-danger"
                  : uniklSyllabusPath
                    ? "btn-indigo"
                    : "bg-gray-400 border-gray-500/30 cursor-not-allowed"
              }`}
              title={
                uniklSyllabusPath
                  ? "View coordinator-uploaded UniKL course syllabus"
                  : "UniKL syllabus not uploaded yet"
              }
            >
              {showUniklSyllabus ? "Hide UniKL's Syllabus" : "Show UniKL's Syllabus"}
            </button>
          )}
        </div>
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
        {showUniklSyllabus && (
          <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden h-[min(70vh,600px)] flex flex-col">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-800">UniKL course syllabus</p>
              <p className="text-xs text-gray-600">
                {course?.course_code || "—"} — {course?.course_name || "—"}
              </p>
            </div>
            {loadingUniklSyllabus && (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                Loading UniKL syllabus...
              </div>
            )}
            {!loadingUniklSyllabus && uniklSyllabusUrl && (
              <embed
                src={uniklSyllabusUrl}
                type="application/pdf"
                className="flex-1 w-full min-h-[400px]"
              />
            )}
            {!loadingUniklSyllabus && !uniklSyllabusUrl && (
              <div className="flex-1 flex items-center justify-center p-4 text-sm text-gray-500">
                Could not load UniKL syllabus.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Approved previous courses</h2>
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
                <th className="p-4 text-left min-w-[140px]">SME Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pasts.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500">No previous courses</td></tr>
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
                    {idx === 0 && (
                      <td className="p-4 align-middle" rowSpan={pastRowSpan}>
                        {canViewSmeEvaluation ? (
                          <div className="text-sm">
                            {bundleSimilarity != null && (
                              <p className="text-xs text-gray-600 mb-1">
                                {bundleSimilarity}% similarity
                              </p>
                            )}
                            {smeReviewed && (
                              <p className="text-xs text-green-700 mb-2">SME reviewed</p>
                            )}
                            {approvedViaTemplate3Only && !smeReviewed && (
                              <p className="text-xs text-blue-700 mb-2">Approved via Template3</p>
                            )}
                            <button
                              type="button"
                              className="inline-flex items-center text-xs font-medium text-indigo-700 hover:text-indigo-900 underline"
                              onClick={() => openSmeEvaluation(pasts, course, subj)}
                            >
                              View evaluation
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900">Comment</h2>
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
            className="btn btn-success cts-action disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => decide("rejected")}
            disabled={submitting || review.status !== "pending"}
            className="btn btn-danger cts-action disabled:opacity-50"
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
