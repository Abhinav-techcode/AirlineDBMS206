import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getLastConfirmedBooking,
  getBookingDraft,
  setLegacyBookingFlags,
} from "../../utils/session";
import {
  downloadBookingTicket,
  requestBookingConfirmationEmail,
} from "../../utils/bookingActions";

const formatDateLabel = (value) => {
  if (!value) return "Travel Date Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const BookingConfirmed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [statusMessage, setStatusMessage] = useState("");
  const [emailing, setEmailing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const booking = useMemo(
    () =>
      location.state?.booking ||
      getLastConfirmedBooking() ||
      getBookingDraft() ||
      {},
    [location.state]
  );

  const amount = Number(booking.amount || localStorage.getItem("zoshBookingAmount") || 0);
  const fareBreakdown = booking.fareBreakdown || {};
  const passengers = booking.passengers || [];
  const seats = booking.seats || [];
  const bookingReference = booking.booking_ref || booking.booking_id || "Pending";
  const routeLabel =
    booking.route ||
    `${booking.source_city || booking.flight?.from || "Origin"} - ${booking.destination_city || booking.flight?.to || "Destination"}`;
  const primaryContact = booking?.contact?.email || "No contact email saved";

  const aircraftImage =
    "https://images.unsplash.com/photo-1521727857535-28d2047314ac?auto=format&fit=crop&w=900&q=80";

  useEffect(() => {
    setLegacyBookingFlags({
      amount,
      bookingStatus: "Confirmed",
      paymentStatus: "Paid",
    });
  }, [amount]);

  useEffect(() => {
    if (booking?.email_status?.skipped) {
      setStatusMessage(booking.email_status.reason || "Email delivery is not configured yet.");
      return;
    }

    if (booking?.email_status?.success === false) {
      setStatusMessage(booking.email_status.message || "Booking confirmation email could not be sent.");
      return;
    }

    if (booking?.email_status?.messageId) {
      setStatusMessage("Booking confirmation email sent with the PDF ticket attached.");
    }
  }, [booking?.email_status]);

  const displayName = (passenger, fallback) =>
    passenger?.name ||
    [passenger?.title, passenger?.firstName, passenger?.lastName]
      .filter(Boolean)
      .join(" ") ||
    fallback;

  const handleEmailConfirmation = async () => {
    setEmailing(true);
    setStatusMessage("");

    try {
      const response = await requestBookingConfirmationEmail(booking, booking?.contact?.email);
      const emailResult = response?.email || {};

      if (emailResult.skipped) {
        setStatusMessage(emailResult.reason || "Email delivery is not configured yet.");
      } else if (emailResult.success === false) {
        setStatusMessage(emailResult.message || "Unable to send confirmation email.");
      } else {
        setStatusMessage("Booking confirmation email sent with the PDF ticket attached.");
      }
    } catch (error) {
      setStatusMessage(error.message || "Unable to send confirmation email.");
    } finally {
      setEmailing(false);
    }
  };

  const handleDownloadTicket = async () => {
    setDownloading(true);
    setStatusMessage("");

    try {
      const filename = await downloadBookingTicket(booking);
      setStatusMessage(`${filename} downloaded successfully.`);
    } catch (error) {
      setStatusMessage(error.message || "Unable to download the ticket PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="confirmed-page">
      <style>{styles}</style>

      <section className="success-hero">
        <div className="check-mark">OK</div>
        <h1>Booking Confirmed!</h1>
        <p>Your flight is booked successfully</p>
        <span>{bookingReference}</span>
      </section>

      <main className="confirmed-shell">
        <section className="action-card">
          <button type="button" onClick={handleDownloadTicket} disabled={downloading}>
            {downloading ? "Preparing PDF..." : "Download PDF Ticket"}
          </button>
          <button type="button" onClick={handleEmailConfirmation} disabled={emailing}>
            {emailing ? "Sending..." : "Email Confirmation"}
          </button>
          <button type="button" onClick={() => navigate("/my-bookings")}>
            View All Bookings
          </button>
        </section>

        {statusMessage ? <div className="action-status">{statusMessage}</div> : null}

        <section className="confirmed-grid">
          <article className="flight-card">
            <header>Flight Details</header>
            <img className="confirmation-image" src={aircraftImage} alt="" />
            <div className="route-box">
              <div>
                <h2>{booking.source_airport || booking.flight?.originName || "Departure Airport"}</h2>
                <span>{formatDateLabel(booking.departure_date || booking.flight?.departureDate)}</span>
                <strong>{booking.departure_time || booking.flight?.departureTime || "TBD"}</strong>
              </div>

              <div className="route-line">
                <span>{booking.flight?.duration || booking.duration || "Trip"}</span>
                <i />
                <b>{booking.flight_number || booking.flight?.code || "Flight"}</b>
              </div>

              <div>
                <h2>{booking.destination_airport || booking.flight?.destinationName || "Arrival Airport"}</h2>
                <span>{formatDateLabel(booking.departure_date || booking.flight?.departureDate)}</span>
                <strong>{booking.arrival_time || booking.flight?.arrivalTime || "TBD"}</strong>
              </div>
            </div>
          </article>

          <aside className="summary-card">
            <header>Booking Summary</header>
            <div className="summary-row">
              <span>Booking Reference</span>
              <b>{bookingReference}</b>
            </div>
            <div className="summary-row">
              <span>Status</span>
              <strong className="confirmed-status">{booking.booking_status || "Confirmed"}</strong>
            </div>
            <div className="summary-row">
              <span>Payment Status</span>
              <strong className="paid-status">{booking.payment_status || "SUCCESS"}</strong>
            </div>
            <div className="summary-row">
              <span>Base Fare</span>
              <b>Rs. {Number(fareBreakdown.baseFare || 0).toLocaleString("en-IN")}</b>
            </div>
            <div className="summary-row">
              <span>Taxes & Fees</span>
              <b>Rs. {Number(fareBreakdown.taxes || 0).toLocaleString("en-IN")}</b>
            </div>
            <div className="total-row">
              <span>Total Amount</span>
              <b>Rs. {amount.toLocaleString("en-IN")}</b>
            </div>
          </aside>
        </section>

        <section className="ticket-preview-card">
          <div className="ticket-preview-head">
            <div>
              <p>In-App Ticket</p>
              <h2>Your booking message is now available here</h2>
              <span>The same ticket is also generated as a PDF for download and email attachment.</span>
            </div>
            <strong>{bookingReference}</strong>
          </div>

          <div className="ticket-preview-body">
            <div className="ticket-route">
              <div>
                <span>From</span>
                <strong>{booking.source_airport || booking.flight?.originName || "Departure Airport"}</strong>
                <small>{booking.departure_time || booking.flight?.departureTime || "TBD"}</small>
              </div>
              <b>{routeLabel}</b>
              <div>
                <span>To</span>
                <strong>{booking.destination_airport || booking.flight?.destinationName || "Arrival Airport"}</strong>
                <small>{booking.arrival_time || booking.flight?.arrivalTime || "TBD"}</small>
              </div>
            </div>

            <div className="ticket-meta-grid">
              <div>
                <span>Travel Date</span>
                <strong>{formatDateLabel(booking.departure_date || booking.flight?.departureDate)}</strong>
              </div>
              <div>
                <span>Flight Number</span>
                <strong>{booking.flight_number || booking.flight?.code || "TBD"}</strong>
              </div>
              <div>
                <span>Contact Email</span>
                <strong>{primaryContact}</strong>
              </div>
              <div>
                <span>Payment</span>
                <strong>{booking.payment_status || "SUCCESS"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="passenger-card">
          <h2>Passenger Details</h2>
          <div className="passenger-grid">
            {passengers.length > 0 ? (
              passengers.map((passenger, index) => (
                <div key={`${displayName(passenger, `Passenger ${index + 1}`)}-${index}`}>
                  <span>Passenger {index + 1}</span>
                  <strong>{displayName(passenger, `Passenger ${index + 1}`)}</strong>
                  <p>
                    Seat {(seats[index] && (seats[index].seatNumber || seats[index].seat_no)) || "Not selected"}
                  </p>
                </div>
              ))
            ) : (
              <div>
                <span>Passenger</span>
                <strong>No passenger details available</strong>
                <p>The booking was confirmed, but passenger names were not returned by the backend.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

const styles = `
  .confirmed-page {
    min-height: 100vh;
    background: #f6f8fc;
    color: #111827;
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  }

  button {
    font: inherit;
    cursor: pointer;
  }

  .success-hero {
    min-height: 310px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #ffffff;
    background: linear-gradient(135deg, #00b956, #009a49);
  }

  .check-mark {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background: #ffffff;
    color: #16a34a;
    display: grid;
    place-items: center;
    font-size: 20px;
    font-weight: 900;
    margin-bottom: 22px;
  }

  .success-hero h1 {
    margin: 0;
    font-size: 42px;
    line-height: 1.1;
  }

  .success-hero p {
    margin: 12px 0 18px;
    font-size: 18px;
    opacity: 0.9;
  }

  .success-hero span {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.17);
    padding: 10px 22px;
    font-weight: 900;
  }

  .confirmed-shell {
    max-width: 1120px;
    margin: -44px auto 0;
    padding: 0 22px 56px;
  }

  .action-card,
  .flight-card,
  .summary-card,
  .passenger-card {
    background: #ffffff;
    border: 1px solid #e6e9f2;
    border-radius: 8px;
    box-shadow: 0 18px 36px rgba(25, 35, 90, 0.08);
  }

  .action-card {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    padding: 28px;
    margin-bottom: 24px;
  }

  .action-card button {
    border: 1px solid #dfe4ed;
    border-radius: 8px;
    background: #ffffff;
    color: #111827;
    padding: 15px;
    font-weight: 900;
  }

  .action-card button:first-child {
    border-color: transparent;
    background: #0f4c81;
    color: #ffffff;
  }

  .action-card button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .action-status {
    margin: -8px 0 18px;
    border-radius: 12px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
    padding: 12px 14px;
    font-weight: 800;
  }

  .confirmed-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 330px;
    gap: 24px;
    align-items: start;
  }

  .flight-card,
  .summary-card,
  .passenger-card {
    overflow: hidden;
  }

  .flight-card header {
    background: linear-gradient(135deg, #2563eb, #6d28d9);
    color: white;
    padding: 18px 22px;
    font-size: 18px;
    font-weight: 900;
  }

  .confirmation-image {
    width: 100%;
    height: 190px;
    object-fit: cover;
    display: block;
  }

  .summary-card header {
    background: #059669;
    color: white;
    padding: 18px 22px;
    font-size: 18px;
    font-weight: 900;
  }

  .route-box {
    display: grid;
    grid-template-columns: 1fr 170px 1fr;
    gap: 22px;
    align-items: center;
    padding: 32px;
  }

  .route-box h2 {
    margin: 0 0 18px;
    font-size: 22px;
    line-height: 1.25;
    text-transform: uppercase;
  }

  .route-box span,
  .route-box p {
    color: #6b7280;
    font-weight: 700;
  }

  .route-box strong {
    display: block;
    color: #6d28d9;
    font-size: 20px;
    margin-top: 8px;
  }

  .route-line {
    text-align: center;
    color: #6d28d9;
    font-weight: 900;
  }

  .route-line i {
    display: block;
    height: 3px;
    background: #6d28d9;
    margin: 10px 0;
  }

  .route-line b {
    color: #16a34a;
    font-size: 12px;
  }

  .summary-card {
    padding-bottom: 12px;
  }

  .summary-row,
  .total-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 15px 22px;
    border-bottom: 1px solid #edf0f6;
    color: #4b5563;
    font-weight: 700;
  }

  .summary-row b {
    color: #059669;
  }

  .summary-row strong {
    border-radius: 999px;
    background: #fef3c7;
    color: #92400e;
    padding: 5px 9px;
    font-size: 12px;
    text-transform: uppercase;
  }

  .summary-row strong.confirmed-status,
  .summary-row strong.paid-status {
    background: #dcfce7;
    color: #15803d;
  }

  .total-row {
    color: #111827;
    font-size: 18px;
    font-weight: 900;
    border-bottom: 0;
  }

  .total-row b {
    color: #16a34a;
  }

  .passenger-card {
    padding: 24px;
    margin-top: 24px;
  }

  .ticket-preview-card {
    margin-top: 24px;
    border-radius: 8px;
    background: #ffffff;
    border: 1px solid #e6e9f2;
    box-shadow: 0 18px 36px rgba(25, 35, 90, 0.08);
    overflow: hidden;
  }

  .ticket-preview-head {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: center;
    padding: 24px 28px;
    color: #ffffff;
    background: linear-gradient(135deg, #0f4c81, #1793d1);
  }

  .ticket-preview-head p {
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 1.4px;
    font-size: 12px;
    opacity: 0.84;
    font-weight: 900;
  }

  .ticket-preview-head h2 {
    margin: 0 0 8px;
    font-size: 28px;
    line-height: 1.15;
  }

  .ticket-preview-head span {
    opacity: 0.9;
    font-weight: 700;
  }

  .ticket-preview-head strong {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    padding: 12px 18px;
    font-size: 14px;
    white-space: nowrap;
  }

  .ticket-preview-body {
    padding: 28px;
  }

  .ticket-route {
    display: grid;
    grid-template-columns: 1fr 220px 1fr;
    gap: 18px;
    align-items: center;
    border: 1px dashed #bfd4e6;
    border-radius: 18px;
    background: linear-gradient(180deg, #f8fbff, #eef6fb);
    padding: 24px;
  }

  .ticket-route span,
  .ticket-meta-grid span {
    display: block;
    color: #64748b;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 900;
  }

  .ticket-route strong {
    display: block;
    margin-top: 8px;
    font-size: 20px;
    line-height: 1.3;
  }

  .ticket-route small {
    display: block;
    margin-top: 8px;
    color: #0f4c81;
    font-size: 15px;
    font-weight: 900;
  }

  .ticket-route b {
    text-align: center;
    color: #0f4c81;
    font-size: 15px;
    line-height: 1.5;
  }

  .ticket-meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-top: 18px;
  }

  .ticket-meta-grid > div {
    border-radius: 8px;
    background: #f8fafc;
    border: 1px solid #e6e9f2;
    padding: 16px;
  }

  .ticket-meta-grid strong {
    display: block;
    margin-top: 10px;
    font-size: 16px;
    line-height: 1.4;
  }

  .passenger-card h2 {
    margin: 0 0 18px;
  }

  .passenger-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .passenger-grid div {
    border-radius: 8px;
    background: #f8fafc;
    border: 1px solid #e6e9f2;
    padding: 16px;
  }

  .passenger-grid span {
    color: #6b7280;
    font-size: 13px;
    font-weight: 800;
  }

  .passenger-grid strong {
    display: block;
    margin-top: 8px;
    font-size: 18px;
  }

  .passenger-grid p {
    color: #6d28d9;
    font-weight: 900;
    margin-bottom: 0;
  }

  @media (max-width: 880px) {
    .action-card,
    .confirmed-grid,
    .route-box,
    .passenger-grid,
    .ticket-route,
    .ticket-meta-grid {
      grid-template-columns: 1fr;
    }

    .confirmed-shell {
      padding: 0 14px 36px;
    }

    .ticket-preview-head {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media (max-width: 560px) {
    .success-hero h1 {
      font-size: 32px;
    }

    .route-box {
      padding: 22px;
    }
  }
`;

export default BookingConfirmed;
