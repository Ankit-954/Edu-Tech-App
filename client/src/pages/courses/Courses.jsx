import React, { useMemo, useState } from "react";
import "./courses.css";
import { CourseData } from "../../context/CourseContext";
import CourseCard from "../../components/coursecard/CourseCard";

const Courses = () => {
  const { courses } = CourseData();
  const [query, setQuery] = useState("");
  const [streamFilter, setStreamFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const streams = useMemo(() => {
    const unique = new Set((courses || []).map((c) => c.stream || c.category).filter(Boolean));
    return ["all", ...Array.from(unique)];
  }, [courses]);

  const levels = useMemo(() => {
    const unique = new Set((courses || []).map((c) => c.level).filter(Boolean));
    return ["all", ...Array.from(unique)];
  }, [courses]);

  const subjects = useMemo(() => {
    const set = new Set();
    (courses || []).forEach((c) => {
      (c.subjects || []).forEach((s) => set.add(s));
    });
    return ["all", ...Array.from(set)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (courses || []).filter((c) => {
      const streamValue = c.stream || c.category || "";
      const subjectList = Array.isArray(c.subjects) ? c.subjects : [];
      const searchable = `${c.title} ${c.description} ${c.createdBy} ${streamValue} ${subjectList.join(" ")}`.toLowerCase();

      const matchQuery = !q || searchable.includes(q);
      const matchStream = streamFilter === "all" || streamValue === streamFilter;
      const matchLevel = levelFilter === "all" || c.level === levelFilter;
      const matchSubject = subjectFilter === "all" || subjectList.includes(subjectFilter);

      return matchQuery && matchStream && matchLevel && matchSubject;
    });
  }, [courses, query, streamFilter, levelFilter, subjectFilter]);

  return (
    <div className="courses">
      <div className="courses-hero">
        <h2>Browse All Courses</h2>
        <p>Discover courses by stream, subject, and level.</p>
        <input
          type="text"
          placeholder="Search courses, instructors, skills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="courses-search"
        />
      </div>

      <div className="courses-layout">
        <aside className="courses-filter">
          <div className="courses-filter-head">
            <h3>Filters</h3>
            <button
              type="button"
              onClick={() => {
                setStreamFilter("all");
                setLevelFilter("all");
                setSubjectFilter("all");
                setQuery("");
              }}
            >
              Clear all
            </button>
          </div>

          <label>Stream</label>
          <select value={streamFilter} onChange={(e) => setStreamFilter(e.target.value)}>
            {streams.map((s) => (
              <option value={s} key={s}>
                {s === "all" ? "All Streams" : s}
              </option>
            ))}
          </select>

          <label>Level</label>
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
            {levels.map((l) => (
              <option value={l} key={l}>
                {l === "all" ? "All Levels" : l}
              </option>
            ))}
          </select>

          <label>Subject</label>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            {subjects.map((s) => (
              <option value={s} key={s}>
                {s === "all" ? "All Subjects" : s}
              </option>
            ))}
          </select>
        </aside>

        <div className="courses-content">
          <div className="courses-result-bar">
            <span>{filteredCourses.length} courses found</span>
          </div>
          <div className="course-container">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((e) => <CourseCard key={e._id} course={e} />)
            ) : (
              <p>No courses match your filters.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses;
