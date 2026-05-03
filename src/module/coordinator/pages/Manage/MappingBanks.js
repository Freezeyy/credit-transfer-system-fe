import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  assignMappingBank,
  deleteMyMappingBank,
  listMyMappingBanks,
  listMyPrevProgramOptions,
  listStudents,
  uploadMappingBank,
} from "../../hooks/useMappingBanks";

export default function MappingBanks() {
  const [loading, setLoading] = useState(true);
  const [banks, setBanks] = useState([]);
  const [search, setSearch] = useState("");

  const [oldCampuses, setOldCampuses] = useState([]);
  const [loadingOldCampuses, setLoadingOldCampuses] = useState(false);
  const [prevProgramOptions, setPrevProgramOptions] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    mb_name: "",
    old_campus_id: "",
    intake_year: "",
    prev_program: "",
    namingConvention: "",
    file: null,
  });

  // Assign modal
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeBank, setActiveBank] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsPagination, setStudentsPagination] = useState(null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterOldCampusId, setFilterOldCampusId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState(() => new Set());
  const [assigning, setAssigning] = useState(false);
  const [selectAllOldCampusId, setSelectAllOldCampusId] = useState("");

  const loadBanks = useCallback(async () => {
    setLoading(true);
    const res = await listMyMappingBanks(search);
    if (res.success) setBanks(res.data || []);
    else setBanks([]);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    loadBanks();
  }, [loadBanks]);

  useEffect(() => {
    async function loadOldCampuses() {
      setLoadingOldCampuses(true);
      try {
        const origin = process.env.REACT_APP_API_ORIGIN || "http://localhost:3000";
        const res = await fetch(`${origin}/staticdata`);
        if (!res.ok) throw new Error("Failed to load staticdata");
        const data = await res.json();
        setOldCampuses(data.oldCampuses || []);
      } catch (e) {
        console.error(e);
        setOldCampuses([]);
      } finally {
        setLoadingOldCampuses(false);
      }
    }
    loadOldCampuses();
  }, []);

  useEffect(() => {
    async function loadPrevPrograms() {
      const res = await listMyPrevProgramOptions();
      if (res.success) setPrevProgramOptions(res.data || []);
    }
    loadPrevPrograms();
  }, []);

  const visibleCount = useCallback((b) => {
    try {
      const ids = JSON.parse(b.visible_student_ids || "[]");
      return Array.isArray(ids) ? ids.length : 0;
    } catch {
      return 0;
    }
  }, []);

  const openAssign = async (bank) => {
    setActiveBank(bank);
    setAssignOpen(true);
    setSelectedStudentIds(new Set());
    setStudentSearch("");
    setPage(1);
    setPageSize(10);
    setFilterOldCampusId("");
    setSelectAllOldCampusId("");
  };

  const loadStudents = useCallback(async () => {
    if (!assignOpen) return;
    setStudentsLoading(true);
    const res = await listStudents({
      page,
      limit: pageSize,
      search: studentSearch,
      old_campus_id: filterOldCampusId,
    });
    if (res.success) {
      setStudents(res.data || []);
      setStudentsPagination(res.pagination || null);
    } else {
      setStudents([]);
      setStudentsPagination(null);
    }
    setStudentsLoading(false);
  }, [assignOpen, page, pageSize, studentSearch, filterOldCampusId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const toggleStudent = (studentId) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const canUpload = useMemo(() => {
    return (
      form.mb_name.trim() &&
      form.old_campus_id &&
      form.file &&
      String(form.file.type || "").toLowerCase() === "application/pdf"
    );
  }, [form]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!canUpload) return;
    setUploading(true);
    const res = await uploadMappingBank({
      mb_name: form.mb_name.trim(),
      old_campus_id: form.old_campus_id,
      intake_year: form.intake_year.trim(),
      prev_program: form.prev_program.trim(),
      namingConvention: form.namingConvention.trim(),
      file: form.file,
    });
    setUploading(false);

    if (!res.success) {
      alert(res.message || "Upload failed");
      return;
    }

    alert("Course analysis summary uploaded");
    setForm({
      mb_name: "",
      old_campus_id: "",
      intake_year: "",
      prev_program: "",
      namingConvention: "",
      file: null,
    });
    await loadBanks();
  };

  const handleAssign = async () => {
    if (!activeBank) return;
    setAssigning(true);

    const res = await assignMappingBank({
      mb_id: activeBank.mb_id,
      student_ids: Array.from(selectedStudentIds),
      select_all_old_campus_id: selectAllOldCampusId,
    });
    setAssigning(false);

    if (!res.success) {
      if (res.data?.student_ids?.length) {
        alert(
          `Some selected students already have a course analysis summary assigned.\nStudent IDs: ${res.data.student_ids.join(", ")}`
        );
        return;
      }
      alert(res.message || "Assign failed");
      return;
    }

    alert("Assigned successfully");
    setAssignOpen(false);
    setActiveBank(null);
    await loadBanks();
  };

  const handleDelete = async (bank) => {
    if (!bank?.mb_id) return;
    if (!window.confirm(`Delete course analysis summary "${bank.mb_name}"?\n\nThis will remove it from students too.`)) return;
    const res = await deleteMyMappingBank(bank.mb_id);
    if (!res.success) {
      alert(res.message || "Delete failed");
      return;
    }
    alert("Deleted");
    if (activeBank?.mb_id === bank.mb_id) {
      setAssignOpen(false);
      setActiveBank(null);
    }
    await loadBanks();
  };

  return (
    
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Course Analysis Summary</h1>
            <p className="text-sm text-gray-600 mt-1">
              Upload your course analysis summary PDFs and choose which students can see them.
            </p>
          </div>
          <div className="w-full sm:w-80">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search course analysis summaries..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Upload card */}
        <div className="bg-white rounded-lg shadow-md p-5 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Course Analysis Summary</h2>
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Summary title *</label>
              <input
                value={form.mb_name}
                onChange={(e) => setForm((p) => ({ ...p, mb_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g. UniKL BMI – Diploma IT – March 2026"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Previous institution campus *</label>
              <select
                value={form.old_campus_id}
                onChange={(e) => setForm((p) => ({ ...p, old_campus_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
                disabled={loadingOldCampuses}
              >
                <option value="">{loadingOldCampuses ? "Loading..." : "Select previous institution campus"}</option>
                {oldCampuses.map((c) => (
                  <option key={c.old_campus_id} value={c.old_campus_id}>
                    {c.old_campus_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intake Year</label>
              <input
                value={form.intake_year}
                onChange={(e) => setForm((p) => ({ ...p, intake_year: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g. March 2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Previous Program</label>
              <input
                value={form.prev_program}
                onChange={(e) => setForm((p) => ({ ...p, prev_program: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Type to search existing..."
                list="prev_program_options"
              />
              <datalist id="prev_program_options">
                {prevProgramOptions.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Naming Convention (reserved)</label>
              <input
                value={form.namingConvention}
                onChange={(e) => setForm((p) => ({ ...p, namingConvention: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PDF File *</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
              <p className="text-xs text-gray-500 mt-1">PDF only.</p>
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-2 mt-1">
              <button
                type="submit"
                disabled={!canUpload || uploading}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </form>
        </div>

        {/* My uploads table */}
        <div className="bg-white rounded-lg shadow-md p-5 mt-6 overflow-x-auto">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-900">My uploaded course analysis summaries</h2>
            <div className="text-sm text-gray-500">{loading ? "Loading..." : `${banks.length} file(s)`}</div>
          </div>

          <table className="w-full mt-4 border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left text-sm font-semibold">
                <th className="p-3 border">No.</th>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Previous campus</th>
                <th className="p-3 border">Intake</th>
                <th className="p-3 border">Prev Program</th>
                <th className="p-3 border">Visible To</th>
                <th className="p-3 border">File</th>
                <th className="p-3 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && banks.length === 0 ? (
                <tr>
                  <td className="p-4 border text-center text-gray-500" colSpan={8}>
                    No course analysis summaries uploaded yet.
                  </td>
                </tr>
              ) : (
                banks.map((b, idx) => (
                  <tr key={b.mb_id} className="text-sm hover:bg-gray-50">
                    <td className="p-3 border">{idx + 1}</td>
                    <td className="p-3 border font-medium text-gray-900">{b.mb_name}</td>
                    <td className="p-3 border">{b.oldCampus?.old_campus_name || "-"}</td>
                    <td className="p-3 border">{b.intake_year || "-"}</td>
                    <td className="p-3 border">{b.prev_program || "-"}</td>
                    <td className="p-3 border">{visibleCount(b)} student(s)</td>
                    <td className="p-3 border">
                      {b.file_upload ? (
                        <a
                          className="text-indigo-600 hover:underline"
                          href={`${process.env.REACT_APP_API_ORIGIN || "http://localhost:3000"}${b.file_upload}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View PDF
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3 border">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openAssign(b)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Send to students
                        </button>
                        <button
                          onClick={() => handleDelete(b)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
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

        {/* Assign modal */}
        {assignOpen && activeBank && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl overflow-hidden">
              <div className="p-4 border-b flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Select students</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Course analysis summary: <span className="font-medium">{activeBank.mb_name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setAssignOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>

              <div className="p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                      value={studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                        setPage(1);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Search by student name/email"
                    />
                  </div>
                  <div className="min-w-[220px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by previous institution campus</label>
                    <select
                      value={filterOldCampusId}
                      onChange={(e) => {
                        setFilterOldCampusId(e.target.value);
                        setPage(1);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">All previous institution campuses</option>
                      {oldCampuses.map((c) => (
                        <option key={c.old_campus_id} value={c.old_campus_id}>
                          {c.old_campus_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-[160px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Page size</label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(parseInt(e.target.value, 10));
                        setPage(1);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 bg-gray-50 border rounded-lg p-3 flex flex-wrap gap-3 items-end">
                  <div className="min-w-[260px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quick: select ALL students from previous institution campus
                    </label>
                    <select
                      value={selectAllOldCampusId}
                      onChange={(e) => setSelectAllOldCampusId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">(Not using)</option>
                      {oldCampuses.map((c) => (
                        <option key={c.old_campus_id} value={c.old_campus_id}>
                          {c.old_campus_name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      If selected, manual checkboxes will be ignored.
                    </p>
                  </div>
                  <div className="flex-1" />
                  <button
                    onClick={handleAssign}
                    disabled={assigning || (!selectAllOldCampusId && selectedStudentIds.size === 0)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {assigning ? "Sending..." : "Send course analysis summary"}
                  </button>
                </div>

                <div className="mt-4 overflow-x-auto border rounded-lg">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200 text-left text-sm font-semibold">
                        <th className="p-3 border">Select</th>
                        <th className="p-3 border">Student</th>
                        <th className="p-3 border">Email</th>
                        <th className="p-3 border">Previous campus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsLoading ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-gray-500">
                            Loading students...
                          </td>
                        </tr>
                      ) : students.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-gray-500">
                            No students found.
                          </td>
                        </tr>
                      ) : (
                        students.map((s) => (
                          <tr key={s.student_id} className="text-sm hover:bg-gray-50">
                            <td className="p-3 border">
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.has(s.student_id)}
                                onChange={() => toggleStudent(s.student_id)}
                                disabled={!!selectAllOldCampusId}
                              />
                            </td>
                            <td className="p-3 border">{s.student_name}</td>
                            <td className="p-3 border">{s.student_email}</td>
                            <td className="p-3 border">{s.oldCampus?.old_campus_name || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {studentsPagination && (
                  <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm text-gray-600">
                      Page {studentsPagination.currentPage} of {studentsPagination.totalPages} • {studentsPagination.totalItems} students
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= studentsPagination.totalPages}
                        className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
}

