/** SME outcome is preserved in sme_decision_status even when approval_status moves to HOS stages. */

export function hasViewableSmeEvaluation(pastSubject) {
  if (!pastSubject) return false;
  const smeDecision = String(pastSubject.sme_decision_status || "").toLowerCase();
  if (
    smeDecision === "approved_sme" ||
    smeDecision === "sme_reviewed_rejected" ||
    smeDecision === "rejected"
  ) {
    return true;
  }
  if (pastSubject.template3_id) return true;
  return false;
}

export function subjectHasViewableSmeEvaluation(pastSubjects = []) {
  return (pastSubjects || []).some(hasViewableSmeEvaluation);
}

export function findTemplate3IdForEvaluation(pastSubjects = []) {
  const row = (pastSubjects || []).find((p) => p.template3_id);
  return row?.template3_id ?? null;
}

export function findPrimaryPastForSmeEval(pastSubjects = []) {
  const pasts = pastSubjects || [];
  return (
    pasts.find((p) => p.template3_id) ||
    pasts.find((p) => {
      const d = String(p.sme_decision_status || "").toLowerCase();
      return d === "approved_sme" || d === "sme_reviewed_rejected";
    }) ||
    pasts[0] ||
    null
  );
}

/** Fallback mapping column data from loaded application rows (when live Template3 check is pending). */
export function buildMappingSnapshotFromPastRows(pastRows = [], course = null) {
  if (!pastRows.length) return null;

  const results = pastRows.map((p) => {
    const nested = p.template3;
    const template3_id = p.template3_id || nested?.template3_id;
    const hasMatch = !!template3_id;
    return {
      pastSubject_id: p.pastSubject_id,
      pastSubject_code: p.pastSubject_code,
      pastSubject_name: p.pastSubject_name,
      hasMatch,
      template3: hasMatch
        ? {
            template3_id,
            similarity_percentage: p.similarity_percentage ?? nested?.similarity_percentage ?? null,
            sme_review_notes: p.sme_review_notes ?? nested?.sme_review_notes ?? null,
            course: course
              ? { course_code: course.course_code, course_name: course.course_name }
              : undefined,
          }
        : null,
    };
  });

  const matchedCount = results.filter((r) => r.hasMatch).length;
  const allMatch = matchedCount > 0 && matchedCount === results.length;

  return {
    results,
    allMatch,
    someMatch: matchedCount > 0,
    matchedCount,
    requiredCount: 0,
    missingRequiredCodes: [],
    coverageIncomplete: false,
  };
}
