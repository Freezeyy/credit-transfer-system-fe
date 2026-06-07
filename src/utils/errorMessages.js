/** Turn API "in use" detail counts into readable dialog text. */

const IN_USE_LABELS = {
  smeCount: (n) =>
    n > 0 ? `${n} active SME assignment${n !== 1 ? "s" : ""}` : null,
  template3Count: (n) =>
    n > 0 ? `${n} Template3 mapping${n !== 1 ? "s" : ""}` : null,
  programCourseCount: (n) =>
    n > 0 ? `linked to ${n} programme${n !== 1 ? "s" : ""}` : null,
  newSubCount: (n) =>
    n > 0
      ? `${n} credit transfer application course${n !== 1 ? "s" : ""}`
      : null,
  studentCount: (n) =>
    n > 0 ? `${n} enrolled student${n !== 1 ? "s" : ""}` : null,
  appCount: (n) =>
    n > 0 ? `${n} credit transfer application${n !== 1 ? "s" : ""}` : null,
  coordinatorCount: (n) =>
    n > 0 ? `${n} active coordinator${n !== 1 ? "s" : ""}` : null,
  lecturerCount: (n) =>
    n > 0 ? `${n} lecturer${n !== 1 ? "s" : ""}` : null,
  programCount: (n) =>
    n > 0 ? `${n} programme${n !== 1 ? "s" : ""}` : null,
  courseCount: (n) =>
    n > 0 ? `${n} course${n !== 1 ? "s" : ""}` : null,
};

export function formatInUseDetails(details) {
  if (!details || typeof details !== "object") return "";

  const lines = Object.entries(details)
    .map(([key, value]) => {
      const label = IN_USE_LABELS[key];
      return label ? label(Number(value) || 0) : null;
    })
    .filter(Boolean);

  if (lines.length === 0) return "";
  return `\n\nStill in use:\n• ${lines.join("\n• ")}`;
}

/** User-facing message for failed API actions (never raw JSON). */
export function formatActionError(message, details) {
  const base = String(message || "Something went wrong. Please try again.");
  return base + formatInUseDetails(details);
}
