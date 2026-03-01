import React from "react";
import "./footer.css";
import {
  AiFillFacebook,
  AiFillTwitterSquare,
  AiFillInstagram,
} from "react-icons/ai";

const Footer = () => {
  return (
    <footer>
      <div className="footer-content">
        <p>
          &copy; 2024 Your EduTech Platform. All rights reserved. <br />
          Created by <a href="#">Ankit Kumar</a>
        </p>
        <div className="social-links">
          <a href="#" aria-label="Facebook">
            <AiFillFacebook />
          </a>
          <a href="#" aria-label="Twitter">
            <AiFillTwitterSquare />
          </a>
          <a href="#" aria-label="Instagram">
            <AiFillInstagram />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
