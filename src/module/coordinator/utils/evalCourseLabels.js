export function courseColumnHeader(label, fallbackTitle) {
  const code = (label?.code || "").trim();
  const name = (label?.name || "").trim();
  if (code || name) {
    return (
      <div className="min-w-[200px]">
        {code ? <div className="font-semibold text-gray-900">{code}</div> : null}
        {name ? <div className="text-xs font-normal text-gray-600 mt-0.5">{name}</div> : null}
        <div className="text-xs font-normal text-gray-500 mt-1">Topics</div>
      </div>
    );
  }
  return fallbackTitle;
}

export function buildEvalCourseLabels(mapping, evaluation, pastColsCount) {
  const evalRoot = evaluation || null;
  const newLabel = {
    code:
      evalRoot?.new_subject_code ||
      mapping?.new_subject_code ||
      evalRoot?.course?.course_code ||
      null,
    name:
      evalRoot?.new_subject_name ||
      mapping?.new_subject_name ||
      evalRoot?.course?.course_name ||
      null,
  };
  const pastFromMapping = mapping?.past_courses || [];
  const pastLabels = Array.from({ length: pastColsCount }, (_, idx) => {
    const mapped = pastFromMapping[idx];
    if (mapped?.code || mapped?.name) return mapped;
    if (idx === 0 && (evalRoot?.old_subject_code || evalRoot?.old_subject_name)) {
      return {
        code: evalRoot.old_subject_code || null,
        name: evalRoot.old_subject_name || null,
      };
    }
    return { code: null, name: null };
  });
  return { newLabel, pastLabels };
}

export function formatCoursePair(label) {
  const code = (label?.code || "").trim();
  const name = (label?.name || "").trim();
  if (code && name) return `${code} — ${name}`;
  return code || name || "—";
}
