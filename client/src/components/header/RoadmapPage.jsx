import React from "react";
import { useParams } from "react-router-dom";
import roadmaps from "./roadmap.json";
import html2pdf from "html2pdf.js"; // Import html2pdf.js
import "./roadmap.css";

const RoadmapPage = () => {
  const { roadmapName } = useParams();
  const roadmap = roadmaps[roadmapName];

  const downloadPDF = () => {
    const element = document.getElementById("roadmap-content");

    // Options for the PDF download (optional customization)
    const options = {
      margin: 10,
      filename: `${roadmapName}-roadmap.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    // Convert the HTML content into a PDF
    html2pdf(element, options);
  };

  return (
    <div className="roadmap-page">
      {roadmap ? (
        <>
         <div id="roadmap-content"> 
          <h2 className="roadmap-title">Roadmap for {roadmapName}</h2> {/* Include this outside the content wrapper */}
            {roadmap.stages.map((stage, index) => (
              <div key={index} className="roadmap-stage">
                <h3>{stage.stage}</h3>
                <ul>
                  {stage.skills.map((skill, idx) => (
                    <li key={idx}>{skill}</li>
                  ))}
                </ul>
                {stage.tools && (
                  <>
                    <h4>Tools</h4>
                    <ul>
                      {stage.tools.map((tool, idx) => (
                        <li key={idx}>{tool}</li>
                      ))}
                    </ul>
                  </>
                )}
                {stage.projects && (
                  <>
                    <h4>Projects</h4>
                    <ul>
                      {stage.projects.map((project, idx) => (
                        <li key={idx}>{project}</li>
                      ))}
                    </ul>
                  </>
                )}
                {stage.description && (
                  <>
                    <h4>Description</h4>
                    <p>{stage.description}</p>
                  </>
                )}
              </div>
            ))}
          </div>
          {/* PDF Download Button */}
          <button className="download-btn" onClick={downloadPDF}>
            Download PDF
          </button>
        </>
      ) : (
        <div className="error-message">
          <p>No roadmap found for <strong>{roadmapName}</strong>.</p>
          <p>Please try searching for a different roadmap.</p>
        </div>
      )}
    </div>
  );
};

export default RoadmapPage;
