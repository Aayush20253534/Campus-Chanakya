export const normalizeResult = (item) => {
  const grade = item.grade || "N/A";

  return {
    code: item.subject_code || "N/A",
    name: item.subject_name || "Unnamed Subject",
    semester: item.semester || "N/A",
    credits: item.credits || 0,
    internal: item.internal_marks ?? 0,
    external: item.external_marks ?? 0,
    total: item.total_marks ?? 0,
    grade,
    result: grade === "F" || grade === "D" ? "Fail" : "Pass",
  };
};

export const getGradeFromTotal = (total) => {
  const n = Number(total) || 0;

  if (n >= 90) return "A+";
  if (n >= 80) return "A";
  if (n >= 70) return "B+";
  if (n >= 60) return "B";
  if (n >= 50) return "C";
  if (n >= 40) return "D";

  return "F";
};

export const getGradeClass = (grade) => {
  if (grade === "A+" || grade === "A") return "gp-excellent";
  if (grade === "F" || grade === "D") return "gp-fail";
  return "gp-good";
};

export const getUniqueSemesters = (results) => {
  return [...new Set(results.map((item) => item.semester))].sort(
    (a, b) => Number(b) - Number(a)
  );
};

export const filterBySemester = (results, semester) => {
  if (semester === "all") return results;

  return results.filter(
    (item) => String(item.semester) === String(semester)
  );
};