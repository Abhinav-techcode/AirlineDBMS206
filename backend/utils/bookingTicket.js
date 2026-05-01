const formatDateLabel = (value) => {
  if (!value) return "Date pending";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const sanitizePdfText = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " ");

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const wrapText = (text, maxLength = 78) => {
  const source = String(text ?? "").trim();
  if (!source) {
    return [""];
  }

  const words = source.split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
      continue;
    }

    if (`${currentLine} ${word}`.length <= maxLength) {
      currentLine = `${currentLine} ${word}`;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const buildTicketFilename = (bookingDetails = {}) => {
  const reference = String(bookingDetails.pnr || bookingDetails.bookingReference || "zoshair-ticket")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${reference || "zoshair-ticket"}.pdf`;
};

const buildTicketText = (bookingDetails = {}) => {
  const passengers = Array.isArray(bookingDetails.passengers) ? bookingDetails.passengers : [];
  const passengerLines =
    passengers.length > 0
      ? passengers.map((passenger, index) => {
          const seat = passenger.seat || "TBD";
          const ticketNumber = passenger.ticketNumber ? ` | Ticket ${passenger.ticketNumber}` : "";
          return `${index + 1}. ${passenger.name || `Passenger ${index + 1}`} | Seat ${seat}${ticketNumber}`;
        })
      : ["No passenger details available."];

  return [
    "ZoshAir E-Ticket",
    `Booking Reference: ${bookingDetails.pnr || bookingDetails.bookingReference || "Pending"}`,
    `Flight Number: ${bookingDetails.flightNumber || "TBD"}`,
    `Route: ${bookingDetails.route || "Route pending"}`,
    `Departure Date: ${bookingDetails.departureDate || "Date pending"}`,
    `Departure Time: ${bookingDetails.departureTime || "TBD"}`,
    `Arrival Time: ${bookingDetails.arrivalTime || "TBD"}`,
    `From: ${bookingDetails.departureAirport || "Departure airport pending"}`,
    `To: ${bookingDetails.arrivalAirport || "Arrival airport pending"}`,
    `Booking Status: ${bookingDetails.bookingStatus || "CONFIRMED"}`,
    `Payment Status: ${bookingDetails.paymentStatus || "SUCCESS"}`,
    `Contact Email: ${bookingDetails.contactEmail || "Not provided"}`,
    `Contact Mobile: ${bookingDetails.contactMobile || "Not provided"}`,
    `Total Price: Rs. ${Number(bookingDetails.totalPrice || 0).toLocaleString("en-IN")}`,
    "",
    "Passenger Details",
    ...passengerLines,
  ].join("\n");
};

const buildTicketHtml = (bookingDetails = {}) => {
  const passengers = Array.isArray(bookingDetails.passengers) ? bookingDetails.passengers : [];

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; padding: 24px;">
      <div style="max-width: 760px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe4f0; border-radius: 18px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0f4c81, #1793d1); color: #ffffff; padding: 28px;">
          <div style="font-size: 12px; letter-spacing: 1.6px; text-transform: uppercase; opacity: 0.85;">ZoshAir</div>
          <h2 style="margin: 10px 0 6px; font-size: 28px;">Booking Confirmed</h2>
          <p style="margin: 0; font-size: 15px;">Your e-ticket is attached as a PDF for easy download and printing.</p>
        </div>
        <div style="padding: 28px;">
          <p style="margin-top: 0;">Dear ${escapeHtml(bookingDetails.passengerName || "Passenger")},</p>
          <p>Your booking has been confirmed successfully. Here are your trip details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tbody>
              ${[
                ["Booking Reference", bookingDetails.pnr || bookingDetails.bookingReference || "Pending"],
                ["Flight", bookingDetails.flightNumber || "TBD"],
                ["Route", bookingDetails.route || "Route pending"],
                ["Departure Date", bookingDetails.departureDate || "Date pending"],
                ["Departure Time", bookingDetails.departureTime || "TBD"],
                ["Arrival Time", bookingDetails.arrivalTime || "TBD"],
                ["From", bookingDetails.departureAirport || "Departure airport pending"],
                ["To", bookingDetails.arrivalAirport || "Arrival airport pending"],
                ["Payment Status", bookingDetails.paymentStatus || "SUCCESS"],
                ["Total Price", `Rs. ${Number(bookingDetails.totalPrice || 0).toLocaleString("en-IN")}`],
              ]
                .map(
                  ([label, value]) => `
                    <tr>
                      <td style="padding: 10px 0; color: #475569; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${escapeHtml(
                        label
                      )}</td>
                      <td style="padding: 10px 0; text-align: right; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${escapeHtml(
                        value
                      )}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
          <h3 style="margin: 24px 0 12px;">Passenger Details</h3>
          <ul style="padding-left: 18px; margin: 0;">
            ${
              passengers.length > 0
                ? passengers
                    .map((passenger, index) => {
                      const pieces = [
                        passenger.name || `Passenger ${index + 1}`,
                        `Seat ${passenger.seat || "TBD"}`,
                      ];

                      if (passenger.ticketNumber) {
                        pieces.push(`Ticket ${passenger.ticketNumber}`);
                      }

                      return `<li style="margin-bottom: 8px;">${escapeHtml(pieces.join(" | "))}</li>`;
                    })
                    .join("")
                : '<li>No passenger details available.</li>'
            }
          </ul>
          <p style="margin: 24px 0 0;">Thank you for choosing ZoshAir.</p>
        </div>
      </div>
    </div>
  `;
};

const createPdfBuffer = (contentStream) => {
  const objects = {
    1: "<< /Type /Catalog /Pages 2 0 R >>",
    2: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    3:
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    4: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    5: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    6: `<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}\nendstream`,
  };

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 1; index <= Object.keys(objects).length; index += 1) {
    offsets[index] = Buffer.byteLength(pdf, "utf8");
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const startXref = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${Object.keys(objects).length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index <= Object.keys(objects).length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${Object.keys(objects).length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
};

const buildTicketPdfBuffer = (bookingDetails = {}) => {
  const rawLines = [
    `Booking Reference: ${bookingDetails.pnr || bookingDetails.bookingReference || "Pending"}`,
    `Flight Number: ${bookingDetails.flightNumber || "TBD"}`,
    `Route: ${bookingDetails.route || "Route pending"}`,
    `Departure Date: ${bookingDetails.departureDate || "Date pending"}`,
    `Departure Time: ${bookingDetails.departureTime || "TBD"}`,
    `Arrival Time: ${bookingDetails.arrivalTime || "TBD"}`,
    `From: ${bookingDetails.departureAirport || "Departure airport pending"}`,
    `To: ${bookingDetails.arrivalAirport || "Arrival airport pending"}`,
    `Booking Status: ${bookingDetails.bookingStatus || "CONFIRMED"}`,
    `Payment Status: ${bookingDetails.paymentStatus || "SUCCESS"}`,
    `Contact Email: ${bookingDetails.contactEmail || "Not provided"}`,
    `Contact Mobile: ${bookingDetails.contactMobile || "Not provided"}`,
    `Total Price: Rs. ${Number(bookingDetails.totalPrice || 0).toLocaleString("en-IN")}`,
    "",
    "Passenger Details",
    ...(Array.isArray(bookingDetails.passengers) && bookingDetails.passengers.length > 0
      ? bookingDetails.passengers.map((passenger, index) => {
          const seat = passenger.seat || "TBD";
          const ticketNumber = passenger.ticketNumber ? ` | Ticket ${passenger.ticketNumber}` : "";
          return `${index + 1}. ${passenger.name || `Passenger ${index + 1}`} | Seat ${seat}${ticketNumber}`;
        })
      : ["No passenger details available."]),
  ];

  const wrappedLines = rawLines.flatMap((line) => (line ? wrapText(line) : [""]));
  const contentCommands = [
    "q",
    "0.06 0.30 0.51 rg",
    "40 760 515 56 re",
    "f",
    "Q",
    "BT",
    "/F2 24 Tf",
    "1 1 1 rg",
    "60 792 Td",
    `(${sanitizePdfText("ZoshAir E-Ticket")}) Tj`,
    "ET",
    "BT",
    "/F1 11 Tf",
    "0.20 0.24 0.31 rg",
    "60 734 Td",
    "16 TL",
  ];

  wrappedLines.forEach((line, index) => {
    const command = `(${sanitizePdfText(line)}) Tj`;
    if (index === 0) {
      contentCommands.push(command);
      return;
    }

    contentCommands.push(`T* ${command}`);
  });

  contentCommands.push("ET");

  return createPdfBuffer(contentCommands.join("\n"));
};

const buildTicketDetails = (booking = {}) => {
  const seats = Array.isArray(booking.seats) ? booking.seats : [];
  const passengers = Array.isArray(booking.passengers) ? booking.passengers : [];
  const tickets = Array.isArray(booking.tickets) ? booking.tickets : [];

  return {
    passengerName:
      passengers[0]?.name ||
      [passengers[0]?.firstName, passengers[0]?.lastName].filter(Boolean).join(" ") ||
      "Passenger",
    bookingReference: booking.booking_ref || booking.booking_id || "Pending",
    pnr: booking.booking_ref || booking.booking_id || "Pending",
    flightNumber: booking.flight_number || booking.flight?.code || "TBD",
    route:
      booking.route ||
      `${booking.source_city || booking.flight?.from || "Origin"} - ${booking.destination_city || booking.flight?.to || "Destination"}`,
    departureDate: formatDateLabel(booking.departure_date || booking.flight?.departureDate),
    departureTime: booking.departure_time || booking.flight?.departureTime || "TBD",
    arrivalTime: booking.arrival_time || booking.flight?.arrivalTime || "TBD",
    departureAirport: booking.source_airport || booking.flight?.originName || "Departure airport pending",
    arrivalAirport: booking.destination_airport || booking.flight?.destinationName || "Arrival airport pending",
    bookingStatus: booking.booking_status || booking.status || "CONFIRMED",
    paymentStatus: booking.payment_status || "SUCCESS",
    totalPrice: booking.amount || 0,
    contactEmail: booking.contact?.email || booking.email || "",
    contactMobile: booking.contact?.mobile || booking.mobile || "",
    passengers: passengers.map((passenger, index) => ({
      name:
        passenger?.name ||
        [passenger?.title, passenger?.firstName, passenger?.lastName].filter(Boolean).join(" ") ||
        `Passenger ${index + 1}`,
      seat: seats[index]?.seatNumber || seats[index]?.seat_no || seats[index] || "TBD",
      ticketNumber: tickets[index]?.ticket_number || tickets[index]?.ticketNumber || "",
    })),
    seats,
    tickets,
  };
};

module.exports = {
  buildTicketDetails,
  buildTicketFilename,
  buildTicketText,
  buildTicketHtml,
  buildTicketPdfBuffer,
};
