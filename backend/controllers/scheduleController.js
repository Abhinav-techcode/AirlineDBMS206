const asyncHandler = require("../utils/asyncHandler");
const { createSchedule, listSchedules } = require("../models/scheduleModel");

exports.createSchedule = asyncHandler(async (req, res) => {
  const { flight_id, departure_time, arrival_time, date } = req.body;

  if (!flight_id || !departure_time || !arrival_time || !date) {
    return res.status(400).json({
      success: false,
      message: "flight_id, departure_time, arrival_time, and date are required.",
    });
  }

  const schedule = await createSchedule(req.body);

  res.status(201).json({
    success: true,
    message: "Schedule created successfully.",
    data: schedule,
  });
});

exports.getSchedules = asyncHandler(async (req, res) => {
  const schedules = await listSchedules();

  res.json({
    success: true,
    count: schedules.length,
    data: schedules,
  });
});
