/** Legacy whole-application hint when there are no subject rows (prefer per-subject matching when possible). */
export function deriveAppStatus(app) {
  const subjects = app.newApplicationSubjects || [];
  const statuses = subjects.flatMap((s) =>
    (s.pastApplicationSubjects || []).map((p) => String(p.approval_status || "").toLowerCase()),
  );
  if (statuses.length === 0) return app.status || app.ct_status || "submitted";

  const any = (arr) => statuses.some((s) => arr.includes(s));
  const all = (arr) => statuses.every((s) => arr.includes(s));

  if (any(["hos_rejected", "rejected", "sme_reviewed_rejected"])) return "sme_rejected";
  if (all(["hos_approved"])) return "approved";
  if (any(["needs_sme_review"])) return "awaiting_sme";
  if (any(["approved_sme"])) return "sme_approved";
  if (all(["pending"])) return "submitted";
  return "submitted";
}

/** Per UniKL course line — used for inbox filters/counts so multi-course CT apps behave correctly. */
export function deriveCurrentSubjectStatus(subject) {
  const statuses = (subject?.pastApplicationSubjects || []).map((p) =>
    String(p.approval_status || "").toLowerCase(),
  );
  if (statuses.length === 0) return "submitted";

  const any = (arr) => statuses.some((s) => arr.includes(s));
  const all = (arr) => statuses.every((s) => arr.includes(s));

  if (any(["hos_rejected", "rejected", "sme_reviewed_rejected"])) return "sme_rejected";
  if (all(["hos_approved"])) return "approved";
  if (any(["hos_pending"])) return "awaiting_hos";
  if (any(["needs_sme_review"])) return "awaiting_sme";
  if (any(["approved_sme"])) return "sme_approved";
  if (any(["approved_template3"])) return "submitted";
  if (all(["pending"])) return "submitted";
  return "submitted";
}

export const INBOX_FILTERS = [
  "submitted",
  "awaiting_sme",
  "awaiting_hos",
  "sme_approved",
  "sme_rejected",
  "approved",
];

export function appMatchesSubjectStatusFilter(app, statusFilter) {
  if (statusFilter === "all") return true;
  const subjects = app.newApplicationSubjects || [];
  if (subjects.length === 0) {
    return deriveAppStatus(app) === statusFilter;
  }
  return subjects.some((subj) => deriveCurrentSubjectStatus(subj) === statusFilter);
}

export function computeInboxStatusCounts(applicationList) {
  const counts = {};
  INBOX_FILTERS.forEach((k) => {
    counts[k] = 0;
  });
  applicationList.forEach((app) => {
    INBOX_FILTERS.forEach((key) => {
      if (appMatchesSubjectStatusFilter(app, key)) counts[key] += 1;
    });
  });
  return counts;
}
