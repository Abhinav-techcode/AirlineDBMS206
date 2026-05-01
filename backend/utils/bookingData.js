const { pool } = require("../config/db");
const { ensureEntity, quote } = require("./schemaHelper");

const getBookingHistory = async ({ userId = null, bookingIds = [], scheduleId = null, scheduleSeatIds = [] } = {}) => {
  const { schema, entity: bookings } = await ensureEntity("bookings", ["id", "userId", "scheduleId"]);
  const { entity: schedules } = await ensureEntity("schedules", ["id", "flightId"]);
  const { entity: flights } = await ensureEntity("flights", ["id", "number"]);
  const { entity: airports } = await ensureEntity("airports", ["id", "code", "city", "name"]);
  const users = schema.entities.users;

  const tickets = schema.entities.tickets;
  const passengers = schema.entities.passengers;
  const payments = schema.entities.payments;
  const scheduleSeats = schema.entities.scheduleSeats;
  const seats = schema.entities.seats;

  const selectColumns = [
    `b.${quote(bookings.columns.id)} AS booking_id`,
    bookings.columns.reference
      ? `b.${quote(bookings.columns.reference)} AS booking_ref`
      : `b.${quote(bookings.columns.id)} AS booking_ref`,
    bookings.columns.userId ? `b.${quote(bookings.columns.userId)} AS user_id` : "NULL AS user_id",
    bookings.columns.scheduleId
      ? `b.${quote(bookings.columns.scheduleId)} AS schedule_id`
      : "NULL AS schedule_id",
    bookings.columns.instanceId
      ? `b.${quote(bookings.columns.instanceId)} AS instance_id`
      : "NULL AS instance_id",
    bookings.columns.status
      ? `b.${quote(bookings.columns.status)} AS booking_status`
      : "'CONFIRMED' AS booking_status",
    bookings.columns.bookedDate
      ? `b.${quote(bookings.columns.bookedDate)} AS booked_date`
      : "NULL AS booked_date",
    bookings.columns.amount
      ? `b.${quote(bookings.columns.amount)} AS booking_amount`
      : "NULL AS booking_amount",
    bookings.columns.contactEmail
      ? `b.${quote(bookings.columns.contactEmail)} AS contact_email`
      : "NULL AS contact_email",
    bookings.columns.contactMobile
      ? `b.${quote(bookings.columns.contactMobile)} AS contact_mobile`
      : "NULL AS contact_mobile",
    users.table && users.columns.email
      ? `u.${quote(users.columns.email)} AS user_email`
      : "NULL AS user_email",
    `f.${quote(flights.columns.number)} AS flight_number`,
    flights.columns.airlineName
      ? `f.${quote(flights.columns.airlineName)} AS airline_name`
      : "'ZoshAir' AS airline_name",
    flights.columns.aircraftModel
      ? `f.${quote(flights.columns.aircraftModel)} AS aircraft_model`
      : "NULL AS aircraft_model",
    airports.columns.code ? `src.${quote(airports.columns.code)} AS source_code` : "NULL AS source_code",
    airports.columns.city ? `src.${quote(airports.columns.city)} AS source_city` : "NULL AS source_city",
    airports.columns.name ? `src.${quote(airports.columns.name)} AS source_airport` : "NULL AS source_airport",
    airports.columns.code ? `dst.${quote(airports.columns.code)} AS destination_code` : "NULL AS destination_code",
    airports.columns.city ? `dst.${quote(airports.columns.city)} AS destination_city` : "NULL AS destination_city",
    airports.columns.name
      ? `dst.${quote(airports.columns.name)} AS destination_airport`
      : "NULL AS destination_airport",
    schedules.columns.departureTime
      ? `DATE_FORMAT(s.${quote(schedules.columns.departureTime)}, '%H:%i') AS departure_time`
      : "NULL AS departure_time",
    schedules.columns.arrivalTime
      ? `DATE_FORMAT(s.${quote(schedules.columns.arrivalTime)}, '%H:%i') AS arrival_time`
      : "NULL AS arrival_time",
    schedules.columns.date ? `s.${quote(schedules.columns.date)} AS departure_date` : "NULL AS departure_date",
    tickets.table && tickets.columns.id
      ? `t.${quote(tickets.columns.id)} AS ticket_id`
      : "NULL AS ticket_id",
    tickets.table && tickets.columns.ticketNumber
      ? `t.${quote(tickets.columns.ticketNumber)} AS ticket_number`
      : "NULL AS ticket_number",
    tickets.table && tickets.columns.status
      ? `t.${quote(tickets.columns.status)} AS ticket_status`
      : "NULL AS ticket_status",
    passengers.table && passengers.columns.id
      ? `p.${quote(passengers.columns.id)} AS passenger_id`
      : "NULL AS passenger_id",
    passengers.table && passengers.columns.name
      ? `p.${quote(passengers.columns.name)} AS passenger_name`
      : "NULL AS passenger_name",
    passengers.table && passengers.columns.firstName
      ? `p.${quote(passengers.columns.firstName)} AS passenger_first_name`
      : "NULL AS passenger_first_name",
    passengers.table && passengers.columns.lastName
      ? `p.${quote(passengers.columns.lastName)} AS passenger_last_name`
      : "NULL AS passenger_last_name",
    passengers.table && passengers.columns.age
      ? `p.${quote(passengers.columns.age)} AS passenger_age`
      : "NULL AS passenger_age",
    passengers.table && passengers.columns.gender
      ? `p.${quote(passengers.columns.gender)} AS passenger_gender`
      : "NULL AS passenger_gender",
    scheduleSeats.table && scheduleSeats.columns.id
      ? `ss.${quote(scheduleSeats.columns.id)} AS schedule_seat_id`
      : "NULL AS schedule_seat_id",
    seats.table && seats.columns.seatNo
      ? `seat.${quote(seats.columns.seatNo)} AS seat_no`
      : scheduleSeats.table && scheduleSeats.columns.seatNo
        ? `ss.${quote(scheduleSeats.columns.seatNo)} AS seat_no`
        : "NULL AS seat_no",
    payments.table && payments.columns.id
      ? `pay.${quote(payments.columns.id)} AS payment_id`
      : "NULL AS payment_id",
    payments.table && payments.columns.status
      ? `pay.${quote(payments.columns.status)} AS payment_status`
      : "'PENDING' AS payment_status",
    payments.table && payments.columns.method
      ? `pay.${quote(payments.columns.method)} AS payment_method`
      : "NULL AS payment_method",
    payments.table && payments.columns.transactionId
      ? `pay.${quote(payments.columns.transactionId)} AS transaction_id`
      : "NULL AS transaction_id",
    payments.table && payments.columns.amount
      ? `pay.${quote(payments.columns.amount)} AS payment_amount`
      : "NULL AS payment_amount",
  ];

  const joins = [
    `JOIN ${quote(schedules.table)} s ON s.${quote(schedules.columns.id)} = b.${quote(bookings.columns.scheduleId)}`,
    `JOIN ${quote(flights.table)} f ON f.${quote(flights.columns.id)} = s.${quote(schedules.columns.flightId)}`,
  ];

  const sourceAirportId = flights.columns.sourceAirportId || schedules.columns.sourceAirportId;
  const destinationAirportId = flights.columns.destinationAirportId || schedules.columns.destinationAirportId;
  const sourceOwner = flights.columns.sourceAirportId ? "f" : "s";
  const destinationOwner = flights.columns.destinationAirportId ? "f" : "s";

  if (!sourceAirportId || !destinationAirportId) {
    const error = new Error("Unable to resolve airport relationships for booking history queries.");
    error.statusCode = 500;
    throw error;
  }

  joins.push(
    `JOIN ${quote(airports.table)} src ON src.${quote(airports.columns.id)} = ${sourceOwner}.${quote(sourceAirportId)}`,
    `JOIN ${quote(airports.table)} dst ON dst.${quote(airports.columns.id)} = ${destinationOwner}.${quote(destinationAirportId)}`
  );

  if (users.table && users.columns.id && users.columns.email && bookings.columns.userId) {
    joins.push(
      `LEFT JOIN ${quote(users.table)} u ON u.${quote(users.columns.id)} = b.${quote(bookings.columns.userId)}`
    );
  }

  if (tickets.table && tickets.columns.bookingId) {
    joins.push(
      `LEFT JOIN ${quote(tickets.table)} t ON t.${quote(tickets.columns.bookingId)} = b.${quote(bookings.columns.id)}`
    );
  }

  if (passengers.table && passengers.columns.id && tickets.table && tickets.columns.passengerId) {
    joins.push(
      `LEFT JOIN ${quote(passengers.table)} p ON p.${quote(passengers.columns.id)} = t.${quote(tickets.columns.passengerId)}`
    );
  } else if (passengers.table && passengers.columns.bookingId) {
    joins.push(
      `LEFT JOIN ${quote(passengers.table)} p ON p.${quote(passengers.columns.bookingId)} = b.${quote(bookings.columns.id)}`
    );
  }

  if (scheduleSeats.table && scheduleSeats.columns.id && tickets.table && tickets.columns.scheduleSeatId) {
    joins.push(
      `LEFT JOIN ${quote(scheduleSeats.table)} ss ON ss.${quote(scheduleSeats.columns.id)} = t.${quote(
        tickets.columns.scheduleSeatId
      )}`
    );
  }

  if (seats.table && seats.columns.id && scheduleSeats.table && scheduleSeats.columns.seatId) {
    joins.push(
      `LEFT JOIN ${quote(seats.table)} seat ON seat.${quote(seats.columns.id)} = ss.${quote(
        scheduleSeats.columns.seatId
      )}`
    );
  }

  if (payments.table && payments.columns.bookingId) {
    joins.push(
      `LEFT JOIN ${quote(payments.table)} pay ON pay.${quote(payments.columns.bookingId)} = b.${quote(
        bookings.columns.id
      )}`
    );
  }

  const where = [];
  const params = [];

  if (userId != null) {
    where.push(`b.${quote(bookings.columns.userId)} = ?`);
    params.push(userId);
  }

  if (scheduleId != null && bookings.columns.scheduleId) {
    where.push(`b.${quote(bookings.columns.scheduleId)} = ?`);
    params.push(scheduleId);
  }

  if (Array.isArray(bookingIds) && bookingIds.length > 0) {
    where.push(
      `b.${quote(bookings.columns.id)} IN (${bookingIds.map(() => "?").join(", ")})`
    );
    params.push(...bookingIds);
  }

  if (
    Array.isArray(scheduleSeatIds) &&
    scheduleSeatIds.length > 0 &&
    tickets.table &&
    tickets.columns.scheduleSeatId
  ) {
    where.push(
      `t.${quote(tickets.columns.scheduleSeatId)} IN (${scheduleSeatIds.map(() => "?").join(", ")})`
    );
    params.push(...scheduleSeatIds);
  }

  const sql = `
    SELECT
      ${selectColumns.join(",\n      ")}
    FROM ${quote(bookings.table)} b
    ${joins.join("\n    ")}
    ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY b.${quote(bookings.columns.id)} DESC
  `;

  const [rows] = await pool.query(sql, params);
  return formatBookingHistory(rows);
};

const formatBookingHistory = (rows) => {
  const bookings = new Map();

  for (const row of rows) {
    const bookingId = row.booking_id;
    if (!bookings.has(bookingId)) {
      bookings.set(bookingId, {
        id: bookingId,
        booking_id: bookingId,
        booking_ref: row.booking_ref || `BK${bookingId}`,
        user_id: row.user_id,
        schedule_id: row.schedule_id,
        instance_id: row.instance_id,
        flight_number: row.flight_number,
        airline_name: row.airline_name,
        route: `${row.source_city || row.source_code} - ${row.destination_city || row.destination_code}`,
        source_city: row.source_city,
        destination_city: row.destination_city,
        source_airport: row.source_airport,
        destination_airport: row.destination_airport,
        departure_time: row.departure_time,
        arrival_time: row.arrival_time,
        departure_date: row.departure_date,
        amount: Number(row.booking_amount || row.payment_amount || 0),
        status: row.booking_status || "CONFIRMED",
        booking_status: row.booking_status || "CONFIRMED",
        payment_status: row.payment_status || "PENDING",
        payment_method: row.payment_method,
        transaction_id: row.transaction_id,
        booked_date: row.booked_date,
        contact: {
          email: row.contact_email || row.user_email || "",
          mobile: row.contact_mobile || "",
        },
        passengers: [],
        seats: [],
        tickets: [],
      });
    }

    const booking = bookings.get(bookingId);

    if (row.ticket_id && !booking.tickets.some((ticket) => ticket.ticket_id === row.ticket_id)) {
      booking.tickets.push({
        ticket_id: row.ticket_id,
        ticket_number: row.ticket_number,
        status: row.ticket_status,
      });
    }

    const passengerName =
      row.passenger_name ||
      [row.passenger_first_name, row.passenger_last_name].filter(Boolean).join(" ").trim();
    if (
      (row.passenger_id || passengerName) &&
      !booking.passengers.some(
        (passenger) =>
          passenger.passenger_id === row.passenger_id ||
          (passengerName && passenger.name === passengerName)
      )
    ) {
      booking.passengers.push({
        passenger_id: row.passenger_id || null,
        name: passengerName || null,
        age: row.passenger_age != null ? Number(row.passenger_age) : null,
        gender: row.passenger_gender || null,
      });
    }

    if (row.schedule_seat_id && !booking.seats.some((seat) => seat.schedule_seat_id === row.schedule_seat_id)) {
      booking.seats.push({
        schedule_seat_id: row.schedule_seat_id,
        seatNumber: row.seat_no,
        seat_no: row.seat_no,
      });
    } else if (row.seat_no && !booking.seats.some((seat) => seat.seatNumber === row.seat_no)) {
      booking.seats.push({
        schedule_seat_id: row.schedule_seat_id || null,
        seatNumber: row.seat_no,
        seat_no: row.seat_no,
      });
    }
  }

  return Array.from(bookings.values());
};

module.exports = {
  getBookingHistory,
  formatBookingHistory,
};
