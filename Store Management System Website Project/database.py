# database.py
import sqlite3
import bcrypt
import json
from datetime import datetime

class StoreDatabase:
    def __init__(self, db_name='storesync.db'):
        self.db_name = db_name
        self.init_database()
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # USERS TABLE
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                role TEXT DEFAULT 'customer',
                phone TEXT,
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # After table creation, ensure password hashing column exists and migrate old plaintext passwords if any
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        if 'password_hash' not in columns:
            # Add password_hash column
            cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
            # Migrate existing plaintext passwords into password_hash
            try:
                cursor.execute("SELECT id, password FROM users WHERE password IS NOT NULL AND password != ''")
                rows = cursor.fetchall()
                for row in rows:
                    uid = row[0]
                    plain = row[1]
                    try:
                        hashed = bcrypt.hashpw(plain.encode('utf-8'), bcrypt.gensalt())
                        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hashed, uid))
                    except Exception:
                        # If hashing fails for some reason, skip and continue
                        continue
            except Exception:
                # Table may not have 'password' column or select may fail; ignore
                pass

        # Create default users if missing
        cursor.execute("SELECT COUNT(*) FROM users WHERE username='admin'")
        if cursor.fetchone()[0] == 0:
            admin_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, first_name, last_name, role)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', ('admin', 'admin@storesync.com', admin_hash, 'Admin', 'User', 'admin'))
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE username='customer'")
        if cursor.fetchone()[0] == 0:
            customer_hash = bcrypt.hashpw('customer123'.encode('utf-8'), bcrypt.gensalt())
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, first_name, last_name, role)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', ('customer', 'customer@storesync.com', customer_hash, 'John', 'Doe', 'customer'))
        
        # PRODUCTS TABLE
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                stock_quantity INTEGER DEFAULT 0,
                category TEXT,
                image TEXT,
                rating REAL DEFAULT 4.5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert sample products
        sample_products = [
            ("Smartphone X12", "Latest smartphone with 128GB storage", 699.99, 25, "electronics", "📱"),
            ("Wireless Headphones Pro", "Noise-cancelling wireless headphones", 199.99, 15, "electronics", "🎧"),
            ("Laptop EliteBook", "15-inch laptop with i7 processor", 1299.99, 10, "electronics", "💻"),
            ("Smart Watch Pro", "Fitness tracker with heart rate monitor", 299.99, 8, "electronics", "⌚"),
            ("Bluetooth Speaker", "Portable speaker with 24hr battery", 89.99, 35, "electronics", "🔊")
        ]
        
        cursor.execute("SELECT COUNT(*) FROM products")
        if cursor.fetchone()[0] == 0:
            for product in sample_products:
                cursor.execute('''
                    INSERT INTO products (name, description, price, stock_quantity, category, image)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', product)
        
        # ORDERS TABLE
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT UNIQUE NOT NULL,
                user_id INTEGER,
                customer_name TEXT NOT NULL,
                customer_email TEXT NOT NULL,
                customer_phone TEXT,
                shipping_address TEXT,
                payment_method TEXT,
                items TEXT,
                total_amount REAL NOT NULL,
                status TEXT DEFAULT 'processing',
                order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        
        conn.commit()
        conn.close()
        print("Database initialized successfully")
    
    # USER METHODS
    def register_user(self, username, email, password, first_name, last_name, role='customer', phone='', address=''):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone, address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (username, email, password_hash, first_name, last_name, role, phone, address))
            conn.commit()
            user_id = cursor.lastrowid
            return {"success": True, "user_id": user_id, "message": "Registration successful"}
        except sqlite3.IntegrityError as e:
            if "UNIQUE constraint failed: users.username" in str(e):
                return {"success": False, "error": "Username already exists"}
            elif "UNIQUE constraint failed: users.email" in str(e):
                return {"success": False, "error": "Email already exists"}
            else:
                return {"success": False, "error": "Registration failed"}
        finally:
            conn.close()
    
    def login_user(self, username, password):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        conn.close()
        
        # Safely get the password hash (some databases might still have 'password' column)
        try:
            phash = user['password_hash'] if 'password_hash' in user.keys() else user['password']
        except Exception:
            phash = None

        if user and phash:
            try:
                if bcrypt.checkpw(password.encode('utf-8'), phash):
                    return {
                        "success": True,
                        "user": {
                            "id": user['id'],
                            "username": user['username'],
                            "email": user['email'],
                            "first_name": user['first_name'],
                            "last_name": user['last_name'],
                            "role": user['role'],
                            "phone": user['phone'],
                            "address": user['address']
                        }
                    }
            except Exception:
                # If bcrypt raises (e.g. stored value not a hash), attempt direct compare (legacy plaintext)
                if phash == password:
                    return {"success": True, "user": {"id": user['id'], "username": user['username'], "email": user['email'], "first_name": user['first_name'], "last_name": user['last_name'], "role": user['role'], "phone": user['phone'], "address": user['address']}}

        return {"success": False, "error": "Invalid credentials"}
    
    # PRODUCT METHODS
    def get_all_products(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM products ORDER BY id DESC')
        products = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return products
    
    def get_product_by_id(self, product_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
        product = cursor.fetchone()
        conn.close()
        return dict(product) if product else None
    
    def add_product(self, name, description, price, stock_quantity, category, image):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO products (name, description, price, stock_quantity, category, image)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (name, description, price, stock_quantity, category, image))
            conn.commit()
            product_id = cursor.lastrowid
            return {"success": True, "product_id": product_id}
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    # ORDER METHODS
    def create_order(self, user_id, customer_data, items, total_amount):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{cursor.lastrowid or 1:04d}"
        
        try:
            cursor.execute('''
                INSERT INTO orders (order_number, user_id, customer_name, customer_email, 
                customer_phone, shipping_address, payment_method, items, total_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                order_number,
                user_id,
                customer_data['customerName'],
                customer_data['customerEmail'],
                customer_data.get('customerPhone', ''),
                customer_data.get('shippingAddress', ''),
                customer_data.get('paymentMethod', 'cash'),
                json.dumps(items),
                total_amount
            ))
            
            # Update product stock
            for item in items:
                cursor.execute('''
                    UPDATE products 
                    SET stock_quantity = stock_quantity - ? 
                    WHERE id = ?
                ''', (item['quantity'], item['product_id']))
            
            conn.commit()
            return {"success": True, "order_number": order_number}
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    def get_user_orders(self, user_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC', (user_id,))
        orders = []
        for row in cursor.fetchall():
            order = dict(row)
            order['items'] = json.loads(order['items'])
            orders.append(order)
        conn.close()
        return orders
    
    def get_all_orders(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM orders ORDER BY order_date DESC')
        orders = []
        for row in cursor.fetchall():
            order = dict(row)
            order['items'] = json.loads(order['items'])
            orders.append(order)
        conn.close()
        return orders
    
    def update_order_status(self, order_number, status):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('UPDATE orders SET status = ? WHERE order_number = ?', (status, order_number))
            conn.commit()
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            conn.close()
    
    # ADMIN METHODS
    def get_dashboard_stats(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM users')
        total_users = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM products')
        total_products = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM orders')
        total_orders = cursor.fetchone()[0]
        
        cursor.execute('SELECT SUM(total_amount) FROM orders')
        total_revenue = cursor.fetchone()[0] or 0
        
        # Get low stock products
        cursor.execute('SELECT COUNT(*) FROM products WHERE stock_quantity < 10')
        low_stock = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "total_users": total_users,
            "total_products": total_products,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "low_stock_items": low_stock
        }

# Create database instance
db = StoreDatabase()