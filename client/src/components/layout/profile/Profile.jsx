import ProfessorProfile from "./ProfessorProfile";
import StudentProfile from "./StudentProfile";

const Profile = () => {
  const role = localStorage.getItem("role") || "student";

  if (role === "professor") {
    return <ProfessorProfile />;
  }

  return <StudentProfile />;
};

export default Profile;