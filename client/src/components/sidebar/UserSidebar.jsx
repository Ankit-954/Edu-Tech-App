import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  AiFillHome,
  AiOutlineLogin,
  AiOutlineLogout,
  AiOutlineClose,
} from "react-icons/ai";
import { FaBook, FaUserAlt } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { RiProfileLine } from "react-icons/ri";
import toast from "react-hot-toast";
import { UserData } from "../../context/UserContext";
import "./userSidebar.css";

const UserSidebar = ({ isOpen, onClose, isAuth, user }) => {
  const navigate = useNavigate();
  const { setIsAuth, setUser } = UserData();

  const logoutHandler = () => {
    localStorage.clear();
    setUser([]);
    setIsAuth(false);
    toast.success("Logged Out");
    onClose();
    navigate("/login");
  };

  const directLoginHandler = () => {
    localStorage.clear();
    setUser([]);
    setIsAuth(false);
    onClose();
    navigate("/login");
  };

  const navClass = ({ isActive }) =>
    `user-side-link ${isActive ? "active-nav" : ""}`;
  const testAttempts = Array.isArray(user?.testHistory) ? user.testHistory.length : 0;
  const purchasedCourses = Array.isArray(user?.subscription) ? user.subscription.length : 0;
  const recentTestAttempts = Array.isArray(user?.testHistory)
    ? user.testHistory.filter((t) => {
        const completedAt = new Date(t?.completedAt || 0).getTime();
        return completedAt > Date.now() - 7 * 24 * 60 * 60 * 1000;
      }).length
    : 0;

  return (
    <>
      <div
        className={`user-side-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />
      <aside className={`user-side-drawer ${isOpen ? "open" : ""}`}>
        <div className="user-side-head">
          <div className="user-side-user">
            <h3>{isAuth ? user?.name || "User" : "Guest"}</h3>
            {isAuth && <p>{user?.email || ""}</p>}
          </div>
          <button type="button" onClick={onClose} className="user-side-close-btn">
            <AiOutlineClose />
          </button>
        </div>

        <nav className="user-side-nav">
          <NavLink to="/" end className={navClass} onClick={onClose}>
            <AiFillHome />
            <span>Home</span>
          </NavLink>
          <NavLink to="/courses" className={navClass} onClick={onClose}>
            <FaBook />
            <span>Courses</span>
          </NavLink>
          <NavLink to="/progress" className={navClass} onClick={onClose}>
            <MdDashboard />
            <span>Progress</span>
            {isAuth && purchasedCourses > 0 && (
              <span className="user-side-badge">{purchasedCourses}</span>
            )}
          </NavLink>
          <NavLink to="/test" className={navClass} onClick={onClose}>
            <FaUserAlt />
            <span>Test</span>
            {isAuth && testAttempts > 0 && (
              <span className="user-side-badge">{testAttempts}</span>
            )}
          </NavLink>
          <NavLink to="/interview" className={navClass} onClick={onClose}>
            <FaUserAlt />
            <span>Interview</span>
          </NavLink>
          <NavLink to="/reviews" className={navClass} onClick={onClose}>
            <FaUserAlt />
            <span>Review</span>
          </NavLink>

          {isAuth && (
            <>
              <NavLink to="/account" className={navClass} onClick={onClose}>
                <RiProfileLine />
                <span>My Profile</span>
              </NavLink>
              <NavLink to={`/${user?._id}/dashboard`} className={navClass} onClick={onClose}>
                <MdDashboard />
                <span>Dashboard</span>
              </NavLink>
              {user?.role === "admin" && (
                <NavLink to="/admin/dashboard" className={navClass} onClick={onClose}>
                  <MdDashboard />
                  <span>Admin Panel</span>
                </NavLink>
              )}
            </>
          )}
        </nav>

        {isAuth && (
          <div className="user-side-stats">
            <div className="user-side-stat-card">
              <span>Tests (7d)</span>
              <strong>{recentTestAttempts}</strong>
            </div>
            <div className="user-side-stat-card">
              <span>Courses</span>
              <strong>{purchasedCourses}</strong>
            </div>
          </div>
        )}

        <div className="user-side-actions">
          {isAuth ? (
            <button
              type="button"
              onClick={logoutHandler}
              className="user-side-action logout"
            >
              <AiOutlineLogout />
              Logout
            </button>
          ) : (
            <button
              type="button"
              onClick={directLoginHandler}
              className="user-side-action login"
            >
              <AiOutlineLogin />
              Login
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default UserSidebar;
