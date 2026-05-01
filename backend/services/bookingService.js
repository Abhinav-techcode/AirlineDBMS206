const crypto = require("crypto");

const { pool } = require("../config/db");
const { getBookingHistory } = require("../utils/bookingData");
const { ensureInstanceForSchedule } = require("../utils/seatLayout");

const buildTicketNumber = () => `TKT-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

const buildBookingReference = async (connection) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `ZA${Date.now().toString(36).toUpperCase()}${crypto
      .randomBytes(2)
      .toString("hex")
      .toUpperCase()}`.slice(0, 12);

    const [rows] = await connection.query(
      `
        SELECT booking_id
        FROM booking
        WHERE booking_ref = ?
        LIMIT 1
      `,
      [candidate]
    );

    if (rows.length === 0) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique booking reference right now.");
};

const resolveSeatRows = async (connection, scheduleId, passengers, userId) => {
  if (!Array.isArray(passengers) || passengers.length === 0) {
    const error = new Error("At least one passenger is required.");
    error.statusCode = 400;
    throw error;
  }

  const requestedSeatIds = passengers
    .map((passenger) => Number(passenger.schedule_seat_id || 0))
    .filter(Boolean);

  let seatRows = [];

  if (requestedSeatIds.length > 0) {
    const placeholders = requestedSeatIds.map(() => "?").join(", ");
    const [rows] = await connection.query(
      `
        SELECT
          ss.schedule_seat_id,
          ss.status,
          seat.seat_no,
          sl.user_id AS lock_user_id,
          sl.lock_expiry_time
        FROM schedule_seat ss
        JOIN seat ON seat.seat_id = ss.seat_id
        LEFT JOIN seat_lock sl
          ON sl.schedule_seat_id = ss.schedule_seat_id
         AND sl.lock_expiry_time > NOW()
        WHERE ss.schedule_id = ?
          AND ss.schedule_seat_id IN (${placeholders})
        FOR UPDATE
      `,
      [scheduleId, ...requestedSeatIds]
    );

    seatRows = rows;
  } else {
    const [rows] = await connection.query(
      `
        SELECT
          ss.schedule_seat_id,
          ss.status,
          seat.seat_no,
          sl.user_id AS lock_user_id,
          sl.lock_expiry_time
        FROM schedule_seat ss
        JOIN seat ON seat.seat_id = ss.seat_id
        LEFT JOIN seat_lock sl
          ON sl.schedule_seat_id = ss.schedule_seat_id
         AND sl.lock_expiry_time > NOW()
        WHERE ss.schedule_id = ?
          AND UPPER(ss.status) = 'AVAILABLE'
          AND (sl.lock_id IS NULL OR sl.user_id = ?)
        ORDER BY seat.seat_row ASC, seat.seat_label ASC
        LIMIT ?
        FOR UPDATE
      `,
      [scheduleId, userId, passengers.length]
    );

    seatRows = rows;
  }

  if (seatRows.length < passengers.length) {
    const error = new Error("Not enough seats are available for this booking.");
    error.statusCode = 409;
    throw error;
  }

  const seatRowsById = new Map(seatRows.map((row) => [Number(row.schedule_seat_id), row]));

  return passengers.map((passenger, index) => {
    const seatRow =
      passenger.schedule_seat_id != null
        ? seatRowsById.get(Number(passenger.schedule_seat_id))
        : seatRows[index];

    if (!seatRow) {
      const error = new Error("One or more selected seats could not be resolved.");
      error.statusCode = 404;
      throw error;
    }

    if (String(seatRow.status || "").toUpperCase() === "BOOKED") {
      const error = new Error(`Seat ${seatRow.seat_no} is no longer available.`);
      error.statusCode = 409;
      throw error;
    }

    if (
      seatRow.lock_user_id != null &&
      Number(seatRow.lock_user_id) !== Number(userId)
    ) {
      const error = new Error(`Seat ${seatRow.seat_no} is currently locked by another user.`);
      error.statusCode = 409;
      throw error;
    }

    return {
      ...seatRow,
      passenger,
    };
  });
};

const createBookingWithSeats = async ({
  userId,
  scheduleId,
  passengers,
  contact = {},
  amount = 0,
  instanceId = null,
  departureDate = null,
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [scheduleRows] = await connection.query(
      `
        SELECT schedule_id, flight_id, date
        FROM schedule
        WHERE schedule_id = ?
        LIMIT 1
      `,
      [scheduleId]
    );

    if (!scheduleRows[0]) {
      const error = new Error("Schedule not found.");
      error.statusCode = 404;
      throw error;
    }

    let resolvedInstance = null;
    if (instanceId) {
      const [instanceRows] = await connection.query(
        `
          SELECT *
          FROM flight_instance
          WHERE instance_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [instanceId]
      );

      if (!instanceRows[0]) {
        const error = new Error("Flight instance not found.");
        error.statusCode = 404;
        throw error;
      }

      resolvedInstance = instanceRows[0];
    } else {
      resolvedInstance = await ensureInstanceForSchedule(
        connection,
        scheduleId,
        departureDate || scheduleRows[0].date
      );
    }

    if (Number(resolvedInstance.available_seats || 0) < passengers.length) {
      const error = new Error("Not enough seats are available on this instance.");
      error.statusCode = 409;
      throw error;
    }

    const seatAssignments = await resolveSeatRows(connection, scheduleId, passengers, userId);
    const bookingRef = await buildBookingReference(connection);

    const [bookingResult] = await connection.query(
      `
        INSERT INTO booking (
          booking_ref,
          user_id,
          schedule_id,
          instance_id,
          total_amount,
          status,
          payment_status,
          contact_email,
          contact_mobile
        )
        VALUES (?, ?, ?, ?, ?, 'CONFIRMED', 'PENDING', ?, ?)
      `,
      [
        bookingRef,
        userId,
        scheduleId,
        resolvedInstance.instance_id,
        Number(amount || 0),
        contact.email || null,
        contact.mobile || null,
      ]
    );

    const bookingId = bookingResult.insertId;

    for (const seatAssignment of seatAssignments) {
      const passengerName =
        seatAssignment.passenger.name ||
        [
          seatAssignment.passenger.title,
          seatAssignment.passenger.firstName,
          seatAssignment.passenger.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

      if (!passengerName) {
        const error = new Error("Each passenger must include a name.");
        error.statusCode = 400;
        throw error;
      }

      const [passengerResult] = await connection.query(
        `
          INSERT INTO passenger (booking_id, name, age, gender)
          VALUES (?, ?, ?, ?)
        `,
        [
          bookingId,
          passengerName,
          seatAssignment.passenger.age || null,
          seatAssignment.passenger.gender || null,
        ]
      );

      await connection.query(
        `
          INSERT INTO ticket (booking_id, passenger_id, schedule_seat_id, ticket_number, status)
          VALUES (?, ?, ?, ?, 'BOOKED')
        `,
        [bookingId, passengerResult.insertId, seatAssignment.schedule_seat_id, buildTicketNumber()]
      );
    }

    const seatIds = seatAssignments.map((seatAssignment) => seatAssignment.schedule_seat_id);
    await connection.query(
      `
        UPDATE schedule_seat
        SET status = 'BOOKED',
            last_updated = NOW()
        WHERE schedule_seat_id IN (${seatIds.map(() => "?").join(", ")})
      `,
      seatIds
    );

    await connection.query(
      `
        DELETE FROM seat_lock
        WHERE schedule_seat_id IN (${seatIds.map(() => "?").join(", ")})
      `,
      seatIds
    );

    await connection.query(
      `
        UPDATE flight_instance
        SET available_seats = available_seats - ?,
            booked_seats = booked_seats + ?
        WHERE instance_id = ?
      `,
      [seatAssignments.length, seatAssignments.length, resolvedInstance.instance_id]
    );

    await connection.commit();

    const bookings = await getBookingHistory({ bookingIds: [bookingId] });
    return {
      bookingId,
      bookingRef,
      instanceId: resolvedInstance.instance_id,
      bookings,
      seats: seatAssignments.map((seatAssignment) => ({
        schedule_seat_id: seatAssignment.schedule_seat_id,
        seat_no: seatAssignment.seat_no,
        seatNumber: seatAssignment.seat_no,
      })),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createBookingWithSeats,
};
