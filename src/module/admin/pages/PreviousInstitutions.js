import { useEffect, useState } from "react";
import {
  listUniTypes,
  createUniType,
  updateUniType,
  deleteUniType,
  listInstitutions,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  listOldCampuses,
  createOldCampus,
  updateOldCampus,
  deleteOldCampus,
} from "../hooks/useSuperAdminPreviousInstitutions";

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Badge({ active }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        active ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-600 border border-gray-200"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function PreviousInstitutions() {
  const [tab, setTab] = useState("unitypes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [uniTypes, setUniTypes] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [oldCampuses, setOldCampuses] = useState([]);

  const [newUniType, setNewUniType] = useState({ uni_type_code: "", uni_type_name: "" });
  const [newInstitution, setNewInstitution] = useState({ institution_name: "", uni_type_id: "" });
  const [newOldCampus, setNewOldCampus] = useState({ old_campus_name: "", institution_id: "" });
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [ut, inst, oc] = await Promise.all([listUniTypes(), listInstitutions(), listOldCampuses()]);
      setUniTypes(ut.uniTypes || []);
      setInstitutions(inst.institutions || []);
      setOldCampuses(oc.oldCampuses || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    setSearch("");
    setModalOpen(false);
    setEditMode(false);
    setEditingId(null);
  }, [tab]);

  const toggleActive = async (entity, id, current) => {
    try {
      if (entity === "unitype") await updateUniType(id, { is_active: !current });
      if (entity === "institution") await updateInstitution(id, { is_active: !current });
      if (entity === "oldcampus") await updateOldCampus(id, { is_active: !current });
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
  };

  const onCreateUniType = async (e) => {
    e.preventDefault();
    try {
      await createUniType({ ...newUniType, is_active: true });
      setNewUniType({ uni_type_code: "", uni_type_name: "" });
      setModalOpen(false);
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
  };

  const onUpdateUniType = async (e) => {
    e.preventDefault();
    try {
      await updateUniType(editingId, { ...newUniType });
      setModalOpen(false);
      setEditMode(false);
      setEditingId(null);
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
  };

  const onCreateInstitution = async (e) => {
    e.preventDefault();
    try {
      await createInstitution({
        institution_name: newInstitution.institution_name,
        uni_type_id: parseInt(newInstitution.uni_type_id),
        is_active: true,
      });
      setNewInstitution({ institution_name: "", uni_type_id: "" });
      setModalOpen(false);
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
  };

  const onUpdateInstitution = async (e) => {
    e.preventDefault();
    try {
      await updateInstitution(editingId, {
        institution_name: newInstitution.institution_name,
        uni_type_id: parseInt(newInstitution.uni_type_id),
      });
      setModalOpen(false);
      setEditMode(false);
      setEditingId(null);
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
  };

  const onCreateOldCampus = async (e) => {
    e.preventDefault();
    try {
      await createOldCampus({
        old_campus_name: newOldCampus.old_campus_name,
        institution_id: parseInt(newOldCampus.institution_id),
        is_active: true,
      });
      setNewOldCampus({ old_campus_name: "", institution_id: "" });
      setModalOpen(false);
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
  };

  const onUpdateOldCampus = async (e) => {
    e.preventDefault();
    try {
      await updateOldCampus(editingId, {
        old_campus_name: newOldCampus.old_campus_name,
        institution_id: parseInt(newOldCampus.institution_id),
      });
      setModalOpen(false);
      setEditMode(false);
      setEditingId(null);
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    setEditingId(null);
    if (tab === "unitypes") setNewUniType({ uni_type_code: "", uni_type_name: "" });
    if (tab === "institutions") setNewInstitution({ institution_name: "", uni_type_id: "" });
    if (tab === "oldcampuses") setNewOldCampus({ old_campus_name: "", institution_id: "" });
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditMode(true);
    if (tab === "unitypes") {
      setEditingId(row.uni_type_id);
      setNewUniType({ uni_type_code: row.uni_type_code, uni_type_name: row.uni_type_name });
    }
    if (tab === "institutions") {
      setEditingId(row.institution_id);
      setNewInstitution({ institution_name: row.institution_name, uni_type_id: String(row.uni_type_id) });
    }
    if (tab === "oldcampuses") {
      setEditingId(row.old_campus_id);
      setNewOldCampus({ old_campus_name: row.old_campus_name, institution_id: String(row.institution_id) });
    }
    setModalOpen(true);
  };

  const onDelete = async (entity, id, label) => {
    if (!window.confirm(`Delete "${label}"?\n\nThis cannot be undone.`)) return;
    try {
      if (entity === "unitype") await deleteUniType(id);
      if (entity === "institution") await deleteInstitution(id);
      if (entity === "oldcampus") await deleteOldCampus(id);
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
          <p>Loading previous institution data...</p>
        </div>
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const filteredUniTypes = uniTypes.filter((t) =>
    !q
      ? true
      : `${t.uni_type_code} ${t.uni_type_name}`.toLowerCase().includes(q)
  );
  const filteredInstitutions = institutions.filter((i) =>
    !q
      ? true
      : `${i.institution_name} ${i.uniType ? `${i.uniType.uni_type_code} ${i.uniType.uni_type_name}` : ""}`
          .toLowerCase()
          .includes(q)
  );
  const filteredOldCampuses = oldCampuses.filter((oc) =>
    !q
      ? true
      : `${oc.old_campus_name} ${oc.institution?.institution_name || ""}`
          .toLowerCase()
          .includes(q)
  );

  const tabMeta = {
    unitypes: { label: "UniTypes", count: uniTypes.length },
    institutions: { label: "Institutions", count: institutions.length },
    oldcampuses: { label: "Old Campuses", count: oldCampuses.length },
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Previous Institutions</h1>
            <p className="text-gray-600">
              Super Admin: manage UniTypes, Institutions, and StudentOldCampuses used in student registration.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openCreateModal}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
            >
              Add {tabMeta[tab].label}
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-b">
          <div className="flex gap-2">
            {Object.entries(tabMeta).map(([key, meta]) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                    active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {meta.label} <span className={`${active ? "text-indigo-100" : "text-gray-400"}`}>({meta.count})</span>
                </button>
              );
            })}
          </div>

          <div className="w-full md:w-96">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${tabMeta[tab].label}...`}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {tab === "unitypes" && (
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4 w-16">No.</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUniTypes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-500">
                    No UniTypes found.
                  </td>
                </tr>
              ) : (
                filteredUniTypes.map((t, idx) => (
                  <tr key={t.uni_type_id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{t.uni_type_code}</td>
                    <td className="py-3 px-4 text-gray-700">{t.uni_type_name}</td>
                    <td className="py-3 px-4"><Badge active={!!t.is_active} /></td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button className="text-gray-700 hover:text-gray-900" onClick={() => openEditModal(t)}>Edit</button>
                        <button className="text-indigo-600 hover:text-indigo-800 font-medium" onClick={() => toggleActive("unitype", t.uni_type_id, t.is_active)}>
                          {t.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button className="text-red-600 hover:text-red-800 font-medium" onClick={() => onDelete("unitype", t.uni_type_id, `${t.uni_type_code} - ${t.uni_type_name}`)}>
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
      )}

      {tab === "institutions" && (
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4 w-16">No.</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstitutions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-500">
                    No Institutions found.
                  </td>
                </tr>
              ) : (
                filteredInstitutions.map((i, idx) => (
                  <tr key={i.institution_id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{i.institution_name}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {i.uniType ? `${i.uniType.uni_type_code} - ${i.uniType.uni_type_name}` : i.uni_type_id}
                    </td>
                    <td className="py-3 px-4"><Badge active={!!i.is_active} /></td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button className="text-gray-700 hover:text-gray-900" onClick={() => openEditModal(i)}>Edit</button>
                        <button className="text-indigo-600 hover:text-indigo-800 font-medium" onClick={() => toggleActive("institution", i.institution_id, i.is_active)}>
                          {i.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button className="text-red-600 hover:text-red-800 font-medium" onClick={() => onDelete("institution", i.institution_id, i.institution_name)}>
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
      )}

      {tab === "oldcampuses" && (
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4 w-16">No.</th>
                <th className="py-3 px-4">Old campus / branch</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOldCampuses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-500">
                    No Old Campuses found.
                  </td>
                </tr>
              ) : (
                filteredOldCampuses.map((oc, idx) => (
                  <tr key={oc.old_campus_id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{oc.old_campus_name}</td>
                    <td className="py-3 px-4 text-gray-700">{oc.institution?.institution_name || oc.institution_id}</td>
                    <td className="py-3 px-4"><Badge active={!!oc.is_active} /></td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button className="text-gray-700 hover:text-gray-900" onClick={() => openEditModal(oc)}>Edit</button>
                        <button className="text-indigo-600 hover:text-indigo-800 font-medium" onClick={() => toggleActive("oldcampus", oc.old_campus_id, oc.is_active)}>
                          {oc.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button className="text-red-600 hover:text-red-800 font-medium" onClick={() => onDelete("oldcampus", oc.old_campus_id, oc.old_campus_name)}>
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
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          tab === "unitypes"
            ? (editMode ? "Edit UniType" : "Add UniType")
            : tab === "institutions"
              ? (editMode ? "Edit Institution" : "Add Institution")
              : (editMode ? "Edit Old Campus / Branch" : "Add Old Campus / Branch")
        }
      >
        {tab === "unitypes" && (
          <form onSubmit={editMode ? onUpdateUniType : onCreateUniType} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">UniType code</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. IPTA"
                value={newUniType.uni_type_code}
                onChange={(e) => setNewUniType((s) => ({ ...s, uni_type_code: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">UniType name</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Universiti Awam"
                value={newUniType.uni_type_name}
                onChange={(e) => setNewUniType((s) => ({ ...s, uni_type_name: e.target.value }))}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
              <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                {editMode ? "Save" : "Add"}
              </button>
            </div>
          </form>
        )}

        {tab === "institutions" && (
          <form onSubmit={editMode ? onUpdateInstitution : onCreateInstitution} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Institution name</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Universiti Malaya"
                value={newInstitution.institution_name}
                onChange={(e) => setNewInstitution((s) => ({ ...s, institution_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">UniType</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                value={newInstitution.uni_type_id}
                onChange={(e) => setNewInstitution((s) => ({ ...s, uni_type_id: e.target.value }))}
                required
              >
                <option value="">Select UniType</option>
                {uniTypes.filter((u) => u.is_active).map((u) => (
                  <option key={u.uni_type_id} value={u.uni_type_id}>
                    {u.uni_type_code} - {u.uni_type_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
              <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                {editMode ? "Save" : "Add"}
              </button>
            </div>
          </form>
        )}

        {tab === "oldcampuses" && (
          <form onSubmit={editMode ? onUpdateOldCampus : onCreateOldCampus} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Old campus / branch name</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. IIUM Gombak"
                value={newOldCampus.old_campus_name}
                onChange={(e) => setNewOldCampus((s) => ({ ...s, old_campus_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                value={newOldCampus.institution_id}
                onChange={(e) => setNewOldCampus((s) => ({ ...s, institution_id: e.target.value }))}
                required
              >
                <option value="">Select Institution</option>
                {institutions.filter((i) => i.is_active).map((i) => (
                  <option key={i.institution_id} value={i.institution_id}>
                    {i.institution_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
              <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                {editMode ? "Save" : "Add"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

