const asyncHandler = require("../utils/asyncHandler");
const { listBookings, updatePaymentStatus } = require("../models/bookingModel");
const { createBookingWithSeats } = require("../services/bookingService");
const { getBookingHistory } = require("../utils/bookingData");
const { sendBookingConfirmationEmail } = require("../services/emailService");
const {
  buildTicketDetails,
  buildTicketFilename,
  buildTicketPdfBuffer,
} = require("../utils/bookingTicket");

const getBookings = asyncHandler(async (req, res) => {
  const userId = req.query.user_id ? Number(req.query.user_id) : null;
  const bookings = await listBookings({ userId });

  res.json({
    success: true,
    count: bookings.length,
    bookings,
    data: bookings,
  });
});

const getUserBookings = asyncHandler(async (req, res) => {
  const userId = Number(req.params.userId);

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "A valid userId is required.",
    });
  }

  const bookings = await listBookings({ userId });

  res.json({
    success: true,
    count: bookings.length,
    bookings,
    data: bookings,
  });
});

const createBooking = asyncHandler(async (req, res) => {
  const {
    user_id: userId,
    schedule_id: scheduleId,
    instance_id: instanceId,
    passengers = [],
    contact = {},
    amount = 0,
    departure_date: departureDate,
  } = req.body;

  if (!userId || !scheduleId || !Array.isArray(passengers) || passengers.length === 0) {
    return res.status(400).json({
      success: false,
      message: "user_id, schedule_id, and passengers[] are required.",
    });
  }

  const result = await createBookingWithSeats({
    userId: Number(userId),
    scheduleId: Number(scheduleId),
    instanceId: instanceId ? Number(instanceId) : null,
    passengers,
    contact,
    amount,
    departureDate,
  });

  res.status(201).json({
    success: true,
    message: "Booking created successfully.",
    booking_id: result.bookingId,
    booking_ids: [result.bookingId],
    instance_id: result.instanceId,
    pnr: result.bookingRef,
    seats: result.seats,
    bookings: result.bookings,
    data: {
      booking_id: result.bookingId,
      booking_ref: result.bookingRef,
      instance_id: result.instanceId,
      bookings: result.bookings,
    },
  });
});

const processPayment = asyncHandler(async (req, res) => {
  const {
    booking_id: bookingId,
    booking_ids: bookingIdsFromBody,
    amount,
    payment_method: paymentMethod,
    transaction_id: transactionId,
    email,
    contact = {},
  } = req.body;

  const targetBookingIds = Array.isArray(bookingIdsFromBody)
    ? bookingIdsFromBody.filter(Boolean).map(Number)
    : bookingId
      ? [Number(bookingId)]
      : [];

  if (targetBookingIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "booking_id or booking_ids[] is required for payment processing.",
    });
  }

  await updatePaymentStatus({
    bookingIds: targetBookingIds,
    amount,
    paymentMethod,
    transactionId,
  });

  const bookings = await getBookingHistory({ bookingIds: targetBookingIds });
  const primaryBooking = bookings[0] || null;
  const recipientEmail = email || contact.email || primaryBooking?.contact?.email || null;

  let emailResult = {
    skipped: true,
    reason: "No recipient email provided.",
  };

  if (recipientEmail && primaryBooking) {
    try {
      emailResult = await sendBookingConfirmationEmail(recipientEmail, buildTicketDetails(primaryBooking));
    } catch (error) {
      emailResult = {
        skipped: false,
        success: false,
        message: error.message,
      };
    }
  }

  res.json({
    success: true,
    message: "Payment processed successfully.",
    booking_ids: targetBookingIds,
    bookings,
    email: emailResult,
    data: {
      booking_ids: targetBookingIds,
      bookings,
      email: emailResult,
    },
  });
});

const sendBookingEmail = asyncHandler(async (req, res) => {
  const bookingId = Number(req.params.bookingId);
  const fallbackEmail = req.body?.email || null;

  if (!bookingId) {
    return res.status(400).json({
      success: false,
      message: "A valid bookingId is required.",
    });
  }

  const bookings = await getBookingHistory({ bookingIds: [bookingId] });
  const booking = bookings[0];

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found.",
    });
  }

  const recipientEmail = fallbackEmail || booking.contact?.email || null;
  const emailResult = await sendBookingConfirmationEmail(recipientEmail, buildTicketDetails(booking));

  res.json({
    success: true,
    message: "Booking confirmation email processed.",
    booking_id: bookingId,
    email: emailResult,
    data: {
      booking_id: bookingId,
      email: emailResult,
    },
  });
});

const downloadBookingTicketPdf = asyncHandler(async (req, res) => {
  const bookingId = Number(req.params.bookingId);

  if (!bookingId) {
    return res.status(400).json({
      success: false,
      message: "A valid bookingId is required.",
    });
  }

  const bookings = await getBookingHistory({ bookingIds: [bookingId] });
  const booking = bookings[0];

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found.",
    });
  }

  const ticketDetails = buildTicketDetails(booking);
  const pdfBuffer = buildTicketPdfBuffer(ticketDetails);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${buildTicketFilename(ticketDetails)}"`);
  res.send(pdfBuffer);
});

module.exports = {
  getBookings,
  getUserBookings,
  createBooking,
  processPayment,
  sendBookingEmail,
  downloadBookingTicketPdf,
};
