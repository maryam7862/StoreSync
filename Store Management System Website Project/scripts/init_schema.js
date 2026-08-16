const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

(async () => {
  try {
    const DB_FILE = process.env.SQLITE_FILE || path.join(__dirname, '..', 'storesync.sqlite');
    const db = await open({ filename: DB_FILE, driver: sqlite3.Database });
    await db.exec('PRAGMA foreign_keys = ON;');

    const stmts = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('admin','customer')),
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        rating REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        shipping_address TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        subtotal REAL NOT NULL,
        shipping REAL NOT NULL DEFAULT 0,
        tax REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL,
        status TEXT DEFAULT 'processing' CHECK (status IN ('processing','shipped','delivered','cancelled')),
        order_date DATE NOT NULL,
        order_time TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
      );`,

      `CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        total REAL NOT NULL,
        FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id)
      );`,

      `CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id)
      );`,

      `CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id)
      );`,

      `CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );`,

      `CREATE TABLE IF NOT EXISTS order_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
      );`,

      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
      `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`,
      `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`,
      `CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);`
    ];

    await db.exec('BEGIN');
    for (const s of stmts) await db.exec(s);

    // Insert default admin user placeholder (hash the password separately if needed)
    const adminExists = await db.get("SELECT id FROM users WHERE email = ?", 'admin@storesync.com');
    if (!adminExists) {
      await db.run(
        `INSERT INTO users (name, email, password, type) VALUES (?, ?, ?, ?);`,
        ['Admin User', 'admin@storesync.com', '$2b$10$YourHashedPasswordHere', 'admin']
      );
    }

    // Insert sample products if none exist
    const prod = await db.get('SELECT id FROM products LIMIT 1');
    if (!prod) {
      await db.run(`INSERT INTO products (name, description, price, category, stock, rating) VALUES (?, ?, ?, ?, ?, ?)`,
        ['Smartphone X12', 'Latest smartphone with 128GB storage, 8GB RAM, 48MP camera', 699.99, 'electronics', 25, 4.8]
      );
      await db.run(`INSERT INTO products (name, description, price, category, stock, rating) VALUES (?, ?, ?, ?, ?, ?)`,
        ['Wireless Headphones Pro', 'Noise-cancelling wireless headphones with 30hr battery', 199.99, 'electronics', 15, 4.6]
      );
      await db.run(`INSERT INTO products (name, description, price, category, stock, rating) VALUES (?, ?, ?, ?, ?, ?)`,
        ['Laptop EliteBook', '15-inch laptop with i7 processor, 16GB RAM, 512GB SSD', 1299.99, 'electronics', 10, 4.9]
      );
    }

    await db.exec('COMMIT');
    await db.close();
    console.log('✅ SQLite schema initialized at', DB_FILE);
  } catch (err) {
    console.error('Error initializing schema:', err.message || err);
    process.exitCode = 1;
  }
})();
