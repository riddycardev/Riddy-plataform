import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL || '';

async function main() {
  const conn = await mysql.createConnection(dbUrl);
  
  const [bookings] = await conn.execute(
    'SELECT id, renter_id, host_id, status, created_at FROM bookings ORDER BY created_at DESC LIMIT 5'
  );
  console.log('=== LATEST BOOKINGS ===');
  console.log(JSON.stringify(bookings, null, 2));
  
  const [payments] = await conn.execute(
    'SELECT id, booking_id, status, amount, mp_payment_id, failure_reason, created_at FROM payments ORDER BY created_at DESC LIMIT 10'
  );
  console.log('=== LATEST PAYMENTS ===');
  console.log(JSON.stringify(payments, null, 2));
  
  await conn.end();
}
main().catch(e => console.error('ERR:', e.message));
