import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../utils/api";
import {
  downloadBookingTicket,
  requestBookingConfirmationEmail,
} from "../../utils/bookingActions";
import {
  cacheBookings,
  getCachedBookings,
  getCurrentUser,
  getCurrentUserId,
  saveLastConfirmedBooking,
} from "../../utils/session";

const formatDateLabel = (value) => {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const MyBookings = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentUserId = getCurrentUserId();
  const [allBookings, setAllBookings] = useState(getCachedBookings());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [statusMessage, setStatusMessage] = useState("");
  const [emailingBookingId, setEmailingBookingId] = useState(null);
  const [downloadingBookingId, setDownloadingBookingId] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadBookings = async () => {
      if (!currentUserId) {
        setLoading(false);
        setErrorMessage("Please sign in to view your bookings.");
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const response = await apiRequest(`/bookings/${currentUserId}`);
        if (!ignore) {
          const bookings = Array.isArray(response?.bookings) ? response.bookings : [];
          setAllBookings(bookings);
          cacheBookings(bookings);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message || "Unable to load booking history.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      ignore = true;
    };
  }, [currentUserId]);

  const filteredBookings = useMemo(() => {
    const today = new Date();

    return allBookings.filter((booking) => {
      const bookingStatus = String(booking.booking_status || booking.status || "").toUpperCase();
      const departureDateValue = booking.departure_date || booking.flight?.departureDate;
      const departureDate = departureDateValue ? new Date(departureDateValue) : null;

      if (activeFilter === "UPCOMING") {
        return departureDate && !Number.isNaN(departureDate.getTime()) && departureDate >= today;
      }

      if (activeFilter === "PAST") {
        return departureDate && !Number.isNaN(departureDate.getTime()) && departureDate < today;
      }

      if (activeFilter === "CANCELLED") {
        return bookingStatus === "CANCELLED";
      }

      return true;
    });
  }, [activeFilter, allBookings]);

  const cityImage =
    "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=900&q=80";

  const displayName = (passenger, fallback) =>
    passenger?.name ||
    [passenger?.title, passenger?.firstName, passenger?.lastName]
      .filter(Boolean)
      .join(" ") ||
    fallback;

  const openBookingDetails = (booking) => {
    saveLastConfirmedBooking(booking);
    navigate("/booking-confirmed", {
      state: {
        booking,
      },
    });
  };

  const resendBookingEmail = async (booking) => {
    setEmailingBookingId(booking.booking_id);
    setStatusMessage("");

    try {
      const response = await requestBookingConfirmationEmail(booking, booking?.contact?.email);
      const emailResult = response?.email || {};

      if (emailResult.skipped) {
        setStatusMessage(emailResult.reason || "Email delivery is not configured yet.");
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

  return (
    <div className="bookings-page">
      <style>{styles}</style>

      <nav className="bookings-nav">
        <button className="brand" onClick={() => navigate("/dashboard/customer")}>
          <span>X</span>
          ZoshAir
        </button>
        <div>
          <button onClick={() => navigate("/dashboard/customer")}>Home</button>
          <button className="active">My Bookings</button>
        </div>
        <span className="avatar">
          {currentUser?.name ? String(currentUser.name).slice(0, 2).toUpperCase() : "RV"}
        </span>
      </nav>

      <main className="bookings-shell">
        <header className="page-heading">
          <div>
            <h1>My Bookings</h1>
            <p>Manage your flight bookings and travel history</p>
          </div>
          <img src={cityImage} alt="" />
        </header>

        <div className="tabs">
          <button className={activeFilter === "ALL" ? "active" : ""} onClick={() => setActiveFilter("ALL")}>
            All Bookings
          </button>
          <button className={activeFilter === "UPCOMING" ? "active" : ""} onClick={() => setActiveFilter("UPCOMING")}>
            Upcoming
          </button>
          <button className={activeFilter === "PAST" ? "active" : ""} onClick={() => setActiveFilter("PAST")}>
            Past
          </button>
          <button
            className={activeFilter === "CANCELLED" ? "active" : ""}
            onClick={() => setActiveFilter("CANCELLED")}
          >
            Cancelled
          </button>
        </div>

        {statusMessage ? <p className="status-banner">{statusMessage}</p> : null}

        {loading ? (
          <p style={{ padding: "20px" }}>Loading bookings...</p>
        ) : errorMessage ? (
          <p style={{ padding: "20px", color: "#be123c", fontWeight: 700 }}>{errorMessage}</p>
        ) : filteredBookings.length === 0 ? (
          <p style={{ padding: "20px" }}>No bookings yet.</p>
        ) : (
          filteredBookings.map((booking) => (
            <article className="booking-card" key={booking.id || booking.booking_id}>
              <section className="trip-hero">
                <div className="trip-title">
                  <span>X</span>
                  <div>
                    <h2>{`${booking.source_city || booking.flight?.from || "Origin"} - ${booking.destination_city || booking.flight?.to || "Destination"} (${booking.flight_number || booking.flight?.code || "Flight"})`}</h2>
                    <small>{booking.booking_ref || booking.booking_id}</small>
                  </div>
                </div>

                <strong className="confirmed-pill">
                  {booking.booking_status || booking.status || "CONFIRMED"}
                </strong>

                <div className="route-box">
                  <div>
                    <small>Departure</small>
                    <strong>{booking.departure_time || booking.flight?.departureTime || "TBD"}</strong>
                    <p>{booking.source_airport || booking.flight?.originName || "Departure airport pending"}</p>
                    <span>{formatDateLabel(booking.departure_date || booking.flight?.departureDate)}</span>
                  </div>

                  <div className="route-line">
                    <i />
                    <b>{booking.flight_number || booking.flight?.code || "Flight"}</b>
                  </div>

                  <div className="arrival">
                    <small>Arrival</small>
                    <strong>{booking.arrival_time || booking.flight?.arrivalTime || "TBD"}</strong>
                    <p>{booking.destination_airport || booking.flight?.destinationName || "Arrival airport pending"}</p>
                    <span>{formatDateLabel(booking.departure_date || booking.flight?.departureDate)}</span>
                  </div>
                </div>
              </section>

              <section className="booking-info-grid">
                <div>
                  <h3>Passengers</h3>
                  {booking.passengers?.map((passenger, index) => (
                    <div key={`${displayName(passenger, `Passenger ${index + 1}`)}-${index}`}>
                      <strong>{displayName(passenger, `Passenger ${index + 1}`)}</strong>
                      <p>{passenger?.gender || "Adult"}</p>
                    </div>
                  ))}
                  <b>Total: {booking.passengers?.length || 0} passenger(s)</b>
                </div>

                <div>
                  <h3>Contact</h3>
                  <strong>{booking.contact?.email || currentUser?.email || "Not provided"}</strong>
                  <p>
                    {booking.contact?.mobile
                      ? `${booking.contact?.countryCode || "+91"} ${booking.contact?.mobile}`
                      : "Contact details were not returned by the backend"}
                  </p>
                </div>

                <div>
                  <h3>Seats</h3>
                  {booking.seats?.map((seat, index) => (
                    <div key={`${seat?.seatNumber || seat?.seat_no || seat}-${index}`}>
                      <strong>{seat?.seatNumber || seat?.seat_no || seat}</strong>
                      <p>{index === 0 ? "Assigned" : "Assigned"}</p>
                    </div>
                  ))}
                </div>

                <div className="fare-card">
                  <h3>Fare</h3>
                  <strong>Rs. {Number(booking.amount || 0).toLocaleString("en-IN")}</strong>
                  <p>Booking Status: {booking.booking_status || "CONFIRMED"}</p>
                  <p>Payment Status: {booking.payment_status || "SUCCESS"}</p>
                  <span className="paid-pill">{booking.payment_status || "Paid"}</span>
                </div>
              </section>

              <footer className="booking-actions">
                <span>Booked on {formatDateLabel(booking.booked_date || booking.departure_date)}</span>
                <div>
                  <button
                    type="button"
                    onClick={() => handleDownloadTicket(booking)}
                    disabled={downloadingBookingId === booking.booking_id}
                  >
                    {downloadingBookingId === booking.booking_id ? "Preparing PDF..." : "View PDF Ticket"}
                  </button>
                  <button type="button" onClick={() => openBookingDetails(booking)}>
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => resendBookingEmail(booking)}
                    disabled={emailingBookingId === booking.booking_id}
                  >
                    {emailingBookingId === booking.booking_id ? "Sending..." : "Email Confirmation"}
                  </button>
                </div>
              </footer>
            </article>
          ))
        )}
      </main>
    </div>
  );
};

const styles = `
  .bookings-page {
    min-height: 100vh;
    background: #f6f8fc;
    color: #111827;
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  }

  button {
    font: inherit;
    cursor: pointer;
  }

  .bookings-nav {
    height: 64px;
    background: #ffffff;
    border-bottom: 1px solid #eceff5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    padding: 0 max(22px, calc((100vw - 1220px) / 2));
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .brand,
  .bookings-nav div button {
    border: 0;
    background: transparent;
    color: #111827;
    font-weight: 900;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
  }

  .brand span {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: #7048e8;
    color: #ffffff;
    display: grid;
    place-items: center;
  }

  .bookings-nav div {
    display: flex;
    gap: 18px;
  }

  .bookings-nav div button.active {
    background: #f3efff;
    color: #5b32d6;
    border-radius: 8px;
    padding: 10px 18px;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #f1f2f6;
    display: grid;
    place-items: center;
    font-weight: 900;
  }

  .bookings-shell {
    max-width: 1220px;
    margin: 0 auto;
    padding: 28px 22px 56px;
  }

  .page-heading {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 22px;
    align-items: center;
    border-radius: 8px;
    background: linear-gradient(135deg, #ffffff, #eef2ff);
    border: 1px solid #e6e9f2;
    padding: 22px;
    margin-bottom: 22px;
    box-shadow: 0 18px 36px rgba(25, 35, 90, 0.08);
  }

  .page-heading h1 {
    margin: 0 0 8px;
    font-size: 32px;
  }

  .page-heading p {
    margin: 0;
    color: #6b7280;
    font-weight: 700;
  }

  .page-heading img {
    width: 100%;
    height: 130px;
    object-fit: cover;
    border-radius: 8px;
  }

  .tabs {
    display: inline-flex;
    gap: 4px;
    background: #eef2f7;
    border-radius: 8px;
    padding: 5px;
    margin-bottom: 24px;
  }

  .tabs button {
    border: 0;
    border-radius: 8px;
    background: transparent;
    padding: 11px 18px;
    color: #4b5563;
    font-weight: 900;
  }

  .tabs button.active {
    background: #ffffff;
    color: #5b32d6;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  }

  .status-banner {
    margin: 0 0 18px;
    border-radius: 12px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
    padding: 12px 14px;
    font-weight: 800;
  }

  .booking-card {
    background: #ffffff;
    border: 1px solid #e6e9f2;
    border-radius: 8px;
    box-shadow: 0 18px 36px rgba(25, 35, 90, 0.08);
    overflow: hidden;
    margin-bottom: 20px;
  }

  .trip-hero {
    position: relative;
    color: #ffffff;
    padding: 24px;
    background: linear-gradient(135deg, #2563eb, #9333ea);
  }

  .trip-title {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
  }

  .trip-title > span {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.17);
    display: grid;
    place-items: center;
  }

  .trip-title h2 {
    margin: 0 0 6px;
    font-size: 24px;
  }

  .trip-title small {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    padding: 5px 12px;
    font-weight: 900;
  }

  .confirmed-pill,
  .pending-pill {
    position: absolute;
    right: 24px;
    top: 24px;
    border-radius: 999px;
    padding: 7px 14px;
    font-size: 12px;
  }

  .confirmed-pill {
    background: #dcfce7;
    color: #15803d;
  }

  .pending-pill {
    background: #fef3c7;
    color: #92400e;
  }

  .route-box {
    display: grid;
    grid-template-columns: 1fr 260px 1fr;
    gap: 28px;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 8px;
    padding: 20px;
  }

  .route-box small {
    display: block;
    text-transform: uppercase;
    opacity: 0.82;
    font-weight: 900;
  }

  .route-box strong {
    display: block;
    margin: 8px 0;
    font-size: 30px;
  }

  .route-box p {
    margin: 0 0 10px;
    max-width: 300px;
    font-size: 16px;
    font-weight: 900;
    line-height: 1.35;
  }

  .arrival {
    text-align: right;
  }

  .route-line {
    text-align: center;
  }

  .route-line i {
    display: block;
    height: 3px;
    background: rgba(255, 255, 255, 0.74);
    margin-bottom: 12px;
  }

  .route-line b {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    padding: 8px 16px;
  }

  .booking-info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 24px;
  }

  .booking-info-grid > div {
    border: 1px solid #e6e9f2;
    border-radius: 8px;
    padding: 18px;
    min-height: 150px;
  }

  .booking-info-grid h3 {
    margin: 0 0 18px;
    color: #4b5563;
    text-transform: uppercase;
    font-size: 12px;
  }

  .booking-info-grid strong {
    display: block;
    margin-top: 10px;
    font-size: 17px;
  }

  .booking-info-grid p {
    margin: 4px 0;
    color: #6b7280;
    font-size: 13px;
    font-weight: 700;
  }

  .booking-info-grid b {
    display: block;
    margin-top: 18px;
  }

  .fare-card {
    background: #f0fdf4;
    border-color: #bbf7d0 !important;
  }

  .fare-card > strong {
    font-size: 30px;
  }

  .fare-card span {
    display: inline-block;
    margin-top: 12px;
    border-radius: 999px;
    background: #dcfce7;
    color: #15803d;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 900;
  }

  .fare-card span.unpaid-pill {
    background: #fee2e2;
    color: #991b1b;
  }

  .booking-actions {
    border-top: 1px solid #edf0f6;
    padding: 18px 24px;
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: center;
  }

  .booking-actions span {
    color: #6b7280;
    font-weight: 800;
  }

  .booking-actions div {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .booking-actions button {
    border: 1px solid #dfe4ed;
    background: #ffffff;
    border-radius: 8px;
    padding: 10px 14px;
    font-weight: 900;
  }

  .booking-actions button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  @media (max-width: 980px) {
    .route-box,
    .page-heading,
    .booking-info-grid {
      grid-template-columns: 1fr;
    }

    .arrival {
      text-align: left;
    }

    .booking-actions {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  @media (max-width: 640px) {
    .bookings-nav div {
      display: none;
    }

    .bookings-shell {
      padding: 18px 12px 36px;
    }

    .confirmed-pill {
      position: static;
      display: inline-block;
      margin-bottom: 14px;
    }
  }
`;

export default MyBookings;
