import React, { useEffect, useMemo, useState } from "react";
import { listPrograms, createProgram, updateProgram, deleteProgram } from "../hooks/useProgramsManagement";

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function ManagePrograms() {
  const user = useMemo(() => JSON.parse(localStorage.getItem("cts_user") || "{}"), []);
  const isSuperAdmin = user?.role === "Super Admin";

  const [campuses, setCampuses] = useState([]);
  const [loadingCampuses, setLoadingCampuses] = useState(false);

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    program_name: "",
    program_code: "",
    campus_id: "",
    program_structure: "",
  });

  async function load() {
    setLoading(true);
    setError("");
    const res = await listPrograms();
    if (res.success) {
      setPrograms(res.data);
    } else {
      setPrograms([]);
      setError(res.message || "Failed to load programs");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let mounted = true;

    async function loadCampuses() {
      setLoadingCampuses(true);
      try {
        const origin = process.env.REACT_APP_API_ORIGIN || "http://localhost:3000";
        const res = await fetch(`${origin}/staticdata`);
        if (!res.ok) throw new Error("Failed to load campuses");
        const data = await res.json();
        if (!mounted) return;
        setCampuses(data.campuses || []);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setCampuses([]);
      } finally {
        if (!mounted) return;
        setLoadingCampuses(false);
      }
    }

    loadCampuses();
    return () => {
      mounted = false;
    };
  }, [isSuperAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((p) => {
      return (
        String(p.program_name || "").toLowerCase().includes(q) ||
        String(p.program_code || "").toLowerCase().includes(q) ||
        String(p.campus_id || "").toLowerCase().includes(q) ||
        String(p.campus?.campus_name || "").toLowerCase().includes(q)
      );
    });
  }, [programs, search]);

  function openCreate() {
    setEditing(null);
    setForm({ program_name: "", program_code: "", campus_id: "", program_structure: "" });
    setShowModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      program_name: p.program_name || "",
      program_code: p.program_code || "",
      campus_id: p.campus_id ? String(p.campus_id) : "",
      program_structure: p.program_structure || "",
    });
    setShowModal(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.program_name.trim() || !form.program_code.trim()) {
      alert("Program name and code are required.");
      return;
    }
    if (isSuperAdmin && !form.campus_id) {
      alert("Campus ID is required for Super Admin.");
      return;
    }

    const payload = {
      program_name: form.program_name.trim(),
      program_code: form.program_code.trim(),
      program_structure: form.program_structure?.trim() ? form.program_structure.trim() : null,
      ...(isSuperAdmin ? { campus_id: parseInt(form.campus_id) } : {}),
    };

    const res = editing
      ? await updateProgram(editing.program_id, payload)
      : await createProgram(payload);

    if (!res.success) {
      alert(res.message || "Failed");
      return;
    }
    setShowModal(false);
    await load();
  }

  async function onDelete(p) {
    if (!window.confirm(`Delete program ${p.program_code} - ${p.program_name}?`)) return;
    const res = await deleteProgram(p.program_id);
    if (!res.success) {
      alert(res.message || "Failed to delete");
      return;
    }
    await load();
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Programs</h1>
          <p className="text-gray-600">
            {isSuperAdmin
              ? "Create, edit, and delete programs across all campuses."
              : "Create, edit, and delete programs for your campus only."}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm whitespace-nowrap"
        >
          Add Program
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by program code/name/campus id..."
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Programs</h2>
          <span className="text-sm text-gray-500">{filtered.length} item(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campus</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-red-600">{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No programs found</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.program_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{p.program_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{p.program_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{p.campus?.campus_name || "N/A"}</td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => openEdit(p)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal
          title={editing ? "Edit Program" : "Add Program"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Code</label>
              <input
                value={form.program_code}
                onChange={(e) => setForm((s) => ({ ...s, program_code: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
              <input
                value={form.program_name}
                onChange={(e) => setForm((s) => ({ ...s, program_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {isSuperAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                <select
                  value={form.campus_id}
                  onChange={(e) => setForm((s) => ({ ...s, campus_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={loadingCampuses}
                >
                  <option value="">
                    {loadingCampuses ? "Loading campuses..." : "Select campus"}
                  </option>
                  {campuses.map((c) => (
                    <option key={c.campus_id} value={String(c.campus_id)}>
                      {c.campus_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Super Admin must select a campus.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Structure (optional)</label>
              <textarea
                value={form.program_structure}
                onChange={(e) => setForm((s) => ({ ...s, program_structure: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              >
                {editing ? "Save" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

