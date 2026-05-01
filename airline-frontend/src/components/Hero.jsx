import React from "react";
import { useNavigate } from "react-router-dom";

const Hero = ({ darkMode }) => {
  const navigate = useNavigate();

  return (
    <div style={styles.container(darkMode)}>

      {/* GLOW */}
      <div style={styles.glow1}></div>
      <div style={styles.glow2}></div>

      {/* CONTENT */}
      <div style={styles.content}>

        <h1 style={styles.title}>
          Smarter Travel Starts Here <br />
          <span style={styles.highlight}>Flight Booking Reimagined</span>
        </h1>

        <p style={styles.subtitle}>
          Whether you're a traveler or an airline managing operations,
          our platform connects you to seamless experiences in the skies.
        </p>

        {/* ✅ BUTTON GROUP */}
        <div style={styles.buttonGroup}>

          <button
            style={styles.primary}
            onClick={() => navigate("/login/customer")}
          >
            👤 Traveler
          </button>

          <button
            style={styles.admin}
            onClick={() => navigate("/login/admin")}
          >
            🛠 Admin
          </button>

        </div>

      </div>
    </div>
  );
};

const styles = {
  container: (darkMode) => ({
    position: "relative",
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    background: darkMode
      ? "radial-gradient(circle at 20% 30%, #1e293b, #020617)"
      : "radial-gradient(circle at 30% 20%, #e0e7ff, #ffffff)",
  }),

  content: {
    textAlign: "center",
    zIndex: 2,
    maxWidth: "750px",
    padding: "20px",
  },

  title: {
    fontSize: "56px",
    fontWeight: "700",
    lineHeight: "1.2",
    letterSpacing: "-1px",
  },

  highlight: {
    color: "#7c3aed",
  },

  subtitle: {
    marginTop: "20px",
    fontSize: "18px",
    color: "#6b7280",
  },

  buttonGroup: {
    marginTop: "35px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },

  primary: {
    background: "linear-gradient(135deg, #7c3aed, #9333ea)",
    color: "white",
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "500",
    boxShadow: "0 8px 20px rgba(124,58,237,0.4)",
  },

  admin: {
    background: "#111827",
    color: "white",
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "500",
  },

  glow1: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "#a78bfa",
    filter: "blur(120px)",
    top: "20%",
    left: "20%",
    opacity: 0.4,
  },

  glow2: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "#60a5fa",
    filter: "blur(120px)",
    bottom: "10%",
    right: "20%",
    opacity: 0.4,
  },
};

export default Hero;
