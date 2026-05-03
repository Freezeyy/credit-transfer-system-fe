import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChartPieIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from "@heroicons/react/outline";
import { getHosReviewStats, listHosReviews } from "../hooks/useHosReviews";

const COLORS = {
  pending: "#fbbf24",
  approved: "#34d399",
  rejected: "#f87171",
  coordinator: "#0ea5e9",
  sme: "#a855f7",
  awaitingHos: "#4f46e5",
};

/** Donut chart using conic-gradient (no extra chart dependencies). */
function ReviewStatusDonut({ pending, approved, rejected, size = 220 }) {
  const segments = useMemo(() => {
    const list = [
      { key: "pending", count: pending, color: COLORS.pending },
      { key: "approved", count: approved, color: COLORS.approved },
      { key: "rejected", count: rejected, color: COLORS.rejected },
    ].filter((s) => s.count > 0);
    const total = pending + approved + rejected;
    if (total === 0) return { gradient: null, total };
    let cursor = 0;
    const stops = list.map((s) => {
      const pct = (s.count / total) * 100;
      const start = cursor;
      cursor += pct;
      return `${s.color} ${start}% ${cursor}%`;
    });
    return { gradient: `conic-gradient(${stops.join(", ")})`, total };
  }, [pending, approved, rejected]);

  const hole = Math.round(size * 0.42);

  if (!segments.gradient) {
    return (
      <div
        className="rounded-full bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-500 text-sm mx-auto"
        style={{ width: size, height: size }}
      >
        <span>No data yet</span>
      </div>
    );
  }

  return (
    <div className="relative mx-auto shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full shadow-md"
        style={{
          width: size,
          height: size,
          background: segments.gradient,
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-inner flex flex-col items-center justify-center border border-gray-100"
        style={{ width: hole, height: hole }}
      >
        <span className="text-2xl font-bold text-gray-900 leading-none">{segments.total}</span>
        <span className="text-[11px] text-gray-500 mt-1">Total reviews</span>
      </div>
    </div>
  );
}

const DEFAULT_PIPELINE = {
  applications_at_coordinator: 0,
  applications_awaiting_sme: 0,
  applications_awaiting_hos: 0,
  applications_terminal: 0,
  total_applications: 0,
  distinct_students_applied: 0,
};

/** Active programme funnel: Coordinator queue vs SME vs awaiting HOS (excludes settled applications). */
function ProgrammePipelineDonut({ coordinator, sme, awaitingHos, size = 200 }) {
  const segments = useMemo(() => {
    const list = [
      { key: "pc", count: coordinator, color: COLORS.coordinator },
      { key: "sme", count: sme, color: COLORS.sme },
      { key: "hos", count: awaitingHos, color: COLORS.awaitingHos },
    ].filter((s) => s.count > 0);
    const total = coordinator + sme + awaitingHos;
    if (total === 0) return { gradient: null, total };
    let cursor = 0;
    const stops = list.map((s) => {
      const pct = (s.count / total) * 100;
      const start = cursor;
      cursor += pct;
      return `${s.color} ${start}% ${cursor}%`;
    });
    return { gradient: `conic-gradient(${stops.join(", ")})`, total };
  }, [coordinator, sme, awaitingHos]);

  const hole = Math.round(size * 0.42);

  if (!segments.gradient) {
    return (
      <div
        className="rounded-full bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-500 text-xs text-center px-3 mx-auto"
        style={{ width: size, height: size }}
      >
        Nothing in Coordinator / SME / HOS queues
      </div>
    );
  }

  return (
    <div className="relative mx-auto shrink-0" style={{ width: size, height: size }}>
      <div className="rounded-full shadow-md" style={{ width: size, height: size, background: segments.gradient }} />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-inner flex flex-col items-center justify-center border border-gray-100"
        style={{ width: hole, height: hole }}
      >
        <span className="text-xl font-bold text-gray-900 leading-none">{segments.total}</span>
        <span className="text-[10px] text-gray-500 mt-1 text-center px-1">In pipeline</span>
      </div>
    </div>
  );
}

export default function HosDashboardContent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [pipeline, setPipeline] = useState(DEFAULT_PIPELINE);
  const [recent, setRecent] = useState([]);

  async function load() {
    setLoading(true);
    const [statsRes, pendingRes] = await Promise.all([
      getHosReviewStats(),
      listHosReviews("pending"),
    ]);

    if (statsRes.success && statsRes.data?.stats) {
      const s = statsRes.data.stats;
      setStats({
        pending: s.pending ?? 0,
        approved: s.approved ?? 0,
        rejected: s.rejected ?? 0,
        total: s.total ?? 0,
      });
      setPipeline({ ...DEFAULT_PIPELINE, ...(statsRes.data.pipeline || {}) });
    } else {
      setStats({ pending: 0, approved: 0, rejected: 0, total: 0 });
      setPipeline(DEFAULT_PIPELINE);
    }

    if (pendingRes.success) {
      setRecent((pendingRes.data || []).slice(0, 5));
    } else {
      setRecent([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const legend = useMemo(
    () => [
      { key: "pending", label: "Pending (your review)", count: stats.pending, color: COLORS.pending },
      { key: "approved", label: "Approved", count: stats.approved, color: COLORS.approved },
      { key: "rejected", label: "Rejected", count: stats.rejected, color: COLORS.rejected },
    ],
    [stats]
  );

  const pipelineLegend = useMemo(
    () => [
      {
        key: "pc",
        label: "With Programme Coordinator",
        subtitle: "Needs review / not yet sent to SME or awaiting PC action.",
        count: pipeline.applications_at_coordinator ?? 0,
        color: COLORS.coordinator,
      },
      {
        key: "sme",
        label: "With SME",
        subtitle: "At least one course mapping awaiting SME review.",
        count: pipeline.applications_awaiting_sme ?? 0,
        color: COLORS.sme,
      },
      {
        key: "hos",
        label: "Awaiting your sign-off",
        subtitle: "Sent to Head of Section; includes your pending queue.",
        count: pipeline.applications_awaiting_hos ?? 0,
        color: COLORS.awaitingHos,
      },
    ],
    [pipeline]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">Loading dashboard…</div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-slate-700 to-indigo-800 rounded-xl p-6 text-white shadow-md">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <ChartPieIcon className="h-9 w-9 opacity-90" />
          Head of Section Overview
        </h1>
        <p className="text-slate-200 text-sm max-w-2xl">
          View-only summaries: your HOS decisions, intake across your UniKL programme (Coordinator vs SME queues), and applicants.
          Open{" "}
          <Link to="/hos/reviews" className="underline font-medium text-white">
            Reviews
          </Link>{" "}
          to record a decision when the process window is open.
        </p>
      </div>

      {/* Programme pipeline (aligned with Coordinator inbox statuses) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Credit transfer intake — your programme</h2>
        <p className="text-sm text-gray-600 mb-6">
          Non-draft applications for the same UniKL programme as your Head-of-Section assignment. Counts exclude applications fully completed or rejected.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col items-center">
            <ProgrammePipelineDonut
              coordinator={pipeline.applications_at_coordinator}
              sme={pipeline.applications_awaiting_sme}
              awaitingHos={pipeline.applications_awaiting_hos}
            />
            <ul className="mt-6 w-full space-y-4">
              {pipelineLegend.map((row) => (
                <li key={row.key} className="text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-start gap-2 text-gray-800 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: row.color }} />
                      <span>
                        <span className="font-medium block">{row.label}</span>
                        <span className="text-xs text-gray-500 block mt-0.5">{row.subtitle}</span>
                      </span>
                    </span>
                    <span className="font-bold text-gray-900 tabular-nums shrink-0">{row.count}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 p-4 bg-sky-50 border-l-4 border-sky-500">
              <p className="text-xs text-sky-900/80 font-medium">Applications with PC</p>
              <p className="text-2xl font-bold text-sky-700 mt-1">{pipeline.applications_at_coordinator}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 bg-violet-50 border-l-4 border-violet-500">
              <p className="text-xs text-violet-900/80 font-medium">Applications with SME</p>
              <p className="text-2xl font-bold text-violet-700 mt-1">{pipeline.applications_awaiting_sme}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 bg-indigo-50 border-l-4 border-indigo-600">
              <p className="text-xs text-indigo-900/80 font-medium">Awaiting HOS</p>
              <p className="text-2xl font-bold text-indigo-700 mt-1">{pipeline.applications_awaiting_hos}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 bg-emerald-50 border-l-4 border-emerald-500">
              <p className="text-xs text-emerald-900/80 font-medium">Students who applied</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{pipeline.distinct_students_applied}</p>
              <p className="text-[11px] text-emerald-800/70 mt-1">Distinct accounts (non-draft)</p>
            </div>
            <div className="sm:col-span-2 rounded-xl border border-dashed border-gray-300 p-4 bg-gray-50">
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-800">{pipeline.total_applications}</span> total submitted applications •{" "}
                <span className="font-semibold text-gray-800">{pipeline.applications_terminal}</span> completed or rejected
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 self-start w-full">Review status mix</h2>
          <ReviewStatusDonut
            pending={stats.pending}
            approved={stats.approved}
            rejected={stats.rejected}
          />
          <ul className="mt-8 w-full space-y-3">
            {legend.map((row) => (
              <li key={row.key} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                  {row.label}
                </span>
                <span className="font-semibold text-gray-900 tabular-nums">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 border-l-4 border-amber-400">
              <p className="text-xs text-gray-600 mb-1">Pending / under review</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 border-l-4 border-emerald-400">
              <p className="text-xs text-gray-600 mb-1">Approved</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 border-l-4 border-red-400">
              <p className="text-xs text-gray-600 mb-1">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 border-l-4 border-gray-400">
              <p className="text-xs text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>

          <Link
            to="/hos/reviews"
            className="block bg-indigo-50 border-2 border-indigo-100 rounded-xl p-5 hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-indigo-900">Open review queue</h3>
                <p className="text-sm text-indigo-700/90 mt-1">
                  Browse pending, approved, and rejected packages (same list as coordinators route to you).
                </p>
              </div>
              <ArrowRightIcon className="h-8 w-8 text-indigo-600 shrink-0" />
            </div>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
            Latest pending packages
          </h2>
          <Link to="/hos/reviews" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium">
            View all <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No pending HOS reviews right now.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((r) => {
              const subj = r.newApplicationSubject;
              const ct = subj?.creditTransferApplication;
              const student = ct?.student;
              const course = subj?.course;
              return (
                <li key={r.hos_review_id}>
                  <button
                    type="button"
                    className="w-full text-left py-4 px-2 rounded-lg hover:bg-gray-50 flex items-center justify-between gap-4"
                    onClick={() => navigate(`/hos/reviews/${r.hos_review_id}`)}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {course?.course_code || subj?.application_subject_name || "UniKL course"} —{" "}
                        {course?.course_name || subj?.application_subject_name || ""}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {student?.student_name || "Student"} · Application #{ct?.ct_id ?? "—"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-1 rounded-full shrink-0">
                      Pending
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-500 px-1">
        Decisions still require opening each review from the queue when the credit transfer window is active for your campus.
      </p>
    </div>
  );
}
