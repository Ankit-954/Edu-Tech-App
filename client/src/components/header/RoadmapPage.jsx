import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import html2pdf from "html2pdf.js";
import "./roadmap.css";
import { server } from "../../main";
import CourseCard from "../coursecard/CourseCard";

const renderSafeText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    const title = typeof value.title === "string" ? value.title : "";
    const description = typeof value.description === "string" ? value.description : "";
    const link = typeof value.link === "string" ? value.link : "";
    if (title && description) return `${title}: ${description}`;
    return title || description || link || "";
  }
  return "";
};

const RoadmapPage = () => {
  const { roadmapName } = useParams();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [recommendedCourses, setRecommendedCourses] = useState([]);

  const topic = useMemo(() => decodeURIComponent(roadmapName || "").trim(), [roadmapName]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const { data } = await axios.get(`${server}/api/roadmap/generate`, {
          params: { topic },
        });
        if (!active) return;
        setRoadmap(data.roadmap || null);
        setRecommendedCourses(
          Array.isArray(data.recommendedCourses) ? data.recommendedCourses : []
        );
      } catch (error) {
        if (!active) return;
        setLoadError(error?.response?.data?.message || "Failed to generate roadmap.");
      } finally {
        if (active) setLoading(false);
      }
    };

    if (topic.length >= 2) {
      loadData();
    } else {
      setLoading(false);
      setLoadError("Please provide a valid topic.");
    }

    return () => {
      active = false;
    };
  }, [topic]);

  const downloadPDF = () => {
    const element = document.getElementById("roadmap-content");
    const options = {
      margin: 10,
      filename: `${(roadmap?.topic || topic || "roadmap").replace(/\s+/g, "-")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf(element, options);
  };

  return (
    <div className="roadmap-page">
      <div className="roadmap-hero">
        <h2>{roadmap?.topic || topic} Roadmap</h2>
        <p>
          {roadmap?.summary ||
            "AI-generated learning path with detailed weekly phases and platform recommendations."}
        </p>
        <div className="roadmap-hero-meta">
          <span>Total Duration: {roadmap?.totalDurationWeeks || 0} weeks</span>
          <button className="download-btn" onClick={downloadPDF} disabled={!roadmap}>
            Download PDF
          </button>
        </div>
      </div>

      {loading && <p className="roadmap-loading">Generating roadmap...</p>}
      {loadError && !loading && <p className="roadmap-error">{loadError}</p>}

      {!loading && roadmap && (
        <div id="roadmap-content" className="roadmap-content">
          <section className="roadmap-kpi-grid">
            <article className="roadmap-kpi-card">
              <span>Total Weeks</span>
              <strong>{roadmap.totalDurationWeeks || 0}</strong>
            </article>
            <article className="roadmap-kpi-card">
              <span>Phases</span>
              <strong>{Array.isArray(roadmap.phases) ? roadmap.phases.length : 0}</strong>
            </article>
            <article className="roadmap-kpi-card">
              <span>Recommended Courses</span>
              <strong>{recommendedCourses.length}</strong>
            </article>
          </section>

          <section className="roadmap-section">
            <h3>Learning Phases (Week-wise)</h3>
            <div className="roadmap-phases">
              {(roadmap.phases || []).map((phase, idx) => (
                <article key={`${phase.title}-${idx}`} className="roadmap-phase-card">
                  <div className="phase-top">
                    <h4>
                      {idx + 1}. {phase.title}
                    </h4>
                    <span>
                      Week {phase.weekStart || 1}-{phase.weekEnd || phase.durationWeeks || 1}
                    </span>
                  </div>
                  {phase.focus && <p className="phase-focus">{phase.focus}</p>}

                  {(phase.goals || []).length > 0 && (
                    <div className="phase-block">
                      <h5>Goals</h5>
                      <div className="phase-chip-list">
                        {(phase.goals || []).map((x, i) => (
                          <span key={`g-${i}`}>{renderSafeText(x)}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(phase.skills || []).length > 0 && (
                    <div className="phase-block">
                      <h5>Skills</h5>
                      <div className="phase-chip-list">
                        {(phase.skills || []).map((x, i) => (
                          <span key={`s-${i}`}>{renderSafeText(x)}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(phase.outcomes || []).length > 0 && (
                    <div className="phase-block">
                      <h5>Outcomes</h5>
                      <div className="phase-chip-list phase-chip-list-accent">
                        {(phase.outcomes || []).map((x, i) => (
                          <span key={`o-${i}`}>{renderSafeText(x)}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(phase.projects || []).length > 0 && (
                    <div className="phase-block">
                      <h5>Projects</h5>
                      <div className="phase-project-list">
                        {(phase.projects || []).map((x, i) => (
                          <div key={`p-${i}`} className="phase-project-item">
                            {renderSafeText(x)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(phase.resources || []).length > 0 && (
                    <div className="phase-block">
                      <h5>Resources</h5>
                      <div className="phase-chip-list">
                        {(phase.resources || []).map((x, i) => (
                          <span key={`r-${i}`}>{renderSafeText(x)}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(phase.checkpoints || []).length > 0 && (
                    <div className="phase-block">
                      <h5>Checkpoints</h5>
                      <div className="phase-chip-list">
                        {(phase.checkpoints || []).map((x, i) => (
                          <span key={`c-${i}`}>{renderSafeText(x)}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          {(roadmap.learningTips || []).length > 0 && (
            <section className="roadmap-section">
              <h3>Execution Tips</h3>
              <div className="phase-chip-list phase-chip-list-accent">
                {roadmap.learningTips.map((tip, idx) => (
                  <span key={`${renderSafeText(tip)}-${idx}`}>{renderSafeText(tip)}</span>
                ))}
              </div>
            </section>
          )}

          <section className="roadmap-section">
            <h3>Recommended Courses On SmartLearn</h3>
            <div className="recommended-courses-cards">
              {recommendedCourses.length > 0 ? (
                recommendedCourses.map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))
              ) : (
                <p>No matching platform courses found for this topic yet.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default RoadmapPage;
