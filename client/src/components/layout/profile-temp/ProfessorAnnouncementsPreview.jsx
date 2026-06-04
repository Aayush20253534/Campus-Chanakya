import { useNavigate } from "react-router-dom";

const getRelativeDate = (date) => {
  if (!date) return "Recently posted";

  const postedDate = new Date(date);
  if (Number.isNaN(postedDate.getTime())) return "Recently posted";

  const diffTime = Math.abs(new Date() - postedDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= 1 ? "Today" : `${diffDays} days ago`;
};

const ProfessorAnnouncementsPreview = ({ announcements }) => {
  const navigate = useNavigate();

  return (
    <div className="profile-section-card" onClick={() => navigate("/announcement")}>
      <div className="profile-section-header">
        <i className="fa-solid fa-bullhorn"></i>
        Official Announcements
      </div>

      {announcements.length === 0 ? (
        <div className="profile-empty">No announcements found.</div>
      ) : (
        announcements.slice(0, 4).map((item) => (
          <div className="profile-news-item" key={item.id}>
            <span className="profile-news-tag">
              {item.ai_generated_category || "GENERAL"}
            </span>

            <h5>{item.admin_given_title || item.ai_generated_title}</h5>

            <span>Posted {getRelativeDate(item.upload_date)}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default ProfessorAnnouncementsPreview;