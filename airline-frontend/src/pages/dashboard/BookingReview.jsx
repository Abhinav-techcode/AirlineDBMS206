import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { apiRequest } from "../../utils/api";
import {
  getCurrentUser,
  getCurrentUserId,
  saveBookingDraft,
  setLegacyBookingFlags,
} from "../../utils/session";

const mealCatalog = [
  {
    id: "veg-bowl",
    name: "Garden Fresh Salad Bowl",
    description: "Mixed greens, feta, cucumber, cherry tomatoes, and herb dressing.",
    tag: "Vegetarian",
    price: 249,
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "alfredo",
    name: "Creamy Alfredo Pasta",
    description: "Fettuccine pasta with parmesan cream sauce and roasted garlic.",
    tag: "Hot Meal",
    price: 299,
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "kids",
    name: "Kids Chicken Nuggets",
    description: "Mini nuggets, fries, and fruit cup for younger travellers.",
    tag: "Kids",
    price: 279,
    image:
      "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "vegan",
    name: "Protein Vegan Box",
    description: "Quinoa, roasted vegetables, hummus, and tahini dressing.",
    tag: "Vegan",
    price: 329,
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
  },
];

const insuranceFee = 4999;
const extraBagFee = 990;
const emptyPassenger = {
  title: "",
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  nationality: "Indian",
};

const normaliseSeat = (seat, index) => ({
  passengerId: seat?.passengerId || index + 1,
  passengerLabel: seat?.passengerLabel || `Passenger ${index + 1}`,
  schedule_seat_id: seat?.schedule_seat_id || null,
  seatNumber: seat?.seatNumber || seat?.seat_no || `Pending-${index + 1}`,
  seat_no: seat?.seat_no || seat?.seatNumber || `Pending-${index + 1}`,
  price: Number(seat?.price || 0),
  type: seat?.type || "Standard",
});

const BookingReview = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const currentUser = getCurrentUser();
  const currentUserId = getCurrentUserId();

  const passengerCount = Math.max(1, Number(state?.passengerCount || state?.travelers || 1));
  const searchState = state || {};
  const selectedSeats = useMemo(() => {
    if (Array.isArray(state?.selectedSeats) && state.selectedSeats.length > 0) {
      return state.selectedSeats.map(normaliseSeat);
    }

    if (Array.isArray(state?.seats) && state.seats.length > 0) {
      return state.seats.map(normaliseSeat);
    }

    return Array.from({ length: passengerCount }, (_, index) =>
      normaliseSeat(null, index)
    );
  }, [passengerCount, state?.selectedSeats, state?.seats]);

  const flight = state?.flight || {
    airline: "ZoshAir",
    airlineName: "ZoshAir",
    airlineCode: "ZA",
    code: state?.flight_number || "FT101",
    from: state?.from || "BOM",
    to: state?.to || "CCU",
    departureTime: "13:00",
    arrivalTime: "15:00",
    departureDate: state?.departureDate || "Apr 3, 2026",
    duration: "2h 00m",
    aircraft: "Boeing 737-800",
    cabin: state?.travelClass || "Economy",
    price: Number(state?.price || 4200),
    originName: state?.flight?.fromAirport || "Chhatrapati Shivaji Maharaj International Airport",
    destinationName: state?.flight?.toAirport || "Netaji Subhas Chandra Bose International Airport",
  };

  const [secureTrip, setSecureTrip] = useState(false);
  const [extraBags, setExtraBags] = useState(0);
  const [contact, setContact] = useState({
    email: currentUser?.email || "",
    countryCode: "+91",
    mobile: "",
  });
  const [passengers, setPassengers] = useState(() =>
    Array.from({ length: passengerCount }, () => ({ ...emptyPassenger }))
  );
  const [expandedPassenger, setExpandedPassenger] = useState(0);
  const [selectedMeals, setSelectedMeals] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const seatTotal = selectedSeats.reduce((sum, seat) => sum + Number(seat?.price || 0), 0);
  const mealTotal = Object.values(selectedMeals).reduce((sum, mealId) => {
    const match = mealCatalog.find((meal) => meal.id === mealId);
    return sum + Number(match?.price || 0);
  }, 0);
  const baseFareTotal = Number(flight.price || 4200) * passengerCount;
  const bagsTotal = extraBags * extraBagFee;
  const insuranceTotal = secureTrip ? insuranceFee : 0;
  const taxesTotal = Math.round(baseFareTotal * 0.1);
  const grandTotal = baseFareTotal + taxesTotal + seatTotal + mealTotal + bagsTotal + insuranceTotal;

  const updatePassenger = (index, field, value) => {
    setPassengers((current) =>
      current.map((passenger, passengerIndex) =>
        passengerIndex === index ? { ...passenger, [field]: value } : passenger
      )
    );
  };

  const passengerDisplayName = (passenger, index) => {
    const name = [passenger.title, passenger.firstName, passenger.lastName].filter(Boolean).join(" ");
    return name || `Adult ${index + 1}`;
  };

  const completedPassengers = passengers.filter(
    (passenger) => passenger.firstName && passenger.lastName && passenger.gender && passenger.dateOfBirth
  ).length;

  const handleProceedToPayment = async () => {
    if (!currentUserId) {
      setErrorMessage("Please sign in before confirming your booking.");
      return;
    }

    if (!contact.email.trim() || !contact.mobile.trim()) {
      setErrorMessage("Enter contact email and mobile number before continuing.");
      return;
    }

    const invalidPassengerIndex = passengers.findIndex(
      (passenger) =>
        !passenger.firstName ||
        !passenger.lastName ||
        !passenger.gender ||
        !passenger.dateOfBirth
    );

    if (invalidPassengerIndex >= 0) {
      setErrorMessage(`Complete traveller details for Passenger ${invalidPassengerIndex + 1}.`);
      return;
    }

    if (selectedSeats.some((seat) => !seat.schedule_seat_id)) {
      setErrorMessage("Each passenger needs a locked seat before booking can continue.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const confirmResponse = await apiRequest("/seats/confirm", {
        method: "POST",
        body: {
          user_id: currentUserId,
          schedule_id: state?.schedule_id,
          instance_id: state?.flight?.instance_id || state?.instance_id || null,
          departure_date: state?.departureDate || state?.flight?.departure_date || "",
          amount: grandTotal,
          contact: {
            email: contact.email,
            mobile: contact.mobile,
          },
          passengers: passengers.map((passenger, index) => ({
            ...passenger,
            schedule_seat_id: selectedSeats[index]?.schedule_seat_id,
            seat_no: selectedSeats[index]?.seat_no,
          })),
        },
      });

      const mealItems = Object.entries(selectedMeals)
        .map(([passengerIndex, mealId]) => {
          const meal = mealCatalog.find((item) => item.id === mealId);
          if (!meal) return null;
          return {
            passengerIndex: Number(passengerIndex),
            passengerLabel: `Passenger ${Number(passengerIndex) + 1}`,
            ...meal,
          };
        })
        .filter(Boolean);

      const bookingDetails = {
        booking_id: confirmResponse.booking_id,
        booking_ids: confirmResponse.booking_ids || [confirmResponse.booking_id].filter(Boolean),
        schedule_id: state?.schedule_id,
        user_id: currentUserId,
        flight,
        backendBookings: confirmResponse.bookings || [],
        passengers,
        contact,
        seats: selectedSeats,
        passengerCount,
        selectedMeals: mealItems,
        extraBags,
        insurance: secureTrip,
        amount: grandTotal,
        fareBreakdown: {
          baseFare: baseFareTotal,
          taxes: taxesTotal,
          seatSelection: seatTotal,
          meals: mealTotal,
          baggage: bagsTotal,
          travelInsurance: insuranceTotal,
          total: grandTotal,
        },
        status: "Pending",
        payment_status: confirmResponse.payment_status || "PENDING",
        booked_date: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      };

      saveBookingDraft(bookingDetails);
      setLegacyBookingFlags({
        amount: grandTotal,
        bookingStatus: "Pending",
        paymentStatus: "Unpaid",
      });

      navigate("/payment", {
        state: {
          amount: grandTotal,
          bookingDetails,
        },
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to confirm booking right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={darkMode ? "review-page dark" : "review-page"}>
      <style>{styles}</style>

      <nav className="review-nav">
        <button type="button" className="brand" onClick={() => navigate("/dashboard/customer")}>
          <span className="brand-mark">ZA</span>
          <span>ZoshAir</span>
        </button>

        <div className="review-links">
          <button type="button" onClick={() => navigate("/dashboard/customer")}>
            Home
          </button>
          <button type="button" onClick={() => navigate("/my-bookings")}>
            My Bookings
          </button>
        </div>

        <div className="nav-tools">
          <button type="button" onClick={() => setDarkMode((current) => !current)}>
            {darkMode ? "Dark" : "Light"}
          </button>
          <span>{currentUser?.name ? String(currentUser.name).slice(0, 2).toUpperCase() : "RV"}</span>
        </div>
      </nav>

      <main className="review-shell">
        <button type="button" className="back-link" onClick={() => navigate("/flights", { state: searchState })}>
          Back to Flight Search
        </button>

        <div className="page-title">
          <h1>Complete Your Booking</h1>
          <p>Review flight details, add traveller information, and customise the trip before payment.</p>
        </div>

        {errorMessage ? <div className="status-banner">{errorMessage}</div> : null}

        <div className="review-layout">
          <div className="review-main">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Flight Details</h2>
                  <p>{flight.airlineName || flight.airline || "ZoshAir"} - {flight.code} - {flight.aircraft}</p>
                </div>
                <span className="pill green">Non-stop</span>
              </div>

              <div className="route-grid">
                <div>
                  <span className="muted">{flight.departureDate}</span>
                  <strong>{flight.departureTime || flight.depart || "13:00"}</strong>
                  <b>{flight.from}</b>
                  <p>{flight.originName || flight.fromAirport}</p>
                </div>

                <div className="route-center">
                  <span>{flight.duration || flight.durationLabel || "2h 00m"}</span>
                  <i />
                  <small>{String(flight.cabin || "Economy").toUpperCase()}</small>
                </div>

                <div className="align-right">
                  <span className="muted">{flight.departureDate}</span>
                  <strong>{flight.arrivalTime || flight.arrive || "15:00"}</strong>
                  <b>{flight.to}</b>
                  <p>{flight.destinationName || flight.toAirport}</p>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Traveller Details</h2>
                  <p>{completedPassengers} of {passengerCount} travellers completed</p>
                </div>
                <span className="pill blue">{passengerCount} passengers</span>
              </div>

              <div className="info-banner">
                <strong>Important</strong>
                <ul>
                  <li>Enter names exactly as they appear on government ID.</li>
                  <li>Middle name is optional.</li>
                  <li>These details are used in the live backend booking confirmation step.</li>
                </ul>
              </div>

              {passengers.map((passenger, index) => {
                const seat = selectedSeats[index];
                const completed = passenger.firstName && passenger.lastName && passenger.gender && passenger.dateOfBirth;

                return (
                  <div
                    key={`traveller-${index}`}
                    className={`traveller-card ${completed ? "completed" : ""}`}
                  >
                    <button
                      type="button"
                      className="traveller-toggle"
                      onClick={() => setExpandedPassenger((current) => (current === index ? -1 : index))}
                    >
                      <div>
                        <strong>{passengerDisplayName(passenger, index)}</strong>
                        <p>
                          {seat?.seatNumber || "Seat pending"} - {seat?.type || "Standard"}
                        </p>
                      </div>
                      <span>{completed ? "Completed" : "Fill details"}</span>
                    </button>

                    {expandedPassenger === index ? (
                      <div className="form-grid">
                        <label>
                          Title
                          <select
                            value={passenger.title}
                            onChange={(event) => updatePassenger(index, "title", event.target.value)}
                          >
                            <option value="">Select</option>
                            <option value="Mr">Mr</option>
                            <option value="Mrs">Mrs</option>
                            <option value="Ms">Ms</option>
                          </select>
                        </label>

                        <label>
                          First Name
                          <input
                            value={passenger.firstName}
                            onChange={(event) => updatePassenger(index, "firstName", event.target.value)}
                            placeholder="Enter first name"
                          />
                        </label>

                        <label>
                          Last Name
                          <input
                            value={passenger.lastName}
                            onChange={(event) => updatePassenger(index, "lastName", event.target.value)}
                            placeholder="Enter last name"
                          />
                        </label>

                        <label>
                          Gender
                          <select
                            value={passenger.gender}
                            onChange={(event) => updatePassenger(index, "gender", event.target.value)}
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </label>

                        <label>
                          Date of Birth
                          <input
                            type="date"
                            value={passenger.dateOfBirth}
                            onChange={(event) => updatePassenger(index, "dateOfBirth", event.target.value)}
                          />
                        </label>

                        <label>
                          Nationality
                          <input
                            value={passenger.nationality}
                            onChange={(event) => updatePassenger(index, "nationality", event.target.value)}
                          />
                        </label>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <div className="contact-card">
                <h3>Contact Information</h3>
                <div className="contact-grid">
                  <label>
                    Email Address
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(event) => setContact((current) => ({ ...current, email: event.target.value }))}
                      placeholder="you@example.com"
                    />
                  </label>

                  <label>
                    Mobile Number
                    <div className="phone-grid">
                      <select
                        value={contact.countryCode}
                        onChange={(event) =>
                          setContact((current) => ({ ...current, countryCode: event.target.value }))
                        }
                      >
                        <option value="+91">+91</option>
                        <option value="+971">+971</option>
                        <option value="+1">+1</option>
                      </select>
                      <input
                        value={contact.mobile}
                        onChange={(event) => setContact((current) => ({ ...current, mobile: event.target.value }))}
                        placeholder="Mobile number"
                      />
                    </div>
                  </label>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Seat Selection</h2>
                  <p>Your locked seats will be confirmed against the booking when you continue to payment.</p>
                </div>
                <button type="button" className="action-btn" onClick={() => navigate("/seats", { state: searchState })}>
                  Change Seats
                </button>
              </div>

              <div className="seat-summary-list">
                {selectedSeats.map((seat, index) => (
                  <div key={seat.passengerId || index} className="seat-summary-card">
                    <div>
                      <span>{seat.passengerLabel || `Passenger ${index + 1}`}</span>
                      <strong>{seat.seatNumber}</strong>
                    </div>
                    <small>{seat.type || "Standard"}</small>
                    <b>Rs. {Number(seat.price || 0).toLocaleString("en-IN")}</b>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Travel Protection</h2>
                  <p>Make the add-on feel optional and clear, instead of a confusing payment wall.</p>
                </div>
              </div>

              <div className="insurance-shell">
                <div className="insurance-banner">
                  <div>
                    <h3>Trip Secure</h3>
                    <p>Medical, baggage, delay, and cancellation protection bundled for the itinerary.</p>
                  </div>
                  <span>Recommended</span>
                </div>

                <div className="insurance-cards">
                  <label className={`choice ${secureTrip ? "active" : ""}`}>
                    <input
                      type="radio"
                      checked={secureTrip}
                      onChange={() => setSecureTrip(true)}
                    />
                    <div>
                      <strong>Yes, secure my trip</strong>
                      <p>13 coverage benefits with higher support priority during disruption.</p>
                    </div>
                    <b>Rs. {insuranceFee.toLocaleString("en-IN")}</b>
                  </label>

                  <label className={`choice ${!secureTrip ? "active muted-choice" : ""}`}>
                    <input
                      type="radio"
                      checked={!secureTrip}
                      onChange={() => setSecureTrip(false)}
                    />
                    <div>
                      <strong>No, continue without insurance</strong>
                      <p>Proceed with fare, seats, and meals only.</p>
                    </div>
                    <b>Rs. 0</b>
                  </label>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Meal Selection</h2>
                  <p>Select meals per passenger so the order total reflects actual choices.</p>
                </div>
                <span className="pill orange">{mealCatalog.length} meals</span>
              </div>

              <div className="meal-grid">
                {mealCatalog.map((meal) => (
                  <div key={meal.id} className="meal-card">
                    <img src={meal.image} alt={meal.name} />
                    <div className="meal-copy">
                      <div className="meal-top">
                        <strong>{meal.name}</strong>
                        <span>{meal.tag}</span>
                      </div>
                      <p>{meal.description}</p>
                      <div className="meal-footer">
                        <b>Rs. {meal.price}</b>
                      </div>
                    </div>

                    <div className="meal-passenger-list">
                      {Array.from({ length: passengerCount }, (_, index) => (
                        <button
                          key={`${meal.id}-${index}`}
                          type="button"
                          className={selectedMeals[index] === meal.id ? "meal-select active" : "meal-select"}
                          onClick={() =>
                            setSelectedMeals((current) => ({
                              ...current,
                              [index]: current[index] === meal.id ? undefined : meal.id,
                            }))
                          }
                        >
                          {selectedMeals[index] === meal.id ? "Added to" : "Add for"} {` Passenger ${index + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Baggage & Policy</h2>
                  <p>Cleaner allowance panel so checkout feels useful, not cluttered.</p>
                </div>
              </div>

              <div className="policy-card">
                <div className="policy-title">
                  <strong>Economy Standard Baggage Policy</strong>
                  <span>Enhanced baggage allowance for selected fare</span>
                </div>

                <div className="policy-grid">
                  <div>
                    <small>Check-in baggage</small>
                    <strong>20 kg</strong>
                    <span>1 piece included</span>
                  </div>
                  <div>
                    <small>Cabin baggage</small>
                    <strong>7 kg</strong>
                    <span>1 piece included</span>
                  </div>
                  <div>
                    <small>Additional bags</small>
                    <div className="bag-qty">
                      <button type="button" onClick={() => setExtraBags((current) => Math.max(0, current - 1))}>
                        -
                      </button>
                      <b>{extraBags}</b>
                      <button type="button" onClick={() => setExtraBags((current) => current + 1)}>
                        +
                      </button>
                    </div>
                    <span>Rs. {extraBagFee.toLocaleString("en-IN")} each</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="summary-card">
            <div className="summary-panel">
              <h2>Fare Summary</h2>
              <span>{passengerCount} Passenger(s)</span>

              <div className="summary-total">
                <span>Total Amount</span>
                <strong>Rs. {grandTotal.toLocaleString("en-IN")}</strong>
              </div>

              <div className="summary-lines">
                <div>
                  <span>Base Fare</span>
                  <b>Rs. {baseFareTotal.toLocaleString("en-IN")}</b>
                </div>
                <div>
                  <span>Taxes & Fees</span>
                  <b>Rs. {taxesTotal.toLocaleString("en-IN")}</b>
                </div>
                <div>
                  <span>Seat Selection</span>
                  <b>Rs. {seatTotal.toLocaleString("en-IN")}</b>
                </div>
                <div>
                  <span>Meals</span>
                  <b>Rs. {mealTotal.toLocaleString("en-IN")}</b>
                </div>
                <div>
                  <span>Extra Baggage</span>
                  <b>Rs. {bagsTotal.toLocaleString("en-IN")}</b>
                </div>
                <div>
                  <span>Travel Insurance</span>
                  <b>Rs. {insuranceTotal.toLocaleString("en-IN")}</b>
                </div>
              </div>

              <button type="button" className="pay-button" onClick={handleProceedToPayment} disabled={submitting}>
                {submitting ? "Confirming Booking..." : "Proceed to Payment"}
              </button>

              <div className="trust-row">
                <span>Secure</span>
                <span>Instant</span>
                <span>Verified</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

const styles = `
  .review-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #ffffff 0, #ffffff 72px, #f6f8fc 72px);
    color: #111827;
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  }

  .review-page.dark {
    background: linear-gradient(180deg, #020617 0, #020617 72px, #0f172a 72px);
    color: #f8fafc;
  }

  button,
  input,
  select {
    font: inherit;
  }

  button {
    cursor: pointer;
  }

  .review-nav {
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 0 max(18px, calc((100vw - 1220px) / 2));
    border-bottom: 1px solid #e8edf5;
    background: #ffffff;
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .review-page.dark .review-nav,
  .review-page.dark .panel,
  .review-page.dark .summary-panel {
    background: rgba(15, 23, 42, 0.96);
    color: #f8fafc;
    border-color: rgba(148, 163, 184, 0.18);
  }

  .review-page.dark .review-links button,
  .review-page.dark .nav-tools button,
  .review-page.dark .back-link,
  .review-page.dark .panel-head p,
  .review-page.dark .page-title p,
  .review-page.dark .traveller-toggle p,
  .review-page.dark .policy-title span,
  .review-page.dark .meal-copy p,
  .review-page.dark .summary-total span,
  .review-page.dark .summary-lines div,
  .review-page.dark .trust-row,
  .review-page.dark label {
    color: #cbd5e1;
  }

  .review-page.dark input,
  .review-page.dark select,
  .review-page.dark .traveller-card,
  .review-page.dark .policy-grid div,
  .review-page.dark .meal-card,
  .review-page.dark .seat-summary-card {
    background: rgba(15, 23, 42, 0.96);
    color: #f8fafc;
    border-color: rgba(148, 163, 184, 0.18);
  }

  .brand,
  .review-links button,
  .nav-tools button,
  .back-link,
  .traveller-toggle,
  .action-btn,
  .meal-select {
    border: 0;
    background: transparent;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 900;
    color: #111827;
  }

  .brand-mark {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: linear-gradient(135deg, #4338ca, #7c3aed);
    color: #ffffff;
    font-size: 14px;
  }

  .review-links {
    display: flex;
    gap: 36px;
  }

  .review-links button,
  .nav-tools button {
    color: #111827;
    font-weight: 800;
  }

  .nav-tools {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .nav-tools span {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #eef2f7;
    display: grid;
    place-items: center;
    font-weight: 900;
  }

  .review-shell {
    max-width: 1220px;
    margin: 0 auto;
    padding: 24px 20px 48px;
  }

  .back-link {
    color: #4b5563;
    font-weight: 800;
    margin-bottom: 16px;
    padding: 0;
  }

  .page-title {
    margin-bottom: 20px;
  }

  .page-title h1 {
    margin: 0 0 8px;
    font-size: 32px;
    line-height: 1.05;
  }

  .page-title p {
    margin: 0;
    color: #6b7280;
    font-weight: 700;
  }

  .status-banner {
    border-radius: 16px;
    background: #fff1f2;
    border: 1px solid #fecdd3;
    color: #be123c;
    padding: 14px 16px;
    font-weight: 800;
    margin-bottom: 18px;
  }

  .review-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 24px;
    align-items: start;
  }

  .review-main {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .panel,
  .summary-panel {
    background: #ffffff;
    border: 1px solid #e6eaf2;
    border-radius: 24px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  }

  .panel {
    padding: 22px;
  }

  .panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .panel-head h2,
  .summary-panel h2,
  .insurance-banner h3,
  .contact-card h3 {
    margin: 0;
    font-size: 22px;
  }

  .panel-head p,
  .summary-panel span,
  .insurance-banner p,
  .traveller-toggle p,
  .policy-title span,
  .meal-copy p {
    margin: 6px 0 0;
    color: #6b7280;
    font-weight: 700;
  }

  .pill {
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 900;
    white-space: nowrap;
  }

  .pill.green {
    background: #dcfce7;
    color: #15803d;
  }

  .pill.blue {
    background: #dbeafe;
    color: #2563eb;
  }

  .pill.orange {
    background: #ffedd5;
    color: #d97706;
  }

  .route-grid {
    display: grid;
    grid-template-columns: 1fr 180px 1fr;
    gap: 16px;
    align-items: center;
  }

  .route-grid strong {
    display: block;
    margin: 10px 0 6px;
    font-size: 36px;
  }

  .route-grid b {
    display: block;
    font-size: 22px;
  }

  .route-grid p,
  .route-grid .muted {
    color: #6b7280;
    font-weight: 700;
  }

  .route-center {
    text-align: center;
    color: #4338ca;
    font-weight: 900;
  }

  .route-center i {
    display: block;
    height: 3px;
    margin: 10px 0;
    border-radius: 999px;
    background: linear-gradient(90deg, #4338ca, #8b5cf6);
  }

  .route-center small {
    color: #16a34a;
  }

  .align-right {
    text-align: right;
  }

  .info-banner {
    border-radius: 18px;
    border: 1px solid #fde68a;
    background: #fffbeb;
    padding: 16px 18px;
    margin-bottom: 16px;
  }

  .info-banner strong {
    display: block;
    margin-bottom: 8px;
  }

  .info-banner ul {
    margin: 0;
    padding-left: 18px;
    color: #92400e;
    font-weight: 700;
  }

  .traveller-card {
    border: 1px solid #e8edf5;
    border-radius: 18px;
    padding: 16px;
    margin-bottom: 14px;
  }

  .traveller-card.completed {
    border-color: #bbf7d0;
    background: #f0fdf4;
  }

  .traveller-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    text-align: left;
    padding: 0;
  }

  .traveller-toggle strong {
    display: block;
    font-size: 20px;
  }

  .traveller-toggle span {
    border-radius: 999px;
    background: #eef2ff;
    color: #4338ca;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 900;
    white-space: nowrap;
  }

  .form-grid,
  .contact-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-top: 16px;
  }

  .contact-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  label {
    color: #334155;
    font-size: 13px;
    font-weight: 800;
  }

  input,
  select {
    width: 100%;
    box-sizing: border-box;
    margin-top: 8px;
    padding: 13px 14px;
    border: 1px solid #dde4ef;
    border-radius: 14px;
    background: #ffffff;
    color: #111827;
    outline: none;
  }

  .contact-card {
    border-top: 1px solid #edf1f7;
    margin-top: 18px;
    padding-top: 18px;
  }

  .phone-grid {
    display: grid;
    grid-template-columns: 90px 1fr;
    gap: 10px;
  }

  .action-btn {
    border-radius: 14px;
    background: #eef2ff;
    color: #4338ca;
    padding: 12px 16px;
    font-weight: 900;
  }

  .seat-summary-list {
    display: grid;
    gap: 12px;
  }

  .seat-summary-card {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    align-items: center;
    border: 1px solid #bbf7d0;
    background: #f0fdf4;
    border-radius: 18px;
    padding: 16px;
  }

  .seat-summary-card span,
  .seat-summary-card small {
    color: #166534;
    font-weight: 700;
  }

  .seat-summary-card strong,
  .seat-summary-card b {
    display: block;
    font-size: 22px;
  }

  .insurance-shell {
    border: 1px solid #dbeafe;
    border-radius: 20px;
    overflow: hidden;
  }

  .insurance-banner {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    padding: 18px 20px;
    background: linear-gradient(135deg, #2563eb, #5b32d6);
    color: white;
  }

  .insurance-banner span {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 900;
  }

  .insurance-cards {
    padding: 18px;
    display: grid;
    gap: 12px;
    background: #fafbff;
  }

  .choice {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: center;
    border: 2px solid #e5e7eb;
    border-radius: 18px;
    background: #ffffff;
    padding: 16px;
    cursor: pointer;
  }

  .choice.active {
    border-color: #2563eb;
    background: #eff6ff;
  }

  .choice.muted-choice {
    border-color: #e5e7eb;
    background: #ffffff;
  }

  .choice input {
    width: 18px;
    height: 18px;
    margin: 0;
  }

  .choice strong {
    display: block;
    margin-bottom: 4px;
  }

  .choice p {
    margin: 0;
    color: #64748b;
    font-weight: 700;
  }

  .choice b {
    font-size: 20px;
  }

  .meal-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .meal-card {
    border: 1px solid #e6eaf2;
    border-radius: 20px;
    overflow: hidden;
    background: #ffffff;
  }

  .meal-card img {
    width: 100%;
    height: 170px;
    object-fit: cover;
    display: block;
  }

  .meal-copy {
    padding: 16px;
  }

  .meal-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }

  .meal-top strong {
    font-size: 18px;
  }

  .meal-top span {
    border-radius: 999px;
    background: #fff7ed;
    color: #ea580c;
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 900;
  }

  .meal-footer {
    margin-top: 14px;
  }

  .meal-footer b {
    font-size: 22px;
  }

  .meal-passenger-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 0 16px 16px;
  }

  .meal-select {
    border-radius: 12px;
    background: #eef2f7;
    color: #0f172a;
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 900;
  }

  .meal-select.active {
    background: #f97316;
    color: #ffffff;
  }

  .policy-card {
    border: 1px solid #e9d5ff;
    border-radius: 18px;
    padding: 18px;
    background: linear-gradient(180deg, #fcf7ff, #ffffff);
  }

  .policy-title strong {
    display: block;
    font-size: 22px;
    margin-bottom: 6px;
  }

  .policy-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-top: 16px;
  }

  .policy-grid div {
    border-radius: 18px;
    background: #ffffff;
    border: 1px solid #ece8ff;
    padding: 16px;
  }

  .policy-grid small,
  .policy-grid span {
    color: #64748b;
    font-weight: 700;
  }

  .policy-grid strong {
    display: block;
    margin: 8px 0 4px;
    font-size: 24px;
    color: #4338ca;
  }

  .bag-qty {
    display: inline-grid;
    grid-template-columns: 34px 40px 34px;
    align-items: center;
    overflow: hidden;
    border: 1px solid #dbe3ef;
    border-radius: 12px;
    margin: 8px 0 6px;
  }

  .bag-qty button {
    border: 0;
    background: #eef2ff;
    color: #4338ca;
    height: 34px;
    font-weight: 900;
  }

  .bag-qty b {
    margin: 0;
    text-align: center;
    font-size: 16px;
    color: #111827;
  }

  .summary-card {
    position: sticky;
    top: 92px;
  }

  .summary-panel {
    padding: 22px;
  }

  .summary-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f1f5ff;
    border-radius: 18px;
    padding: 18px;
    margin: 18px 0;
  }

  .summary-total span {
    color: #64748b;
    font-weight: 700;
  }

  .summary-total strong {
    font-size: 30px;
  }

  .summary-lines {
    border-top: 1px solid #edf1f7;
    border-bottom: 1px solid #edf1f7;
    padding: 10px 0;
  }

  .summary-lines div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    color: #475569;
    font-weight: 700;
  }

  .pay-button {
    width: 100%;
    border: 0;
    border-radius: 16px;
    background: linear-gradient(135deg, #2563eb, #5b32d6);
    color: white;
    padding: 16px;
    margin-top: 18px;
    font-weight: 900;
  }

  .pay-button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .trust-row {
    display: flex;
    justify-content: space-around;
    gap: 10px;
    color: #64748b;
    font-size: 12px;
    font-weight: 900;
    margin-top: 16px;
  }

  @media (max-width: 1040px) {
    .review-layout,
    .route-grid,
    .policy-grid,
    .meal-grid,
    .form-grid,
    .contact-grid {
      grid-template-columns: 1fr;
    }

    .summary-card {
      position: static;
    }

    .align-right {
      text-align: left;
    }
  }

  @media (max-width: 760px) {
    .review-links {
      display: none;
    }

    .review-shell {
      padding: 18px 14px 36px;
    }

    .choice,
    .seat-summary-card {
      grid-template-columns: 1fr;
      text-align: left;
    }
  }
`;

export default BookingReview;
