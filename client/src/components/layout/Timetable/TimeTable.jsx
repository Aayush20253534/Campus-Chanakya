import StudentTimetable from "./StudentTimetable";
import ProfessorTimetable from "./ProfessorTimetable";

const Timetable = () => {
  const role = localStorage.getItem("role") || "student";

  if (role === "professor") {
    return <ProfessorTimetable />;
  }

  return <StudentTimetable />;
};

export default Timetable;