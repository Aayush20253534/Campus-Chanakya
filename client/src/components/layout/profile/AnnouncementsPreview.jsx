import { useNavigate } from "react-router-dom";

const AnnouncementsPreview = ({ announcements }) => {
  const navigate = useNavigate();

  return (
    <div className="profile-section-card" onClick={() => navigate("/announcement")}>
      <div className="profile-section-header">
        <i className="fa-solid fa-bullhorn"></i>
        Official Announcements
      </div>

      {announcements.length === 0 ? (
        <div className="profile-empty">No new announcements</div>
      ) : (
        announcements.slice(0, 3).map((item) => (
          <div className="profile-news-item" key={item.id}>
            <span className="profile-news-tag">
              {item.ai_generated_category || "GENERAL"}
            </span>

            <h5>{item.ai_generated_title || item.admin_given_title}</h5>

            <span>{item.upload_date || "Recently posted"}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default AnnouncementsPreview;