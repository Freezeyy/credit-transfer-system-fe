import { useEffect, useMemo, useState } from "react";
import { CalendarIcon } from "@heroicons/react/outline";
import { getCampusProcessWindow, saveCampusProcessWindow } from "../hooks/useProcessWindowManagement";

export default function ProcessWindowSettings() {
  const user = JSON.parse(localStorage.getItem("cts_user") || "null");
  const isSuperAdmin = user?.role === "Super Admin";

  const [campuses, setCampuses] = useState([]);
  const [campusId, setCampusId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [ctStartAt, setCtStartAt] = useState("");
  const [ctEndAt, setCtEndAt] = useState("");
  const [ctPreset, setCtPreset] = useState("manual"); // 1m | 2m | manual

  const [smeDays, setSmeDays] = useState(14);
  const [smePreset, setSmePreset] = useState("2w"); // 1w | 2w | manual

  const OPEN_API_BASE = process.env.REACT_APP_API_ORIGIN || "http://localhost:3000";

  const nowIsoLocal = useMemo(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, []);

  useEffect(() => {
    async function loadCampuses() {
      if (!isSuperAdmin) return;
      try {
        const res = await fetch(`${OPEN_API_BASE}/staticdata`);
        const data = await res.json();
        setCampuses(data?.campuses || []);
      } catch {
        setCampuses([]);
      }
    }
    loadCampuses();
  }, [OPEN_API_BASE, isSuperAdmin]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const data = await getCampusProcessWindow(isSuperAdmin ? campusId : "");
        setCtStartAt(data.ct_start_at ? new Date(data.ct_start_at).toISOString().slice(0, 16) : "");
        setCtEndAt(data.ct_end_at ? new Date(data.ct_end_at).toISOString().slice(0, 16) : "");
        setSmeDays(Number(data.sme_eval_days ?? 14));
      } catch (e) {
        setError(e?.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campusId, isSuperAdmin]);

  function applyCtPreset(preset) {
    setCtPreset(preset);
    if (preset === "manual") return;
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + (preset === "1m" ? 30 : 60));
    setCtStartAt(start.toISOString().slice(0, 16));
    setCtEndAt(end.toISOString().slice(0, 16));
  }

  function applySmePreset(preset) {
    setSmePreset(preset);
    if (preset === "manual") return;
    setSmeDays(preset === "1w" ? 7 : 14);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        ...(isSuperAdmin ? { campus_id: campusId } : {}),
        ct_start_at: ctStartAt ? new Date(ctStartAt).toISOString() : null,
        ct_end_at: ctEndAt ? new Date(ctEndAt).toISOString() : null,
        sme_eval_days: Number(smeDays),
      };
      await saveCampusProcessWindow(payload);
      setSuccess("Saved successfully.");
    } catch (e) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Process Window Settings</h1>
        <p className="text-gray-600">
          Control when students can apply and how long SMEs have to evaluate assignments.
        </p>
      </div>

      {isSuperAdmin && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <label className="text-sm font-medium text-gray-700 block mb-2">Campus</label>
          <select
            value={campusId}
            onChange={(e) => setCampusId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
          >
            <option value="">Select a campus</option>
            {campuses.map((c) => (
              <option key={c.campus_id} value={c.campus_id}>
                {c.campus_name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Super Admin can manage windows for any campus.
          </p>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">CT Process Window</h2>
              <p className="text-sm text-gray-600">
                Students can apply and staff can process within this date range.
              </p>
            </div>
            <CalendarIcon className="h-6 w-6 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <button
              className={`px-3 py-2 rounded-lg text-sm border ${ctPreset === "1m" ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-gray-200 hover:bg-gray-50"}`}
              onClick={() => applyCtPreset("1m")}
              type="button"
            >
              1 month
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm border ${ctPreset === "2m" ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-gray-200 hover:bg-gray-50"}`}
              onClick={() => applyCtPreset("2m")}
              type="button"
            >
              2 months
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm border ${ctPreset === "manual" ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-gray-200 hover:bg-gray-50"}`}
              onClick={() => applyCtPreset("manual")}
              type="button"
            >
              Manual
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Start</label>
              <input
                type="datetime-local"
                value={ctStartAt}
                onChange={(e) => {
                  setCtPreset("manual");
                  setCtStartAt(e.target.value);
                }}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                placeholder={nowIsoLocal}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">End</label>
              <input
                type="datetime-local"
                value={ctEndAt}
                onChange={(e) => {
                  setCtPreset("manual");
                  setCtEndAt(e.target.value);
                }}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Tip: set an end date in the past to lock all CT processing for testing.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">SME Evaluation Time</h2>
              <p className="text-sm text-gray-600">
                How many days an SME has to complete each assignment after it’s assigned.
              </p>
            </div>
            <CalendarIcon className="h-6 w-6 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <button
              className={`px-3 py-2 rounded-lg text-sm border ${smePreset === "1w" ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-gray-200 hover:bg-gray-50"}`}
              onClick={() => applySmePreset("1w")}
              type="button"
            >
              1 week
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm border ${smePreset === "2w" ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-gray-200 hover:bg-gray-50"}`}
              onClick={() => applySmePreset("2w")}
              type="button"
            >
              2 weeks
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm border ${smePreset === "manual" ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-gray-200 hover:bg-gray-50"}`}
              onClick={() => applySmePreset("manual")}
              type="button"
            >
              Manual
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Days</label>
            <input
              type="number"
              min="1"
              value={smeDays}
              onChange={(e) => {
                setSmePreset("manual");
                setSmeDays(e.target.value);
              }}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-6 bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm">
          {success}
        </div>
      )}

      <div className="mt-6 flex items-center justify-end">
        <button
          onClick={handleSave}
          disabled={saving || loading || (isSuperAdmin && !campusId)}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

