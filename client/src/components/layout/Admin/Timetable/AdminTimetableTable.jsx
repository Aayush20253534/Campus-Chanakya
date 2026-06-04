import { DAYS, findSlot, START_TIMES } from "./adminTimetableUtils";

const AdminTimetableTable = ({ slots, loading, onSlotClick, onFreeSlotClick }) => {
  if (loading) {
    return (
      <div className="admin-timetable-container">
        <table className="admin-timetable">
          <tbody>
            <tr>
              <td className="admin-timetable-loading-cell">Loading...</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="admin-timetable-container">
      <table className="admin-timetable">
        <thead>
          <tr>
            <th>Day</th>
            {START_TIMES.map((start) => (
              <th key={start}>
                {start}–{Number(start.split(":")[0]) + 1}:00
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {DAYS.map((day) => (
            <tr key={day}>
              <td className="admin-timetable-day-cell">{day}</td>

              {START_TIMES.map((start) => {
                const slot = findSlot(slots, day, start);

                if (slot) {
                  const displayTeacher = slot.teacher_name || slot.teacher_id;

                  return (
                    <td
                      key={`${day}-${start}`}
                      className="admin-timetable-slot-cell"
                      onClick={() => onSlotClick(slot)}
                    >
                      <strong>{slot.subject}</strong>
                      <br />
                      <small>{displayTeacher}</small>
                      <br />
                      <span>Room: {slot.room_number}</span>
                    </td>
                  );
                }

                return (
                  <td
                    key={`${day}-${start}`}
                    className="admin-timetable-free-cell"
                    onClick={() => onFreeSlotClick(day, start)}
                  >
                    Free
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

export default AdminTimetableTable;