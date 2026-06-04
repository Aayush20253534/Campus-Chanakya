import StudentAssignments from "./StudentAssignments";
import ProfessorAssignments from "./ProfessorAssignments";

const Assignments = () => {
  const role = localStorage.getItem("role") || "student";

  if (role === "professor") {
    return <ProfessorAssignments />;
  }

  return <StudentAssignments />;
};

export default Assignments;