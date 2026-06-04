const AdminFeedNotifications = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="admin-feed-notification-modal-overlay active">
      <div className="admin-feed-notification-modal">
        <div className="admin-feed-notification-header">
          <h3>Complaints / Reports</h3>

          <button
            type="button"
            className="admin-feed-notification-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="admin-feed-notification-body">
          <div className="admin-feed-complaint-item">
            <div className="admin-feed-complaint-title">System Report</div>

            <div className="admin-feed-complaint-info">
              <strong>Status:</strong> Active
              <br />
              <strong>Note:</strong> Moderation AI is online.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFeedNotifications;