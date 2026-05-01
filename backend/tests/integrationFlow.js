/* eslint-disable no-console */
const dotenv = require("dotenv");

dotenv.config();

const hasDatabaseConfig = Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);

if (!hasDatabaseConfig) {
  console.log("Skipping integration flow: DB_HOST, DB_USER, and DB_NAME must be configured.");
  process.exit(0);
}

process.env.NODE_ENV = "test";
process.env.EMAIL_DISABLE_SEND = process.env.EMAIL_DISABLE_SEND || "true";

const { startServer } = require("../server");
const { pool } = require("../config/db");

const baseUrl = `http://127.0.0.1:${process.env.PORT || 5000}`;

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status} ${JSON.stringify(body)}`);
  }

  return body;
};

const run = async () => {
  const server = await startServer();

  try {
    const uniqueSuffix = Date.now();
    const registerPayload = {
      name: `Integration User ${uniqueSuffix}`,
      email: `integration-${uniqueSuffix}@example.com`,
      password: "Password@123",
      role: "CUSTOMER",
    };

    let userId;

    try {
      const registerResult = await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(registerPayload),
      });
      userId = registerResult.user.user_id;
      console.log("Register:", registerResult.message);
    } catch (error) {
      console.log("Register step skipped:", error.message);
    }

    const loginResult = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: registerPayload.email,
        password: registerPayload.password,
        role: "CUSTOMER",
      }),
    });

    userId = userId || loginResult.user.user_id;
    console.log("Login:", loginResult.message);

    const dashboard = await request("/api/admin/dashboard");
    const firstSchedule = dashboard.schedules?.[0];

    if (!firstSchedule) {
      throw new Error("No schedules available for integration search.");
    }

    const searchParams = new URLSearchParams({
      from: firstSchedule.source_code,
      to: firstSchedule.destination_code,
      date: firstSchedule.departure_date,
    });

    const flightSearch = await request(`/api/flights/search?${searchParams.toString()}`);
    if (!flightSearch.flights?.length) {
      throw new Error("No flights returned for integration search.");
    }

    const selectedFlight = flightSearch.flights[0];
    console.log("Flight Search: found", flightSearch.flights.length, "flight(s)");

    const seatResult = await request(`/api/seats/${selectedFlight.schedule_id}`);
    const availableSeat = seatResult.seats.find((seat) => seat.status === "available");

    if (!availableSeat) {
      throw new Error("No available seats returned.");
    }

    console.log("Seat Load: selected seat", availableSeat.seat_no);

    await request("/api/seats/lock", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        schedule_id: selectedFlight.schedule_id,
        schedule_seat_id: availableSeat.schedule_seat_id,
      }),
    });
    console.log("Seat Lock: success");

    const confirmResult = await request("/api/seats/confirm", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        schedule_id: selectedFlight.schedule_id,
        contact: {
          email: registerPayload.email,
          mobile: "9999999999",
        },
        passengers: [
          {
            title: "Mr",
            firstName: "Integration",
            lastName: "Passenger",
            dateOfBirth: "1995-01-01",
            gender: "Male",
            schedule_seat_id: availableSeat.schedule_seat_id,
          },
        ],
      }),
    });
    console.log("Confirm Booking:", confirmResult.message);

    const bookingIds = confirmResult.booking_ids?.length
      ? confirmResult.booking_ids
      : [confirmResult.booking_id].filter(Boolean);

    if (!bookingIds.length) {
      throw new Error("Booking confirmation did not return a booking id.");
    }

    const paymentResult = await request("/api/bookings/payment", {
      method: "POST",
      body: JSON.stringify({
        booking_ids: bookingIds,
        amount: selectedFlight.price,
        payment_method: "UPI",
        transaction_id: `TXN_${Date.now()}`,
        email: registerPayload.email,
      }),
    });
    console.log("Payment:", paymentResult.message);

    const historyResult = await request(`/api/bookings/${userId}`);
    console.log("Booking History:", historyResult.count, "booking(s)");

    console.log("Integration flow completed successfully.");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
