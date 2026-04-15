import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listHosReviews } from "../hooks/useHosReviews";

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  const cls =
    s === "pending" ? "bg-yellow-100 text-yellow-800" :
    s === "approved" ? "bg-green-100 text-green-800" :
    s === "rejected" ? "bg-red-100 text-red-800" :
    "bg-gray-100 text-gray-800";
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>{status}</span>;
}

export default function HosReviewsList() {
  const [status, setStatus] = useState("pending");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const res = await listHosReviews(status);
    if (res.success) setReviews(res.data);
    else {
      setReviews([]);
      setError(res.message || "Failed to load reviews");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [status]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter((r) => {
      const subj = r.newApplicationSubject;
      const ct = subj?.creditTransferApplication;
      const student = ct?.student;
      const program = ct?.program;
      const course = subj?.course;
      return (
        String(student?.student_name || "").toLowerCase().includes(q) ||
        String(student?.student_email || "").toLowerCase().includes(q) ||
        String(program?.program_code || "").toLowerCase().includes(q) ||
        String(program?.program_name || "").toLowerCase().includes(q) ||
        String(course?.course_code || "").toLowerCase().includes(q) ||
        String(course?.course_name || "").toLowerCase().includes(q)
      );
    });
  }, [reviews, search]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">HOS Reviews</h1>
        <p className="text-gray-600">Review approved subjects sent by coordinators.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6 flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student / program / course..."
          className="flex-1 min-w-[240px] border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Requests</h2>
          <span className="text-sm text-gray-500">{filtered.length} item(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left w-16">No.</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Student</th>
                <th className="p-4 text-left">Programme</th>
                <th className="p-4 text-left">Course / Current Subject</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan="6" className="p-8 text-center text-red-700">{error}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No reviews</td></tr>
              ) : (
                filtered.map((r, idx) => {
                  const subj = r.newApplicationSubject;
                  const ct = subj?.creditTransferApplication;
                  const student = ct?.student;
                  const program = ct?.program;
                  const course = subj?.course;
                  return (
                    <tr key={r.hos_review_id} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-600">{idx + 1}</td>
                      <td className="p-4"><StatusPill status={r.status} /></td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{student?.student_name || "—"}</div>
                        <div className="text-xs text-gray-500">{student?.student_email || ""}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{program?.program_code || "—"}</div>
                        <div className="text-xs text-gray-500">{program?.program_name || ""}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{course?.course_code || subj?.application_subject_name || "—"}</div>
                        <div className="text-xs text-gray-500">{course?.course_name || subj?.application_subject_name || ""}</div>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/hos/reviews/${r.hos_review_id}`}
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

