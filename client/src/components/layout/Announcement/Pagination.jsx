const Pagination = ({ currentPage, totalPages, setCurrentPage }) => {
  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const maxDots = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxDots / 2));
  let endPage = Math.min(totalPages, startPage + maxDots - 1);

  if (endPage - startPage + 1 < maxDots) {
    startPage = Math.max(1, endPage - maxDots + 1);
  }

  return (
    <div className="pagination">
      <button
        className="pagination-button"
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
      >
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <div className="pagination-dots">
        {Array.from({ length: endPage - startPage + 1 }).map((_, index) => {
          const page = startPage + index;

          return (
            <button
              key={page}
              className={`pagination-dot ${
                page === currentPage ? "active" : ""
              }`}
              onClick={() => goToPage(page)}
            ></button>
          );
        })}
      </div>

      <button
        className="pagination-button"
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
};

export default Pagination;