const AdminStudentSearch = ({ value, onChange }) => {
  return (
    <div className="admin-students-search-bar">
      <input
        type="text"
        className="admin-students-search-input"
        placeholder="Search by ID or Name..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
};

export default AdminStudentSearch;