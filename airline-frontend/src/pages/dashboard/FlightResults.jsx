import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { apiRequest } from "../../utils/api";
import { getCurrentUser } from "../../utils/session";

const timeBuckets = [
  { id: "any", label: "Any Time", sublabel: "All departures" },
  { id: "morning", label: "Morning", sublabel: "6 AM - 12 PM" },
  { id: "afternoon", label: "Afternoon", sublabel: "12 PM - 6 PM" },
  { id: "evening", label: "Evening", sublabel: "6 PM - 12 AM" },
  { id: "night", label: "Night", sublabel: "12 AM - 6 AM" },
];

const getTimeBucket = (time) => {
  const hour = Number(String(time).split(":")[0]);
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 24) return "evening";
  return "night";
};

const formatRouteDate = (dateValue) => {
  if (!dateValue) return "Flexible";
  const date = new Date(dateValue);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normaliseCabin = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase();

const FlightResults = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const currentUser = getCurrentUser();

  const tripType = state?.tripType || "oneway";
  const fare = state?.fare || "Regular";
  const from = state?.from || "BOM";
  const to = state?.to || "CCU";
  const departureDate = state?.departureDate || "2026-04-03";
  const returnDate = state?.returnDate || "";
  const travelers = Number(state?.travelers || 2);
  const travelClass = state?.travelClass || "Economy";

  const [apiFlights, setApiFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [selectedTimeBucket, setSelectedTimeBucket] = useState("any");
  const [minPrice, setMinPrice] = useState(1000);
  const [maxPrice, setMaxPrice] = useState(20000);
  const [darkMode, setDarkMode] = useState(false);
  const [expandedFlightId, setExpandedFlightId] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadFlights = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const query = new URLSearchParams({
          from,
          to,
          date: departureDate,
          cabin: travelClass,
        });
        const response = await apiRequest(`/flights/search?${query.toString()}`);

        if (!ignore) {
          setApiFlights(Array.isArray(response?.flights) ? response.flights : []);
        }
      } catch (error) {
        if (!ignore) {
          setApiFlights([]);
          setErrorMessage(error.message || "Unable to load flight results.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadFlights();

    return () => {
      ignore = true;
    };
  }, [departureDate, from, to, travelClass]);

  const airlineOptions = useMemo(() => {
    return [...new Map(apiFlights.map((flight) => [flight.airline, flight.image])).entries()].map(
      ([name, image]) => ({ name, image })
    );
  }, [apiFlights]);

  const filteredFlights = useMemo(() => {
    let next = apiFlights.filter(
      (flight) =>
        flight.from === from &&
        flight.to === to &&
        normaliseCabin(flight.cabin) === normaliseCabin(travelClass)
    );

    if (selectedAirlines.length > 0) {
      next = next.filter((flight) => selectedAirlines.includes(flight.airline));
    }

    if (selectedTimeBucket !== "any") {
      next = next.filter((flight) => getTimeBucket(flight.depart) === selectedTimeBucket);
    }

    next = next.filter((flight) => Number(flight.price) >= minPrice && Number(flight.price) <= maxPrice);

    if (sortBy === "price") {
      next = [...next].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "duration") {
      next = [...next].sort((a, b) => Number(a.durationMinutes) - Number(b.durationMinutes));
    } else if (sortBy === "departure") {
      next = [...next].sort((a, b) => String(a.depart).localeCompare(String(b.depart)));
    } else if (sortBy === "arrival") {
      next = [...next].sort((a, b) => String(a.arrive).localeCompare(String(b.arrive)));
    } else if (sortBy === "airline") {
      next = [...next].sort((a, b) => String(a.airline).localeCompare(String(b.airline)));
    }

    return next;
  }, [apiFlights, from, maxPrice, minPrice, selectedAirlines, selectedTimeBucket, sortBy, to, travelClass]);

  const toggleAirline = (airlineName) => {
    setSelectedAirlines((current) =>
      current.includes(airlineName)
        ? current.filter((name) => name !== airlineName)
        : [...current, airlineName]
    );
  };

  const resetFilters = () => {
    setSelectedAirlines([]);
    setSelectedTimeBucket("any");
    setMinPrice(1000);
    setMaxPrice(20000);
  };

  const openSeatFlow = (flight) => {
    navigate("/seats", {
      state: {
        tripType,
        fare,
        from,
        to,
        departureDate,
        returnDate,
        travelers,
        travelClass,
        flight,
        schedule_id: flight.schedule_id,
      },
    });
  };

  return (
    <div className={darkMode ? "flight-results-page dark" : "flight-results-page"}>
      <style>{styles}</style>

      <nav className="top-nav">
        <button className="brand-button" onClick={() => navigate("/dashboard/customer")}>
          <span className="brand-mark">X</span>
          <span>ZoshAir</span>
        </button>

        <div className="nav-center">
          <button onClick={() => navigate("/dashboard/customer")}>Home</button>
          <button onClick={() => navigate("/my-bookings")}>My Bookings</button>
        </div>

        <div className="nav-right">
          <button className="theme-toggle" onClick={() => setDarkMode((current) => !current)}>
            {darkMode ? "Dark" : "Light"}
          </button>
          <div className="avatar">
            {currentUser?.name ? String(currentUser.name).slice(0, 2).toUpperCase() : "RV"}
          </div>
        </div>
      </nav>

      <main className="page-shell">
        <section className="search-strip">
          <span className="search-item strong">
            <span className="pin-icon">O</span>
            {from} -> {to}
          </span>
          <span className="search-item">{formatRouteDate(departureDate)}</span>
          <span className="search-item">
            {travelers} {travelers === 1 ? "passenger" : "passengers"}
          </span>
          <span className="search-item">{travelClass}</span>
          <span className="search-item">{fare}</span>
          <button type="button" onClick={() => navigate("/dashboard/customer")}>
            Modify Search
          </button>
        </section>

        <div className="results-layout">
          <aside className="filters-panel">
            <div className="panel-heading">
              <h2>Filters</h2>
              <button type="button" onClick={resetFilters}>
                Reset
              </button>
            </div>

            <div className="filter-section">
              <div className="section-heading">
                <span>Price Range</span>
                <span>^</span>
              </div>

              <div className="price-labels">
                <span>Rs. {minPrice.toLocaleString("en-IN")}</span>
                <span>to</span>
                <span>Rs. {maxPrice.toLocaleString("en-IN")}</span>
              </div>

              <input
                type="range"
                min="1000"
                max="20000"
                step="500"
                value={minPrice}
                onChange={(event) => setMinPrice(Number(event.target.value))}
              />
              <input
                type="range"
                min="1000"
                max="20000"
                step="500"
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
              />

              <div className="price-inputs">
                <label>
                  Min (Rs)
                  <input
                    value={minPrice}
                    onChange={(event) => setMinPrice(Number(event.target.value) || 1000)}
                  />
                </label>
                <label>
                  Max (Rs)
                  <input
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(Number(event.target.value) || 20000)}
                  />
                </label>
              </div>
            </div>

            <div className="filter-section">
              <div className="section-heading">
                <span>Airlines</span>
                <span>^</span>
              </div>

              {airlineOptions.map((airline) => (
                <label className="filter-row" key={airline.name}>
                  <input
                    type="checkbox"
                    checked={selectedAirlines.includes(airline.name)}
                    onChange={() => toggleAirline(airline.name)}
                  />
                  <img src={airline.image} alt={airline.name} />
                  <span>{airline.name}</span>
                </label>
              ))}
            </div>

            <div className="filter-section">
              <div className="section-heading">
                <span>Departure Time</span>
                <span>^</span>
              </div>

              {timeBuckets.map((bucket) => (
                <label
                  className={selectedTimeBucket === bucket.id ? "time-option active" : "time-option"}
                  key={bucket.id}
                >
                  <input
                    type="radio"
                    name="departureBucket"
                    checked={selectedTimeBucket === bucket.id}
                    onChange={() => setSelectedTimeBucket(bucket.id)}
                  />
                  <span>
                    {bucket.label}
                    <small>{bucket.sublabel}</small>
                  </span>
                </label>
              ))}
            </div>
          </aside>

          <section>
            <div className="toolbar">
              <div>
                <h1>{filteredFlights.length} flights found</h1>
                <p>
                  {tripType === "round" ? "Round trip" : "One way"} - sorted to help you compare timing,
                  airline, and fare quality
                </p>
              </div>

              <div className="sort-actions">
                <span>Sort by:</span>
                {[
                  ["price", "Price"],
                  ["duration", "Duration"],
                  ["departure", "Departure"],
                  ["arrival", "Arrival"],
                  ["airline", "Airline"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={sortBy === id ? "sort-button active" : "sort-button"}
                    onClick={() => setSortBy(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="empty-panel">
                <div className="empty-icon">...</div>
                <h2>Loading flights</h2>
                <p>We are fetching the latest schedules for your selected route.</p>
              </div>
            ) : errorMessage ? (
              <div className="empty-panel">
                <div className="empty-icon">!</div>
                <h2>Unable to load flights</h2>
                <p>{errorMessage}</p>
                <div className="empty-actions">
                  <button type="button" className="empty-primary" onClick={() => window.location.reload()}>
                    Retry
                  </button>
                  <button type="button" className="empty-secondary" onClick={() => navigate("/dashboard/customer")}>
                    Modify Search
                  </button>
                </div>
              </div>
            ) : filteredFlights.length === 0 ? (
              <div className="empty-panel">
                <div className="empty-icon">Q</div>
                <h2>No flights found</h2>
                <p>
                  We could not find flights matching your current filters. Try clearing filters or adjusting
                  your search dates to see more options.
                </p>
                <div className="empty-actions">
                  <button type="button" className="empty-primary" onClick={resetFilters}>
                    Clear All Filters
                  </button>
                  <button type="button" className="empty-secondary" onClick={() => navigate("/dashboard/customer")}>
                    Modify Search
                  </button>
                </div>
              </div>
            ) : (
              <div className="flight-list">
                {filteredFlights.map((flight) => (
                  <article className="flight-card" key={flight.id}>
                    <header className="flight-card-header">
                      <div className="airline-info">
                        <img src={flight.image} alt={flight.airline} />
                        <div>
                          <h2>{flight.airline}</h2>
                          <p>
                            {flight.code} - {flight.cabin} - {flight.aircraft}
                          </p>
                        </div>
                      </div>

                      <div className="badges">
                        {(flight.tags || []).map((tag, index) => (
                          <span
                            key={tag}
                            className={`badge ${index === 0 ? "green" : index === 1 ? "purple" : "blue"}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </header>

                    <div className="flight-main">
                      <div className="airport-side">
                        <strong>{flight.depart}</strong>
                        <span>{flight.from}</span>
                        <p>{flight.fromAirport}</p>
                        <small>{formatRouteDate(departureDate)}</small>
                      </div>

                      <div className="timeline">
                        <span>{flight.durationLabel}</span>
                        <div className="timeline-line">
                          <i />
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedFlightId((current) => (current === flight.id ? null : flight.id))
                            }
                          >
                            i
                          </button>
                          <i />
                        </div>
                        <small>Non-stop</small>
                      </div>

                      <div className="airport-side arrival">
                        <strong>{flight.arrive}</strong>
                        <span>{flight.to}</span>
                        <p>{flight.toAirport}</p>
                        <small>{formatRouteDate(departureDate)}</small>
                      </div>
                    </div>

                    <footer className="flight-card-footer">
                      <div className="fare-block">
                        <div className="fare">
                          <strong>Rs. {Number(flight.price).toLocaleString("en-IN")}</strong>
                          <del>Rs. {Number(flight.oldPrice || flight.price).toLocaleString("en-IN")}</del>
                          <span>per person</span>
                          <small>{fare} {travelClass}</small>
                        </div>
                      </div>

                      <div className="seats-box">
                        <strong>{flight.seats}</strong>
                        <span>seats available</span>
                      </div>

                      <div className="card-actions">
                        <button
                          className="details-button"
                          type="button"
                          onClick={() =>
                            setExpandedFlightId((current) => (current === flight.id ? null : flight.id))
                          }
                        >
                          Details
                        </button>
                        <button className="select-button" type="button" onClick={() => openSeatFlow(flight)}>
                          Select Flight
                        </button>
                      </div>
                    </footer>

                    {expandedFlightId === flight.id ? (
                      <div className="flight-extra">
                        <div>
                          <strong>Route</strong>
                          <span>{flight.fromAirport} to {flight.toAirport}</span>
                        </div>
                        <div>
                          <strong>Cabin</strong>
                          <span>{flight.cabin}</span>
                        </div>
                        <div>
                          <strong>Aircraft</strong>
                          <span>{flight.aircraft}</span>
                        </div>
                        <div>
                          <strong>Search Fare</strong>
                          <span>{fare} - {travelClass}</span>
                        </div>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

const styles = `
  .flight-results-page {
    min-height: 100vh;
    background:
      linear-gradient(180deg, #17206f 0 320px, transparent 320px),
      #f6f8fc;
    color: #111827;
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  }

  .flight-results-page.dark {
    background:
      linear-gradient(180deg, #020617 0 320px, transparent 320px),
      #0f172a;
    color: #f8fafc;
  }

  button {
    font: inherit;
  }

  .top-nav {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 0 max(22px, calc((100vw - 1220px) / 2));
    background: #ffffff;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .flight-results-page.dark .top-nav,
  .flight-results-page.dark .search-strip,
  .flight-results-page.dark .toolbar,
  .flight-results-page.dark .filters-panel,
  .flight-results-page.dark .flight-card,
  .flight-results-page.dark .empty-panel {
    background: rgba(15, 23, 42, 0.96);
    color: #f8fafc;
    border-color: rgba(148, 163, 184, 0.2);
  }

  .flight-results-page.dark .brand-button,
  .flight-results-page.dark .nav-center button,
  .flight-results-page.dark .theme-toggle,
  .flight-results-page.dark .search-strip button,
  .flight-results-page.dark .panel-heading button,
  .flight-results-page.dark .sort-button,
  .flight-results-page.dark .details-button,
  .flight-results-page.dark .empty-secondary,
  .flight-results-page.dark .airport-side span,
  .flight-results-page.dark .airline-info p,
  .flight-results-page.dark .airport-side p,
  .flight-results-page.dark .airport-side small,
  .flight-results-page.dark .timeline,
  .flight-results-page.dark .toolbar p,
  .flight-results-page.dark .search-item,
  .flight-results-page.dark .filter-row,
  .flight-results-page.dark .time-option {
    color: #e2e8f0;
  }

  .flight-results-page.dark .theme-toggle,
  .flight-results-page.dark .details-button,
  .flight-results-page.dark .empty-secondary {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.2);
  }

  .brand-button,
  .nav-center button,
  .theme-toggle,
  .search-strip button,
  .panel-heading button,
  .sort-button,
  .details-button,
  .select-button,
  .empty-primary,
  .empty-secondary {
    cursor: pointer;
  }

  .brand-button {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 0;
    background: transparent;
    color: #111827;
    font-size: 18px;
    font-weight: 800;
  }

  .brand-mark {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: #7048e8;
    display: grid;
    place-items: center;
    color: white;
  }

  .nav-center {
    display: flex;
    align-items: center;
    gap: 42px;
  }

  .nav-center button {
    border: 0;
    background: transparent;
    color: #111827;
    font-size: 14px;
    font-weight: 700;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .theme-toggle {
    border: 1px solid #e6e9f2;
    background: #ffffff;
    border-radius: 8px;
    padding: 9px 18px;
    color: #111827;
    font-size: 13px;
    font-weight: 700;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #f1f2f6;
    color: #4b5563;
    display: grid;
    place-items: center;
    font-size: 13px;
    font-weight: 800;
  }

  .page-shell {
    max-width: 1220px;
    margin: 0 auto;
    padding: 24px 22px 48px;
  }

  .search-strip,
  .toolbar,
  .filters-panel,
  .flight-card,
  .empty-panel {
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid #e6e9f2;
    border-radius: 12px;
    box-shadow: 0 18px 36px rgba(25, 35, 90, 0.08);
  }

  .search-strip {
    min-height: 58px;
    display: flex;
    align-items: center;
    gap: 22px;
    padding: 0 22px;
    margin-bottom: 14px;
  }

  .search-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #4b5563;
    font-size: 14px;
    font-weight: 700;
    white-space: nowrap;
  }

  .search-item.strong {
    color: #111827;
    font-size: 16px;
  }

  .pin-icon {
    color: #7048e8;
    font-size: 18px;
  }

  .search-strip button {
    margin-left: auto;
    border: 1px solid #ddd6fe;
    background: #f4f0ff;
    color: #5b32d6;
    border-radius: 8px;
    padding: 9px 13px;
    font-weight: 800;
  }

  .results-layout {
    display: grid;
    grid-template-columns: 288px minmax(0, 1fr);
    gap: 22px;
    align-items: start;
  }

  .filters-panel {
    overflow: hidden;
  }

  .panel-heading {
    min-height: 58px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 18px;
    border-bottom: 1px solid #edf0f6;
  }

  .panel-heading h2,
  .toolbar h1 {
    margin: 0;
    font-size: 18px;
  }

  .panel-heading button {
    border: 0;
    background: transparent;
    color: #6b7280;
    font-size: 13px;
    font-weight: 700;
  }

  .filter-section {
    padding: 18px;
    border-bottom: 1px solid #edf0f6;
  }

  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    color: #202437;
    font-size: 14px;
    font-weight: 800;
  }

  .price-labels {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 10px;
    align-items: center;
    color: #7048e8;
    font-size: 12px;
    font-weight: 800;
    margin-bottom: 8px;
  }

  .price-labels span:nth-child(2) {
    color: #6b7280;
  }

  input[type="range"] {
    width: 100%;
    accent-color: #7048e8;
  }

  .price-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 12px;
  }

  .price-inputs label {
    color: #4b5563;
    font-size: 12px;
    font-weight: 700;
  }

  .price-inputs input {
    width: 100%;
    box-sizing: border-box;
    margin-top: 5px;
    border: 1px solid #e4e7ef;
    border-radius: 6px;
    padding: 8px;
    color: #111827;
    font-weight: 700;
  }

  .filter-row,
  .time-option {
    display: flex;
    align-items: center;
    gap: 11px;
    color: #374151;
    font-size: 13px;
    font-weight: 700;
    margin-top: 14px;
    cursor: pointer;
  }

  .filter-row input,
  .time-option input {
    accent-color: #7048e8;
  }

  .filter-row img {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #e5e7eb;
  }

  .time-option {
    padding: 12px 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    margin-top: 8px;
  }

  .time-option.active {
    border-color: #d8ccff;
    background: #f4f0ff;
  }

  .time-option span {
    display: flex;
    flex-direction: column;
  }

  .time-option small {
    color: #6b7280;
    font-size: 12px;
    margin-top: 2px;
  }

  .toolbar {
    min-height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 0 18px;
    margin-bottom: 16px;
  }

  .toolbar p {
    margin: 6px 0 0;
    color: #6b7280;
    font-size: 13px;
    font-weight: 700;
  }

  .sort-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }

  .sort-actions > span {
    color: #2f3446;
    font-size: 13px;
    font-weight: 800;
  }

  .sort-button {
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #5b6172;
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 800;
  }

  .sort-button.active {
    background: #7048e8;
    color: #ffffff;
  }

  .flight-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .flight-card {
    overflow: hidden;
  }

  .flight-card-header {
    min-height: 78px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 0 22px;
    border-bottom: 1px solid #edf0f6;
  }

  .airline-info {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .airline-info img {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #ede9fe;
  }

  .airline-info h2 {
    margin: 0 0 5px;
    font-size: 20px;
  }

  .airline-info p {
    margin: 0;
    color: #6b7280;
    font-size: 13px;
    font-weight: 800;
  }

  .badges {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .badge {
    border-radius: 8px;
    padding: 6px 14px;
    color: #ffffff;
    font-size: 12px;
    font-weight: 900;
  }

  .badge.green {
    background: #16b979;
  }

  .badge.purple {
    background: #7048e8;
  }

  .badge.blue {
    background: #5961e8;
  }

  .flight-main {
    display: grid;
    grid-template-columns: minmax(190px, 1fr) minmax(220px, 1.2fr) minmax(190px, 1fr);
    gap: 26px;
    align-items: center;
    padding: 24px 22px 22px;
  }

  .airport-side strong {
    display: block;
    font-size: 32px;
    line-height: 1;
    margin-bottom: 12px;
  }

  .airport-side span {
    display: block;
    color: #22283a;
    font-size: 14px;
    font-weight: 900;
    margin-bottom: 8px;
  }

  .airport-side p {
    min-height: 38px;
    margin: 0 0 8px;
    color: #444a5e;
    font-size: 13px;
    line-height: 1.45;
    font-weight: 700;
  }

  .airport-side small {
    color: #6b7280;
    font-size: 13px;
    font-weight: 700;
  }

  .arrival {
    text-align: right;
  }

  .timeline {
    text-align: center;
    color: #6b7280;
    font-size: 13px;
    font-weight: 800;
  }

  .timeline-line {
    display: grid;
    grid-template-columns: 1fr 38px 1fr;
    align-items: center;
    margin-top: 8px;
  }

  .timeline-line i {
    height: 4px;
    background: #7048e8;
    position: relative;
  }

  .timeline-line i::before,
  .timeline-line i::after {
    content: "";
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #7048e8;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  .timeline-line i:first-child::before {
    left: -2px;
  }

  .timeline-line i:last-child::after {
    right: -2px;
  }

  .timeline-line button {
    width: 38px;
    height: 38px;
    border: 2px solid #d7ccff;
    background: #ffffff;
    border-radius: 50%;
    display: grid;
    place-items: center;
    z-index: 2;
  }

  .flight-card-footer {
    display: grid;
    grid-template-columns: 1fr 130px 240px;
    align-items: center;
    gap: 22px;
    padding: 22px;
    background: #fbfcff;
    border-top: 1px solid #edf0f6;
  }

  .flight-extra {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    padding: 0 22px 22px;
    border-top: 1px solid #edf0f6;
    background: #ffffff;
  }

  .flight-results-page.dark .flight-extra {
    background: rgba(15, 23, 42, 0.96);
    border-color: rgba(148, 163, 184, 0.2);
  }

  .flight-extra strong {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
  }

  .flight-extra span {
    color: #64748b;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
  }

  .flight-results-page.dark .flight-extra span {
    color: #cbd5e1;
  }

  .fare {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }

  .fare strong {
    color: #5b32d6;
    font-size: 28px;
  }

  .fare del {
    color: #8b92a3;
    font-size: 16px;
    font-weight: 800;
  }

  .fare span {
    width: 100%;
    color: #4b5563;
    font-size: 13px;
    font-weight: 700;
  }

  .fare small {
    border-radius: 6px;
    background: #f3f4f6;
    color: #111827;
    padding: 5px 9px;
    font-size: 12px;
    font-weight: 800;
  }

  .seats-box {
    border: 1px solid #e1e6f0;
    border-radius: 8px;
    background: #ffffff;
    padding: 11px 10px;
    text-align: center;
  }

  .seats-box strong {
    display: block;
    color: #7048e8;
    font-size: 24px;
  }

  .seats-box span {
    color: #6b7280;
    font-size: 12px;
    font-weight: 700;
  }

  .card-actions {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 12px;
  }

  .details-button,
  .select-button,
  .empty-primary,
  .empty-secondary {
    border-radius: 8px;
    padding: 13px 16px;
    font-size: 13px;
    font-weight: 900;
  }

  .details-button,
  .empty-secondary {
    border: 1px solid #dfe4ed;
    background: #ffffff;
    color: #111827;
  }

  .select-button,
  .empty-primary {
    border: 0;
    background: #5b32d6;
    color: #ffffff;
  }

  .empty-panel {
    padding: 60px 40px;
    text-align: center;
  }

  .empty-icon {
    width: 92px;
    height: 92px;
    border-radius: 50%;
    background: #f8fafc;
    color: #334155;
    display: grid;
    place-items: center;
    font-size: 44px;
    margin: 0 auto 20px;
  }

  .empty-panel h2 {
    margin: 0 0 12px;
    font-size: 36px;
  }

  .empty-panel p {
    max-width: 620px;
    margin: 0 auto;
    color: #64748b;
    line-height: 1.6;
    font-weight: 700;
  }

  .empty-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 24px;
  }

  @media (max-width: 980px) {
    .nav-center {
      display: none;
    }

    .results-layout {
      grid-template-columns: 1fr;
    }

    .toolbar,
    .flight-card-header,
    .search-strip {
      align-items: flex-start;
      flex-direction: column;
      padding: 18px;
    }

    .search-strip button {
      margin-left: 0;
    }

    .flight-main,
    .flight-card-footer,
    .flight-extra {
      grid-template-columns: 1fr;
    }

    .arrival {
      text-align: left;
    }

    .timeline {
      text-align: left;
    }

    .card-actions {
      max-width: 300px;
    }
  }

  @media (max-width: 620px) {
    .top-nav {
      height: auto;
      padding: 12px 14px;
    }

    .theme-toggle {
      display: none;
    }

    .page-shell {
      padding: 16px 12px 32px;
    }

    .search-strip {
      gap: 12px;
    }

    .sort-actions {
      justify-content: flex-start;
    }

    .badges {
      justify-content: flex-start;
    }

    .airport-side strong {
      font-size: 28px;
    }

    .fare strong {
      font-size: 24px;
    }

    .card-actions {
      grid-template-columns: 1fr;
      max-width: none;
    }
  }
`;

export default FlightResults;
