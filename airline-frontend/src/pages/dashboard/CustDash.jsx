import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../utils/api";

const defaultAirports = [
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj International Airport" },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhas Chandra Bose International Airport" },
  { code: "DEL", city: "Delhi", name: "Indira Gandhi International Airport" },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda International Airport" },
  { code: "MAA", city: "Chennai", name: "Chennai International Airport" },
  { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi International Airport" },
];

const fares = [
  { id: "Regular", label: "Regular", desc: "Regular fares", badge: "" },
  { id: "Student", label: "Student", desc: "Extra discounts and baggage", badge: "Student" },
  { id: "Armed Forces", label: "Armed Forces", desc: "Up to Rs. 600 off", badge: "Rs. 600" },
  { id: "Senior Citizen", label: "Senior Citizen", desc: "Up to Rs. 600 off", badge: "Rs. 600" },
  { id: "Doctor & Nurses", label: "Doctor and Nurses", desc: "Up to Rs. 600 off", badge: "Rs. 600" },
];

const CustDash = () => {
  const navigate = useNavigate();
  const [airports, setAirports] = useState(defaultAirports);
  const [darkMode, setDarkMode] = useState(false);
  const [tripType, setTripType] = useState("oneway");
  const [fare, setFare] = useState("Regular");
  const [from, setFrom] = useState("BOM");
  const [to, setTo] = useState("CCU");
  const [departureDate, setDepartureDate] = useState("2026-04-03");
  const [returnDate, setReturnDate] = useState("2026-04-10");
  const [travelers, setTravelers] = useState("2");
  const [travelClass, setTravelClass] = useState("Economy");

  const fromAirport = airports.find((airport) => airport.code === from);
  const toAirport = airports.find((airport) => airport.code === to);

  useEffect(() => {
    let ignore = false;

    const loadAirports = async () => {
      try {
        const response = await apiRequest("/meta/airports");
        const nextAirports = Array.isArray(response?.airports) && response.airports.length > 0
          ? response.airports
          : defaultAirports;

        if (ignore) {
          return;
        }

        setAirports(nextAirports);

        const airportCodes = nextAirports.map((airport) => airport.code);
        setFrom((current) => (airportCodes.includes(current) ? current : nextAirports[0]?.code || "BOM"));
        setTo((current) =>
          airportCodes.includes(current) ? current : nextAirports[1]?.code || nextAirports[0]?.code || "CCU"
        );
      } catch (error) {
        if (!ignore) {
          setAirports(defaultAirports);
        }
      }
    };

    loadAirports();

    return () => {
      ignore = true;
    };
  }, []);

  const swapAirports = () => {
    setFrom(to);
    setTo(from);
  };

  const handleSearch = () => {
    navigate("/flights", {
      state: {
        tripType,
        fare,
        from,
        to,
        departureDate,
        returnDate: tripType === "round" ? returnDate : "",
        travelers,
        travelClass,
      },
    });
  };

  return (
    <div style={{ ...styles.page, background: darkMode ? "#020617" : styles.page.background }}>
      <div
        style={{
          ...styles.backgroundImage,
          opacity: darkMode ? 0.82 : styles.backgroundImage.opacity,
          backgroundImage: darkMode
            ? "linear-gradient(rgba(2, 6, 23, 0.88), rgba(30, 41, 59, 0.82)), url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80')"
            : styles.backgroundImage.backgroundImage,
        }}
      />
      <div style={styles.waveBg} />

      <nav style={{ ...styles.nav, background: darkMode ? "rgba(15, 23, 42, 0.92)" : styles.nav.background }}>
        <button style={styles.logoWrap} onClick={() => navigate("/dashboard/customer")}>
          <span style={styles.logoIcon}>ZA</span>
          <span style={{ ...styles.logoText, color: darkMode ? "#ffffff" : styles.logoText.color }}>ZoshAir</span>
        </button>

        <div style={styles.navLinks}>
          <button style={{ ...styles.navLinkActive, color: darkMode ? "#ffffff" : styles.navLinkActive.color }}>Home</button>
          <button
            style={{ ...styles.navLink, color: darkMode ? "#cbd5e1" : styles.navLink.color }}
            onClick={() => navigate("/my-bookings")}
          >
            My Bookings
          </button>
        </div>

        <div style={styles.navRight}>
          <button style={styles.themeBtn} onClick={() => setDarkMode((current) => !current)}>
            {darkMode ? "Dark" : "Light"}
          </button>
          <div style={styles.avatar}>RV</div>
        </div>
      </nav>

      <section style={styles.hero}>
        <p style={styles.kicker}>Premium flight booking</p>
        <h1 style={styles.heroTitle}>Let's Start Your Journey!</h1>
        <p style={styles.heroSub}>Choose your route, dates, traveller count, and cabin class before searching.</p>
      </section>

      <main style={styles.card}>
        <div style={styles.tabRow}>
          {[["round", "Round Trip"], ["oneway", "One Way"], ["multi", "Multi City"]].map(([id, label]) => (
            <button
              key={id}
              style={tripType === id ? { ...styles.tab, ...styles.tabActive } : styles.tab}
              onClick={() => setTripType(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <section style={styles.searchGrid}>
          <label style={styles.fieldBox}>
            <span style={styles.fieldLabel}>From</span>
            <select style={styles.control} value={from} onChange={(event) => setFrom(event.target.value)}>
              {airports.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.code} - {airport.city}
                </option>
              ))}
            </select>
            <small style={styles.fieldCity}>{fromAirport?.name || "Airport loading..."}</small>
          </label>

          <button style={styles.swapBtn} onClick={swapAirports} aria-label="Swap route">
            <span style={styles.swapCircle}>⇅</span>
          </button>

          <label style={styles.fieldBox}>
            <span style={styles.fieldLabel}>To</span>
            <select style={styles.control} value={to} onChange={(event) => setTo(event.target.value)}>
              {airports.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.code} - {airport.city}
                </option>
              ))}
            </select>
            <small style={styles.fieldCity}>{toAirport?.name || "Airport loading..."}</small>
          </label>

          <label style={styles.fieldBox}>
            <span style={styles.fieldLabel}>Departure</span>
            <input
              style={styles.control}
              type="date"
              value={departureDate}
              onChange={(event) => setDepartureDate(event.target.value)}
            />
            <small style={styles.fieldCity}>Pick your departure date</small>
          </label>

          {tripType === "round" && (
            <label style={styles.fieldBox}>
              <span style={styles.fieldLabel}>Return</span>
              <input
                style={styles.control}
                type="date"
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
              />
              <small style={styles.fieldCity}>Pick your return date</small>
            </label>
          )}

          <label style={styles.fieldBox}>
            <span style={styles.fieldLabel}>Travellers</span>
            <select style={styles.control} value={travelers} onChange={(event) => setTravelers(event.target.value)}>
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? "Traveller" : "Travellers"}
                </option>
              ))}
            </select>
            <small style={styles.fieldCity}>Adults and children</small>
          </label>

          <label style={{ ...styles.fieldBox, ...styles.activeField }}>
            <span style={styles.fieldLabel}>Class</span>
            <select style={styles.control} value={travelClass} onChange={(event) => setTravelClass(event.target.value)}>
              <option>Economy</option>
              <option>Premium Economy</option>
              <option>Business</option>
              <option>First</option>
            </select>
            <small style={styles.fieldCity}>{travelClass}</small>
          </label>
        </section>

        <p style={styles.faresTitle}>Select special fares</p>
        <section style={styles.faresGrid}>
          {fares.map((item) => (
            <button
              key={item.id}
              style={fare === item.id ? { ...styles.fareCard, ...styles.fareCardActive } : styles.fareCard}
              onClick={() => setFare(item.id)}
            >
              <span style={styles.fareIcon}>{item.label.slice(0, 1)}</span>
              <strong style={styles.fareName}>{item.label}</strong>
              <small style={styles.fareDesc}>{item.desc}</small>
              {item.badge && <span style={styles.fareDiscount}>{item.badge}</span>}
            </button>
          ))}
        </section>

        <button style={styles.searchBtn} onClick={handleSearch}>
          Search Flights
        </button>
      </main>

      <footer style={styles.footer}>
        {["Free Cancellation", "No Hidden Charges", "Best Price Guaranteed", "24/7 Support"].map((item) => (
          <div key={item} style={styles.footerItem}>
            <span style={styles.footerCheck}>✓</span>
            <span>{item}</span>
          </div>
        ))}
      </footer>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#154ec8",
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
    paddingBottom: "48px",
  },
  backgroundImage: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(21, 78, 200, 0.78), rgba(109, 40, 217, 0.78)), url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    opacity: 0.95,
  },
  waveBg: {
    position: "absolute",
    bottom: 0,
    left: "-10%",
    right: "-10%",
    height: "48%",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "55% 55% 0 0 / 12% 12% 0 0",
    zIndex: 0,
  },
  nav: {
    position: "relative",
    zIndex: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 32px",
    background: "#ffffff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  logoIcon: {
    width: "32px",
    height: "32px",
    background: "#4f46e5",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 900,
  },
  logoText: { fontWeight: "800", fontSize: "18px", color: "#111827" },
  navLinks: { display: "flex", gap: "28px" },
  navLink: {
    border: "none",
    background: "transparent",
    fontSize: "15px",
    color: "#6b7280",
    cursor: "pointer",
    fontWeight: "700",
  },
  navLinkActive: {
    border: "none",
    background: "transparent",
    fontSize: "15px",
    color: "#111827",
    cursor: "pointer",
    fontWeight: "800",
  },
  navRight: { display: "flex", alignItems: "center", gap: "12px" },
  themeBtn: {
    padding: "8px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    color: "#374151",
    fontWeight: "700",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#6d28d9",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "13px",
  },
  hero: {
    position: "relative",
    zIndex: 2,
    textAlign: "center",
    padding: "50px 20px 28px",
    color: "#fff",
  },
  kicker: {
    margin: "0 0 10px",
    textTransform: "uppercase",
    fontSize: "12px",
    fontWeight: 900,
  },
  heroTitle: { fontSize: "38px", fontWeight: "800", margin: "0 0 10px" },
  heroSub: { fontSize: "16px", opacity: 0.9, margin: 0 },
  card: {
    position: "relative",
    zIndex: 3,
    background: "rgba(255,255,255,0.96)",
    borderRadius: "8px",
    padding: "28px",
    maxWidth: "1080px",
    margin: "0 auto",
    boxShadow: "0 24px 70px rgba(15,23,42,0.24)",
    border: "1px solid rgba(255,255,255,0.4)",
  },
  tabRow: {
    display: "flex",
    gap: "6px",
    marginBottom: "24px",
    borderBottom: "2px solid #f3f4f6",
    flexWrap: "wrap",
  },
  tab: {
    padding: "10px 20px",
    borderRadius: "8px 8px 0 0",
    fontSize: "14px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#6b7280",
    fontWeight: "800",
  },
  tabActive: {
    background: "#4f46e5",
    color: "#fff",
  },
  searchGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(180px, 1.2fr) 46px minmax(180px, 1.2fr) repeat(3, minmax(150px, 1fr))",
    gap: "10px",
    alignItems: "stretch",
    marginBottom: "24px",
  },
  fieldBox: {
    minWidth: 0,
    border: "1.5px solid #e5e7eb",
    borderRadius: "8px",
    background: "#fff",
    padding: "13px",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },
  activeField: {
    borderColor: "#4f46e5",
    background: "#f8f7ff",
  },
  fieldLabel: {
    fontSize: "11px",
    fontWeight: "900",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  control: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#111827",
    fontSize: "18px",
    fontWeight: "800",
    outline: "none",
    minWidth: 0,
  },
  fieldCity: {
    color: "#6b7280",
    fontSize: "12px",
    lineHeight: 1.35,
    minHeight: "32px",
  },
  swapBtn: {
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  swapCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "1.5px solid #dfe4ed",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#4f46e5",
    fontWeight: 900,
  },
  faresTitle: {
    fontSize: "12px",
    fontWeight: "900",
    color: "#374151",
    textTransform: "uppercase",
    margin: "0 0 12px",
  },
  faresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
    marginBottom: "22px",
  },
  fareCard: {
    textAlign: "left",
    padding: "14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
    background: "#fff",
  },
  fareCardActive: {
    borderColor: "#4f46e5",
    background: "#f5f3ff",
  },
  fareIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "#e8eeff",
    color: "#4f46e5",
    display: "grid",
    placeItems: "center",
    marginBottom: "9px",
    fontWeight: 900,
  },
  fareName: {
    display: "block",
    fontSize: "14px",
    fontWeight: "800",
    color: "#111827",
    marginBottom: "4px",
  },
  fareDesc: {
    display: "block",
    fontSize: "12px",
    color: "#6b7280",
    minHeight: "32px",
  },
  fareDiscount: {
    display: "inline-block",
    marginTop: "9px",
    padding: "3px 9px",
    background: "#dcfce7",
    color: "#15803d",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "800",
  },
  searchBtn: {
    width: "100%",
    padding: "16px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(90deg, #4f46e5 0%, #9333ea 100%)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "900",
    cursor: "pointer",
  },
  footer: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "center",
    gap: "32px",
    flexWrap: "wrap",
    padding: "24px 20px 0",
  },
  footerItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "rgba(255,255,255,0.92)",
    fontSize: "13px",
    fontWeight: "700",
  },
  footerCheck: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "1.5px solid rgba(255,255,255,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
};

export default CustDash;
