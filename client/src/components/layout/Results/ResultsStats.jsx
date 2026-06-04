const ResultsStats = ({ summary }) => {
  return (
    <section className="results-stats-row">
      <div className="results-gold-stat-card">
        <div className="results-stat-label">Current SGPA</div>
        <div className="results-stat-value">{summary.sgpa.toFixed(2)}</div>
        <div className="results-stat-note">Latest Semester</div>
      </div>

      <div className="results-gold-stat-card">
        <div className="results-stat-label">Cumulative GPA</div>
        <div className="results-stat-value">{summary.cgpa.toFixed(2)}</div>
        <div className="results-stat-note">Overall Standing</div>
      </div>

      <div className="results-gold-stat-card">
        <div className="results-stat-label">Total Credits</div>
        <div className="results-stat-value">{summary.creditsEarned}</div>
        <div className="results-stat-note">Earned Successfully</div>
      </div>

      <div className="results-gold-stat-card">
        <div className="results-stat-label">Backlogs</div>
        <div className="results-stat-value danger">{summary.backlogs}</div>
        <div className="results-stat-note">Subjects Failed</div>
      </div>
    </section>
  );
};

export default ResultsStats;