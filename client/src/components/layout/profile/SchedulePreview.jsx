import { useNavigate } from "react-router-dom";

const SchedulePreview = ({ timetable }) => {
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

  const todaysClasses = timetable
    .filter((t) => t.day_of_week === today)
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));

  return (
    <div className="profile-section-card" onClick={() => navigate("/timetable")}>
      <div className="profile-section-header">
        <i className="fa-solid fa-calendar-day"></i>
        Today's Schedule
      </div>

      {todaysClasses.length === 0 ? (
        <div className="profile-empty">No classes today</div>
      ) : (
        todaysClasses.map((cls) => (
          <div className="profile-class-card" key={`${cls.subject}-${cls.start_time}`}>
            <span className="profile-class-time">
              {cls.start_time} – {cls.end_time}
            </span>
            <h4>{cls.subject}</h4>
            <p>{cls.room_number || "Room TBD"}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default SchedulePreview;