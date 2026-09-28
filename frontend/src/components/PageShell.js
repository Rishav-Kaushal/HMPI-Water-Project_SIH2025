import React from "react";
import Navbar from "./Navbar";

export default function PageShell({ children, className = "" }) {
  return (
    <div className={`app-root ${className}`}>
      <Navbar />
      {children}
      <footer className="app-footer">
        <div className="container d-flex flex-wrap justify-content-between gap-2">
          <span>HMPI Water</span>
          <span>Groundwater heavy-metal analysis platform</span>
        </div>
      </footer>
    </div>
  );
}
