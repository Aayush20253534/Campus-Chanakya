import { useEffect, useState } from "react";
import { authFetch } from "../../../utils/auth";
import { getGradeFromTotal, getGradeClass } from "./resultsUtils";

const ProfessorGradeModal = ({ selectedClass, onClose }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedClass) return;
    loadStudents();
  }, [selectedClass]);

  const loadStudents = async () => {
    try {
      setLoading(true);

      const data = await authFetch(
        `/teacher/results/students?section=${selectedClass.section}&year=${selectedClass.year}`
      );

      const formatted = Array.isArray(data)
        ? data.map((student) => ({
            ...student,
            internal: 0,
            external: 0,
          }))
        : [];

      setStudents(formatted);
    } catch (error) {
      console.error("Failed to load students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const updateMark = (index, field, value) => {
    const max = field === "internal" ? 40 : 60;
    const num = Math.min(max, Math.max(0, Number(value) || 0));

    setStudents((prev) =>
      prev.map((student, i) =>
        i === index
          ? {
              ...student,
              [field]: num,
            }
          : student
      )
    );
  };

  const saveGrades = async () => {
    try {
      setSaving(true);

      const semesterValue = Number(selectedClass.year) * 2;

      const payload = {
        subject_code: selectedClass.subject,
        subject_name: selectedClass.subject,
        semester: semesterValue,
        results: students.map((student) => ({
          student_reg_no: student.reg_no,
          student_name: student.name,
          internal_marks: Number(student.internal) || 0,
          external_marks: Number(student.external) || 0,
          credits: 4,
        })),
      };

      const response = await authFetch("/teacher/results/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response?.status === "success") {
        alert("Marks & grades saved successfully!");
        onClose();
      } else {
        alert(response?.detail || "Failed to save grades.");
      }
    } catch (error) {
      console.error("Save grades failed:", error);
      alert("Failed to save grades.");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedClass) return null;

  return (
    <div className="prof-modal-overlay active" onClick={onClose}>
      <div className="prof-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="prof-modal-close" onClick={onClose}>
          ×
        </button>

        <h2 className="font-royal prof-modal-title">
          {selectedClass.subject} - Sec {selectedClass.section}
        </h2>

        <p className="prof-modal-subtitle">
          Enter marks: Internal /40, External /60
        </p>

        <div className="prof-modal-divider"></div>

        <table className="prof-students-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Roll No.</th>
              <th>Internal (40)</th>
              <th>External (60)</th>
              <th>Total</th>
              <th>Grade</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="results-empty-table">
                  Loading roster...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="6" className="results-empty-table">
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((student, index) => {
                const total =
                  (Number(student.internal) || 0) +
                  (Number(student.external) || 0);

                const grade = getGradeFromTotal(total);

                return (
                  <tr key={student.reg_no}>
                    <td className="prof-student-name">{student.name}</td>

                    <td className="prof-student-roll">{student.reg_no}</td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={student.internal}
                        onChange={(e) =>
                          updateMark(index, "internal", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={student.external}
                        onChange={(e) =>
                          updateMark(index, "external", e.target.value)
                        }
                      />
                    </td>

                    <td className="prof-total-cell">{total}/100</td>

                    <td>
                      <span className={`results-grade-pill ${getGradeClass(grade)}`}>
                        {grade}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <button className="prof-save-btn" onClick={saveGrades} disabled={saving}>
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </div>
  );
};

export default ProfessorGradeModal;