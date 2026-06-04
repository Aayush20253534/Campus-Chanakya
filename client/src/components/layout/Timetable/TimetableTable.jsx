import {
  DAYS,
  TIME_SLOTS,
  buildTimetableMap,
  formatTime,
  getCellClassName,
  getClassDuration,
  getRoomNumber,
  getTeacherName,
} from "./timetableUtils";

const TimetableTable = ({ timetable, onClassClick }) => {
  const dataMap = buildTimetableMap(timetable);

  return (
    <div className="timetable-container">
      <table className="timetable-table">
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
          {DAYS.map((day) => {
            let skipCount = 0;

            return (
              <tr key={day}>
                <td className="timetable-day-cell time-header">{day}</td>

                {TIME_SLOTS.map((slot) => {
                  if (skipCount > 0) {
                    skipCount -= 1;
                    return null;
                  }

                  const classData = dataMap[day]?.[slot];

                  if (!classData) {
                    return (
                      <td
                        key={slot}
                        className={slot === "13:00" ? "break-cell" : ""}
                      >
                        {slot === "13:00" ? "LUNCH" : "\u00A0"}
                      </td>
                    );
                  }

                  const duration = getClassDuration(classData);

                  if (duration > 1) {
                    skipCount = duration - 1;
                  }

                  return (
                    <td
                      key={slot}
                      colSpan={duration}
                      className={getCellClassName(classData)}
                      onClick={() =>
                        onClassClick({
                          ...classData,
                          displayStartTime: slot,
                          displayEndTime: formatTime(classData.end_time),
                        })
                      }
                    >
                      <div className="timetable-cell-content">
                        <span className="mobile-time-label">{slot}</span>

                        <span className="subject-name">
                          {classData.subject || "Unknown"}
                        </span>

                        <span className="prof-name">
                          {getTeacherName(classData)}
                        </span>

                        <span className="room-tag">
                          {getRoomNumber(classData)}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableTable;