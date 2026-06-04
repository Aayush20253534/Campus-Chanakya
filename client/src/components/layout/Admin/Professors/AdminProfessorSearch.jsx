const AdminProfessorSearch = ({ value, onChange }) => {
  return (
    <div className="admin-professors-search-bar">
      <input
        type="text"
        className="admin-professors-search-input"
        placeholder="Search by Faculty ID or Name..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
};

export default AdminProfessorSearch;