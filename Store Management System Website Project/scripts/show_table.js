const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const table = process.argv[2] || 'users';
(async () => {
  try {
    const DB_FILE = process.env.SQLITE_FILE || path.join(__dirname, '..', 'storesync.sqlite');
    const db = await open({ filename: DB_FILE, driver: sqlite3.Database });
    const rows = await db.all(`SELECT * FROM ${table} LIMIT 200`);
    if (!rows || rows.length === 0) {
      console.log(`No rows found in table '${table}'.`);
    } else {
      console.table(rows);
    }
    await db.close();
  } catch (err) {
    console.error('Error showing table:', err.message || err);
    process.exitCode = 1;
  }
})();
