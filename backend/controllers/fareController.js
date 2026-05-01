const asyncHandler = require("../utils/asyncHandler");
const { createFare, listFares } = require("../models/fareModel");

exports.createFare = asyncHandler(async (req, res) => {
  const { flight_id, base_price, taxes } = req.body;

  if (!flight_id || base_price == null || taxes == null) {
    return res.status(400).json({
      success: false,
      message: "flight_id, base_price, and taxes are required.",
    });
  }

  const fare = await createFare(req.body);

  res.status(201).json({
    success: true,
    message: "Fare created successfully.",
    data: fare,
  });
});

exports.getFares = asyncHandler(async (req, res) => {
  const fares = await listFares();

  res.json({
    success: true,
    count: fares.length,
    data: fares,
  });
});
