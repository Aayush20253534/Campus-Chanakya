import { getStudentDisplayValue } from "./adminStudentsUtils";

const AdminStudentCard = ({ student, index, onEdit, onResetPassword }) => {
  const department = getStudentDisplayValue(student.department, "Gen");
  const gender = getStudentDisplayValue(student.gender);
  const year = getStudentDisplayValue(student.year);
  const dob = getStudentDisplayValue(student.dob);
  const section = getStudentDisplayValue(student.section);
  const email = getStudentDisplayValue(student.email);
  const name = getStudentDisplayValue(student.name, "Unnamed Student");
  const id = getStudentDisplayValue(student.id);

  return (
    <article
      className="admin-student-card"
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      <div className="admin-student-card-content">
        <div className="admin-student-card-header">
          <span className="admin-student-department-badge">
            {department}
          </span>

          <div className="admin-student-year">Year {year}</div>
        </div>

        <h3 className="admin-student-card-title font-royal">{name}</h3>

        <div className="admin-student-id-ref">
          {id} • {gender}
        </div>

        <div className="admin-student-card-description">
          <dl>
            <dt>Email:</dt>
            <dd title={email}>{email}</dd>

            <dt>Sec:</dt>
            <dd>{section}</dd>

            <dt>DOB:</dt>
            <dd>{dob}</dd>
          </dl>
        </div>

        <div className="admin-student-action-buttons">
          <button
            type="button"
            className="admin-student-edit-btn"
            onClick={() => onEdit(student)}
          >
            Edit
          </button>

          <button
            type="button"
            className="admin-student-reset-btn"
            onClick={() => onResetPassword(student.id)}
          >
            Reset Pass
          </button>
        </div>
      </div>
    </article>
  );
};

export default AdminStudentCard;