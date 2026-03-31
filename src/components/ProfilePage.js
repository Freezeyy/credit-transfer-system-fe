import React, { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

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
          setStudent(data.student || data);
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
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Student</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">Name</div>
              <div className="text-sm font-semibold text-gray-900">{student.student_name}</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-sm font-semibold text-gray-900">{student.student_email}</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">Phone</div>
              <div className="text-sm font-semibold text-gray-900">{student.student_phone || "—"}</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">UniKL Campus</div>
              <div className="text-sm font-semibold text-gray-900">{student.campus?.campus_name || "—"}</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">Program</div>
              <div className="text-sm font-semibold text-gray-900">
                {student.program ? `${student.program.program_code} - ${student.program.program_name}` : "—"}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500">Previous Institution Campus</div>
              <div className="text-sm font-semibold text-gray-900">{student.oldCampus?.old_campus_name || "—"}</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 md:col-span-2">
              <div className="text-xs text-gray-500">Previous Programme Name</div>
              <div className="text-sm font-semibold text-gray-900">{student.prev_programme_name || "—"}</div>
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
              <div className="text-xs text-gray-500 mb-1">Subject Method Expert (SME)</div>
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

