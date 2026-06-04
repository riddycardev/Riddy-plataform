import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT id, name, email, openId FROM users LIMIT 10');
console.log('Users:', JSON.stringify(rows, null, 2));
await conn.end();
