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

    await connection.query(
      `
        UPDATE booking
        SET payment_status = ?,
            status = ?,
            total_amount = ?
        WHERE booking_id IN (${bookingIds.map(() => "?").join(", ")})
      `,
      [paymentStatus, bookingStatus, Number(amount || 0), ...bookingIds]
    );

    for (const bookingId of bookingIds) {
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
