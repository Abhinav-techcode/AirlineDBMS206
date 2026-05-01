import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        ...styles.navbar,
        background: darkMode ? "rgba(2, 6, 23, 0.82)" : "rgba(255, 255, 255, 0.24)",
        color: darkMode ? "#ffffff" : "#111827",
        borderBottom: darkMode ? "1px solid rgba(148, 163, 184, 0.24)" : "1px solid rgba(255,255,255,0.28)",
      }}
    >
      <button type="button" style={styles.logoButton} onClick={() => navigate("/")}>
        <div style={styles.logo}>AirlinePro</div>
      </button>

      <div style={styles.links}>
        <button type="button" style={styles.linkButton} onClick={() => navigate("/login/customer")}>
          Features
        </button>
        <button type="button" style={styles.linkButton} onClick={() => navigate("/login/airline")}>
          Airline
        </button>
        <button type="button" style={styles.linkButton} onClick={() => navigate("/login/admin")}>
          Admin
        </button>
      </div>

      <div style={styles.buttons}>
        <button type="button" onClick={() => setDarkMode((current) => !current)} style={styles.toggle}>
          {darkMode ? "Dark" : "Light"}
        </button>

        <button
          type="button"
          style={{
            ...styles.signIn,
            color: darkMode ? "#ffffff" : "#111827",
            border: darkMode ? "1px solid rgba(255,255,255,0.45)" : "1px solid rgba(17,24,39,0.16)",
          }}
          onClick={() => navigate("/login/customer")}
        >
          Sign In
        </button>

        <button type="button" style={styles.getStarted} onClick={() => navigate("/login/customer")}>
          Get Started
        </button>
      </div>
    </div>
  );
};

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 32px",
    position: "absolute",
    width: "100%",
    top: 0,
    left: 0,
    backdropFilter: "blur(18px)",
    boxSizing: "border-box",
    zIndex: 10,
  },
  logoButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
  },
  logo: {
    fontSize: "20px",
    fontWeight: "700",
    letterSpacing: "1px",
  },
  links: {
    display: "flex",
    gap: "18px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  linkButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "15px",
    color: "inherit",
    opacity: 0.92,
  },
  buttons: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  toggle: {
    padding: "8px 14px",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    background: "#e5e7eb",
    fontSize: "13px",
    fontWeight: "700",
  },
  signIn: {
    background: "transparent",
    padding: "9px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "700",
  },
  getStarted: {
    background: "linear-gradient(135deg, #7c3aed, #9333ea)",
    color: "white",
    padding: "10px 18px",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
  },
};

export default Navbar;
