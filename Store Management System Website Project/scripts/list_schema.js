const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

(async () => {
  try {
    const DB_FILE = process.env.SQLITE_FILE || path.join(__dirname, '..', 'storesync.sqlite');
    const db = await open({ filename: DB_FILE, driver: sqlite3.Database });

    const rows = await db.all(
      "SELECT type, name, sql FROM sqlite_master WHERE type IN ('table','index','view') ORDER BY type, name;"
    );

    if (!rows || rows.length === 0) {
      console.log('No tables or schema objects found.');
    } else {
      for (const r of rows) {
        console.log(`-- ${r.type.toUpperCase()}: ${r.name}`);
        if (r.sql) console.log(r.sql + '\n');
      }
    }

    await db.close();
  } catch (err) {
    console.error('Error reading SQLite schema:', err.message || err);
    process.exitCode = 1;
  }
})();
