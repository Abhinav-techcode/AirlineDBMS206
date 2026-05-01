const { pool } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { getBookingHistory } = require("../utils/bookingData");
const { createBookingWithSeats } = require("../services/bookingService");
const {
  ensureEntity,
  quote,
  mapStatus,
  normaliseProcedureResult,
  calculateAge,
  joinPassengerName,
  loadSchema,
} = require("../utils/schemaHelper");

const resolveScheduleSeatId = async (connection, scheduleId, scheduleSeatId, seatNo) => {
  const { entity: scheduleSeats } = await ensureEntity("scheduleSeats", ["id", "scheduleId"]);
  const schema = await loadSchema();
  const seats = schema.entities.seats;

  if (scheduleSeatId) {
    return Number(scheduleSeatId);
  }

  if (!seatNo) {
    const error = new Error("Each passenger must include schedule_seat_id or seat_no.");
    error.statusCode = 400;
    throw error;
  }

  const joins = [];
  const selectSeatNo = seats.table && seats.columns.seatNo
    ? `seat.${quote(seats.columns.seatNo)}`
    : scheduleSeats.columns.seatNo
      ? `ss.${quote(scheduleSeats.columns.seatNo)}`
      : null;

  if (seats.table && seats.columns.id && scheduleSeats.columns.seatId) {
    joins.push(
      `LEFT JOIN ${quote(seats.table)} seat ON seat.${quote(seats.columns.id)} = ss.${quote(
        scheduleSeats.columns.seatId
      )}`
    );
  }

  if (!selectSeatNo) {
    const error = new Error("Unable to resolve seat number mapping for seat confirmation.");
    error.statusCode = 500;
    throw error;
  }

  const [rows] = await connection.query(
    `
      SELECT ss.${quote(scheduleSeats.columns.id)} AS schedule_seat_id
      FROM ${quote(scheduleSeats.table)} ss
      ${joins.join("\n      ")}
      WHERE ss.${quote(scheduleSeats.columns.scheduleId)} = ?
        AND ${selectSeatNo} = ?
      LIMIT 1
    `,
    [scheduleId, seatNo]
  );

  if (!rows[0]) {
    const error = new Error(`Seat "${seatNo}" was not found for schedule ${scheduleId}.`);
    error.statusCode = 404;
    throw error;
  }

  return Number(rows[0].schedule_seat_id);
};

const cleanupExpiredLocks = async (connection, seatLocks) => {
  if (!seatLocks.table || !seatLocks.columns.expiry) {
    return;
  }

  await connection.query(
    `DELETE FROM ${quote(seatLocks.table)} WHERE ${quote(seatLocks.columns.expiry)} <= NOW()`
  );
};

const getSeatsBySchedule = asyncHandler(async (req, res) => {
  const scheduleId = Number(req.params.scheduleId);
  if (!scheduleId) {
    const error = new Error("A valid scheduleId is required.");
    error.statusCode = 400;
    throw error;
  }

  const { schema, entity: scheduleSeats } = await ensureEntity("scheduleSeats", ["id", "scheduleId"]);
  const seats = schema.entities.seats;
  const seatLocks = schema.entities.seatLocks;

  const selectSeatNo = seats.table && seats.columns.seatNo
    ? `seat.${quote(seats.columns.seatNo)}`
    : scheduleSeats.columns.seatNo
      ? `ss.${quote(scheduleSeats.columns.seatNo)}`
      : null;

  if (!selectSeatNo) {
    const error = new Error("Unable to resolve seat number column for seat lookup.");
    error.statusCode = 500;
    throw error;
  }

  const joins = [];
  if (seats.table && seats.columns.id && scheduleSeats.columns.seatId) {
    joins.push(
      `LEFT JOIN ${quote(seats.table)} seat ON seat.${quote(seats.columns.id)} = ss.${quote(
        scheduleSeats.columns.seatId
      )}`
    );
  }

  const hasActiveLockJoin = Boolean(
    seatLocks.table && seatLocks.columns.scheduleSeatId && seatLocks.columns.expiry
  );

  if (hasActiveLockJoin) {
    joins.push(
      `LEFT JOIN (
        SELECT sl1.${quote(seatLocks.columns.scheduleSeatId)} AS schedule_seat_id,
               MAX(sl1.${quote(seatLocks.columns.expiry)}) AS expiry
        FROM ${quote(seatLocks.table)} sl1
        WHERE sl1.${quote(seatLocks.columns.expiry)} > NOW()
        GROUP BY sl1.${quote(seatLocks.columns.scheduleSeatId)}
      ) lock_info ON lock_info.schedule_seat_id = ss.${quote(scheduleSeats.columns.id)}`
    );
  }

  const [rows] = await pool.query(
    `
      SELECT
        ss.${quote(scheduleSeats.columns.id)} AS schedule_seat_id,
        ${selectSeatNo} AS seat_no,
        ${scheduleSeats.columns.status ? `ss.${quote(scheduleSeats.columns.status)}` : "'available'"} AS seat_status,
        ${scheduleSeats.columns.price ? `ss.${quote(scheduleSeats.columns.price)}` : "0"} AS seat_price,
        ${hasActiveLockJoin ? "lock_info.schedule_seat_id" : "NULL"} AS locked_seat
      FROM ${quote(scheduleSeats.table)} ss
      ${joins.join("\n      ")}
      WHERE ss.${quote(scheduleSeats.columns.scheduleId)} = ?
      ORDER BY seat_no ASC
    `,
    [scheduleId]
  );

  const seatsPayload = rows.map((row) => ({
    schedule_seat_id: row.schedule_seat_id,
    seat_no: row.seat_no,
    status: row.locked_seat ? "locked" : mapStatus(row.seat_status),
    price: Number(row.seat_price || 0),
  }));

  res.json({
    success: true,
    schedule_id: scheduleId,
    seats: seatsPayload,
    data: seatsPayload,
  });
});

const lockSeat = asyncHandler(async (req, res) => {
  const { user_id: userId, schedule_id: scheduleId, schedule_seat_id: scheduleSeatId, seat_no: seatNo } = req.body;

  if (!userId || !scheduleId || (!scheduleSeatId && !seatNo)) {
    const error = new Error("user_id, schedule_id, and schedule_seat_id or seat_no are required.");
    error.statusCode = 400;
    throw error;
  }

  const { schema, entity: seatLocks } = await ensureEntity("seatLocks", [
    "id",
    "scheduleSeatId",
    "userId",
    "expiry",
  ]);
  const { entity: scheduleSeats } = await ensureEntity("scheduleSeats", ["id", "scheduleId"]);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await cleanupExpiredLocks(connection, seatLocks);

    const resolvedScheduleSeatId = await resolveScheduleSeatId(
      connection,
      Number(scheduleId),
      scheduleSeatId,
      seatNo
    );

    const [seatRows] = await connection.query(
      `
        SELECT
          ss.${quote(scheduleSeats.columns.id)} AS schedule_seat_id,
          ${scheduleSeats.columns.status ? `ss.${quote(scheduleSeats.columns.status)} AS seat_status` : "'available' AS seat_status"}
        FROM ${quote(scheduleSeats.table)} ss
        WHERE ss.${quote(scheduleSeats.columns.id)} = ?
          AND ss.${quote(scheduleSeats.columns.scheduleId)} = ?
        LIMIT 1
      `,
      [resolvedScheduleSeatId, scheduleId]
    );

    if (!seatRows[0]) {
      const error = new Error("Seat was not found for the provided schedule.");
      error.statusCode = 404;
      throw error;
    }

    if (mapStatus(seatRows[0].seat_status) === "occupied") {
      const error = new Error("This seat has already been booked.");
      error.statusCode = 409;
      throw error;
    }

    const [activeLocks] = await connection.query(
      `
        SELECT *
        FROM ${quote(seatLocks.table)}
        WHERE ${quote(seatLocks.columns.scheduleSeatId)} = ?
          AND ${quote(seatLocks.columns.expiry)} > NOW()
        ORDER BY ${quote(seatLocks.columns.expiry)} DESC
        LIMIT 1
      `,
      [resolvedScheduleSeatId]
    );

    if (
      activeLocks[0] &&
      Number(activeLocks[0][seatLocks.columns.userId]) !== Number(userId)
    ) {
      const error = new Error("This seat is temporarily locked by another user.");
      error.statusCode = 409;
      throw error;
    }

    if (activeLocks[0]) {
      await connection.query(
        `
          UPDATE ${quote(seatLocks.table)}
          SET ${quote(seatLocks.columns.expiry)} = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
          ${seatLocks.columns.status ? `, ${quote(seatLocks.columns.status)} = 'LOCKED'` : ""}
          WHERE ${quote(seatLocks.columns.id)} = ?
        `,
        [activeLocks[0][seatLocks.columns.id]]
      );
    } else {
      const insertColumns = [
        quote(seatLocks.columns.scheduleSeatId),
        quote(seatLocks.columns.userId),
        quote(seatLocks.columns.expiry),
      ];
      const insertValues = [resolvedScheduleSeatId, userId];
      const placeholders = ["?", "?", "DATE_ADD(NOW(), INTERVAL 5 MINUTE)"];

      if (seatLocks.columns.status) {
        insertColumns.push(quote(seatLocks.columns.status));
        insertValues.push("LOCKED");
        placeholders.push("?");
      }

      if (seatLocks.columns.createdAt) {
        insertColumns.push(quote(seatLocks.columns.createdAt));
        placeholders.push("NOW()");
      }

      await connection.query(
        `
          INSERT INTO ${quote(seatLocks.table)} (${insertColumns.join(", ")})
          VALUES (${placeholders.join(", ")})
        `,
        insertValues
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Seat locked successfully.",
      schedule_id: Number(scheduleId),
      schedule_seat_id: resolvedScheduleSeatId,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      data: {
        schedule_id: Number(scheduleId),
        schedule_seat_id: resolvedScheduleSeatId,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

const confirmSeatBooking = asyncHandler(async (req, res) => {
  const {
    user_id: userId,
    schedule_id: scheduleId,
    passengers = [],
    contact = {},
    amount = 0,
    instance_id: instanceId,
    departure_date: departureDate,
  } = req.body;

  if (!userId || !scheduleId || !Array.isArray(passengers) || passengers.length === 0) {
    const error = new Error("user_id, schedule_id, and passengers[] are required.");
    error.statusCode = 400;
    throw error;
  }

  const preparedPassengers = passengers.map((passenger) => ({
    ...passenger,
    name: joinPassengerName(passenger),
    age: Number(passenger.age || calculateAge(passenger.dateOfBirth) || 0),
    gender: passenger.gender || "Other",
  }));

  const result = await createBookingWithSeats({
    userId: Number(userId),
    scheduleId: Number(scheduleId),
    passengers: preparedPassengers,
    contact,
    amount,
    instanceId: instanceId ? Number(instanceId) : null,
    departureDate,
  });

  res.status(201).json({
    success: true,
    message: "Seat booking confirmed successfully.",
    booking_id: result.bookingId,
    booking_ids: [result.bookingId],
    schedule_id: Number(scheduleId),
    instance_id: result.instanceId,
    pnr: result.bookingRef,
    passengers: result.bookings[0]?.passengers || preparedPassengers,
    seats: result.seats,
    payment_status: result.bookings[0]?.payment_status || "PENDING",
    bookings: result.bookings,
    data: {
      booking_id: result.bookingId,
      booking_ref: result.bookingRef,
      instance_id: result.instanceId,
      bookings: result.bookings,
    },
  });
});

module.exports = {
  getSeatsBySchedule,
  lockSeat,
  confirmSeatBooking,
};
