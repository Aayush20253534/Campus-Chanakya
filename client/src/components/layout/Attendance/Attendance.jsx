import StudentAttendance from "./StudentAttendance";
import ProfessorAttendance from "./ProfessorAttendance";

const Attendance = () => {
  const role = localStorage.getItem("role") || "student";

  if (role === "professor") {
    return <ProfessorAttendance />;
  }

  return <StudentAttendance />;
};

export default Attendance;