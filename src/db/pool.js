const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set. Database connections will fail.');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString && connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
