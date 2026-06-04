import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check Fernando's user and latest bookings/payments
const [users] = await conn.execute(
  "SELECT id, name, email, createdAt FROM users WHERE name LIKE '%Fernando%' OR email LIKE '%fernando%' ORDER BY id DESC LIMIT 5"
);
console.log('=== Fernando users ===');
console.table(users);

// Check all bookings for user 1230001 (Fernando)
const [bookings] = await conn.execute(
  "SELECT id, vehicleId, hostId, renterId, status, subtotal, serviceFee, insuranceFee, createdAt FROM bookings WHERE renterId = 1230001 ORDER BY createdAt DESC LIMIT 10"
);
console.log('\n=== Fernando bookings ===');
console.table(bookings);

// Check latest payments
const [payments] = await conn.execute(
  "SELECT id, bookingId, userId, status, amount, paymentMethod, mpPaymentId, failureReason, createdAt FROM payments WHERE userId = 1230001 ORDER BY createdAt DESC LIMIT 10"
);
console.log('\n=== Fernando payments ===');
console.table(payments);

// Check the MP payment IDs to query MP API
const mpIds = payments.filter(p => p.mpPaymentId).map(p => p.mpPaymentId);
console.log('\n=== MP Payment IDs to check ===', mpIds);

await conn.end();
