import { FILTERS, SORT_OPTIONS } from "./assignmentsUtils";

const AssignmentFilters = ({
  currentFilter,
  setCurrentFilter,
  currentSort,
  setCurrentSort,
}) => {
  return (
    <div className="assignments-controls-section">
      <div className="assignments-filters">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            className={`assignments-filter-btn ${
              currentFilter === filter.value ? "active" : ""
            }`}
            onClick={() => setCurrentFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <select
        className="assignments-sort-dropdown"
        value={currentSort}
        onChange={(e) => setCurrentSort(e.target.value)}
      >
        {SORT_OPTIONS.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AssignmentFilters;