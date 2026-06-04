import { ANNOUNCEMENT_CATEGORIES } from "./adminAnnouncementsUtils";

const AdminAnnouncementFilters = ({ activeCategory, onChangeCategory }) => {
  return (
    <div className="admin-announcement-filters">
      {ANNOUNCEMENT_CATEGORIES.map((category) => (
        <button
          key={category}
          type="button"
          className={
            activeCategory === category
              ? "admin-announcement-filter-btn active"
              : "admin-announcement-filter-btn"
          }
          onClick={() => onChangeCategory(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default AdminAnnouncementFilters;