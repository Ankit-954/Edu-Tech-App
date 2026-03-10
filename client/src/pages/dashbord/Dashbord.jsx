import React, { useMemo } from "react";
import "./dashbord.css";
import { CourseData } from "../../context/CourseContext";
import CourseCard from "../../components/coursecard/CourseCard";

const Dashbord = () => {
  const { mycourse, courses } = CourseData();

  const topCourses = useMemo(() => {
    const all = Array.isArray(courses) ? courses : [];
    return all
      .filter((c) => c.isTopCourse)
      .sort((a, b) => (a.topPriority || 0) - (b.topPriority || 0))
      .slice(0, 4);
  }, [courses]);
  return (
    <div className="student-dashboard">
      <h2>Top Picks For You</h2>
      <div className="dashboard-content">
        {topCourses && topCourses.length > 0 ? (
          topCourses.map((e) => <CourseCard key={e._id} course={e} />)
        ) : (
          <p>No top courses selected by admin yet.</p>
        )}
      </div>

      <h2>All Enrolled Courses</h2>
      <div className="dashboard-content">
        {mycourse && mycourse.length > 0 ? (
          mycourse.map((e) => <CourseCard key={e._id} course={e} />)
        ) : (
          <p>No course Enrolled Yet</p>
        )}
      </div>
    </div>
  );
};

export default Dashbord;
