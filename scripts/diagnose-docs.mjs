import mysql2 from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql2.createConnection(process.env.DATABASE_URL);

const [vehicles] = await conn.execute('SELECT id, brand, model, status, hostId, crlvUrl FROM vehicles');
console.log('vehicles:', vehicles.map(r => ({id: r.id, brand: r.brand, status: r.status, hostId: r.hostId, hasCrlv: !!r.crlvUrl})));

const hostIds = [...new Set(vehicles.map(r => r.hostId))];
if (hostIds.length > 0) {
  const [ud] = await conn.execute(`SELECT userId, documentType, status, fileUrl FROM user_documents WHERE userId IN (${hostIds.join(',')})`);
  console.log('user_documents for hosts:', ud);
  
  const [vd] = await conn.execute('SELECT vehicleId, documentType, status, fileUrl FROM vehicle_documents LIMIT 10');
  console.log('vehicle_documents:', vd);
}

await conn.end();
