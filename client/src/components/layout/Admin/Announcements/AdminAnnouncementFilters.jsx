// FIX: Use the `categories` prop passed from AdminAnnouncements instead of
// re-importing ANNOUNCEMENT_CATEGORIES directly. This way the parent controls
// the list and there's a single source of truth.
const AdminAnnouncementFilters = ({ categories = [], activeCategory, onChangeCategory }) => {
  return (
    <div className="admin-announcement-filters">
      {categories.map((category) => (
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