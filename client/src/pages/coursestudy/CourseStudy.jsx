import React, { useEffect } from "react";
import "./coursestudy.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import CourseThumbnail from "../../components/coursethumbnail/CourseThumbnail";

const CourseStudy = ({ user }) => {
  const params = useParams();

  const { fetchCourse, course } = CourseData();
  const navigate = useNavigate();

  useEffect(() => {
    const hasAccess =
      user?.role === "admin" ||
      (Array.isArray(user?.subscription) &&
        user.subscription.some((courseId) => String(courseId) === String(params.id)));
    if (user && !hasAccess) {
      navigate("/");
    }
  }, [user, params.id, navigate]);

  useEffect(() => {
    fetchCourse(params.id);
  }, [params.id]);
  return (
    <>
      {course && (
        <div className="course-study-page">
          <div className="course-study-shell">
            <div className="course-study-media">
              <CourseThumbnail course={course} className="study-cover" />
            </div>

            <div className="course-study-content">
              <p className="study-kicker">Course Overview</p>
              <h1>{course.title}</h1>
              <p className="study-description">{course.description}</p>

              <div className="study-meta">
                <span className="meta-pill">Instructor: {course.createdBy}</span>
                <span className="meta-pill">Duration: {course.duration} weeks</span>
              </div>

              <Link to={`/lectures/${course._id}`} className="study-cta">
                Start Learning
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseStudy;
