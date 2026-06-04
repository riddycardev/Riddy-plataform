import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT id, vehicleId, imageUrl, isMain FROM vehicle_images WHERE vehicleId = 1');
console.log('Images:', JSON.stringify(rows, null, 2));
await conn.end();
