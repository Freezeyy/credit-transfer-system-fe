export function isSmeReviewCompleted(pastSubjects = []) {
  if (!pastSubjects.length) return false;
  return pastSubjects.every((ps) => {
    const d = String(ps.sme_decision_status || "").toLowerCase();
    return d === "approved_sme" || d === "sme_reviewed_rejected" || d === "rejected";
  });
}

export function parseTopicsComparison(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** First Template3 row on this bundle that has a stored topics comparison. */
export function findStoredTemplate3Evaluation(pastSubjects = []) {
  for (const ps of pastSubjects) {
    const t3 = ps.template3;
    if (!t3) continue;
    const topics = parseTopicsComparison(t3.topics_comparison);
    if (topics?.length) {
      return {
        topics,
        sme_review_notes: (t3.sme_review_notes || ps.sme_review_notes || "").trim(),
        similarity_percentage: t3.similarity_percentage ?? ps.similarity_percentage,
      };
    }
  }

  const notes = pastSubjects.map((ps) => (ps.sme_review_notes || "").trim()).find(Boolean);
  const sim = pastSubjects.find((ps) => ps.similarity_percentage != null)?.similarity_percentage;
  if (notes || sim != null) {
    return { topics: null, sme_review_notes: notes || "", similarity_percentage: sim };
  }
  return null;
}

export function topicsRowsFromStoredComparison(storedTopics, pastSubjectsCount) {
  if (!Array.isArray(storedTopics) || storedTopics.length === 0) return [];
  const count = Math.max(1, pastSubjectsCount || 1);

  return storedTopics.map((row, i) => {
    const past = row.pastSubjectTopics || [];
    const pastSubjectTopics = Array.from({ length: count }, (_, idx) => ({
      topic: past[idx]?.topic || "",
    }));

    return {
      id: `stored-${i}`,
      newSubjectTopic: row.newSubjectTopic || "",
      pastSubjectTopics,
      similarityPercentage:
        row.similarityPercentage != null ? String(row.similarityPercentage) : "",
    };
  });
}
