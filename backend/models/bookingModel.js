const { pool } = require("../config/db");
const { getBookingHistory } = require("../utils/bookingData");

const listBookings = async ({ userId = null } = {}) => {
  if (userId != null) {
    return getBookingHistory({ userId: Number(userId) });
  }

  return getBookingHistory();
};

const updatePaymentStatus = async ({
  bookingIds,
  amount,
  paymentStatus = "SUCCESS",
  bookingStatus = "CONFIRMED",
  paymentMethod = null,
  transactionId = null,
}) => {
  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    return;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const bookingId of bookingIds) {
      // --- Payment table is the source of truth ---
      // Update or insert into Payment FIRST.
      // The sync_payment_status_insert/update triggers will propagate
      // payment_status → Booking automatically.
      const [paymentRows] = await connection.query(
        `
          SELECT payment_id
          FROM payment
          WHERE booking_id = ?
          LIMIT 1
        `,
        [bookingId]
      );

      if (paymentRows[0]) {
        await connection.query(
          `
            UPDATE payment
            SET amount = ?,
                payment_status = ?,
                payment_method = ?,
                transaction_id = ?,
                payment_date = NOW()
            WHERE payment_id = ?
          `,
          [Number(amount || 0), paymentStatus, paymentMethod, transactionId, paymentRows[0].payment_id]
        );
      } else {
        await connection.query(
          `
            INSERT INTO payment (booking_id, amount, payment_status, payment_method, transaction_id, payment_date)
            VALUES (?, ?, ?, ?, ?, NOW())
          `,
          [bookingId, Number(amount || 0), paymentStatus, paymentMethod, transactionId]
        );
      }

      // Fallback: if sync triggers don't exist, update Booking directly.
      // This is safe even if the trigger already ran — idempotent update.
      await connection.query(
        `
          UPDATE booking
          SET payment_status = ?,
              status = ?,
              total_amount = ?
          WHERE booking_id = ?
        `,
        [paymentStatus, bookingStatus, Number(amount || 0), bookingId]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  listBookings,
  updatePaymentStatus,
};
