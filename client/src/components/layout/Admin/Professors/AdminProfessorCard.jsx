import { getProfessorValue } from "./adminProfessorsUtils";

const AdminProfessorCard = ({ professor, index, onEdit, onResetPassword }) => {
  const department = getProfessorValue(professor.department, "General");
  const name = getProfessorValue(professor.name, "Unnamed Professor");
  const id = getProfessorValue(professor.id, "-");
  const email = getProfessorValue(professor.email, "-");
  const designation = getProfessorValue(professor.designation, "Faculty");
  const specialization = getProfessorValue(professor.specialization);

  return (
    <article
      className="admin-professor-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="admin-professor-card-top-border"></div>

      <div className="admin-professor-card-content">
        <div className="admin-professor-card-header">
          <span className="admin-professor-department-badge">
            {department}
          </span>
        </div>

        <h3 className="admin-professor-card-title font-royal">{name}</h3>

        <div className="admin-professor-id-ref">
          Faculty ID: {id} • {designation}
        </div>

        <div className="admin-professor-card-description">
          <dl>
            <dt>Email:</dt>
            <dd>{email}</dd>

            <dt>Specialization:</dt>
            <dd>{specialization}</dd>
          </dl>
        </div>

        <div className="admin-professor-action-buttons">
          <button
            type="button"
            className="admin-professor-edit-btn"
            onClick={() => onEdit(professor)}
          >
            Edit Details
          </button>

          <button
            type="button"
            className="admin-professor-reset-btn"
            onClick={() => onResetPassword(professor.id)}
          >
            Reset Password
          </button>
        </div>
      </div>
    </article>
  );
};

export default AdminProfessorCard;