import React from "react";
import {
  buildEvalCourseLabels,
  courseColumnHeader,
  formatCoursePair,
} from "../module/coordinator/utils/evalCourseLabels";

export default function SmeEvaluationModal({ mapping, evaluation, loading, error, onClose }) {
  const topics = evaluation?.topics_comparison || [];
  const pastColsCount =
    Array.isArray(topics) && topics.length > 0 && Array.isArray(topics[0]?.pastSubjectTopics)
      ? topics[0].pastSubjectTopics.length
      : 1;
  const { newLabel, pastLabels } = buildEvalCourseLabels(mapping, evaluation, pastColsCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">SME Evaluation (Courses Comparison)</h3>
            <p className="text-sm text-gray-600 mt-1">
              {pastLabels.length > 1
                ? pastLabels.map((p) => formatCoursePair(p)).join(" + ")
                : formatCoursePair(pastLabels[0] || { code: mapping?.old_subject_code })}
              {" → "}
              {formatCoursePair(newLabel)}
              {mapping?.similarity_percentage != null ? ` (${mapping.similarity_percentage}%)` : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-icon text-gray-500 hover:text-gray-700 text-xl leading-none" data-btn="plain">×</button>
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
                      <th className="p-3 text-left min-w-[260px] align-top">
                        {courseColumnHeader(newLabel, "UniKL course topics")}
                      </th>
                      {Array.from({ length: pastColsCount }).map((_, idx) => (
                        <th key={idx} className="p-3 text-left min-w-[260px] align-top">
                          {courseColumnHeader(
                            pastLabels[idx],
                            `Previous course topics${pastColsCount > 1 ? ` ${idx + 1}` : ""}`
                          )}
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
