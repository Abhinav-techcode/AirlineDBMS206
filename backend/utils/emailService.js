const nodemailer = require("nodemailer");

let transporterPromise;

const createTransporter = async () => {
  if (process.env.EMAIL_DISABLE_SEND === "true") {
    return null;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
  }

  return transporterPromise;
};

const sendBookingConfirmationEmail = async ({
  to,
  bookingId,
  flightNumber,
  route,
  passengers = [],
  seats = [],
}) => {
  if (!to) {
    return {
      skipped: true,
      reason: "No recipient email provided.",
    };
  }

  const transporter = await getTransporter();
  const passengerLines = passengers
    .map((passenger, index) => {
      const seat = seats[index]?.seatNumber || seats[index] || "TBD";
      return `${passenger.name || `Passenger ${index + 1}`} - Seat ${seat}`;
    })
    .join("\n");

  const text = [
    `Booking ID: ${bookingId}`,
    `Flight Number: ${flightNumber}`,
    `Route: ${route}`,
    "Passenger Details:",
    passengerLines || "No passenger details available.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h2>Booking Confirmed</h2>
      <p><strong>Booking ID:</strong> ${bookingId}</p>
      <p><strong>Flight Number:</strong> ${flightNumber}</p>
      <p><strong>Route:</strong> ${route}</p>
      <h3>Passenger Details</h3>
      <ul>
        ${passengers
          .map((passenger, index) => {
            const seat = seats[index]?.seatNumber || seats[index] || "TBD";
            return `<li>${passenger.name || `Passenger ${index + 1}`} - Seat ${seat}</li>`;
          })
          .join("")}
      </ul>
    </div>
  `;

  if (!transporter) {
    return {
      skipped: true,
      reason: "Email transport is disabled or not configured.",
      preview: text,
    };
  }

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: `Booking Confirmation - ${bookingId}`,
    text,
    html,
  });

  return {
    skipped: false,
    messageId: info.messageId,
  };
};

module.exports = {
  sendBookingConfirmationEmail,
};
