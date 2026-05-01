const SESSION_KEY = "zoshSession";
const BOOKING_DRAFT_KEY = "zoshBookingDetails";
const LAST_CONFIRMED_BOOKING_KEY = "zoshLastConfirmedBooking";
const BOOKING_CACHE_KEY = "zoshAllBookings";

const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
};

export const getSession = () => safeJsonParse(localStorage.getItem(SESSION_KEY), null);

export const setSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = () => getSession()?.user || null;

export const getCurrentUserId = () => {
  const userId = getCurrentUser()?.user_id;
  return userId ? Number(userId) : null;
};

export const getAuthToken = () => getSession()?.token || null;

export const saveBookingDraft = (booking) => {
  localStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(booking));
};

export const getBookingDraft = () => safeJsonParse(localStorage.getItem(BOOKING_DRAFT_KEY), {});

export const saveLastConfirmedBooking = (booking) => {
  localStorage.setItem(LAST_CONFIRMED_BOOKING_KEY, JSON.stringify(booking));
};

export const getLastConfirmedBooking = () =>
  safeJsonParse(localStorage.getItem(LAST_CONFIRMED_BOOKING_KEY), null);

export const cacheBookings = (bookings) => {
  localStorage.setItem(BOOKING_CACHE_KEY, JSON.stringify(bookings || []));
};

export const getCachedBookings = () => safeJsonParse(localStorage.getItem(BOOKING_CACHE_KEY), []);

export const setLegacyBookingFlags = ({ amount, bookingStatus, paymentStatus }) => {
  if (amount != null) {
    localStorage.setItem("zoshBookingAmount", String(amount));
  }
  if (bookingStatus) {
    localStorage.setItem("zoshBookingStatus", bookingStatus);
  }
  if (paymentStatus) {
    localStorage.setItem("zoshPaymentStatus", paymentStatus);
  }
};
