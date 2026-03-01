import React from "react";
import Sidebar from "./Sidebar";
import Footer from "../../components/footer/Footer"; // Updated import path
import "./common.css";

const Layout = ({ children }) => {
  return (
    <div className="dashboard-admin">
      <Sidebar />
      <div className="content">
        <div className="main-content">{children}</div>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;