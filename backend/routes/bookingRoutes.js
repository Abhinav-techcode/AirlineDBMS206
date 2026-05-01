const express = require("express");
const {
  getBookings,
  getUserBookings,
  createBooking,
  processPayment,
  sendBookingEmail,
  downloadBookingTicketPdf,
} = require("../controllers/bookingController");

const router = express.Router();

router.route("/").get(getBookings).post(createBooking);
router.post("/:bookingId/email", sendBookingEmail);
router.get("/:bookingId/ticket-pdf", downloadBookingTicketPdf);
router.post("/payment", processPayment);
router.get("/:userId(\\d+)", getUserBookings);

module.exports = router;
