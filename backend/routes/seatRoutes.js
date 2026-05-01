const express = require("express");
const {
  getSeatsBySchedule,
  lockSeat,
  confirmSeatBooking,
} = require("../controllers/seatController");

const router = express.Router();

router.get("/:scheduleId", getSeatsBySchedule);
router.post("/lock", lockSeat);
router.post("/confirm", confirmSeatBooking);

module.exports = router;
