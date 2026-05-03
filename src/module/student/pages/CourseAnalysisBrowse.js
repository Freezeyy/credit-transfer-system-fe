import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SearchIcon, ExternalLinkIcon } from "@heroicons/react/outline";
import { browseCourseAnalysisSummaries } from "../hooks/useMappingBanks";

const API_ORIGIN = process.env.REACT_APP_API_ORIGIN || "http://localhost:3000";

export default function CourseAnalysisBrowse() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [matchMyCampus, setMatchMyCampus] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await browseCourseAnalysisSummaries({
      search: debouncedSearch,
      matchMyCampus,
    });
    if (res.success) setItems(res.data || []);
    else {
      setItems([]);
      setError(res.message || "Something went wrong");
    }
    setLoading(false);
  }, [debouncedSearch, matchMyCampus]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => items, [items]);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Analysis Summary Library</h1>
      <p className="text-gray-600 text-sm mb-6 max-w-3xl">
        Search summaries uploaded by your programme coordinator for credit transfer planning. PDFs apply to your
        UniKL programme; optionally narrow results to summaries that match your registered previous institution campus.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <SearchIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Title, previous programme, intake, campus, programme code..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shrink-0"
          >
            Refresh
          </button>
        </div>

        <label className="inline-flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            checked={matchMyCampus}
            onChange={(e) => setMatchMyCampus(e.target.checked)}
          />
          <span className="text-sm text-gray-700">
            Show only summaries for my previous institution campus
            <span className="block text-xs text-gray-500 mt-0.5">
              Uses the campus recorded on your profile. Untick to see every summary for your UniKL programme.
            </span>
          </span>
        </label>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left border-b border-gray-200">
              <tr>
                <th className="p-3 font-semibold text-gray-700">Title</th>
                <th className="p-3 font-semibold text-gray-700">UniKL programme</th>
                <th className="p-3 font-semibold text-gray-700">Previous campus</th>
                <th className="p-3 font-semibold text-gray-700">Previous programme</th>
                <th className="p-3 font-semibold text-gray-700 whitespace-nowrap">Intake</th>
                <th className="p-3 font-semibold text-gray-700 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Loading summaries…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No course analysis summaries matched your filters. Try clearing search or widening the campus
                    filter.
                  </td>
                </tr>
              ) : (
                rows.map((b) => {
                  const href = b.file_upload ? `${API_ORIGIN}${b.file_upload}` : null;
                  return (
                    <tr key={b.mb_id} className="hover:bg-gray-50/80">
                      <td className="p-3 font-medium text-gray-900">{b.mb_name || "—"}</td>
                      <td className="p-3 text-gray-700">
                        {b.program
                          ? `${b.program.program_code || ""} ${b.program.program_name ? `· ${b.program.program_name}` : ""}`.trim()
                          : "—"}
                      </td>
                      <td className="p-3 text-gray-700">{b.oldCampus?.old_campus_name || "—"}</td>
                      <td className="p-3 text-gray-700">{b.prev_program?.trim() || "—"}</td>
                      <td className="p-3 text-gray-700 whitespace-nowrap">{b.intake_year?.trim() || "—"}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Open
                            <ExternalLinkIcon className="h-4 w-4" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && rows.length > 0 && (
        <p className="text-xs text-gray-500 mt-3">
          {rows.length} {rows.length === 1 ? "summary" : "summaries"} listed.
        </p>
      )}
    </div>
  );
}
