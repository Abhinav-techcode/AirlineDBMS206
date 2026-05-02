import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { apiRequest } from "../../utils/api";
import { getCurrentUserId } from "../../utils/session";

const columns = ["A", "B", "C", "D", "E", "F"];

const getSeatPositionFromOrdinal = (ordinal) => {
  const seatOrdinal = Math.max(1, Number(ordinal) || 1);
  const seatIndex = seatOrdinal - 1;

  return {
    rowNumber: Math.floor(seatIndex / columns.length) + 1,
    column: columns[seatIndex % columns.length],
  };
};

const resolveSeatPosition = (seat, index, rawSeatNumber) => {
  const explicitRow = Number(seat?.rowNumber || seat?.row_number || seat?.seat_row || seat?.seatRow || 0);
  const explicitColumn = String(
    seat?.column || seat?.column_name || seat?.seat_column || seat?.seat_label || seat?.seatLabel || ""
  ).toUpperCase();

  if (explicitRow > 0 && columns.includes(explicitColumn)) {
    return {
      rowNumber: explicitRow,
      column: explicitColumn,
    };
  }

  const rowThenColumn = rawSeatNumber.match(/^(\d+)\s*[- ]?\s*([A-Z])$/i);
  if (rowThenColumn) {
    return {
      rowNumber: Number(rowThenColumn[1]),
      column: String(rowThenColumn[2]).toUpperCase(),
    };
  }

  const columnThenRow = rawSeatNumber.match(/^([A-Z])\s*[- ]?\s*(\d+)$/i);
  if (columnThenRow && columns.includes(String(columnThenRow[1]).toUpperCase())) {
    return {
      rowNumber: Number(columnThenRow[2]),
      column: String(columnThenRow[1]).toUpperCase(),
    };
  }

  const ordinalMatch = rawSeatNumber.match(/(\d+)/);
  if (ordinalMatch) {
    return getSeatPositionFromOrdinal(Number(ordinalMatch[1]));
  }

  return getSeatPositionFromOrdinal(index + 1);
};

const createSeatMeta = (seat, index) => {
  const rawSeatNumber = String(seat?.seat_no || seat?.seatNumber || "").trim();
  const { rowNumber, column } = resolveSeatPosition(seat, index, rawSeatNumber);
  const isWindow = column === "A" || column === "F";
  const isExtraLegroom = rowNumber === 1 || rowNumber === 12;

  return {
    schedule_seat_id: seat.schedule_seat_id,
    seatNumber: rawSeatNumber,
    seat_no: rawSeatNumber,
    rowNumber,
    column,
    price: Number(seat.price || 0),
    isWindow,
    isExtraLegroom,
    status: seat.status || "available",
  };
};

const buildSeatMap = (apiSeats) => {
  const realSeats = Array.isArray(apiSeats) ? apiSeats.map((seat, index) => createSeatMeta(seat, index)) : [];
  const rowMap = realSeats.reduce((accumulator, seat) => {
    const key = seat.rowNumber || 0;
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(seat);
    return accumulator;
  }, {});

  return Object.keys(rowMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((rowNumber) =>
      columns.map((column) => {
        const existingSeat = rowMap[rowNumber].find((seat) => seat.column === column);
        if (existingSeat) {
          return existingSeat;
        }

        return {
          schedule_seat_id: null,
          seatNumber: `${rowNumber}${column}`,
          seat_no: `${rowNumber}${column}`,
          rowNumber,
          column,
          price: 0,
          isWindow: column === "A" || column === "F",
          isExtraLegroom: rowNumber === 1 || rowNumber === 12,
          status: "occupied",
        };
      })
    );
};

const SeatSelection = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const currentUserId = getCurrentUserId();

  const passengerCount = Math.max(1, Number(state?.travelers || state?.passengerCount || 2));
  const flight = state?.flight || {
    code: state?.flight_number || "N/A",
    aircraft: state?.aircraft || "N/A",
    from: state?.from || "N/A",
    to: state?.to || "N/A",
    cabin: (state?.travelClass || "Economy").toUpperCase(),
  };

  const passengerTabs = useMemo(
    () =>
      Array.from({ length: passengerCount }, (_, index) => ({
        id: index + 1,
        label: `Passenger ${index + 1}`,
      })),
    [passengerCount]
  );

  const [activePassenger, setActivePassenger] = useState(1);
  const [seatRows, setSeatRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [lockingSeatId, setLockingSeatId] = useState(null);
  const [lockExpiry, setLockExpiry] = useState(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const lockTimerRef = useRef(null);
  const [passengerSeats, setPassengerSeats] = useState(() =>
    passengerTabs.reduce((accumulator, passenger) => {
      accumulator[passenger.id] = null;
      return accumulator;
    }, {})
  );

  // --- Lock countdown timer ---
  const clearLockTimer = useCallback(() => {
    if (lockTimerRef.current) {
      clearInterval(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!lockExpiry) {
      setLockCountdown(0);
      clearLockTimer();
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(lockExpiry).getTime() - Date.now()) / 1000));
      setLockCountdown(remaining);
      if (remaining <= 0) {
        clearLockTimer();
        setLockExpiry(null);
        setPassengerSeats((current) => {
          const next = {};
          for (const key of Object.keys(current)) next[key] = null;
          return next;
        });
        setErrorMessage("Seat lock expired. Please re-select your seats.");
      }
    };
    tick();
    lockTimerRef.current = setInterval(tick, 1000);
    return clearLockTimer;
  }, [lockExpiry, clearLockTimer]);

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const selectedSeats = useMemo(() => Object.values(passengerSeats).filter(Boolean), [passengerSeats]);

  useEffect(() => {
    let ignore = false;

    const loadSeats = async () => {
      if (!state?.schedule_id) {
        setLoading(false);
        setErrorMessage("A schedule must be selected before choosing seats.");
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const response = await apiRequest(`/seats/${state.schedule_id}`);
        if (!ignore) {
          setSeatRows(buildSeatMap(response?.seats));
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message || "Unable to load seats.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadSeats();

    return () => {
      ignore = true;
    };
  }, [state?.schedule_id]);

  const selectSeat = async (seat) => {
    const alreadyAssigned = passengerSeats[activePassenger]?.seatNumber === seat.seatNumber;

    if (alreadyAssigned) {
      setPassengerSeats((current) => ({
        ...current,
        [activePassenger]: null,
      }));
      return;
    }

    if (seat.status !== "available" || !seat.schedule_seat_id) {
      return;
    }

    if (!currentUserId) {
      setErrorMessage("Please sign in before selecting seats.");
      return;
    }

    setLockingSeatId(seat.schedule_seat_id);
    setErrorMessage("");

    try {
      const lockResponse = await apiRequest("/seats/lock", {
        method: "POST",
        body: {
          user_id: currentUserId,
          schedule_id: state?.schedule_id,
          schedule_seat_id: seat.schedule_seat_id,
        },
      });

      // Start / refresh 5-minute lock countdown
      const expiresAt = lockResponse?.expires_at || lockResponse?.data?.expires_at;
      if (expiresAt) {
        setLockExpiry(expiresAt);
      } else {
        setLockExpiry(new Date(Date.now() + 5 * 60 * 1000).toISOString());
      }

      setPassengerSeats((current) => {
        const next = { ...current };
        const existingPassenger = Number(
          Object.entries(next).find(([, assignedSeat]) => assignedSeat?.seatNumber === seat.seatNumber)?.[0]
        );

        if (existingPassenger) {
          next[existingPassenger] = null;
        }

        next[activePassenger] = {
          schedule_seat_id: seat.schedule_seat_id,
          seatNumber: seat.seatNumber,
          seat_no: seat.seat_no,
          price: seat.price,
          rowNumber: seat.rowNumber,
          column: seat.column,
          type: seat.isExtraLegroom ? "Extra Legroom" : seat.isWindow ? "Window" : "Standard",
        };

        return next;
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to lock this seat.");
    } finally {
      setLockingSeatId(null);
    }
  };

  const continueToBooking = () => {
    navigate("/booking-review", {
      state: {
        ...state,
        passengerCount,
        flight,
        schedule_id: state?.schedule_id,
        selectedSeats: passengerTabs.map((passenger) => ({
          passengerId: passenger.id,
          passengerLabel: passenger.label,
          ...passengerSeats[passenger.id],
        })),
      },
    });
  };

  const allPassengersSeated = selectedSeats.length === passengerCount;

  return (
    <div className="seat-page">
      <style>{styles}</style>

      <div className="seat-modal">
        <header className="modal-header">
          <div>
            <h1>Select Seats</h1>
            <p>
              {selectedSeats.length} of {passengerCount} passengers assigned
            </p>
          </div>
          <button type="button" onClick={() => navigate("/flights", { state })}>
            X
          </button>
        </header>

        <div className="passenger-tabs">
          {passengerTabs.map((passenger) => (
            <button
              key={passenger.id}
              type="button"
              className={activePassenger === passenger.id ? "active" : ""}
              onClick={() => setActivePassenger(passenger.id)}
            >
              {passenger.label}
              {passengerSeats[passenger.id]?.seatNumber ? (
                <span>{passengerSeats[passenger.id].seatNumber}</span>
              ) : null}
            </button>
          ))}
        </div>

        <section className="flight-strip">
          <strong>{flight.code}</strong>
          <span>
            {flight.from} → {flight.to} - {flight.aircraft} - {flight.cabin}
          </span>
        </section>

        {errorMessage ? <div className="status-banner error">{errorMessage}</div> : null}
        {loading ? <div className="status-banner">Loading live seat map...</div> : null}
        {lockCountdown > 0 ? (
          <div className="status-banner lock-timer">
            ⏱ Seat lock expires in <strong>{formatCountdown(lockCountdown)}</strong> — complete your selection before time runs out.
          </div>
        ) : null}

        <div className="legend">
          <span><i className="available" />Available</span>
          <span><i className="occupied" />Booked</span>
          <span><i className="locked-legend" />Locked</span>
          <span><i className="selected" />Selected</span>
          <span><i className="window" />Window</span>
          <span><i className="legroom" />Extra Legroom</span>
        </div>

        <section className="plane-shell">
          <div className="plane-nose">Front</div>
          <div className="seat-map-wrap">
            <div className="seat-map">
              <div className="column-labels">
                <span />
                <b>A</b><b>B</b><b>C</b>
                <i />
                <b>D</b><b>E</b><b>F</b>
                <span />
              </div>

              {seatRows.map((row) => (
                <div className="seat-row" key={row[0].rowNumber}>
                  <span className="row-number">{row[0].rowNumber}</span>

                  {row.map((seat, index) => {
                    const assignedPassenger = passengerTabs.find(
                      (passenger) => passengerSeats[passenger.id]?.seatNumber === seat.seatNumber
                    );

                    const statusClass = seat.status === "locked" ? "locked-seat"
                      : seat.status === "occupied" ? "occupied"
                      : "available";
                    const seatClass = [
                      "seat",
                      statusClass,
                      assignedPassenger ? "selected" : "",
                      seat.isWindow ? "window" : "",
                      seat.isExtraLegroom ? "legroom" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <React.Fragment key={seat.seatNumber}>
                        {index === 3 ? <span className="aisle">aisle</span> : null}
                        <button
                          type="button"
                          className={seatClass}
                          disabled={
                            loading ||
                            lockingSeatId === seat.schedule_seat_id ||
                            (seat.status !== "available" && !assignedPassenger)
                          }
                          onClick={() => selectSeat(seat)}
                        >
                          <strong>
                            {lockingSeatId === seat.schedule_seat_id ? "..." : assignedPassenger ? assignedPassenger.id : seat.column}
                          </strong>
                          <small>Rs. {seat.price}</small>
                        </button>
                      </React.Fragment>
                    );
                  })}

                  <span className="row-number right">{row[0].rowNumber}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="selected-panel">
          <div>
            <h2>Passenger Seat Summary</h2>
            <p>
              Each selected seat is now locked against the live backend before you continue to booking.
            </p>
          </div>

          <div className="selected-list">
            {passengerTabs.map((passenger) => (
              <div key={passenger.id} className={passengerSeats[passenger.id] ? "filled" : ""}>
                <span>{passenger.label}</span>
                <strong>{passengerSeats[passenger.id]?.seatNumber || "Not selected"}</strong>
                <small>{passengerSeats[passenger.id]?.type || "Choose a seat"}</small>
              </div>
            ))}
          </div>
        </section>

        <footer className="seat-actions">
          <button type="button" onClick={() => navigate("/flights", { state })}>
            Back to Results
          </button>
          <button type="button" disabled={!allPassengersSeated || loading} onClick={continueToBooking}>
            Continue to Booking
          </button>
        </footer>
      </div>
    </div>
  );
};

const styles = `
  .seat-page {
    min-height: 100vh;
    background: #eef2f7;
    color: #111827;
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
    display: grid;
    place-items: start center;
    padding: 38px 18px;
  }

  button {
    font: inherit;
    cursor: pointer;
  }

  .seat-modal {
    width: min(900px, 100%);
    max-height: calc(100vh - 76px);
    overflow: auto;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.22);
    padding: 24px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 18px;
  }

  .modal-header h1 {
    margin: 0;
    font-size: 28px;
  }

  .modal-header p {
    margin: 8px 0 0;
    color: #6b7280;
    font-weight: 700;
  }

  .modal-header button {
    width: 34px;
    height: 34px;
    border: 0;
    background: transparent;
    color: #6b7280;
    font-weight: 900;
    font-size: 22px;
  }

  .passenger-tabs {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  .passenger-tabs button {
    border: 1px solid #dfe4ed;
    background: #ffffff;
    color: #374151;
    border-radius: 10px;
    padding: 11px 18px;
    font-weight: 900;
  }

  .passenger-tabs button.active {
    border-color: #7048e8;
    color: #5b32d6;
    background: #f8f7ff;
  }

  .passenger-tabs span {
    margin-left: 8px;
    color: #16a34a;
  }

  .flight-strip {
    display: flex;
    flex-direction: column;
    gap: 5px;
    border: 1px solid #dbeafe;
    background: #eff6ff;
    border-radius: 12px;
    padding: 15px 18px;
    margin-bottom: 18px;
  }

  .flight-strip span {
    color: #6b7280;
    font-weight: 700;
  }

  .status-banner {
    border-radius: 12px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
    padding: 12px 14px;
    font-weight: 800;
    margin-bottom: 16px;
  }

  .status-banner.error {
    background: #fff1f2;
    border-color: #fecdd3;
    color: #be123c;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    align-items: center;
    margin-bottom: 20px;
    color: #4b5563;
    font-size: 13px;
    font-weight: 800;
  }

  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .legend i {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    border: 2px solid #dfe4ed;
    background: #ffffff;
  }

  .legend .occupied {
    background: #fca5a5;
    border-color: #ef4444;
  }

  .legend .locked-legend {
    background: #fde68a;
    border-color: #f59e0b;
  }

  .legend .selected {
    background: #2563eb;
    border-color: #2563eb;
  }

  .legend .window {
    border-color: #d8b4fe;
    background: #faf5ff;
  }

  .legend .legroom {
    border-color: #86efac;
    background: #f0fdf4;
  }

  .plane-shell {
    border: 1px solid #e6e9f2;
    border-radius: 130px 130px 26px 26px;
    padding: 22px 22px 26px;
    background: linear-gradient(180deg, #fbfdff, #f8fafc);
  }

  .plane-nose {
    width: 180px;
    height: 58px;
    margin: 0 auto 18px;
    border-radius: 90px 90px 18px 18px;
    background: #eef2ff;
    display: grid;
    place-items: center;
    color: #7048e8;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .seat-map-wrap {
    overflow-x: auto;
  }

  .seat-map {
    width: max-content;
    min-width: 620px;
    margin: 0 auto;
  }

  .column-labels,
  .seat-row {
    display: grid;
    grid-template-columns: 26px repeat(3, 58px) 54px repeat(3, 58px) 26px;
    gap: 10px;
    align-items: center;
    margin-bottom: 10px;
  }

  .column-labels {
    color: #6b7280;
    font-size: 12px;
    text-align: center;
  }

  .row-number {
    color: #4b5563;
    font-size: 13px;
    font-weight: 900;
    text-align: right;
  }

  .row-number.right {
    text-align: left;
  }

  .aisle {
    color: #cbd5e1;
    font-size: 10px;
    text-transform: uppercase;
    writing-mode: vertical-rl;
    text-align: center;
    justify-self: center;
  }

  .seat {
    height: 54px;
    border: 2px solid #dfe4ed;
    border-radius: 10px;
    background: #ffffff;
    display: grid;
    place-items: center;
    color: #111827;
    transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
  }

  .seat strong {
    font-size: 14px;
    line-height: 1;
  }

  .seat small {
    color: #4b5563;
    font-size: 10px;
    font-weight: 800;
  }

  .seat.available:hover {
    transform: translateY(-3px);
    border-color: #7048e8;
    box-shadow: 0 12px 22px rgba(112, 72, 232, 0.18);
  }

  .seat.occupied {
    background: #fecaca;
    border-color: #ef4444;
    color: #991b1b;
    cursor: not-allowed;
  }

  .seat.locked-seat {
    background: #fef3c7;
    border-color: #f59e0b;
    color: #92400e;
    cursor: not-allowed;
  }

  .seat.occupied small {
    color: #9ca3af;
  }

  .seat.selected {
    background: #2563eb;
    border-color: #2563eb;
    color: #ffffff;
  }

  .seat.selected small {
    color: #dbeafe;
  }

  .seat.window:not(.selected):not(.occupied) {
    border-color: #d8b4fe;
    background: #faf5ff;
  }

  .seat.legroom:not(.selected):not(.occupied) {
    border-color: #86efac;
  }

  .selected-panel {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 18px;
    border: 1px solid #dbeafe;
    background: #f8fbff;
    border-radius: 12px;
    padding: 18px;
    margin-top: 20px;
  }

  .selected-panel h2 {
    margin: 0 0 8px;
    font-size: 18px;
  }

  .selected-panel p {
    margin: 0;
    color: #6b7280;
    font-weight: 700;
    line-height: 1.6;
  }

  .selected-list {
    display: grid;
    gap: 10px;
  }

  .selected-list div {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    align-items: center;
    border-radius: 10px;
    background: #ffffff;
    border: 1px solid #e6e9f2;
    padding: 12px;
    font-weight: 800;
  }

  .selected-list div.filled {
    border-color: #bbf7d0;
    background: #f0fdf4;
  }

  .selected-list strong {
    color: #16a34a;
  }

  .selected-list small {
    color: #64748b;
  }

  .seat-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 22px;
  }

  .seat-actions button {
    border-radius: 10px;
    padding: 13px 18px;
    font-weight: 900;
  }

  .seat-actions button:first-child {
    border: 1px solid #dfe4ed;
    background: #ffffff;
    color: #374151;
  }

  .seat-actions button:last-child {
    border: 0;
    background: #5b32d6;
    color: #ffffff;
  }

  .seat-actions button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  @media (max-width: 720px) {
    .seat-page {
      padding: 16px 10px;
    }

    .seat-modal {
      max-height: none;
      padding: 18px;
    }

    .selected-panel {
      grid-template-columns: 1fr;
    }

    .selected-list div {
      grid-template-columns: 1fr;
    }

    .seat-actions {
      flex-direction: column;
    }
  }
`;

export default SeatSelection;
