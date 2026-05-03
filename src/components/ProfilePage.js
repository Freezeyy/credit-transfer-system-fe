import React, { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";
const OPEN_API_BASE = process.env.REACT_APP_API_ORIGIN || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("cts_token");
}

async function fetchJson(url) {
  const token = getToken();
  const res = await fetch(url, {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export default function ProfilePage() {
  const user = useMemo(() => JSON.parse(localStorage.getItem("cts_user") || "{}"), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [student, setStudent] = useState(null);
  const [lecturer, setLecturer] = useState(null);
  const [lecturerRoles, setLecturerRoles] = useState(null);
  const [editingStudent, setEditingStudent] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [hasCreditTransferApplications, setHasCreditTransferApplications] = useState(false);
  const [staticPrograms, setStaticPrograms] = useState([]);
  const [staticOldCampuses, setStaticOldCampuses] = useState([]);
  const [studentDraft, setStudentDraft] = useState({
    student_identifier: "",
    student_name: "",
    student_email: "",
    student_phone: "",
    program_id: "",
    old_campus_id: "",
    prev_programme_name: "",
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      setStudent(null);
      setLecturer(null);
      setLecturerRoles(null);

      try {
        if (user?.role === "Student") {
          const { ok, data } = await fetchJson(`${API_BASE}/student/profile`);
          if (!mounted) return;
          if (!ok) throw new Error(data?.error || "Failed to load student profile");
          const s = data.student;
          if (!s) throw new Error("Failed to load student profile");
          setStudent(s);
          setHasCreditTransferApplications(!!data.has_credit_transfer_applications);
          setStudentDraft({
            student_identifier: s.student_identifier || "",
            student_name: s.student_name || "",
            student_email: s.student_email || "",
            student_phone: s.student_phone || "",
            program_id: s.program_id != null ? String(s.program_id) : "",
            old_campus_id: s.old_campus_id != null ? String(s.old_campus_id) : "",
            prev_programme_name: s.prev_programme_name || "",
          });
        } else {
          const { ok, data } = await fetchJson(`${API_BASE}/lecturer/profile`);
          if (!mounted) return;
          if (!ok) throw new Error(data?.error || "Failed to load lecturer profile");
          setLecturer(data.lecturer || null);
          setLecturerRoles(data.roles || null);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load profile");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "Student" || !editingStudent) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${OPEN_API_BASE}/staticdata`);
        const data = await res.json().catch(() => ({}));
        if (!mounted || !res.ok) return;
        setStaticPrograms(data.programs || []);
        setStaticOldCampuses(data.oldCampuses || []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, [editingStudent, user?.role]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-80" />
            <div className="h-4 bg-gray-200 rounded w-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
          <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
          <p className="mt-2 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (user?.role === "Student" && student) {
    const flowCriticalLocked = hasCreditTransferApplications;

    const resetStudentDraftFromServer = () => {
      setStudentDraft({
        student_identifier: student.student_identifier || "",
        student_name: student.student_name || "",
        student_email: student.student_email || "",
        student_phone: student.student_phone || "",
        program_id: student.program_id != null ? String(student.program_id) : "",
        old_campus_id: student.old_campus_id != null ? String(student.old_campus_id) : "",
        prev_programme_name: student.prev_programme_name || "",
      });
    };

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-sm text-gray-500 mt-1">Student</p>
              {flowCriticalLocked && (
                <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  You already have credit transfer applications. Program, previous institution campus, and previous
                  programme name can&apos;t be changed. You can still update your name, email, and phone.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {editingStudent ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudent(false);
                      resetStudentDraftFromServer();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
                    disabled={savingStudent}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setSavingStudent(true);
                      try {
                        const token = getToken();
                        const pid = parseInt(studentDraft.program_id, 10);
                        const oid = studentDraft.old_campus_id
                          ? parseInt(studentDraft.old_campus_id, 10)
                          : null;
                        if (Number.isNaN(pid)) {
                          alert("Please select a valid program.");
                          return;
                        }
                        const res = await fetch(`${API_BASE}/student/profile`, {
                          method: "PUT",
                          headers: {
                            Authorization: "Bearer " + token,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            student_identifier: studentDraft.student_identifier.trim(),
                            student_name: studentDraft.student_name.trim(),
                            student_email: studentDraft.student_email.trim(),
                            student_phone: studentDraft.student_phone.trim() || null,
                            program_id: pid,
                            old_campus_id: oid,
                            prev_programme_name: studentDraft.prev_programme_name.trim() || null,
                          }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          const msg = data?.error || "Failed to update profile";
                          alert(msg);
                          return;
                        }
                        if (data.student) {
                          setStudent(data.student);
                          if (typeof data.has_credit_transfer_applications === "boolean") {
                            setHasCreditTransferApplications(data.has_credit_transfer_applications);
                          }
                        }
                        setEditingStudent(false);
                      } catch (e) {
                        alert(e?.message || "Failed to update profile");
                      } finally {
                        setSavingStudent(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
                    disabled={savingStudent}
                  >
                    {savingStudent ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    resetStudentDraftFromServer();
                    setEditingStudent(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">Student ID</div>
              {editingStudent ? (
                <input
                  value={studentDraft.student_identifier}
                  onChange={(e) => setStudentDraft((d) => ({ ...d, student_identifier: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Student ID"
                />
              ) : (
                <div className="text-sm font-semibold text-gray-900">{student.student_identifier || "—"}</div>
              )}
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">Name</div>
              {editingStudent ? (
                <input
                  value={studentDraft.student_name}
                  onChange={(e) => setStudentDraft((d) => ({ ...d, student_name: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Full name"
                />
              ) : (
                <div className="text-sm font-semibold text-gray-900">{student.student_name}</div>
              )}
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">Email</div>
              {editingStudent ? (
                <input
                  type="email"
                  value={studentDraft.student_email}
                  onChange={(e) => setStudentDraft((d) => ({ ...d, student_email: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Email"
                />
              ) : (
                <div className="text-sm font-semibold text-gray-900">{student.student_email}</div>
              )}
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">Phone</div>
              {editingStudent ? (
                <input
                  value={studentDraft.student_phone}
                  onChange={(e) => setStudentDraft((d) => ({ ...d, student_phone: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Phone number"
                />
              ) : (
                <div className="text-sm font-semibold text-gray-900">{student.student_phone || "—"}</div>
              )}
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">UniKL Campus</div>
              <div className="text-sm font-semibold text-gray-900">{student.campus?.campus_name || "—"}</div>
              <p className="mt-1 text-[11px] text-gray-500">Set automatically from your program.</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 md:col-span-2">
              <div className="text-xs text-gray-500">Program</div>
              {editingStudent ? (
                <select
                  value={studentDraft.program_id}
                  onChange={(e) => setStudentDraft((d) => ({ ...d, program_id: e.target.value }))}
                  disabled={flowCriticalLocked}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Select program</option>
                  {staticPrograms.map((p) => (
                    <option key={p.program_id} value={p.program_id}>
                      {p.program_code} — {p.program_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm font-semibold text-gray-900">
                  {student.program ? `${student.program.program_code} - ${student.program.program_name}` : "—"}
                </div>
              )}
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 md:col-span-2">
              <div className="text-xs text-gray-500">Previous Institution Campus</div>
              {editingStudent ? (
                <select
                  value={studentDraft.old_campus_id}
                  onChange={(e) => setStudentDraft((d) => ({ ...d, old_campus_id: e.target.value }))}
                  disabled={flowCriticalLocked}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">— None —</option>
                  {staticOldCampuses.map((c) => (
                    <option key={c.old_campus_id} value={c.old_campus_id}>
                      {c.old_campus_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm font-semibold text-gray-900">{student.oldCampus?.old_campus_name || "—"}</div>
              )}
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 md:col-span-2">
              <div className="text-xs text-gray-500">Previous Programme Name</div>
              {editingStudent ? (
                <input
                  value={studentDraft.prev_programme_name}
                  onChange={(e) => setStudentDraft((d) => ({ ...d, prev_programme_name: e.target.value }))}
                  disabled={flowCriticalLocked}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="e.g. Diploma in Information Technology"
                />
              ) : (
                <div className="text-sm font-semibold text-gray-900">{student.prev_programme_name || "—"}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (lecturer) {
    const activeCoordinator = lecturerRoles?.coordinators?.map((c) => c.program).filter(Boolean) || [];
    const activeSme = lecturerRoles?.subjectMethodExperts?.map((s) => s.course).filter(Boolean) || [];
    const isHos = (lecturerRoles?.headOfSections || []).length > 0;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">{user?.role || "Lecturer"}</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">Name</div>
              <div className="text-sm font-semibold text-gray-900">{lecturer.lecturer_name}</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-sm font-semibold text-gray-900">{lecturer.lecturer_email}</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">UniKL Campus</div>
              <div className="text-sm font-semibold text-gray-900">{lecturer.campus?.campus_name || "—"}</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">Flags</div>
              <div className="text-sm font-semibold text-gray-900">
                {lecturer.is_superadmin ? "Super Admin" : lecturer.is_admin ? "Administrator" : "Lecturer"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900">Active Roles</h2>
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Program Coordinator</div>
              {activeCoordinator.length === 0 ? (
                <div className="text-sm text-gray-500">—</div>
              ) : (
                <ul className="text-sm text-gray-900 space-y-1">
                  {activeCoordinator.map((p) => (
                    <li key={p.program_id} className="font-medium">{p.program_code} - {p.program_name}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Subject Matter Expert (SME)</div>
              {activeSme.length === 0 ? (
                <div className="text-sm text-gray-500">—</div>
              ) : (
                <ul className="text-sm text-gray-900 space-y-1">
                  {activeSme.map((c) => (
                    <li key={c.course_id} className="font-medium">{c.course_code} - {c.course_name}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Head of Section</div>
              <div className="text-sm font-semibold text-gray-900">{isHos ? "Yes" : "—"}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
        <p className="mt-2 text-sm text-gray-500">No profile data.</p>
      </div>
    </div>
  );
}

