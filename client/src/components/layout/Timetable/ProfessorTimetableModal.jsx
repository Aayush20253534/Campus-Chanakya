const ProfessorTimetableModal = ({ classData, onClose }) => {
  if (!classData) return null;

  return (
    <div className="timetable-modal-overlay active" onClick={onClose}>
      <div
        className="timetable-modal professor-timetable-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="timetable-modal-header">
          <h3 className="timetable-modal-title">Lecture Details</h3>

          <button className="timetable-close-modal" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="timetable-modal-body">
          <div className="detail-row">
            <span className="detail-label">Subject</span>
            <span className="detail-value">{classData.subject}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Class / Section</span>
            <span className="detail-value">{classData.section}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Time</span>
            <span className="detail-value">
              {classData.start} – {classData.end}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Room</span>
            <span className="detail-value">{classData.room}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorTimetableModal;