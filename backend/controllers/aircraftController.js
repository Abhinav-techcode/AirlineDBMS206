const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const { createAircraft, listAircraft } = require("../models/aircraftModel");

exports.createAircraft = asyncHandler(async (req, res) => {
  const {
    airline_id,   // 🔥 REQUIRED
    model,
    registration_code,
    business_seats,
    first_class_seats,
    range_km,
    cruise_speed,
    max_altitude,
    registration_date,
    next_maintenance,
    status,
    is_available
  } = req.body;

  if (!model || !airline_id) {
    return res.status(400).json({
      success: false,
      message: "Model and airline_id are required.",
    });
  }

  const business = Number(business_seats) || 0;
  const first = Number(first_class_seats) || 0;
  const total_seats = business + first;

  const aircraftData = {
    airline_id,  // 🔥 MUST INCLUDE
    model,
    registration_code,
    total_seats,
    business_seats: business,
    first_class_seats: first,
    range_km,
    cruise_speed,
    max_altitude,
    registration_date,
    next_maintenance,
    status: status || "ACTIVE",
    is_available: is_available ?? 1
  };

  const aircraft = await createAircraft(aircraftData);

  res.status(201).json({
    success: true,
    message: "Aircraft created successfully.",
    data: aircraft,
  });
});

exports.getAircraft = asyncHandler(async (req, res) => {
  const aircraft = await listAircraft();

  res.json({
    success: true,
    count: aircraft.length,
    data: aircraft,
  });
});