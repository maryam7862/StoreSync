const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

(async () => {
  const cfg = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres'
  };

  const client = new Client(cfg);
  try {
    await client.connect();
    const dbName = process.env.DB_NAME || 'storesync_db';
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname=$1`, [dbName]);
    if (res.rowCount > 0) {
      console.log(`Database '${dbName}' already exists.`);
    } else {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database '${dbName}' created successfully.`);
    }
  } catch (err) {
    console.error('Error creating database:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
