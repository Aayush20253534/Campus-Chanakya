import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import DashboardLayout from "../shared/DashboardLayout";
import { authFetch } from "../../../utils/auth";

import ResultsStats from "./ResultsStats";
import ResultsTable from "./ResultsTable";
import ResultModal from "./ResultModal";
import ProfessorResults from "./ProfessorResults";

import {
  filterBySemester,
  getUniqueSemesters,
  normalizeResult,
} from "./resultsUtils";

import "./Results.css";

const Results = () => {
  const role = localStorage.getItem("role") || "student";

  if (role === "professor") {
    return <ProfessorResults />;
  }

  const printableRef = useRef(null);

  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({
    sgpa: 0,
    cgpa: 0,
    creditsEarned: 0,
    backlogs: 0,
  });

  const [semesterFilter, setSemesterFilter] = useState("all");
  const [downloadFormat, setDownloadFormat] = useState("pdf");
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadResultsData();
  }, []);

  const loadResultsData = async () => {
    try {
      setLoading(true);

      const data = await authFetch("/student/results");

      const normalized = Array.isArray(data?.results)
        ? data.results.map(normalizeResult)
        : [];

      setResults(normalized);

      setSummary({
        sgpa: Number(data?.sgpa || 0),
        cgpa: Number(data?.cgpa || 0),
        creditsEarned: Number(data?.credits_earned || 0),
        backlogs: Number(data?.backlogs || 0),
      });

      const semesters = getUniqueSemesters(normalized);
      if (semesters.length > 0) {
        setSemesterFilter(String(semesters[0]));
      }
    } catch (error) {
      console.error("Failed to load results:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const semesters = useMemo(() => getUniqueSemesters(results), [results]);

  const filteredResults = useMemo(() => {
    return filterBySemester(results, semesterFilter);
  }, [results, semesterFilter]);

  const handleExport = async () => {
    if (!printableRef.current) return;

    try {
      setExporting(true);

      const canvas = await html2canvas(printableRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      if (downloadFormat === "pdf") {
        const doc = new jsPDF("p", "mm", "a4");
        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = doc.internal.pageSize.getWidth() - 20;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        doc.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);
        doc.save("Academic_Transcript.pdf");
      } else {
        const link = document.createElement("a");
        link.download = "Academic_Transcript.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout activePage="Exam Results">
      <div className="results-container" ref={printableRef}>
        <section className="results-report-header">
          <div className="results-title-row">
            <svg className="results-crown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>

            <h2 className="results-report-title font-royal">Official Transcript</h2>

            <svg className="results-crown-icon flipped" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>

          <div className="results-report-subtitle">
            Academic Performance Summary
          </div>
        </section>

        <ResultsStats summary={summary} />

        <section className="results-action-bar">
          <div className="results-filter-area">
            <span>Filter:</span>

            <select
              className="results-royal-select"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
            >
              <option value="all">All Semesters</option>

              {semesters.map((sem) => (
                <option value={sem} key={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="results-export-area">
            <select
              className="results-royal-select"
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value)}
            >
              <option value="pdf">Download as PDF</option>
              <option value="png">Download as Image</option>
            </select>

            <button className="results-royal-btn" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "Export"}
            </button>
          </div>
        </section>

        <ResultsTable
          loading={loading}
          results={filteredResults}
          onSelect={setSelectedResult}
        />
      </div>

      <ResultModal
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
      />
    </DashboardLayout>
  );
};

export default Results;