import { useState } from "react";
import { authFetch } from "../../../utils/auth";

const AssignmentAI = ({ assignment }) => {
  const [response, setResponse] = useState("");
  const [loadingMode, setLoadingMode] = useState(null);

  const askAI = async (mode) => {
    try {
      setLoadingMode(mode);
      setResponse("Chanakya is thinking...");

      const payload = {
        assignment_description: `${assignment.title}: ${assignment.description}`,
        query:
          mode === "explain"
            ? "Explain the core concepts required for this."
            : "",
        mode,
      };

      const data = await authFetch("/student/ai-assistant", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data?.ai_response) {
        setResponse(data.ai_response);
      } else {
        setResponse("I couldn't generate a response at this time.");
      }
    } catch (error) {
      console.error("Assignment AI error:", error);
      setResponse("Error connecting to Chanakya AI.");
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <div className="assignments-ai-box">
      <h4 className="font-royal">
        <svg
          style={{ width: 20, height: 20 }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        Ask Chanakya AI
      </h4>

      <div className="assignments-ai-actions">
        <button
          className="assignments-filter-btn"
          onClick={() => askAI("plan")}
          disabled={loadingMode !== null}
        >
          Generate Action Plan
        </button>

        <button
          className="assignments-filter-btn"
          onClick={() => askAI("explain")}
          disabled={loadingMode !== null}
        >
          Explain Topic
        </button>
      </div>

      {response && (
        <div
          className="assignments-ai-response"
          dangerouslySetInnerHTML={{ __html: response }}
        />
      )}
    </div>
  );
};

export default AssignmentAI;