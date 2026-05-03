import React, { useEffect, useMemo, useState, useCallback } from "react";
import { listPrograms } from "../hooks/useProgramsManagement";
import { createCourse, deleteCourse, listCourses, setProgramCourses, updateCourse } from "../hooks/useCoursesManagement";

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

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function ManageCoursesAdmin() {
  const user = useMemo(() => JSON.parse(localStorage.getItem("cts_user") || "{}"), []);
  const isSuperAdmin = user?.role === "Super Admin" || !!user?.is_superadmin;

  const [myCampusName, setMyCampusName] = useState(user?.campus_name || "");
  const [courseCampusId, setCourseCampusId] = useState("");
  const [courseProgramId, setCourseProgramId] = useState("");

  const [campuses, setCampuses] = useState([]);
  const [loadingCampuses, setLoadingCampuses] = useState(false);
  const [campusFilter, setCampusFilter] = useState("");

  const [programs, setPrograms] = useState([]);
  const [modalPrograms, setModalPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [programFilter, setProgramFilter] = useState("");

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProgramCourses, setSavingProgramCourses] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showAllForProgram, setShowAllForProgram] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    course_code: "",
    course_name: "",
    course_credit: "",
  });

  const loadCampuses = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoadingCampuses(true);
    try {
      const origin = process.env.REACT_APP_API_ORIGIN || "http://localhost:3000";
      const res = await fetch(`${origin}/staticdata`);
      const data = await res.json().catch(() => ({}));
      setCampuses(data.campuses || []);
    } catch {
      setCampuses([]);
    } finally {
      setLoadingCampuses(false);
    }
  }, [isSuperAdmin]);

  const loadPrograms = useCallback(async () => {
    setLoadingPrograms(true);
    const res = await listPrograms(isSuperAdmin ? campusFilter : "");
    if (res.success) setPrograms(res.data || []);
    else setPrograms([]);
    setLoadingPrograms(false);
  }, [isSuperAdmin, campusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const res = await listCourses({
      campusId: isSuperAdmin ? campusFilter : "",
      programId: programFilter,
    });

    if (res.success) {
      setCourses(res.data || []);
    } else {
      setCourses([]);
      setError(res.message || "Failed to load courses");
    }
    setLoading(false);
  }, [isSuperAdmin, campusFilter, programFilter]);

  useEffect(() => {
    loadCampuses();
  }, [loadCampuses]);

  useEffect(() => {
    // Admin: show real campus name (fallback via profile API if session doesn't have it yet)
    if (isSuperAdmin) return;
    if (myCampusName) return;
    let mounted = true;
    (async () => {
      try {
        const { ok, data } = await fetchJson(`${API_BASE}/lecturer/profile`);
        if (!mounted) return;
        if (!ok) return;
        const campusName = data?.lecturer?.campus?.campus_name || "";
        if (campusName) {
          setMyCampusName(campusName);
          // Persist back into session so other pages can reuse it
          try {
            const cur = JSON.parse(localStorage.getItem("cts_user") || "{}");
            localStorage.setItem("cts_user", JSON.stringify({ ...cur, campus_name: campusName }));
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isSuperAdmin, myCampusName]);

  useEffect(() => {
    // Modal program options depend on selected campus (Super Admin).
    // For Admin, reuse already loaded programs list.
    let mounted = true;
    async function loadModalPrograms() {
      if (!showModal) return;
      if (!isSuperAdmin) {
        if (mounted) setModalPrograms(programs || []);
        return;
      }
      if (!courseCampusId) {
        if (mounted) setModalPrograms([]);
        return;
      }
      const res = await listPrograms(courseCampusId);
      if (!mounted) return;
      setModalPrograms(res.success ? (res.data || []) : []);
    }
    loadModalPrograms();
    return () => {
      mounted = false;
    };
  }, [showModal, isSuperAdmin, courseCampusId, programs]);

  useEffect(() => {
    // When switching campus (Super Admin), reset program filter to avoid mixing campuses.
    if (isSuperAdmin) {
      setProgramFilter("");
    }
    loadPrograms();
  }, [campusFilter, isSuperAdmin, loadPrograms]);

  useEffect(() => {
    // Default UX: when a program is selected, show only its courses unless user opts into edit mode.
    setShowAllForProgram(false);
  }, [programFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = programFilter && !showAllForProgram
      ? (courses || []).filter((c) => !!c.is_in_program)
      : (courses || []);

    if (!q) return base;
    return base.filter((c) => {
      const code = String(c.course_code || "").toLowerCase();
      const name = String(c.course_name || "").toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [courses, search, programFilter, showAllForProgram]);

  const selectedProgram = useMemo(() => {
    if (!programFilter) return null;
    return programs.find((p) => String(p.program_id) === String(programFilter)) || null;
  }, [programs, programFilter]);

  async function toggleInProgram(courseId, nextChecked) {
    if (!programFilter) return;
    setSavingProgramCourses(true);
    try {
      const currentIds = new Set(
        (courses || []).filter((c) => c.is_in_program).map((c) => c.course_id)
      );
      if (nextChecked) currentIds.add(courseId);
      else currentIds.delete(courseId);

      const res = await setProgramCourses(programFilter, Array.from(currentIds));
      if (!res.success) {
        alert(res.message || "Failed to update program courses");
        return;
      }
      await load();
    } finally {
      setSavingProgramCourses(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ course_code: "", course_name: "", course_credit: "" });
    setCourseCampusId(campusFilter || "");
    setCourseProgramId(programFilter || "");
    setShowModal(true);
  }

  function openEdit(course) {
    setEditing(course);
    setForm({
      course_code: course.course_code || "",
      course_name: course.course_name || "",
      course_credit: course.course_credit != null ? String(course.course_credit) : "",
    });
    setCourseCampusId(course.campus_id ? String(course.campus_id) : campusFilter || "");
    setCourseProgramId(programFilter || "");
    setShowModal(true);
  }

  async function onSubmitCourse(e) {
    e.preventDefault();
    if (!form.course_code.trim() || !form.course_name.trim()) {
      alert("Course code and name are required.");
      return;
    }

    if (isSuperAdmin && !courseCampusId) {
      alert("Please select a campus for this course.");
      return;
    }

    // Require program selection when creating a new course
    if (!editing && !courseProgramId) {
      alert("Please select a program for this course.");
      return;
    }

    const payload = {
      course_code: form.course_code.trim(),
      course_name: form.course_name.trim(),
      course_credit: form.course_credit !== "" ? parseInt(form.course_credit, 10) : null,
      ...(isSuperAdmin && courseCampusId ? { campus_id: parseInt(courseCampusId, 10) } : {}),
      ...(courseProgramId ? { program_ids: [parseInt(courseProgramId, 10)] } : {}),
    };

    const res = editing
      ? await updateCourse(editing.course_id, payload)
      : await createCourse(payload);

    if (!res.success) {
      alert(res.message || "Failed");
      return;
    }
    setShowModal(false);
    await load();
  }

  async function onDeleteCourse(course) {
    if (!window.confirm(`Delete ${course.course_code} ${course.course_name}?`)) return;
    const res = await deleteCourse(course.course_id);
    if (!res.success) {
      const extra = res.details ? `\n\nIn use: ${JSON.stringify(res.details)}` : "";
      alert((res.message || "Failed to delete") + extra);
      return;
    }
    await load();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create/update campus courses and optionally attach them to a program.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Course
        </button>
      </div>

      <div className="bg-white border rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {isSuperAdmin ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
              <select
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                disabled={loadingCampuses}
              >
                <option value="">All campuses</option>
                {campuses.map((c) => (
                  <option key={c.campus_id} value={c.campus_id}>
                    {c.campus_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Super Admin can switch campus.
              </p>
            </div>
          ) : (
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
              <div className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-600">
                {myCampusName || "—"}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program (filter + assign)</label>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              disabled={loadingPrograms}
            >
              <option value="">All programs</option>
              {programs.map((p) => (
                <option key={p.program_id} value={p.program_id}>
                  {p.program_code} — {p.program_name}
                </option>
              ))}
            </select>
            {selectedProgram ? (
              <p className="text-xs text-gray-500 mt-1">
                Showing courses in <span className="font-medium">{selectedProgram.program_code}</span>. Enable edit mode to attach/detach courses.
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Select a program to attach/detach courses.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or name…"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
          {error}
        </div>
      ) : null}

      {programFilter ? (
        <div className="bg-white border rounded-xl p-4 mb-4 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Program view</span>
            <span className="text-gray-500"> — </span>
            {showAllForProgram ? "All campus courses (edit mode)" : "Only courses in selected program"}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showAllForProgram}
              onChange={(e) => setShowAllForProgram(e.target.checked)}
            />
            Show all courses (edit program courses)
          </label>
        </div>
      ) : null}

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {programFilter && showAllForProgram ? (
                <th className="px-4 py-3 text-left font-semibold">In Program</th>
              ) : null}
              <th className="px-4 py-3 text-left font-semibold">Code</th>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Credit</th>
              <th className="px-4 py-3 text-left font-semibold">Campus</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={programFilter && showAllForProgram ? 6 : 5} className="px-4 py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={programFilter && showAllForProgram ? 6 : 5} className="px-4 py-6 text-center text-gray-500">
                  No courses found.
                </td>
              </tr>
            ) : (
              filteredCourses.map((c) => (
                <tr key={c.course_id} className="border-t">
                  {programFilter && showAllForProgram ? (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={!!c.is_in_program}
                        disabled={savingProgramCourses}
                        onChange={(e) => toggleInProgram(c.course_id, e.target.checked)}
                        title="Attach/detach from selected program"
                      />
                    </td>
                  ) : null}
                  <td className="px-4 py-3 font-mono">{c.course_code}</td>
                  <td className="px-4 py-3">{c.course_name}</td>
                  <td className="px-4 py-3">{c.course_credit ?? "—"}</td>
                  <td className="px-4 py-3">{c.campus?.campus_name || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                        onClick={() => openEdit(c)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        onClick={() => onDeleteCourse(c)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal ? (
        <Modal title={editing ? "Edit Course" : "New Course"} onClose={() => setShowModal(false)}>
          <form className="space-y-4" onSubmit={onSubmitCourse}>
            {isSuperAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                <select
                  value={courseCampusId}
                  onChange={(e) => setCourseCampusId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  disabled={loadingCampuses}
                >
                  <option value="">Select campus…</option>
                  {campuses.map((c) => (
                    <option key={c.campus_id} value={c.campus_id}>
                      {c.campus_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Same course code can exist in different campuses.
                </p>
              </div>
            )}

            {!editing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select
                  value={courseProgramId}
                  onChange={(e) => setCourseProgramId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  disabled={loadingPrograms || (isSuperAdmin && !courseCampusId)}
                >
                  <option value="">
                    {isSuperAdmin && !courseCampusId ? "Select campus first…" : "Select program…"}
                  </option>
                  {(modalPrograms || []).map((p) => (
                    <option key={p.program_id} value={p.program_id}>
                      {p.program_code} — {p.program_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  New course will be attached to this program immediately.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                <input
                  value={form.course_code}
                  onChange={(e) => setForm((p) => ({ ...p, course_code: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g. CS101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credit</label>
                <input
                  value={form.course_credit}
                  onChange={(e) => setForm((p) => ({ ...p, course_credit: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g. 3"
                  inputMode="numeric"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
              <input
                value={form.course_name}
                onChange={(e) => setForm((p) => ({ ...p, course_name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="e.g. Data Structures"
              />
            </div>

            {!editing && courseProgramId ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                This course will be attached to the selected program after saving.
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

