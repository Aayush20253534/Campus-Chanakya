import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { authFetch } from "../../../utils/auth";
import ProfessorAssignmentCard from "./ProfessorAssignmentCard";
import ProfessorAssignmentCreateModal from "./ProfessorAssignmentCreateModal";
import "./Assignments.css";

const ProfessorAssignments = () => {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [classData, assignmentData] = await Promise.all([
        authFetch("/teacher/my-classes"),
        authFetch("/professor/assignments"),
      ]);

      setClasses(Array.isArray(classData) ? classData : []);
      setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
    } catch (error) {
      console.error("Professor assignments load error:", error);
      setClasses([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = useMemo(() => {
    const now = new Date();

    return assignments.filter((assignment) => {
      const deadline = new Date(assignment.deadline);

      if (filter === "active") return deadline >= now;
      if (filter === "past") return deadline < now;

      return true;
    });
  }, [assignments, filter]);

  return (
    <DashboardLayout activePage="Assignments">
      <div className="prof-assignments-container">
        <h1 className="prof-assignments-title font-royal">Assignments</h1>

        <p className="prof-assignments-subtitle">
          Create, manage and track assignments for your sections
        </p>

        <div className="prof-assignment-controls-section">
          <div className="prof-assignment-filter-group">
            {["all", "active", "past"].map((item) => (
              <button
                key={item}
                className={`prof-assignment-filter-btn ${
                  filter === item ? "active" : ""
                }`}
                onClick={() => setFilter(item)}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <section className="prof-assignments-grid">
          {loading ? (
            <div className="prof-assignment-empty-state">
              Loading assignments...
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="prof-assignment-empty-state">
              <h2 className="font-royal">No assignments found</h2>
              <p>Change filter or create a new assignment.</p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <ProfessorAssignmentCard
                key={assignment.id}
                assignment={assignment}
              />
            ))
          )}
        </section>
      </div>

      <button
        className="prof-assignment-fab"
        onClick={() => setModalOpen(true)}
      >
        +
      </button>

      <ProfessorAssignmentCreateModal
        open={modalOpen}
        classes={classes}
        onClose={() => setModalOpen(false)}
        onCreated={loadInitialData}
      />
    </DashboardLayout>
  );
};

export default ProfessorAssignments;