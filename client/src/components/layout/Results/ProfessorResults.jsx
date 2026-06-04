import { useEffect, useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { authFetch } from "../../../utils/auth";
import ProfessorGradeModal from "./ProfessorGradeModal";

const ProfessorResults = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await authFetch("/teacher/results/classes");
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load professor classes:", error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout activePage="Exam Results">
      <div className="results-container">
        <section className="prof-results-header">
          <div className="results-title-row">
            <svg className="results-crown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>

            <h2 className="prof-results-title font-royal">Grade Management</h2>

            <svg className="results-crown-icon flipped" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>

          <div className="prof-results-subtitle">
            Enter Internal (40) & External (60) Marks
          </div>
        </section>

        {loading ? (
          <div className="results-empty-table">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="results-empty-table">No classes assigned.</div>
        ) : (
          <section className="prof-sections-grid">
            {classes.map((cls, index) => (
              <article
                key={`${cls.subject}-${cls.section}-${cls.year}-${index}`}
                className="prof-section-card"
                onClick={() => setSelectedClass(cls)}
              >
                <div className="prof-section-header">
                  <div className="prof-section-title">
                    Section {cls.section}
                  </div>

                  <div className="prof-section-subtitle">
                    {cls.subject} ({cls.year} Year)
                  </div>
                </div>

                <div className="prof-section-meta">
                  <div className="prof-section-student-count">View Class</div>
                  <div className="prof-section-graded-count">Click to Grade</div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      <ProfessorGradeModal
        selectedClass={selectedClass}
        onClose={() => setSelectedClass(null)}
      />
    </DashboardLayout>
  );
};

export default ProfessorResults;