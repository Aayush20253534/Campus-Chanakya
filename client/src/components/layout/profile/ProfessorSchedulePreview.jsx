import { useNavigate } from "react-router-dom";

const ProfessorSchedulePreview = ({ classes }) => {
  const navigate = useNavigate();

  const today = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][new Date().getDay()];

  const todaysClasses = classes
    .filter((item) => item.day_of_week === today)
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));

  return (
    <div className="profile-section-card" onClick={() => navigate("/timetable")}>
      <div className="profile-section-header">
        <i className="fa-solid fa-calendar-day"></i>
        Today's Schedule
      </div>

      {todaysClasses.length === 0 ? (
        <div className="profile-empty">No classes scheduled for {today}.</div>
      ) : (
        todaysClasses.map((cls) => (
          <div
            className="profile-class-card"
            key={`${cls.subject}-${cls.start_time}-${cls.section}`}
          >
            <span className="profile-class-time">
              {String(cls.start_time).slice(0, 5)} –{" "}
              {String(cls.end_time).slice(0, 5)}
            </span>

            <h4>{cls.subject}</h4>

            <p>
              {cls.room_number || "TBA"} • Year {cls.year} (Sec {cls.section})
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default ProfessorSchedulePreview;