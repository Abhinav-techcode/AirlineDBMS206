import { apiConfig, apiRequest } from "./api";

const parseFilename = (contentDisposition, fallbackName) => {
  if (!contentDisposition) {
    return fallbackName;
  }

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const standardMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return standardMatch?.[1] || fallbackName;
};

const saveBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const downloadBookingTicket = async (booking = {}) => {
  if (!booking?.booking_id) {
    throw new Error("A confirmed booking is required before the ticket PDF can be downloaded.");
  }

  const response = await fetch(`${apiConfig.baseUrl}/bookings/${booking.booking_id}/ticket-pdf`);
  const fallbackName = `${booking.booking_ref || booking.booking_id || "zoshair-ticket"}.pdf`;

  if (!response.ok) {
    const message = await response.text();
    let parsedMessage = message;

    try {
      parsedMessage = JSON.parse(message)?.message || message;
    } catch (error) {
      parsedMessage = message;
    }

    throw new Error(parsedMessage || "Unable to download the ticket PDF.");
  }

  const blob = await response.blob();
  const filename = parseFilename(response.headers.get("content-disposition"), fallbackName);
  saveBlob(blob, filename);

  return filename;
};

export const requestBookingConfirmationEmail = async (booking = {}, email) => {
  if (!booking?.booking_id) {
    throw new Error("A booking id is required before email confirmation can be sent.");
  }

  return apiRequest(`/bookings/${booking.booking_id}/email`, {
    method: "POST",
    body: {
      email: email || booking?.contact?.email || "",
    },
  });
};
