import React, { useEffect, useMemo, useState } from "react";
import { createCampus, deleteCampus, listCampuses, updateCampus } from "../hooks/useCampusManagement";

function BuildingIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 21V7a2 2 0 0 1 2-2h5v16M11 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16M3 21h18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 9h1M7 12h1M7 15h1M14 7h1M14 10h1M14 13h1M17 7h1M17 10h1M17 13h1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function gradientForName(name) {
  const gradients = [
    "from-indigo-600 via-violet-600 to-fuchsia-600",
    "from-sky-600 via-indigo-600 to-violet-600",
    "from-emerald-600 via-teal-600 to-sky-600",
    "from-amber-500 via-orange-600 to-rose-600",
    "from-slate-700 via-gray-700 to-zinc-700",
    "from-cyan-600 via-sky-600 to-indigo-600",
  ];
  let hash = 0;
  const s = String(name || "");
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return gradients[hash % gradients.length];
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((c) => (
            <div
              key={c.campus_id}
              className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition"
            >
              {/* Top half: "building image" area */}
              <div className={`h-28 bg-gradient-to-br ${gradientForName(c.campus_name)} relative`}>
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_30%,white,transparent_45%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BuildingIcon className="h-12 w-12 text-white/90 drop-shadow" />
                </div>
                {/* <div className="absolute top-3 right-3">
                  <span className="text-[11px] px-2 py-1 rounded-full bg-white/15 text-white border border-white/20">
                    ID {c.campus_id}
                  </span>
                </div> */}
              </div>

              {/* Bottom half: text area */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{c.campus_name}</h3>
                    <p className="text-xs text-gray-500 mt-1">UniKL campus</p>
                  </div>
                  <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                    <button
                      onClick={() => openEdit(c)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(c)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
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

