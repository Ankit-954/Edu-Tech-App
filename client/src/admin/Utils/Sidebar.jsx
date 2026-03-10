import React from "react";
import "./common.css";
import { NavLink } from "react-router-dom";
import { AiFillHome, AiOutlineLogout } from "react-icons/ai";
import { FaBook, FaUserAlt } from "react-icons/fa";
import { UserData } from "../../context/UserContext";

const Sidebar = () => {
  const { user } = UserData();
  return (
    <div className="sidebar">
      <div className="sidebar-brand">SmartLearn Admin</div>
      <ul>
        <li>
          <NavLink
            to={"/admin/dashboard"}
            className={({ isActive }) => (isActive ? "active-nav" : "")}
          >
            <div className="icon">
              <AiFillHome />
            </div>
            <span>Home</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to={"/admin/course"}
            className={({ isActive }) => (isActive ? "active-nav" : "")}
          >
            <div className="icon">
              <FaBook />
            </div>
            <span>Courses</span>
          </NavLink>
        </li>

        {user && user.mainrole === "superadmin" && (
          <li>
            <NavLink
              to={"/admin/users"}
              className={({ isActive }) => (isActive ? "active-nav" : "")}
            >
              <div className="icon">
                <FaUserAlt />
              </div>
              <span>Users</span>
            </NavLink>
          </li>
        )}

        <li>
          <NavLink to={"/account"}>
            <div className="icon">
              <AiOutlineLogout />
            </div>
            <span>Logout</span>
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
