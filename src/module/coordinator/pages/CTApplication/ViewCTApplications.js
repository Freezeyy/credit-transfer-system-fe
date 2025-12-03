import React, { useEffect, useState } from "react";
import {
  getCoordinatorInbox,
  updateApplicationStatus,
} from "../../hooks/useViewCTApplications";

export default function ViewCTApplications() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInbox();
  }, [statusFilter]);

  async function loadInbox() {
    setLoading(true);
    const res = await getCoordinatorInbox(statusFilter);
    if (res.success) setApps(res.data);
    setLoading(false);
  }

  async function updateStatus(newStatus) {
    if (!selected) return;
    const res = await updateApplicationStatus(selected.id, {
      status: newStatus,
      notes,
    });
    if (res.success) {
      loadInbox();
      setSelected(null);
      setNotes("");
    } else alert(res.message);
  }

  return (
    <div className="flex h-full gap-4 p-4">

      {/* LEFT — APPLICATION LIST */}
      <div className={`transition-all duration-300 ${selected ? "w-1/2" : "w-full"}`}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold">Coordinator Inbox</h1>

          <select
            className="border px-3 py-2 rounded-lg"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="awaiting_sme">Awaiting SME</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Program</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3"></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td className="p-4">Loading...</td></tr>
              ) : apps.length === 0 ? (
                <tr><td className="p-4">No applications.</td></tr>
              ) : (
                apps.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-gray-50 cursor-pointer border-b"
                    onClick={() => setSelected(app)}
                  >
                    <td className="p-3">{app.id}</td>
                    <td className="p-3">{app.student_name || "Student"}</td>
                    <td className="p-3">{app.program_code}</td>
                    <td className="p-3">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <button className="text-blue-600 hover:underline">
                        View →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT — SLIDE-IN DETAIL PANEL */}
      {selected && (
        <div className="w-1/2 bg-white rounded-xl shadow-md p-5 border animate-slide-in">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Application #{selected.id}
            </h2>

            <button
              className="text-gray-500 hover:text-black"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <p><b>Student:</b> {selected.student_name}</p>
            <p><b>Program:</b> {selected.program_code}</p>
            <p>
              <b>Status:</b>
              <span className={`ml-2 px-2 py-1 rounded-lg text-xs
                ${selected.status === "pending" ? "bg-yellow-200 text-yellow-800" :
                  selected.status === "approved" ? "bg-green-200 text-green-800" :
                  selected.status === "rejected" ? "bg-red-200 text-red-800" :
                  "bg-blue-200 text-blue-800"}`}>
                {selected.status}
              </span>
            </p>
          </div>

          <hr className="my-4" />

          <h3 className="font-semibold mb-2">Subjects Requested</h3>

          <div className="space-y-4 max-h-64 overflow-auto pr-2">
            {selected.subjects?.map((s, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border">
                <p><b>Current:</b> {s.current_subject}</p>

                <p className="mt-2 font-medium">Past Subjects:</p>
                <ul className="list-disc ml-5">
                  {s.pastSubjects.map((p, j) => (
                    <li key={j}>
                      {p.code} — {p.name} ({p.grade})
                      {p.syllabus_path && (
                        <a
                          href={p.syllabus_path}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 text-blue-600 underline"
                        >
                          View File
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <textarea
            className="w-full mt-4 p-3 border rounded-lg"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex gap-3 mt-4">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
              onClick={() => updateStatus("approved")}
            >
              Approve
            </button>

            <button
              className="bg-red-600 text-white px-4 py-2 rounded-lg"
              onClick={() => updateStatus("rejected")}
            >
              Reject
            </button>

            <button
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
              onClick={() => updateStatus("under_review")}
            >
              Review
            </button>

            <button
              className="bg-purple-600 text-white px-4 py-2 rounded-lg"
              onClick={() => updateStatus("awaiting_sme")}
            >
              SME
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
