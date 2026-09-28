import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Navbar as RBNavbar, Nav, Container, Button } from "react-bootstrap";
import { FaWater, FaSignInAlt, FaSignOutAlt, FaTachometerAlt, FaFlask } from "react-icons/fa";

export default function Navbar() {
  const navigate = useNavigate();
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("hmpi_user") || "null"); }
    catch { return null; }
  })();

  const logout = () => {
    localStorage.removeItem("hmpi_token");
    localStorage.removeItem("hmpi_user");
    navigate("/");
  };

  const linkClass = ({ isActive }) => `nav-link ${isActive ? "active fw-semibold" : ""}`;

  return (
    <RBNavbar expand="lg" className="app-navbar" variant="dark" sticky="top">
      <Container>
        <RBNavbar.Brand as={Link} to="/" className="brand">
          <span className="brand-mark"><FaWater /></span>
          HMPI <span>Water</span>
        </RBNavbar.Brand>
        <RBNavbar.Toggle aria-controls="hmpi-nav" />
        <RBNavbar.Collapse id="hmpi-nav">
          <Nav className="ms-auto align-items-lg-center gap-lg-1">
            <NavLink className={linkClass} to="/dashboard"><FaTachometerAlt className="me-1"/> Dashboard</NavLink>
            <NavLink className={linkClass} to="/analysis"><FaFlask className="me-1"/> Calculator</NavLink>
            <NavLink className={linkClass} to="/samples">Samples</NavLink>
            <NavLink className={linkClass} to="/map">Map</NavLink>
            <NavLink className={linkClass} to="/samples/new">Add Sample</NavLink>
            <NavLink className={linkClass} to="/upload">Upload CSV</NavLink>
            <NavLink className={linkClass} to="/about">About</NavLink>
            {user ? (
              <Button variant="outline-light" size="sm" className="ms-lg-2 rounded-pill px-3" onClick={logout}>
                <FaSignOutAlt className="me-1"/> {user.username}
              </Button>
            ) : (
              <Button variant="light" size="sm" className="ms-lg-2 rounded-pill px-3 text-primary" as={Link} to="/login">
                <FaSignInAlt className="me-1"/> Sign in
              </Button>
            )}
          </Nav>
        </RBNavbar.Collapse>
      </Container>
    </RBNavbar>
  );
}
