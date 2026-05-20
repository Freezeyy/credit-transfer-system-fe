function computeSMEAssignmentParts(assignment) {
  const pastSubjects = assignment?.pastSubjects || [];
  if (pastSubjects.length === 0) {
    return {
      hasPending: true,
      allSmeApproved: false,
      anySmeRejected: false,
    };
  }

  const hasPending = pastSubjects.some(
    (ps) =>
      (ps.sme_decision_status == null || ps.sme_decision_status === "") &&
      (ps.approval_status === "needs_sme_review" || ps.approval_status === "pending"),
  );
  const allSmeApproved = pastSubjects.every((ps) => ps.sme_decision_status === "approved_sme");
  const anySmeRejected = pastSubjects.some(
    (ps) =>
      ps.sme_decision_status === "rejected" || ps.sme_decision_status === "sme_reviewed_rejected",
  );

  return { hasPending, allSmeApproved, anySmeRejected };
}

/** True when at least one row still needs SME input (drives “Review” vs “View” on the list). */
export function smeAssignmentHasPendingRows(assignment) {
  return computeSMEAssignmentParts(assignment).hasPending;
}

/**
 * Match list/detail UX: SME outcome is driven by sme_decision_status when set,
 * while workflow may move approval_status to HOS stages.
 */
export function deriveSMEAssignmentOverallStatus(assignment) {
  const { hasPending, allSmeApproved, anySmeRejected } = computeSMEAssignmentParts(assignment);
  if (hasPending) return "needs_sme_review";
  if (anySmeRejected) return "rejected";
  if (allSmeApproved) return "approved_sme";
  return "needs_sme_review";
}
