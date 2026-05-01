const asyncHandler = require("../utils/asyncHandler");
const { createInstance, listInstances } = require("../models/instanceModel");

exports.createInstance = asyncHandler(async (req, res) => {
  const { schedule_id } = req.body;

  if (!schedule_id) {
    return res.status(400).json({
      success: false,
      message: "schedule_id is required.",
    });
  }

  const instance = await createInstance(req.body);

  res.status(201).json({
    success: true,
    message: "Instance created successfully.",
    data: instance,
  });
});

exports.getInstances = asyncHandler(async (req, res) => {
  const instances = await listInstances();

  res.json({
    success: true,
    count: instances.length,
    data: instances,
  });
});
