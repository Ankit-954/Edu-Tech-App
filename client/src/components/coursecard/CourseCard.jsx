import React, { useState } from "react";
import "./courseCard.css";
import { UserData } from "../../context/UserContext";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { CourseData } from "../../context/CourseContext";
import { server } from "../../main";
import CourseThumbnail from "../coursethumbnail/CourseThumbnail";

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuth } = UserData();
  const { fetchCourses } = CourseData();
  const [topPriority, setTopPriority] = useState(course?.topPriority || 0);
  const [topLoading, setTopLoading] = useState(false);
  const isAdminPanel = location.pathname.startsWith("/admin");

  const deleteHandler = async (id) => {
    if (confirm("Are you sure you want to delete this course")) {
      try {
        const { data } = await axios.delete(`${server}/api/course/${id}`, {
          headers: {
            token: localStorage.getItem("token"),
          },
        });

        toast.success(data.message);
        fetchCourses();
      } catch (error) {
        toast.error(error.response.data.message);
      }
    }
  };

  const updateTopCourse = async (isTopCourse) => {
    setTopLoading(true);
    try {
      const { data } = await axios.put(
        `${server}/api/course/${course._id}/top`,
        { isTopCourse, topPriority: Number(topPriority) || 0 },
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );
      toast.success(data.message);
      fetchCourses();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update top course");
    } finally {
      setTopLoading(false);
    }
  };

  return (
    <div className="course-card">
      {course.isTopCourse && (
        <div className="top-course-badge">Top #{course.topPriority || 0}</div>
      )}
      <CourseThumbnail course={course} className="course-image" />
      <h3>{course.title}</h3>
      <p className="course-meta-line">
        <span>{course.stream || course.category}</span>
        <span>{course.level || "All Levels"}</span>
      </p>
      <p>Instructor- {course.createdBy}</p>
      <p>Duration- {course.duration} weeks</p>
      <p>Price- Rs {course.price}</p>

      {Array.isArray(course.subjects) && course.subjects.length > 0 && (
        <div className="course-subject-tags">
          {course.subjects.slice(0, 3).map((subject) => (
            <span key={subject}>{subject}</span>
          ))}
        </div>
      )}

      {isAuth ? (
        <>
          {user && user.role !== "admin" ? (
            <>
              {Array.isArray(user.subscription) && user.subscription.includes(course._id) ? (
                <button
                  onClick={() => navigate(`/course/study/${course._id}`)}
                  className="common-btn"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/course/${course._id}`)}
                  className="common-btn"
                >
                  Get Started
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => navigate(`/course/study/${course._id}`)}
              className="common-btn"
            >
              Study
            </button>
          )}
        </>
      ) : (
        <button onClick={() => navigate("/login")} className="common-btn">
          Get Started
        </button>
      )}

      <br />

      {user && user.role === "admin" && isAdminPanel && (
        <div className="admin-course-actions">
          <div className="top-course-priority">
            <label>Top Priority</label>
            <input
              type="number"
              min="0"
              value={topPriority}
              onChange={(e) => setTopPriority(e.target.value)}
            />
          </div>
          <button
            onClick={() => updateTopCourse(true)}
            className="common-btn"
            disabled={topLoading}
          >
            Mark Top
          </button>
          <button
            onClick={() => updateTopCourse(false)}
            className="common-btn"
            disabled={topLoading}
            style={{ background: "#475569" }}
          >
            Remove Top
          </button>
          <button
            onClick={() => deleteHandler(course._id)}
            className="common-btn"
            style={{ background: "red" }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseCard;
