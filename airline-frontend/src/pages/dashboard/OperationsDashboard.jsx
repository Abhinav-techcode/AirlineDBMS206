import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../utils/api";
import { downloadBookingTicket, requestBookingConfirmationEmail } from "../../utils/bookingActions";
import { clearSession, getCurrentUser } from "../../utils/session";

const tabs = [
  ["overview", "Overview"],
  ["flights", "Flights"],
  ["schedules", "Schedules"],
  ["bookings", "Bookings"],
];

const formatMoney = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDateTime = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const passengerLabel = (passenger, index) =>
  passenger?.name ||
  [passenger?.title, passenger?.firstName, passenger?.lastName].filter(Boolean).join(" ") ||
  `Passenger ${index + 1}`;

const buildBookingsCsv = (bookings) => {
  const rows = [
    ["Booking Ref", "Flight", "Route", "Status", "Payment", "Amount", "Booked Date", "Passengers"],
    ...bookings.map((booking) => [
      booking.booking_ref || booking.booking_id,
      booking.flight_number || "",
      booking.route || "",
      booking.booking_status || "",
      booking.payment_status || "",
      Number(booking.amount || 0),
      booking.booked_date || "",
      (booking.passengers || []).map((passenger, index) => passengerLabel(passenger, index)).join(" | "),
    ]),
  ];

  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
};

const saveTextFile = (filename, content, mimeType = "text/plain;charset=utf-8") => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const OperationsDashboard = ({ mode = "admin" }) => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState({
    metrics: {},
    flights: [],
    schedules: [],
    bookings: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedFlightNumber, setSelectedFlightNumber] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatus, setBookingStatus] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [emailingBookingId, setEmailingBookingId] = useState(null);
  const [downloadingBookingId, setDownloadingBookingId] = useState(null);

  const roleLabel = mode === "airline" ? "Airline Operations" : "Admin Console";

  const loadDashboard = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await apiRequest("/admin/dashboard");
      setDashboard({
        metrics: response?.metrics || {},
        flights: Array.isArray(response?.flights) ? response.flights : [],
        schedules: Array.isArray(response?.schedules) ? response.schedules : [],
        bookings: Array.isArray(response?.bookings) ? response.bookings : [],
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredSchedules = useMemo(() => {
    return dashboard.schedules.filter((schedule) => {
      if (!selectedFlightNumber) {
        return true;
      }

      return schedule.flight_number === selectedFlightNumber;
    });
  }, [dashboard.schedules, selectedFlightNumber]);

  const filteredBookings = useMemo(() => {
    return dashboard.bookings.filter((booking) => {
      const searchBlob = [
        booking.booking_ref,
        booking.flight_number,
        booking.route,
        ...(booking.passengers || []).map((passenger) => passenger.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchBlob.includes(bookingSearch.toLowerCase());
      const matchesStatus =
        bookingStatus === "ALL" || String(booking.booking_status || "").toUpperCase() === bookingStatus;

      return matchesSearch && matchesStatus;
    });
  }, [bookingSearch, bookingStatus, dashboard.bookings]);

  const openFlightSchedules = (flightNumber) => {
    setSelectedFlightNumber(flightNumber);
    setActiveTab("schedules");
    setStatusMessage(`Showing schedules for ${flightNumber}.`);
  };

  const openFlightBookings = (flightNumber) => {
    setBookingSearch(flightNumber);
    setActiveTab("bookings");
    setStatusMessage(`Showing bookings related to ${flightNumber}.`);
  };

  const exportBookings = () => {
    const csv = buildBookingsCsv(filteredBookings);
    saveTextFile("zoshair-bookings.csv", csv, "text/csv;charset=utf-8");
    setStatusMessage(`Exported ${filteredBookings.length} booking row(s).`);
  };

  const resendEmail = async (booking) => {
    setEmailingBookingId(booking.booking_id);
    setStatusMessage("");

    try {
      const response = await requestBookingConfirmationEmail(booking, booking?.contact?.email);
      const emailResult = response?.email || {};

      if (emailResult.skipped) {
        setStatusMessage(emailResult.reason || "Email delivery is configured to skip sending right now.");
      } else if (emailResult.success === false) {
        setStatusMessage(emailResult.message || "Unable to send booking email.");
      } else {
        setStatusMessage("Booking confirmation email sent with the PDF ticket attached.");
      }
    } catch (error) {
      setStatusMessage(error.message || "Unable to send booking email.");
    } finally {
      setEmailingBookingId(null);
    }
  };

  const handleDownloadTicket = async (booking) => {
    setDownloadingBookingId(booking.booking_id);
    setStatusMessage("");

    try {
      const filename = await downloadBookingTicket(booking);
      setStatusMessage(`${filename} downloaded successfully.`);
    } catch (error) {
      setStatusMessage(error.message || "Unable to download the ticket PDF.");
    } finally {
      setDownloadingBookingId(null);
    }
  };

  const handleSignOut = () => {
    clearSession();
    navigate("/");
  };

  const metrics = [
    ["Total Flights", dashboard.metrics.total_flights || 0],
    ["Schedules", dashboard.metrics.total_schedules || 0],
    ["Bookings", dashboard.metrics.total_bookings || 0],
    ["Revenue", formatMoney(dashboard.metrics.total_revenue || 0)],
  ];

  return (
    <div className="ops-page">
      <style>{styles}</style>

      <nav className="ops-nav">
        <button type="button" className="brand" onClick={() => setActiveTab("overview")}>
          <span>ZA</span>
          <div>
            <strong>{roleLabel}</strong>
            <small>Database-backed dashboard</small>
          </div>
        </button>

        <div className="nav-actions">
          <button type="button" onClick={() => navigate("/dashboard/customer")}>
            Customer View
          </button>
          <button type="button" onClick={loadDashboard}>
            Refresh
          </button>
          <button type="button" onClick={handleSignOut}>
            Sign Out
          </button>
          <div className="avatar">
            {currentUser?.name ? String(currentUser.name).slice(0, 2).toUpperCase() : "AD"}
          </div>
        </div>
      </nav>

      <main className="ops-shell">
        <section className="hero-card">
          <div>
            <p>{mode === "airline" ? "Airline workspace" : "Admin workspace"}</p>
            <h1>{roleLabel}</h1>
            <span>Live flights, schedules, bookings, and revenue pulled from the backend database.</span>
          </div>

          <div className="metric-grid">
            {metrics.map(([label, value]) => (
              <div key={label} className="metric-card">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="tab-row">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={activeTab === id ? "active" : ""}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {statusMessage ? <div className="status-banner success">{statusMessage}</div> : null}
        {errorMessage ? <div className="status-banner error">{errorMessage}</div> : null}
        {loading ? <div className="panel">Loading dashboard data...</div> : null}

        {!loading && activeTab === "overview" ? (
          <div className="panel-stack">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Flights Overview</h2>
                  <p>Quick access into schedules and active bookings per route.</p>
                </div>
              </div>

              <div className="card-grid">
                {dashboard.flights.map((flight) => (
                  <article key={flight.flight_id} className="info-card">
                    <div className="route-pill">{flight.flight_number}</div>
                    <h3>{flight.route}</h3>
                    <p>{flight.source_city} to {flight.destination_city}</p>
                    <div className="info-list">
                      <span>Duration: {flight.duration_label}</span>
                      <span>Schedules: {flight.schedules_count}</span>
                      <span>Starting Fare: {formatMoney(flight.starting_price)}</span>
                    </div>
                    <div className="action-row">
                      <button type="button" onClick={() => openFlightSchedules(flight.flight_number)}>
                        View Schedules
                      </button>
                      <button type="button" onClick={() => openFlightBookings(flight.flight_number)}>
                        View Bookings
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Recent Bookings</h2>
                  <p>The latest confirmed and pending orders from the database.</p>
                </div>
                <button type="button" className="secondary" onClick={() => setActiveTab("bookings")}>
                  Open Bookings
                </button>
              </div>

              <div className="table-wrap">
                <div className="table-head bookings">
                  <div>Reference</div>
                  <div>Flight</div>
                  <div>Passenger</div>
                  <div>Status</div>
                  <div>Amount</div>
                  <div>Action</div>
                </div>

                {dashboard.bookings.slice(0, 6).map((booking) => (
                  <div key={booking.booking_id} className="table-row bookings">
                    <div>{booking.booking_ref || booking.booking_id}</div>
                    <div>{booking.flight_number}</div>
                    <div>{passengerLabel(booking.passengers?.[0], 0)}</div>
                    <div>{booking.booking_status}</div>
                    <div>{formatMoney(booking.amount)}</div>
                    <div>
                      <button type="button" className="text-button" onClick={() => setSelectedBooking(booking)}>
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {!loading && activeTab === "flights" ? (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Flights</h2>
                <p>Live route catalog returned by the backend.</p>
              </div>
            </div>

            <div className="card-grid">
              {dashboard.flights.map((flight) => (
                <article key={flight.flight_id} className="info-card">
                  <div className="route-pill">{flight.flight_number}</div>
                  <h3>{flight.source_code} - {flight.destination_code}</h3>
                  <p>{flight.source_airport} to {flight.destination_airport}</p>
                  <div className="info-list">
                    <span>Duration: {flight.duration_label}</span>
                    <span>Next Departure: {formatDateTime(flight.next_departure)}</span>
                    <span>Active Schedules: {flight.active_schedules}</span>
                  </div>
                  <div className="action-row">
                    <button type="button" onClick={() => openFlightSchedules(flight.flight_number)}>
                      View Schedules
                    </button>
                    <button type="button" onClick={() => openFlightBookings(flight.flight_number)}>
                      View Bookings
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && activeTab === "schedules" ? (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Schedules</h2>
                <p>Flight instances and pricing pulled from the database.</p>
              </div>

              <div className="action-row">
                {selectedFlightNumber ? (
                  <button type="button" className="secondary" onClick={() => setSelectedFlightNumber("")}>
                    Clear Filter
                  </button>
                ) : null}
                <button type="button" className="secondary" onClick={loadDashboard}>
                  Refresh List
                </button>
              </div>
            </div>

            <div className="table-wrap">
              <div className="table-head schedules">
                <div>Flight</div>
                <div>Route</div>
                <div>Date</div>
                <div>Time</div>
                <div>Price</div>
                <div>Status</div>
                <div>Booked</div>
              </div>

              {filteredSchedules.map((schedule) => (
                <div key={schedule.schedule_id} className="table-row schedules">
                  <div>{schedule.flight_number}</div>
                  <div>{schedule.route}</div>
                  <div>{formatDate(schedule.departure_date)}</div>
                  <div>
                    {schedule.departure_time || "TBD"} - {schedule.arrival_time || "TBD"}
                  </div>
                  <div>{formatMoney(schedule.price)}</div>
                  <div>{schedule.status}</div>
                  <div>{schedule.booked_count}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && activeTab === "bookings" ? (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Bookings</h2>
                <p>Search, inspect, export, and resend confirmations from the real booking table.</p>
              </div>

              <div className="action-row">
                <button type="button" className="secondary" onClick={exportBookings}>
                  Export CSV
                </button>
                <button type="button" className="secondary" onClick={loadDashboard}>
                  Refresh
                </button>
              </div>
            </div>

            <div className="filter-row">
              <input
                value={bookingSearch}
                onChange={(event) => setBookingSearch(event.target.value)}
                placeholder="Search by ref, flight, route, or passenger"
              />

              <div className="status-tabs">
                {["ALL", "CONFIRMED", "PENDING", "CANCELLED"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={bookingStatus === status ? "active" : ""}
                    onClick={() => setBookingStatus(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-wrap">
              <div className="table-head bookings-full">
                <div>Reference</div>
                <div>Flight</div>
                <div>Route</div>
                <div>Passengers</div>
                <div>Payment</div>
                <div>Amount</div>
                <div>Booked</div>
                <div>Actions</div>
              </div>

              {filteredBookings.map((booking) => (
                <div key={booking.booking_id} className="table-row bookings-full">
                  <div>{booking.booking_ref || booking.booking_id}</div>
                  <div>{booking.flight_number}</div>
                  <div>{booking.route}</div>
                  <div>{booking.passengers?.length || 0}</div>
                  <div>{booking.payment_status}</div>
                  <div>{formatMoney(booking.amount)}</div>
                  <div>{formatDate(booking.booked_date)}</div>
                  <div className="inline-actions">
                    <button type="button" className="text-button" onClick={() => setSelectedBooking(booking)}>
                      View
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => handleDownloadTicket(booking)}
                      disabled={downloadingBookingId === booking.booking_id}
                    >
                      {downloadingBookingId === booking.booking_id ? "Preparing..." : "PDF Ticket"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      {selectedBooking ? (
        <div className="modal-backdrop" onClick={() => setSelectedBooking(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-head">
              <div>
                <h2>Booking {selectedBooking.booking_ref || selectedBooking.booking_id}</h2>
                <p>{selectedBooking.route}</p>
              </div>
              <button type="button" className="secondary" onClick={() => setSelectedBooking(null)}>
                Close
              </button>
            </div>

            <div className="modal-grid">
              <div>
                <strong>Flight</strong>
                <p>{selectedBooking.flight_number}</p>
              </div>
              <div>
                <strong>Travel Date</strong>
                <p>{formatDate(selectedBooking.departure_date)}</p>
              </div>
              <div>
                <strong>Payment</strong>
                <p>{selectedBooking.payment_status}</p>
              </div>
              <div>
                <strong>Amount</strong>
                <p>{formatMoney(selectedBooking.amount)}</p>
              </div>
            </div>

            <div className="detail-block">
              <strong>Passengers</strong>
              {(selectedBooking.passengers || []).map((passenger, index) => (
                <p key={`${passengerLabel(passenger, index)}-${index}`}>
                  {passengerLabel(passenger, index)} - Seat{" "}
                  {selectedBooking.seats?.[index]?.seatNumber || selectedBooking.seats?.[index]?.seat_no || "Pending"}
                </p>
              ))}
            </div>

            <div className="detail-block">
              <strong>Contact Email</strong>
              <p>{selectedBooking.contact?.email || "No email returned from backend"}</p>
            </div>

            <div className="action-row">
              <button
                type="button"
                onClick={() => handleDownloadTicket(selectedBooking)}
                disabled={downloadingBookingId === selectedBooking.booking_id}
              >
                {downloadingBookingId === selectedBooking.booking_id ? "Preparing PDF..." : "Download PDF Ticket"}
              </button>
              <button
                type="button"
                onClick={() => resendEmail(selectedBooking)}
                disabled={emailingBookingId === selectedBooking.booking_id}
              >
                {emailingBookingId === selectedBooking.booking_id ? "Sending..." : "Resend Email"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const styles = `
  .ops-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 28%),
      linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
    color: #111827;
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  }

  button,
  input {
    font: inherit;
  }

  button {
    cursor: pointer;
  }

  .ops-nav {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
    padding: 14px 24px;
    border-bottom: 1px solid #e2e8f0;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(14px);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 14px;
    border: none;
    background: transparent;
    text-align: left;
  }

  .brand span {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #1d4ed8, #7c3aed);
    color: #ffffff;
    font-weight: 900;
  }

  .brand strong,
  .metric-card strong,
  .info-card h3,
  .panel h2 {
    display: block;
  }

  .brand small,
  .hero-card span,
  .panel p,
  .info-card p,
  .info-list span {
    color: #64748b;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .nav-actions button,
  .action-row button,
  .tab-row button,
  .status-tabs button,
  .secondary {
    border: 1px solid #dbe3ef;
    background: #ffffff;
    border-radius: 12px;
    padding: 10px 14px;
    color: #111827;
    font-weight: 800;
  }

  .avatar {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: #e2e8f0;
    font-size: 13px;
    font-weight: 900;
  }

  .ops-shell {
    max-width: 1240px;
    margin: 0 auto;
    padding: 26px 22px 48px;
  }

  .hero-card,
  .panel,
  .info-card,
  .metric-card,
  .modal-card {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid #e2e8f0;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
  }

  .hero-card {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 24px;
    padding: 26px;
    margin-bottom: 22px;
  }

  .hero-card p {
    margin: 0 0 8px;
    color: #4338ca;
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .hero-card h1 {
    margin: 0;
    font-size: 34px;
  }

  .hero-card span {
    display: block;
    margin-top: 12px;
    font-weight: 700;
    line-height: 1.6;
  }

  .metric-grid,
  .card-grid {
    display: grid;
    gap: 16px;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric-card {
    padding: 18px;
  }

  .metric-card strong {
    font-size: 28px;
  }

  .metric-card span {
    display: block;
    margin-top: 8px;
    font-weight: 700;
  }

  .tab-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  .tab-row button.active,
  .status-tabs button.active {
    background: #111827;
    color: #ffffff;
    border-color: #111827;
  }

  .status-banner {
    border-radius: 16px;
    padding: 14px 16px;
    margin-bottom: 16px;
    font-weight: 800;
  }

  .status-banner.success {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #047857;
  }

  .status-banner.error {
    background: #fff1f2;
    border: 1px solid #fecdd3;
    color: #be123c;
  }

  .panel-stack {
    display: grid;
    gap: 20px;
  }

  .panel {
    padding: 22px;
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 18px;
  }

  .panel-head h2 {
    margin: 0 0 6px;
    font-size: 24px;
  }

  .panel-head p {
    margin: 0;
    font-weight: 700;
    line-height: 1.5;
  }

  .card-grid {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }

  .info-card {
    padding: 18px;
  }

  .route-pill {
    display: inline-flex;
    align-items: center;
    padding: 7px 12px;
    border-radius: 999px;
    background: #eef2ff;
    color: #4338ca;
    font-size: 12px;
    font-weight: 900;
  }

  .info-card h3 {
    margin: 16px 0 8px;
    font-size: 22px;
  }

  .info-card p {
    margin: 0 0 14px;
    font-weight: 700;
    line-height: 1.5;
  }

  .info-list {
    display: grid;
    gap: 8px;
  }

  .info-list span {
    font-size: 14px;
    font-weight: 700;
  }

  .action-row,
  .inline-actions,
  .status-tabs {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .action-row {
    margin-top: 16px;
  }

  .table-wrap {
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    overflow: hidden;
  }

  .table-head,
  .table-row {
    display: grid;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
  }

  .table-head {
    background: #f8fafc;
    font-size: 13px;
    font-weight: 900;
    color: #475569;
  }

  .table-row {
    border-top: 1px solid #edf2f7;
    font-size: 14px;
    font-weight: 700;
  }

  .table-head.bookings,
  .table-row.bookings {
    grid-template-columns: 1.1fr 0.8fr 1fr 0.8fr 0.8fr 0.6fr;
  }

  .table-head.schedules,
  .table-row.schedules {
    grid-template-columns: 0.8fr 1fr 0.8fr 1fr 0.8fr 0.8fr 0.7fr;
  }

  .table-head.bookings-full,
  .table-row.bookings-full {
    grid-template-columns: 1fr 0.8fr 1fr 0.7fr 0.8fr 0.8fr 0.8fr 0.8fr;
  }

  .text-button {
    border: none;
    background: transparent;
    color: #1d4ed8;
    padding: 0;
    font-weight: 900;
  }

  .filter-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    margin-bottom: 18px;
  }

  .filter-row input {
    border: 1px solid #dbe3ef;
    border-radius: 14px;
    padding: 13px 14px;
    outline: none;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    display: grid;
    place-items: center;
    padding: 20px;
    z-index: 30;
  }

  .modal-card {
    width: min(760px, 100%);
    padding: 22px;
  }

  .modal-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 18px;
  }

  .modal-grid strong,
  .detail-block strong {
    display: block;
    margin-bottom: 8px;
  }

  .modal-grid p,
  .detail-block p {
    margin: 0 0 8px;
    color: #475569;
    font-weight: 700;
  }

  .detail-block {
    border-top: 1px solid #edf2f7;
    padding-top: 16px;
    margin-top: 16px;
  }

  @media (max-width: 960px) {
    .hero-card,
    .filter-row,
    .modal-grid {
      grid-template-columns: 1fr;
    }

    .table-head.bookings,
    .table-row.bookings,
    .table-head.schedules,
    .table-row.schedules,
    .table-head.bookings-full,
    .table-row.bookings-full {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .ops-nav,
    .panel-head {
      flex-direction: column;
      align-items: flex-start;
    }

    .ops-shell {
      padding: 18px 12px 32px;
    }
  }
`;

export default OperationsDashboard;
