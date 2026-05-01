import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const cabins = ["Economy", "Premium Economy", "Business", "First"];

const FareSelection = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const flight = state?.flight || {
    airline: "ZoshAir",
    code: state?.flight_number || "AI101",
    from: state?.from || "DEL",
    to: state?.to || "BOM",
    depart: "10:00",
    arrive: "12:00",
    price: 5000,
  };

  const [selectedFare, setSelectedFare] = useState("standard");
  const [selectedCabin, setSelectedCabin] = useState(state?.travelClass || "Economy");
  const [expandedFare, setExpandedFare] = useState("standard");

  const fareOptions = useMemo(() => {
    const basePrice = Number(flight.price || 5000);

    return [
      {
        id: "saver",
        name: "Saver",
        price: basePrice,
        tag: "Lowest",
        groups: [
          { title: "Refund", details: "Non-refundable after booking confirmation" },
          { title: "Baggage", details: "15 kg check-in + 7 kg cabin" },
        ],
      },
      {
        id: "standard",
        name: "Standard",
        price: basePrice + 900,
        tag: "Popular",
        groups: [
          { title: "Refund", details: "Partial refund with airline fee deduction" },
          { title: "Baggage", details: "20 kg check-in + 7 kg cabin" },
        ],
      },
      {
        id: "flex",
        name: "Flex",
        price: basePrice + 1900,
        tag: "Best Flexibility",
        groups: [
          { title: "Refund", details: "Priority refund and one free date change" },
          { title: "Baggage", details: "25 kg check-in + 7 kg cabin" },
        ],
      },
    ];
  }, [flight.price]);

  const selectedFareOption = fareOptions.find((fare) => fare.id === selectedFare) || fareOptions[1];

  return (
    <div className="fare-page">
      <style>{styles}</style>

      <section className="fare-modal">
        <header className="fare-header">
          <div className="title-row">
            <span className="title-icon">ZA</span>
            <div>
              <h1>Select Your Fare</h1>
              <p>Choose the bundle you want before continuing to seat selection.</p>
            </div>
          </div>
          <button className="close-button" type="button" onClick={() => navigate("/flights", { state })}>
            x
          </button>
        </header>

        <section className="trip-card">
          <div>
            <strong>{flight.from}</strong>
            <span>{state?.departureDate || "Flexible Date"}</span>
          </div>
          <div className="plane-mark">
            <span>{flight.depart} - {flight.arrive}</span>
            <small>Non-stop</small>
          </div>
          <div>
            <strong>{flight.to}</strong>
            <span>{state?.departureDate || "Flexible Date"}</span>
          </div>
          <div className="flight-chip">
            <span>{flight.airline}</span>
            <b>{flight.code}</b>
          </div>
        </section>

        <nav className="cabin-tabs">
          {cabins.map((cabin) => (
            <button
              key={cabin}
              type="button"
              className={selectedCabin === cabin ? "active" : ""}
              onClick={() => setSelectedCabin(cabin)}
            >
              {cabin}
            </button>
          ))}
        </nav>

        <section className="fare-grid">
          {fareOptions.map((fare) => {
            const active = selectedFare === fare.id;
            const expanded = expandedFare === fare.id;

            return (
              <article className={active ? "fare-card active" : "fare-card"} key={fare.id}>
                <button className="fare-top" type="button" onClick={() => setSelectedFare(fare.id)}>
                  <span className="select-dot" />
                  <div>
                    <h2>{fare.name}</h2>
                    {fare.tag ? <em>{fare.tag}</em> : null}
                  </div>
                  <div className="price-block">
                    <strong>Rs. {fare.price.toLocaleString("en-IN")}</strong>
                    <small>{selectedCabin}</small>
                  </div>
                </button>

                <button
                  className="breakdown-button"
                  type="button"
                  onClick={() => setExpandedFare((current) => (current === fare.id ? "" : fare.id))}
                >
                  <span>{expanded ? "Hide price breakdown" : "View price breakdown"}</span>
                  <b>{expanded ? "^" : "v"}</b>
                </button>

                {expanded ? (
                  <div className="breakdown-panel">
                    <div>
                      <span>Base Fare</span>
                      <strong>Rs. {Number(flight.price || 0).toLocaleString("en-IN")}</strong>
                    </div>
                    <div>
                      <span>Taxes & Fees</span>
                      <strong>Rs. {Math.max(fare.price - Number(flight.price || 0), 0).toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="total-row">
                      <span>Total Amount</span>
                      <strong>Rs. {fare.price.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                ) : null}

                <h3>Included</h3>
                {fare.groups.map((group) => (
                  <div className="feature-group" key={group.title}>
                    <h4>{group.title}</h4>
                    <div className="feature-row">
                      <span className="state-ok">OK</span>
                      <div>
                        <strong>{group.title}</strong>
                        <small>{group.details}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </article>
            );
          })}
        </section>

        <footer className="fare-footer">
          <button type="button" onClick={() => navigate("/flights", { state })}>
            Back
          </button>
          <button
            type="button"
            onClick={() =>
              navigate("/seats", {
                state: {
                  ...state,
                  selectedFare: selectedFareOption.name,
                  farePrice: selectedFareOption.price,
                  travelClass: selectedCabin,
                },
              })
            }
          >
            Continue
          </button>
        </footer>
      </section>
    </div>
  );
};

const styles = `
  .fare-page {
    min-height: 100vh;
    background: rgba(17, 24, 39, 0.58);
    color: #111827;
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
    padding: 28px 18px;
    display: grid;
    place-items: start center;
  }

  button {
    font: inherit;
    cursor: pointer;
  }

  .fare-modal {
    width: min(1020px, 100%);
    max-height: calc(100vh - 56px);
    overflow: auto;
    background: #ffffff;
    border-radius: 18px;
    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.32);
    padding: 22px;
  }

  .fare-header,
  .title-row,
  .fare-top,
  .fare-footer,
  .trip-card {
    display: flex;
    align-items: center;
  }

  .fare-header,
  .fare-footer {
    justify-content: space-between;
    gap: 18px;
  }

  .title-row {
    gap: 14px;
    align-items: flex-start;
  }

  .title-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    color: #ffffff;
    display: grid;
    place-items: center;
    font-weight: 900;
  }

  .fare-header h1 {
    margin: 0 0 8px;
    font-size: 30px;
  }

  .fare-header p,
  .trip-card span,
  .trip-card small,
  .feature-row small {
    margin: 0;
    color: #6b7280;
    font-weight: 700;
  }

  .close-button {
    border: 0;
    background: transparent;
    color: #6b7280;
    font-size: 20px;
    font-weight: 900;
  }

  .trip-card {
    display: grid;
    grid-template-columns: 1fr 140px 1fr auto;
    gap: 18px;
    border: 1px solid #dbe3ef;
    border-radius: 18px;
    background: linear-gradient(90deg, #f8fbff, #fbf8ff);
    padding: 16px 24px;
    margin: 24px 0;
  }

  .trip-card strong {
    display: block;
    color: #2563eb;
    font-size: 28px;
    line-height: 1;
  }

  .trip-card div:nth-child(3) strong {
    color: #7c3aed;
  }

  .plane-mark {
    text-align: center;
  }

  .plane-mark span {
    color: #2563eb;
    display: block;
    font-size: 13px;
    font-weight: 900;
  }

  .flight-chip {
    text-align: right;
  }

  .flight-chip b {
    display: inline-block;
    border: 1px solid #dfe4ed;
    border-radius: 999px;
    padding: 7px 13px;
    margin-top: 6px;
    font-size: 12px;
  }

  .cabin-tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .cabin-tabs button {
    border: 0;
    background: #ffffff;
    padding: 16px;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .cabin-tabs button.active {
    background: #111827;
    color: #ffffff;
  }

  .fare-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }

  .fare-card {
    border: 2px solid #e5e7eb;
    border-radius: 18px;
    background: #ffffff;
    min-height: 520px;
    padding: 18px;
  }

  .fare-card.active {
    border-color: #5b32d6;
    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
  }

  .fare-top {
    width: 100%;
    border: 0;
    background: transparent;
    padding: 0 0 18px;
    border-bottom: 1px solid #e5e7eb;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    text-align: left;
    align-items: start;
  }

  .select-dot {
    width: 18px;
    height: 18px;
    border: 2px solid #cbd5e1;
    border-radius: 50%;
    margin-top: 6px;
  }

  .fare-card.active .select-dot {
    background: #6b7280;
    border-color: #6b7280;
    box-shadow: inset 0 0 0 4px #ffffff;
  }

  .fare-top h2 {
    margin: 0;
    font-size: 26px;
  }

  .fare-top em {
    display: inline-block;
    border-radius: 6px;
    background: #2563eb;
    color: #ffffff;
    padding: 4px 9px;
    margin-top: 8px;
    font-size: 11px;
    font-style: normal;
    font-weight: 900;
    text-transform: uppercase;
  }

  .price-block {
    text-align: right;
  }

  .price-block strong {
    display: block;
    font-size: 28px;
  }

  .price-block small {
    display: inline-block;
    border-radius: 999px;
    background: #f3f4f6;
    padding: 5px 9px;
    margin-top: 8px;
    color: #374151;
    font-size: 11px;
    font-weight: 800;
  }

  .breakdown-button {
    width: 100%;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    border-radius: 14px;
    padding: 13px 14px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin: 18px 0;
    color: #374151;
    font-weight: 900;
  }

  .breakdown-panel {
    border: 1px solid #dbeafe;
    background: #eff6ff;
    border-radius: 14px;
    padding: 14px;
    margin-bottom: 18px;
  }

  .breakdown-panel div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    background: #ffffff;
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 12px;
    font-weight: 800;
  }

  .breakdown-panel .total-row {
    background: linear-gradient(135deg, #2563eb, #5b32d6);
    color: #ffffff;
    margin-bottom: 0;
    font-size: 18px;
  }

  .fare-card h3 {
    margin: 0 0 14px;
    font-size: 18px;
  }

  .feature-group {
    border: 1px solid #bbf7d0;
    background: #f0fdf4;
    border-radius: 14px;
    padding: 14px;
    margin-bottom: 14px;
  }

  .feature-group h4 {
    margin: 0 0 12px;
    font-size: 13px;
    text-transform: uppercase;
  }

  .feature-row {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    background: #ffffff;
    border-radius: 12px;
    padding: 12px;
  }

  .state-ok {
    color: #16a34a;
    font-weight: 900;
  }

  .fare-footer {
    justify-content: flex-end;
    gap: 12px;
    border-top: 1px solid #edf0f6;
    padding-top: 18px;
    margin-top: 18px;
    position: sticky;
    bottom: -22px;
    background: #ffffff;
  }

  .fare-footer button {
    border-radius: 14px;
    padding: 13px 18px;
    font-weight: 900;
  }

  .fare-footer button:first-child {
    border: 1px solid #dfe4ed;
    background: #ffffff;
  }

  .fare-footer button:last-child {
    border: 0;
    background: #5b32d6;
    color: #ffffff;
  }

  @media (max-width: 900px) {
    .fare-grid,
    .trip-card,
    .cabin-tabs {
      grid-template-columns: 1fr;
    }

    .fare-card {
      min-height: 0;
    }
  }
`;

export default FareSelection;
