const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database connection (SQLite)
const db = new sqlite3.Database(process.env.DB_PATH || './storesync.db', (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('✅ PostgreSQL connected successfully');
    release();
});

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ========== AUTHENTICATION ROUTES ==========

// Register user
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, type = 'customer', phone, address, city, state, zipCode } = req.body;

        // Check if user exists
        const userCheck = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (name, email, password, type, phone, address, city, state, zip_code) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING id, name, email, type, created_at`,
            [name, email, hashedPassword, type, phone, address, city, state, zipCode]
        );

        const user = result.rows[0];

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, type: user.type },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                type: user.type,
                joinedDate: user.created_at
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login user
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, type: user.type },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                type: user.type,
                phone: user.phone,
                address: user.address,
                city: user.city,
                state: user.state,
                zipCode: user.zip_code,
                joinedDate: user.created_at
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ========== PRODUCT ROUTES ==========

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const { category, search, sort = 'newest', page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM products WHERE 1=1';
        let params = [];
        let paramCount = 0;

        if (category) {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            params.push(category);
        }

        if (search) {
            paramCount++;
            query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        // Add sorting
        switch (sort) {
            case 'price_low':
                query += ' ORDER BY price ASC';
                break;
            case 'price_high':
                query += ' ORDER BY price DESC';
                break;
            case 'rating':
                query += ' ORDER BY rating DESC';
                break;
            case 'newest':
            default:
                query += ' ORDER BY created_at DESC';
                break;
        }

        // Add pagination
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await pool.query(query, params);

        // Get total count for pagination
        const countQuery = 'SELECT COUNT(*) FROM products WHERE 1=1';
        const countResult = await pool.query(countQuery);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            products: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM products WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create product (Admin only)
app.post('/api/products', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const result = await pool.query(
            `INSERT INTO products (name, description, price, category, stock, image_url, rating) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [name, description, parseFloat(price), category, parseInt(stock), imageUrl, 4.5]
        );

        res.status(201).json({
            message: 'Product created successfully',
            product: result.rows[0]
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product (Admin only)
app.put('/api/products/:id', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, stock } = req.body;

        // Check if product exists
        const checkResult = await pool.query(
            'SELECT * FROM products WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let imageUrl = checkResult.rows[0].image_url;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
            // Delete old image if exists
            if (checkResult.rows[0].image_url) {
                const oldImagePath = path.join(__dirname, checkResult.rows[0].image_url);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        const result = await pool.query(
            `UPDATE products 
             SET name = $1, description = $2, price = $3, category = $4, stock = $5, image_url = $6, updated_at = CURRENT_TIMESTAMP
             WHERE id = $7 
             RETURNING *`,
            [name, description, parseFloat(price), category, parseInt(stock), imageUrl, id]
        );

        res.json({
            message: 'Product updated successfully',
            product: result.rows[0]
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product (Admin only)
app.delete('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const checkResult = await pool.query(
            'SELECT * FROM products WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Delete image if exists
        if (checkResult.rows[0].image_url) {
            const imagePath = path.join(__dirname, checkResult.rows[0].image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await pool.query('DELETE FROM products WHERE id = $1', [id]);

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// ========== ORDER ROUTES ==========

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const { items, shippingAddress, paymentMethod } = req.body;

        // Calculate totals
        let subtotal = 0;
        const orderItems = [];

        // Check stock and prepare items
        for (const item of items) {
            const productResult = await pool.query(
                'SELECT * FROM products WHERE id = $1 FOR UPDATE',
                [item.id]
            );

            if (productResult.rows.length === 0) {
                return res.status(404).json({ error: `Product ${item.name} not found` });
            }

            const product = productResult.rows[0];
            if (product.stock < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
            }

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                product_id: product.id,
                product_name: product.name,
                price: product.price,
                quantity: item.quantity,
                total: itemTotal
            });
        }

        const shipping = 5.99;
        const tax = subtotal * 0.08;
        const total = subtotal + shipping + tax;

        // Generate order number
        const orderNumber = 'ORD-' + Date.now().toString().slice(-8);

        // Start transaction
        await pool.query('BEGIN');

        try {
            // Create order
            const orderResult = await pool.query(
                `INSERT INTO orders (
                    order_number, user_id, customer_name, customer_email, 
                    shipping_address, payment_method, subtotal, shipping, 
                    tax, total, order_date, order_time
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, CURRENT_TIME)
                RETURNING id`,
                [orderNumber, user.id, user.name, user.email, shippingAddress,
                    paymentMethod, subtotal, shipping, tax, total]
            );

            const orderId = orderResult.rows[0].id;

            // Add order items
            for (const item of orderItems) {
                await pool.query(
                    `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [orderId, item.product_id, item.product_name, item.price, item.quantity, item.total]
                );

                // Update product stock
                await pool.query(
                    'UPDATE products SET stock = stock - $1 WHERE id = $2',
                    [item.quantity, item.product_id]
                );
            }

            // Clear user's cart
            await pool.query('DELETE FROM cart WHERE user_id = $1', [user.id]);

            await pool.query('COMMIT');

            // Get complete order details
            const completeOrder = await pool.query(
                `SELECT o.*, 
                 json_agg(json_build_object(
                     'id', oi.product_id,
                     'name', oi.product_name,
                     'price', oi.price,
                     'quantity', oi.quantity,
                     'total', oi.total
                 )) as items
                 FROM orders o
                 JOIN order_items oi ON o.id = oi.order_id
                 WHERE o.id = $1
                 GROUP BY o.id`,
                [orderId]
            );

            res.status(201).json({
                message: 'Order placed successfully',
                order: completeOrder.rows[0]
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

// Get user orders
app.get('/api/orders/my-orders', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT o.*, 
                   json_agg(json_build_object(
                       'id', oi.product_id,
                       'name', oi.product_name,
                       'price', oi.price,
                       'quantity', oi.quantity,
                       'total', oi.total
                   )) as items
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = $1
        `;

        let params = [user.id];
        let paramCount = 1;

        if (status) {
            paramCount++;
            query += ` AND o.status = $${paramCount}`;
            params.push(status);
        }

        query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get total count
        const countQuery = 'SELECT COUNT(*) FROM orders WHERE user_id = $1' + (status ? ' AND status = $2' : '');
        const countResult = await pool.query(countQuery, status ? [user.id, status] : [user.id]);

        res.json({
            orders: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(countResult.rows[0].count / limit)
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get all orders (Admin only)
app.get('/api/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT o.*, 
                   json_agg(json_build_object(
                       'id', oi.product_id,
                       'name', oi.product_name,
                       'price', oi.price,
                       'quantity', oi.quantity,
                       'total', oi.total
                   )) as items
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE 1=1
        `;

        let params = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            query += ` AND o.status = $${paramCount}`;
            params.push(status);
        }

        if (startDate) {
            paramCount++;
            query += ` AND o.order_date >= $${paramCount}`;
            params.push(startDate);
        }

        if (endDate) {
            paramCount++;
            query += ` AND o.order_date <= $${paramCount}`;
            params.push(endDate);
        }

        query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM orders WHERE 1=1';
        let countParams = [];
        let countParamCount = 0;

        if (status) {
            countParamCount++;
            countQuery += ` AND status = $${countParamCount}`;
            countParams.push(status);
        }

        if (startDate) {
            countParamCount++;
            countQuery += ` AND order_date >= $${countParamCount}`;
            countParams.push(startDate);
        }

        if (endDate) {
            countParamCount++;
            countQuery += ` AND order_date <= $${countParamCount}`;
            countParams.push(endDate);
        }

        const countResult = await pool.query(countQuery, countParams);

        res.json({
            orders: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(countResult.rows[0].count / limit)
            }
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Update order status (Admin only)
app.put('/api/orders/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        // Check if order exists
        const checkResult = await pool.query(
            'SELECT * FROM orders WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update order status
        await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2',
            [status, id]
        );

        // Add status history
        await pool.query(
            'INSERT INTO order_status_history (order_id, status, notes) VALUES ($1, $2, $3)',
            [id, status, notes]
        );

        // Create notification for user
        const order = checkResult.rows[0];
        await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, metadata)
             VALUES ($1, 'order', 'Order Status Updated', $2, $3)`,
            [order.user_id, `Your order ${order.order_number} status has been updated to ${status}`,
            JSON.stringify({ orderId: order.order_number, status })]
        );

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// ========== CART ROUTES ==========

// Get cart items
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const user = req.user;

        const result = await pool.query(
            `SELECT c.*, p.name, p.price, p.image_url, p.stock
             FROM cart c
             JOIN products p ON c.product_id = p.id
             WHERE c.user_id = $1`,
            [user.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// Add to cart
app.post('/api/cart', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const { productId, quantity = 1 } = req.body;

        // Check if product exists and has stock
        const productResult = await pool.query(
            'SELECT * FROM products WHERE id = $1',
            [productId]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = productResult.rows[0];
        if (product.stock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Check if item already in cart
        const cartResult = await pool.query(
            'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
            [user.id, productId]
        );

        if (cartResult.rows.length > 0) {
            // Update quantity
            await pool.query(
                'UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
                [quantity, user.id, productId]
            );
        } else {
            // Add new item
            await pool.query(
                'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)',
                [user.id, productId, quantity]
            );
        }

        res.json({ message: 'Product added to cart' });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// Update cart item quantity
app.put('/api/cart/:productId', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const { productId } = req.params;
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        // Check stock
        const productResult = await pool.query(
            'SELECT stock FROM products WHERE id = $1',
            [productId]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (productResult.rows[0].stock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Update cart
        await pool.query(
            'UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3',
            [quantity, user.id, productId]
        );

        res.json({ message: 'Cart updated' });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

// Remove from cart
app.delete('/api/cart/:productId', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const { productId } = req.params;

        await pool.query(
            'DELETE FROM cart WHERE user_id = $1 AND product_id = $2',
            [user.id, productId]
        );

        res.json({ message: 'Product removed from cart' });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Failed to remove from cart' });
    }
});

// ========== USER PROFILE ROUTES ==========

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = req.user;

        const result = await pool.query(
            'SELECT id, name, email, type, phone, address, city, state, zip_code, created_at FROM users WHERE id = $1',
            [user.id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const { name, phone, address, city, state, zipCode } = req.body;

        await pool.query(
            `UPDATE users 
             SET name = $1, phone = $2, address = $3, city = $4, state = $5, zip_code = $6, updated_at = CURRENT_TIMESTAMP
             WHERE id = $7`,
            [name, phone, address, city, state, zipCode, user.id]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// ========== DASHBOARD STATS ROUTES ==========

// Get dashboard stats (Admin)
app.get('/api/dashboard/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { period = 'month' } = req.query;

        // Get stats
        const [
            totalRevenue,
            totalOrders,
            totalCustomers,
            totalProducts,
            monthlyRevenue,
            orderStats
        ] = await Promise.all([
            // Total revenue
            pool.query('SELECT COALESCE(SUM(total), 0) as total FROM orders'),

            // Total orders
            pool.query('SELECT COUNT(*) as total FROM orders'),

            // Total customers
            pool.query("SELECT COUNT(*) as total FROM users WHERE type = 'customer'"),

            // Total products
            pool.query('SELECT COUNT(*) as total FROM products'),

            // Monthly revenue (last 6 months)
            pool.query(`
                SELECT 
                    TO_CHAR(date, 'Mon') as month,
                    COALESCE(SUM(o.total), 0) as revenue
                FROM 
                    generate_series(
                        CURRENT_DATE - INTERVAL '5 months', 
                        CURRENT_DATE, 
                        '1 month'
                    ) as date
                LEFT JOIN orders o ON 
                    DATE_TRUNC('month', o.order_date) = DATE_TRUNC('month', date)
                GROUP BY date
                ORDER BY date
            `),

            // Order status statistics
            pool.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM orders
                GROUP BY status
            `)
        ]);

        res.json({
            totalRevenue: parseFloat(totalRevenue.rows[0].total),
            totalOrders: parseInt(totalOrders.rows[0].total),
            totalCustomers: parseInt(totalCustomers.rows[0].total),
            totalProducts: parseInt(totalProducts.rows[0].total),
            monthlyRevenue: monthlyRevenue.rows,
            orderStats: orderStats.rows
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// ========== NOTIFICATIONS ROUTES ==========

// Get user notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const { unreadOnly = false } = req.query;

        let query = 'SELECT * FROM notifications WHERE user_id = $1';
        const params = [user.id];

        if (unreadOnly) {
            query += ' AND is_read = false';
        }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        await pool.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
            [id, user.id]
        );

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
    try {
        const user = req.user;

        await pool.query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1',
            [user.id]
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// ========== CUSTOMERS ROUTES (Admin) ==========

// Get all customers (Admin)
app.get('/api/customers', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                u.*,
                COUNT(o.id) as order_count,
                COALESCE(SUM(o.total), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            WHERE u.type = 'customer'
        `;

        let params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get total count
        const countQuery = "SELECT COUNT(*) FROM users WHERE type = 'customer'" + (search ? ' AND (name ILIKE $1 OR email ILIKE $1)' : '');
        const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);

        res.json({
            customers: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(countResult.rows[0].count / limit)
            }
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// ========== ERROR HANDLING ==========

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📊 PostgreSQL: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});