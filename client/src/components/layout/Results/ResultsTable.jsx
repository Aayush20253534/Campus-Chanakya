import { getGradeClass } from "./resultsUtils";

const ResultsTable = ({ loading, results, onSelect }) => {
  return (
    <section className="results-transcript-sheet">
      <table className="results-transcript-table">
        <thead>
          <tr>
            <th>Sub Code</th>
            <th>Subject Name</th>
            <th>Credits</th>
            <th>Internal</th>
            <th>External</th>
            <th>Total</th>
            <th>Grade</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan="7" className="results-empty-table">
                Loading results...
              </td>
            </tr>
          ) : results.length === 0 ? (
            <tr>
              <td colSpan="7" className="results-empty-table">
                No results found.
              </td>
            </tr>
          ) : (
            results.map((result) => (
              <tr
                key={`${result.code}-${result.semester}`}
                onClick={() => onSelect(result)}
              >
                <td className="results-code-cell">{result.code}</td>
                <td className="results-name-cell">{result.name}</td>
                <td className="results-credit-cell">{result.credits}</td>
                <td>{result.internal}</td>
                <td>{result.external}</td>
                <td className="results-total-cell">{result.total}</td>
                <td>
                  <span className={`results-grade-pill ${getGradeClass(result.grade)}`}>
                    {result.grade}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
};

export default ResultsTable;