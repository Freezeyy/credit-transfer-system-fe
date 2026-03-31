import React, { useState, useEffect, useCallback } from "react";
import {
  getTemplate3Mappings,
  getTemplate3Evaluation,
} from "../../hooks/useReviewApplication";

function EvaluationModal({ mapping, evaluation, loading, error, onClose }) {
  const topics = evaluation?.topics_comparison || [];
  const pastColsCount = Array.isArray(topics) && topics.length > 0 && Array.isArray(topics[0]?.pastSubjectTopics)
    ? topics[0].pastSubjectTopics.length
    : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">SME Evaluation (Subjects Comparison)</h3>
            <p className="text-sm text-gray-600 mt-1 truncate">
              {mapping?.old_subject_code} → {mapping?.new_subject_code} ({mapping?.similarity_percentage}%)
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading evaluation...</div>
          ) : error ? (
            <div className="py-10 text-center text-red-700">{error}</div>
          ) : !Array.isArray(topics) || topics.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No stored topics comparison for this mapping yet.
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
                      <th className="p-3 text-left min-w-[260px]">UniKL Subject Topics</th>
                      {Array.from({ length: pastColsCount }).map((_, idx) => (
                        <th key={idx} className="p-3 text-left min-w-[260px]">
                          Previous Subject Topics{pastColsCount > 1 ? ` ${idx + 1}` : ""}
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
                            <div className="text-gray-900">
                              {row.pastSubjectTopics?.[idx]?.topic || "—"}
                            </div>
                          </td>
                        ))}
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {typeof row.similarityPercentage === "number" ? row.similarityPercentage : (row.similarityPercentage ?? "—")}%
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

export default function Template3() {
  const [template3List, setTemplate3List] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEval, setShowEval] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState("");
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [evaluation, setEvaluation] = useState(null);

  // Filters for viewing
  const [filters, setFilters] = useState({
    old_campus_name: "",
    old_programme_name: "",
  });

  // Use useCallback to memoize loadTemplate3List
  const loadTemplate3List = useCallback(async () => {
    setLoading(true);
    const res = await getTemplate3Mappings(filters);
    if (res.success) {
      setTemplate3List(res.data);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadTemplate3List();
  }, [loadTemplate3List]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">View Course Mappings</h1>
      <p className="text-gray-600 mb-6">
        Course mappings are created after SME evaluation. Coordinators can only view existing mappings.
      </p>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="font-semibold mb-3">Search Filters</h2>
        <p className="text-sm text-gray-600 mb-4">
          You can search by old institution details. Results are automatically filtered to your program.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 font-medium">Old Institution Name</label>
            <input
              type="text"
              value={filters.old_campus_name}
              onChange={(e) => setFilters(prev => ({ ...prev, old_campus_name: e.target.value }))}
              className="w-full border rounded p-2"
              placeholder="e.g., GMI"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">Old Institution Programme Name</label>
            <input
              type="text"
              value={filters.old_programme_name}
              onChange={(e) => setFilters(prev => ({ ...prev, old_programme_name: e.target.value }))}
              className="w-full border rounded p-2"
              placeholder="e.g., Diploma in Software Engineering"
            />
          </div>
        </div>
        <button
          onClick={loadTemplate3List}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
        >
          Search
        </button>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">
            Results ({template3List.length} {template3List.length === 1 ? 'mapping' : 'mappings'})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Old Institution</th>
                <th className="p-3 text-left">Old Programme</th>
                <th className="p-3 text-left">Old Subject</th>
                <th className="p-3 text-left">New Subject</th>
                <th className="p-3 text-left">Current Programme</th>
                <th className="p-3 text-left">Similarity</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-4 text-center">Loading...</td>
                </tr>
              ) : template3List.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-500">
                    No mappings found. Try adjusting your search filters.
                  </td>
                </tr>
              ) : (
                template3List.map((t3) => (
                  <tr
                    key={t3.template3_id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    title="Click to view SME evaluation"
                    onClick={async () => {
                      setSelectedMapping(t3);
                      setShowEval(true);
                      setEvalLoading(true);
                      setEvalError("");
                      setEvaluation(null);
                      const res = await getTemplate3Evaluation(t3.template3_id);
                      if (res.success) {
                        setEvaluation(res.data);
                      } else {
                        setEvalError(res.message || "Failed to load evaluation");
                      }
                      setEvalLoading(false);
                    }}
                  >
                    <td className="p-3">{t3.template3_id}</td>
                    <td className="p-3">
                      <p className="font-medium text-xs">{t3.oldCampus?.old_campus_name || "N/A"}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs">{t3.old_programme_name}</p>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{t3.old_subject_code}</p>
                        <p className="text-xs text-gray-600">{t3.old_subject_name}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{t3.new_subject_code}</p>
                        <p className="text-xs text-gray-600">{t3.course?.course_name}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium text-xs">{t3.program?.program_code || "N/A"}</p>
                        <p className="text-xs text-gray-600">{t3.program?.program_name}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                        {t3.similarity_percentage}%
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        t3.is_active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {t3.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEval && selectedMapping && (
        <EvaluationModal
          mapping={selectedMapping}
          evaluation={evaluation}
          loading={evalLoading}
          error={evalError}
          onClose={() => setShowEval(false)}
        />
      )}
    </div>
  );
}