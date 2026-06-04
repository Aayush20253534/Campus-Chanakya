import { SECTIONS, YEARS } from "./adminTimetableUtils";

const AdminTimetableFilters = ({ year, section, onYearChange, onSectionChange }) => {
  return (
    <div className="admin-timetable-filters-wrapper">
      <div className="admin-timetable-filter-group">
        <label htmlFor="adminYearSelect">Year:</label>
        <select
          id="adminYearSelect"
          className="admin-timetable-section-select"
          value={year}
          onChange={(event) => onYearChange(event.target.value)}
        >
          {YEARS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-timetable-filter-group">
        <label htmlFor="adminSectionSelect">Section:</label>
        <select
          id="adminSectionSelect"
          className="admin-timetable-section-select"
          value={section}
          onChange={(event) => onSectionChange(event.target.value)}
        >
          {SECTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AdminTimetableFilters;