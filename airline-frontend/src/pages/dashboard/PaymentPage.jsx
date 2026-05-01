import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { apiRequest } from "../../utils/api";
import {
  getBookingDraft,
  saveLastConfirmedBooking,
  cacheBookings,
  setLegacyBookingFlags,
} from "../../utils/session";

const methodMap = {
  upi: "UPI",
  card: "CARD",
  netbanking: "NETBANKING",
};

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const savedDetails = getBookingDraft();
  const bookingDetails = location.state?.bookingDetails || savedDetails;
  const amount = Number(location.state?.amount || bookingDetails?.amount || 9898);
  const primaryBooking = useMemo(
    () => bookingDetails?.backendBookings?.[0] || {},
    [bookingDetails]
  );
  const [mobile, setMobile] = useState(bookingDetails?.contact?.mobile || "");
  const [method, setMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const completePayment = async () => {
    if (!bookingDetails?.booking_id && !bookingDetails?.booking_ids?.length) {
      setErrorMessage("No confirmed booking was found for this payment request.");
      return;
    }

    setProcessing(true);
    setErrorMessage("");

    try {
      const paymentResponse = await apiRequest("/bookings/payment", {
        method: "POST",
        body: {
          booking_id: bookingDetails.booking_id,
          booking_ids: bookingDetails.booking_ids,
          amount,
          payment_method: methodMap[method] || "UPI",
          transaction_id: `TXN_${Date.now()}`,
          email: bookingDetails?.contact?.email,
          contact: {
            email: bookingDetails?.contact?.email,
            mobile,
          },
        },
      });

      const confirmedBooking = {
        ...(paymentResponse.bookings?.[0] || {}),
        contact: {
          ...(paymentResponse.bookings?.[0]?.contact || {}),
          email: bookingDetails?.contact?.email || paymentResponse.bookings?.[0]?.contact?.email || "",
          mobile,
          countryCode: bookingDetails?.contact?.countryCode || "+91",
        },
        passengers:
          paymentResponse.bookings?.[0]?.passengers?.length > 0
            ? paymentResponse.bookings[0].passengers
            : bookingDetails?.passengers || [],
        seats:
          paymentResponse.bookings?.[0]?.seats?.length > 0
            ? paymentResponse.bookings[0].seats
            : bookingDetails?.seats || [],
        fareBreakdown: bookingDetails?.fareBreakdown || {},
        amount,
        email_status: paymentResponse.email || null,
        payment_status: "SUCCESS",
        booking_status: paymentResponse.bookings?.[0]?.booking_status || "CONFIRMED",
      };

      saveLastConfirmedBooking(confirmedBooking);
      cacheBookings(paymentResponse.bookings || []);
      setLegacyBookingFlags({
        amount,
        bookingStatus: "Confirmed",
        paymentStatus: "Paid",
      });

      navigate("/booking-confirmed", {
        state: {
          booking: confirmedBooking,
        },
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to complete payment.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="payment-page">
      <style>{styles}</style>

      <main className="payment-shell">
        <section className="payment-copy">
          <button onClick={() => navigate("/booking-review")}>Back to review</button>
          <p>Secure payment</p>
          <h1>Complete your ZoshAir payment</h1>
          <span>
            Protected checkout for booking {primaryBooking?.booking_ref || bookingDetails?.booking_id || "Pending"}
          </span>
        </section>

        {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

        <section className="payment-layout">
          <article className="request-card">
            <div className="notice">Test mode payment. Use any mobile number to continue.</div>
            <h2>Payment Request from ZoshAir</h2>
            <small>Payment for</small>
            <strong>{primaryBooking?.booking_ref || bookingDetails?.booking_id || "Booking Draft"}</strong>
            <small>Amount payable</small>
            <b>INR {amount.toLocaleString("en-IN")}.00</b>
            <div className="support-row">
              <span>For any queries, please contact</span>
              <strong>support@zoshair.com</strong>
            </div>
          </article>

          <article className="checkout-card">
            <div className="brand-panel">
              <div className="brand-logo">ZA</div>
              <h2>ZoshAir</h2>
              <span>Total Amount</span>
              <strong>Rs. {amount.toLocaleString("en-IN")}</strong>
            </div>

            <div className="checkout-body">
              <h3>Contact details</h3>
              <p>Enter mobile number to continue</p>

              <label>
                Mobile number
                <div className="mobile-row">
                  <span>{bookingDetails?.contact?.countryCode || "+91"}</span>
                  <input
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value)}
                    placeholder="Mobile number"
                  />
                </div>
              </label>

              <div className="method-grid">
                {[
                  ["upi", "UPI"],
                  ["card", "Card"],
                  ["netbanking", "Net Banking"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={method === id ? "active" : ""}
                    onClick={() => setMethod(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                className="pay-button"
                disabled={mobile.trim().length < 6 || processing}
                onClick={completePayment}
              >
                {processing ? "Confirming Payment..." : `Pay Rs. ${amount.toLocaleString("en-IN")}`}
              </button>
            </div>
          </article>
        </section>

        <section className="trust-card">
          <strong>Razorpay style secure checkout</strong>
          <span>UPI</span>
          <span>Visa</span>
          <span>RuPay</span>
          <span>NetBanking</span>
        </section>
      </main>
    </div>
  );
};

const styles = `
  .payment-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at 15% 10%, rgba(99, 102, 241, 0.16), transparent 30%),
      linear-gradient(135deg, #f8fafc 0%, #eef2ff 48%, #f8fafc 100%);
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

  .payment-shell {
    max-width: 1120px;
    margin: 0 auto;
    padding: 48px 22px;
  }

  .payment-copy {
    margin-bottom: 28px;
  }

  .payment-copy button {
    border: 0;
    background: transparent;
    color: #4f46e5;
    font-weight: 900;
    padding: 0;
    margin-bottom: 18px;
  }

  .payment-copy p {
    margin: 0 0 8px;
    color: #4f46e5;
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 900;
  }

  .payment-copy h1 {
    margin: 0;
    max-width: 720px;
    font-size: 42px;
    line-height: 1.08;
  }

  .payment-copy span {
    display: block;
    margin-top: 12px;
    color: #64748b;
    font-weight: 800;
  }

  .error-banner {
    border-radius: 12px;
    background: #fff1f2;
    border: 1px solid #fecdd3;
    color: #be123c;
    padding: 14px 16px;
    font-weight: 800;
    margin-bottom: 18px;
  }

  .payment-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 350px;
    gap: 28px;
    align-items: center;
  }

  .request-card,
  .checkout-card,
  .trust-card {
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 24px 60px rgba(30, 41, 59, 0.12);
  }

  .request-card {
    padding: 28px;
  }

  .notice {
    border-radius: 8px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    color: #92400e;
    padding: 13px 16px;
    font-weight: 800;
    margin-bottom: 26px;
  }

  .request-card h2 {
    margin: 0 0 24px;
    font-size: 24px;
  }

  .request-card small {
    display: block;
    color: #64748b;
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 900;
    margin-top: 18px;
  }

  .request-card > strong {
    display: block;
    margin-top: 8px;
  }

  .request-card > b {
    display: block;
    margin-top: 8px;
    font-size: 24px;
  }

  .support-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    border-top: 1px solid #e2e8f0;
    margin-top: 28px;
    padding-top: 18px;
    color: #64748b;
    font-weight: 800;
  }

  .checkout-card {
    overflow: hidden;
  }

  .brand-panel {
    text-align: center;
    color: #ffffff;
    background: #172554;
    padding: 34px 24px;
  }

  .brand-logo {
    width: 54px;
    height: 54px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.12);
    display: grid;
    place-items: center;
    margin: 0 auto 18px;
    font-weight: 900;
  }

  .brand-panel h2 {
    margin: 0 0 24px;
  }

  .brand-panel span {
    display: block;
    color: #cbd5e1;
    font-weight: 800;
  }

  .brand-panel strong {
    display: block;
    margin-top: 8px;
    font-size: 32px;
  }

  .checkout-body {
    padding: 24px;
  }

  .checkout-body h3 {
    margin: 0 0 6px;
    font-size: 21px;
  }

  .checkout-body p {
    margin: 0 0 18px;
    color: #64748b;
    font-weight: 700;
  }

  label {
    color: #334155;
    font-size: 13px;
    font-weight: 900;
  }

  .mobile-row {
    display: grid;
    grid-template-columns: 62px 1fr;
    border: 1px solid #dbe3ef;
    border-radius: 8px;
    overflow: hidden;
    margin-top: 8px;
  }

  .mobile-row span {
    display: grid;
    place-items: center;
    background: #f8fafc;
    color: #334155;
    font-weight: 900;
  }

  .mobile-row input {
    border: 0;
    padding: 13px;
    min-width: 0;
    outline: none;
  }

  .method-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin: 18px 0;
  }

  .method-grid button {
    border: 1px solid #dbe3ef;
    background: #ffffff;
    border-radius: 8px;
    padding: 10px 8px;
    color: #334155;
    font-size: 12px;
    font-weight: 900;
  }

  .method-grid button.active {
    border-color: #4f46e5;
    color: #4f46e5;
    background: #eef2ff;
  }

  .pay-button {
    width: 100%;
    border: 0;
    border-radius: 8px;
    background: #020617;
    color: #ffffff;
    padding: 15px;
    font-weight: 900;
    transition: transform 160ms ease, opacity 160ms ease;
  }

  .pay-button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .pay-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .trust-card {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 22px;
    flex-wrap: wrap;
    margin: 34px auto 0;
    padding: 18px 24px;
    color: #64748b;
    max-width: 640px;
    font-weight: 900;
  }

  .trust-card strong {
    color: #172554;
  }

  @media (max-width: 860px) {
    .payment-layout {
      grid-template-columns: 1fr;
    }

    .payment-copy h1 {
      font-size: 32px;
    }
  }
`;

export default PaymentPage;
