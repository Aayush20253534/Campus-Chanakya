const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const ProfessorTimetableTable = ({ timetable, onClassClick }) => {
  const dataMap = {};

  timetable.forEach((item) => {
    if (!dataMap[item.day]) {
      dataMap[item.day] = {};
    }

    dataMap[item.day][item.start] = item;
  });

  return (
    <div className="timetable-container professor-timetable-container">
      <table className="timetable-table professor-timetable-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>09:00 – 10:00</th>
            <th>10:00 – 11:00</th>
            <th>11:00 – 12:00</th>
            <th>12:00 – 13:00</th>
            <th>13:00 – 14:00</th>
            <th>14:00 – 15:00</th>
            <th>15:00 – 16:00</th>
            <th>16:00 – 17:00</th>
            <th>17:00 – 18:00</th>
          </tr>
        </thead>

        <tbody>
          {DAYS.map((day) => (
            <tr key={day}>
              <td className="timetable-day-cell time-header">{day}</td>

              {SLOTS.map((slot) => {
                const lecture = dataMap[day]?.[slot];

                if (!lecture) {
                  return (
                    <td
                      key={slot}
                      className={slot === "13:00" ? "prof-lunch-cell" : ""}
                    >
                      {slot === "13:00" ? "LUNCH" : "—"}
                    </td>
                  );
                }

                return (
                  <td
                    key={slot}
                    className="clickable-cell professor-clickable-cell"
                    onClick={() => onClassClick(lecture)}
                  >
                    <span className="subject-name professor-subject-name">
                      {lecture.subject}
                    </span>

                    <span className="classroom-tag">
                      {lecture.section} • {lecture.room}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProfessorTimetableTable;