const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1111',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tickets_utf8',
  options: '-c client_encoding=UTF8',
});

pool.on('connect', (client) => {
  client.query('SET client_encoding TO UTF8');
});

pool.on('error', (err) => {
  console.error('Неожиданная ошибка в пуле подключений:', err);
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Успешное подключение к базе данных');
    const encodingResult = await client.query('SHOW client_encoding');
    console.log('Текущая кодировка:', encodingResult.rows[0].client_encoding);
    client.release();
  } catch (err) {
    console.error('Ошибка при подключении к базе данных:', err);
  }
}

testConnection();

module.exports = pool; 