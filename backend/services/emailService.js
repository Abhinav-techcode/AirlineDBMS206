const nodemailer = require("nodemailer");
const {
  buildTicketFilename,
  buildTicketText,
  buildTicketHtml,
  buildTicketPdfBuffer,
} = require("../utils/bookingTicket");

let transporterPromise;

const getTransporter = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_DISABLE_SEND === "true") {
    return null;
  }

  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      })
    );
  }

  return transporterPromise;
};

async function sendBookingConfirmationEmail(email, bookingDetails = {}) {
  if (!email) {
    return {
      skipped: true,
      reason: "No recipient email provided.",
    };
  }

  const transporter = await getTransporter();
  const attachmentName = buildTicketFilename(bookingDetails);
  const html = buildTicketHtml(bookingDetails);
  const text = buildTicketText(bookingDetails);
  const pdfBuffer = buildTicketPdfBuffer(bookingDetails);

  if (!transporter) {
    return {
      skipped: true,
      reason: "Email transport is disabled or not configured.",
      preview: text,
      attachmentName,
    };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Booking Confirmation - ${bookingDetails.pnr || "ZoshAir"}`,
      html,
      text,
      attachments: [
        {
          filename: attachmentName,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return {
      skipped: false,
      success: true,
      messageId: info.messageId,
      attachmentName,
    };
  } catch (error) {
    return {
      skipped: false,
      success: false,
      message: error.message,
      attachmentName,
    };
  }
}

module.exports = {
  sendBookingConfirmationEmail,
};
