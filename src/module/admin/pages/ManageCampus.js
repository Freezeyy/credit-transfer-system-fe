import React, { useEffect, useMemo, useState } from "react";
import { createCampus, deleteCampus, listCampuses, updateCampus } from "../hooks/useCampusManagement";

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

export default function ManageCampus() {
  const user = useMemo(() => JSON.parse(localStorage.getItem("cts_user") || "{}"), []);
  const isSuperAdmin = user?.role === "Super Admin";

  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ campus_name: "" });

  async function load() {
    setLoading(true);
    setError("");
    const res = await listCampuses();
    if (res.success) setCampuses(res.data);
    else {
      setCampuses([]);
      setError(res.message || "Failed to load campuses");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!isSuperAdmin) return;
    load();
  }, [isSuperAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return campuses;
    return campuses.filter((c) => String(c.campus_name || "").toLowerCase().includes(q));
  }, [campuses, search]);

  function openCreate() {
    setEditing(null);
    setForm({ campus_name: "" });
    setShowModal(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({ campus_name: c.campus_name || "" });
    setShowModal(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.campus_name.trim()) {
      alert("Campus name is required.");
      return;
    }

    const payload = { campus_name: form.campus_name.trim() };
    const res = editing
      ? await updateCampus(editing.campus_id, payload)
      : await createCampus(payload);

    if (!res.success) {
      alert(res.message || "Failed");
      return;
    }
    setShowModal(false);
    await load();
  }

  async function onDelete(c) {
    if (!window.confirm(`Delete campus "${c.campus_name}"?`)) return;
    const res = await deleteCampus(c.campus_id);
    if (!res.success) {
      const details = res.data?.details;
      if (details) {
        alert(`${res.message}\n\nIn use:\n- Lecturers: ${details.lecturerCount}\n- Programs: ${details.programCount}\n- Courses: ${details.courseCount}`);
      } else {
        alert(res.message || "Failed to delete");
      }
      return;
    }
    await load();
  }

  if (!isSuperAdmin) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Campus</h1>
          <p className="mt-2 text-sm text-red-700">Super Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Campus</h1>
          <p className="text-gray-600">UniKL campuses used across lecturers, programs, and courses.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm whitespace-nowrap"
        >
          Add Campus
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search campus name..."
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
          Loading...
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center text-red-700">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left border-b">
                  <th className="py-3 px-4 w-16">No.</th>
                  <th className="py-3 px-4">Campus Name</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-10 text-center text-gray-500">
                      No campuses found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, idx) => (
                    <tr key={c.campus_id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-600">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{c.campus_name}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button className="text-gray-700 hover:text-gray-900" onClick={() => openEdit(c)}>Edit</button>
                          <button className="text-red-600 hover:text-red-800 font-medium" onClick={() => onDelete(c)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? "Edit Campus" : "Add Campus"} onClose={() => setShowModal(false)}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campus Name</label>
              <input
                value={form.campus_name}
                onChange={(e) => setForm({ campus_name: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
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

