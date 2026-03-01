import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import roadmaps from "./roadmap.json"; // Assuming you have this JSON data
import "./header.css";
import logos from "./logos.png"; // Import the logo image

const Header = ({ isAuth }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearchKeyPress = (event) => {
    if (event.key === "Enter") {
      const sanitizedQuery = searchQuery.trim().toLowerCase(); // Clean the query

      const filteredRoadmaps = Object.keys(roadmaps).filter((roadmapName) =>
        roadmapName.toLowerCase().includes(sanitizedQuery)
      );

      if (filteredRoadmaps.length > 0) {
        // Navigate to the first matching roadmap
        navigate(`/roadmap/${filteredRoadmaps[0]}`);
      } else {
        // Navigate to the roadmap page with a non-existent roadmap name
        navigate(`/roadmap/${sanitizedQuery}`);
      }
    }
  };

  return (
    <header>
      <div className="logo">
        <Link to={"/"}>
          <img src={logos} alt="PathPro" className="logo-image" />
        </Link>
      </div>

      <div className="search-box">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyPress}
        />
      </div>

      <div className="link">
        <Link to={"/"}>Home</Link>
        <Link to={"/courses"}>Courses</Link>
        <Link to={"/about"}>About</Link>
        <Link to={"/test"}>Test</Link> {/* Added Test Section */}
        <Link to={"/reviews"}>Review</Link>
        {isAuth ? (
          <Link to={"/account"}>Account</Link>
        ) : (
          <Link to={"/login"}>Login</Link>
        )}
      </div>
    </header>
  );
};

export default Header;