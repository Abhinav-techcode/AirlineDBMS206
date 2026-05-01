import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../utils/api";
import { setSession } from "../../utils/session";

const LoginPage = ({ role = "CUSTOMER" }) => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resolveDashboard = (userRole) => {
    const nextRole = String(userRole || role).toUpperCase();

    if (nextRole === "CUSTOMER") {
      navigate("/dashboard/customer");
      return;
    }

    if (nextRole === "AIRLINE") {
      navigate("/dashboard/airline");
      return;
    }

    navigate("/dashboard/admin");
  };

  const autoRegisterCustomer = async () => {
    if (!identifier.includes("@")) {
      throw new Error("Please enter a valid email address to create a customer account.");
    }

    const createdAccount = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        name: identifier.split("@")[0],
        email: identifier,
        password,
        role: "CUSTOMER",
      },
    });

    return createdAccount;
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Enter your login details to continue.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      let response;

      try {
        response = await apiRequest("/auth/login", {
          method: "POST",
          body: {
            identifier: identifier.trim(),
            password,
            role,
          },
        });
        setStatusMessage("Signed in successfully.");
      } catch (error) {
        if (role === "CUSTOMER" && error.status === 401) {
          response = await autoRegisterCustomer();
          setStatusMessage("New customer account created and signed in.");
        } else {
          throw error;
        }
      }

      setSession({
        token: response.token,
        user: response.user,
      });

      resolveDashboard(response.user?.role);
    } catch (error) {
      setErrorMessage(error.message || "Unable to sign in right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <div style={styles.left}>
        <h1>AirlinePro</h1>
        <h2>Welcome to Flight Management</h2>
        <p>Modern airline booking & management system</p>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <h2>Welcome Back</h2>
          <p>Login as {role}</p>

          <input
            placeholder={role === "ADMIN" ? "Admin Username" : "Email Address"}
            style={styles.input}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            style={styles.input}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleLogin();
              }
            }}
          />

          {statusMessage ? <p style={styles.success}>{statusMessage}</p> : null}
          {errorMessage ? <p style={styles.error}>{errorMessage}</p> : null}

          <button style={styles.btn} onClick={handleLogin} disabled={submitting}>
            {submitting ? "Signing In..." : "Sign In ->"}
          </button>

          <button style={styles.google} type="button" disabled>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    background: "linear-gradient(135deg, #020617, #0f172a)",
    position: "relative",
  },
  bgGlow1: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "#7c3aed",
    filter: "blur(120px)",
    top: "10%",
    left: "10%",
    opacity: 0.3,
  },
  bgGlow2: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "#2563eb",
    filter: "blur(120px)",
    bottom: "10%",
    right: "10%",
    opacity: 0.3,
  },
  left: {
    flex: 1,
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px",
    zIndex: 2,
  },
  right: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  card: {
    background: "#0f172a",
    padding: "30px",
    borderRadius: "12px",
    width: "320px",
    color: "white",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "none",
    boxSizing: "border-box",
  },
  btn: {
    width: "100%",
    padding: "12px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "8px",
    marginTop: "10px",
    cursor: "pointer",
    opacity: 1,
  },
  google: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "8px",
    border: "1px solid #444",
    background: "#020617",
    color: "white",
    cursor: "not-allowed",
    opacity: 0.5,
  },
  success: {
    margin: "6px 0 0",
    color: "#86efac",
    fontSize: "13px",
  },
  error: {
    margin: "6px 0 0",
    color: "#fca5a5",
    fontSize: "13px",
  },
};

export default LoginPage;
