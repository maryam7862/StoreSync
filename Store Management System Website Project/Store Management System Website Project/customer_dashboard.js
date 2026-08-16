// ========== GLOBAL VARIABLES ==========
let currentUser = {};
let cart = JSON.parse(localStorage.getItem('storesync_cart')) || [];
let products = [];
let currentOrder = null;

// ========== PRODUCTS DATABASE ==========
const productsData = [
    {
        id: 1,
        name: "Smartphone X12",
        description: "Latest smartphone with 128GB storage, 8GB RAM, 48MP camera",
        price: 699.99,
        category: "Electronics",
        image: "📱",
        stock: 25,
        rating: 4.8
    },
    {
        id: 2,
        name: "Wireless Headphones Pro",
        description: "Noise-cancelling wireless headphones with 30hr battery",
        price: 199.99,
        category: "Electronics",
        image: "🎧",
        stock: 15,
        rating: 4.6
    },
    {
        id: 3,
        name: "Laptop EliteBook",
        description: "15-inch laptop with i7 processor, 16GB RAM, 512GB SSD",
        price: 1299.99,
        category: "Electronics",
        image: "💻",
        stock: 10,
        rating: 4.9
    },
    {
        id: 4,
        name: "Smart Watch Series 5",
        description: "Fitness tracker with heart rate monitor and GPS",
        price: 249.99,
        category: "Electronics",
        image: "⌚",
        stock: 30,
        rating: 4.7
    },
    {
        id: 5,
        name: "Wireless Mouse",
        description: "Ergonomic wireless mouse with silent clicks",
        price: 29.99,
        category: "Electronics",
        image: "🖱️",
        stock: 50,
        rating: 4.5
    },
    {
        id: 6,
        name: "Gaming Keyboard",
        description: "Mechanical RGB gaming keyboard with anti-ghosting",
        price: 89.99,
        category: "Electronics",
        image: "⌨️",
        stock: 20,
        rating: 4.8
    },
    {
        id: 7,
        name: "Bluetooth Speaker",
        description: "Portable waterproof speaker with 360° sound",
        price: 79.99,
        category: "Electronics",
        image: "🔊",
        stock: 35,
        rating: 4.4
    },
    {
        id: 8,
        name: "Tablet Mini",
        description: "8-inch tablet with retina display and stylus support",
        price: 399.99,
        category: "Electronics",
        image: "📱",
        stock: 18,
        rating: 4.6
    },
    {
        id: 9,
        name: "DSLR Camera",
        description: "24MP DSLR camera with kit lens and accessories",
        price: 899.99,
        category: "Electronics",
        image: "📷",
        stock: 8,
        rating: 4.9
    },
    {
        id: 10,
        name: "Power Bank 20000mAh",
        description: "Fast charging power bank with multiple ports",
        price: 49.99,
        category: "Electronics",
        image: "🔋",
        stock: 40,
        rating: 4.3
    }
    ,
    {
        id: 11,
        name: "Fitness Band Plus",
        description: "Activity tracker with sleep monitoring and 10-day battery",
        price: 59.99,
        category: "Electronics",
        image: "🏃",
        stock: 60,
        rating: 4.2
    },
    {
        id: 12,
        name: "Cotton Comfort T-Shirt",
        description: "Breathable cotton tee available in multiple colors",
        price: 19.99,
        category: "Apparel",
        image: "👕",
        stock: 120,
        rating: 4.1
    },
    {
        id: 13,
        name: "Ceramic Coffee Mug",
        description: "350ml insulated ceramic mug with lid",
        price: 14.99,
        category: "Home",
        image: "☕",
        stock: 80,
        rating: 4.4
    },
    {
        id: 14,
        name: "LED Desk Lamp",
        description: "Dimmable LED lamp with USB charging port",
        price: 39.99,
        category: "Home",
        image: "💡",
        stock: 45,
        rating: 4.5
    },
    {
        id: 15,
        name: "Running Shoes LX",
        description: "Lightweight running shoes with breathable mesh",
        price: 89.99,
        category: "Footwear",
        image: "👟",
        stock: 35,
        rating: 4.6
    },
    {
        id: 16,
        name: "Stainless Steel Water Bottle",
        description: "Keeps drinks cold for 24 hours, 750ml",
        price: 24.99,
        category: "Accessories",
        image: "🔵",
        stock: 200,
        rating: 4.7
    },
    {
        id: 17,
        name: "Bluetooth Earbuds Lite",
        description: "Compact earbuds with charging case",
        price: 49.99,
        category: "Electronics",
        image: "🎧",
        stock: 90,
        rating: 4.0
    },
    {
        id: 18,
        name: "Scented Candle Set",
        description: "Set of 3 long-burning aromatic candles",
        price: 29.99,
        category: "Home",
        image: "🕯️",
        stock: 70,
        rating: 4.3
    },
    {
        id: 19,
        name: "Noise Isolating Earphones",
        description: "Wired earphones with in-line mic",
        price: 12.99,
        category: "Electronics",
        image: "🎧",
        stock: 150,
        rating: 3.9
    },
    {
        id: 20,
        name: "Classic Sunglasses",
        description: "UV400 protection with stylish frame",
        price: 34.99,
        category: "Accessories",
        image: "🕶️",
        stock: 65,
        rating: 4.2
    },
    {
        id: 21,
        name: "Wireless Charger Pad",
        description: "Fast wireless charging compatible with Qi devices",
        price: 29.99,
        category: "Electronics",
        image: "🔌",
        stock: 110,
        rating: 4.4
    },
    {
        id: 22,
        name: "Comfort Pillow",
        description: "Memory foam pillow with breathable cover",
        price: 44.99,
        category: "Home",
        image: "🛏️",
        stock: 40,
        rating: 4.5
    },
    {
        id: 23,
        name: "Sturdy Backpack",
        description: "Water-resistant backpack with laptop sleeve",
        price: 59.99,
        category: "Accessories",
        image: "🎒",
        stock: 75,
        rating: 4.6
    },
    {
        id: 24,
        name: "Kitchen Knife Set",
        description: "4-piece stainless steel chef knife set",
        price: 69.99,
        category: "Home",
        image: "🔪",
        stock: 30,
        rating: 4.7
    },
    {
        id: 25,
        name: "Yoga Mat Pro",
        description: "Non-slip yoga mat with carrying strap",
        price: 29.99,
        category: "Fitness",
        image: "🧘",
        stock: 95,
        rating: 4.4
    },
    {
        id: 26,
        name: "Portable Projector Mini",
        description: "Compact projector for movies and presentations",
        price: 199.99,
        category: "Electronics",
        image: "📽️",
        stock: 20,
        rating: 4.1
    },
    {
        id: 27,
        name: "Kids Building Blocks",
        description: "Educational 200-piece building set",
        price: 24.99,
        category: "Toys",
        image: "🧩",
        stock: 140,
        rating: 4.5
    },
    {
        id: 28,
        name: "Travel Adapter",
        description: "Universal travel adapter with USB ports",
        price: 19.99,
        category: "Accessories",
        image: "🔌",
        stock: 180,
        rating: 4.0
    },
    {
        id: 29,
        name: "Eco Bamboo Toothbrush",
        description: "Pack of 4 biodegradable toothbrushes",
        price: 9.99,
        category: "Personal Care",
        image: "🪥",
        stock: 210,
        rating: 4.2
    },
    {
        id: 30,
        name: "Wireless Numeric Keypad",
        description: "Bluetooth numeric keypad for laptops",
        price: 34.99,
        category: "Electronics",
        image: "🔢",
        stock: 55,
        rating: 4.3
    }
];

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    // Load current user from localStorage
    loadCurrentUser();
    
    // Initialize products
    products = productsData;
    
    // Initialize UI
    renderProducts();
    updateCartDisplay();
    
    // Set up event listeners
    setupEventListeners();
    
    // Show welcome notification
    showNotification(`Welcome back, ${currentUser.name}!`, 'success');
});

// ========== USER MANAGEMENT ==========
function loadCurrentUser() {
    const storedUser = localStorage.getItem('storesync_current_user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
        document.getElementById('customerName').value = currentUser.name;
        document.getElementById('customerEmail').value = currentUser.email || '';
    } else {
        // Redirect to login if no user found
        window.location.href = 'index.html';
    }
}

function logout() {
    localStorage.removeItem('storesync_current_user');
    localStorage.removeItem('storesync_cart');
    window.location.href = 'index.html';
}

// ========== PRODUCTS MANAGEMENT ==========
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-badge">${product.category}</div>
            <div class="product-image">${product.image}</div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <div style="color: #ffc107;">
                            ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}
                        </div>
                        <div style="font-size: 12px; color: var(--gray);">Stock: ${product.stock}</div>
                    </div>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                </div>
                <div class="product-footer">
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

// ========== CART MANAGEMENT ==========
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            showNotification('No more stock available!', 'error');
            return;
        }
    } else {
        if (product.stock > 0) {
            cart.push({
                ...product,
                quantity: 1
            });
        } else {
            showNotification('Product out of stock!', 'error');
            return;
        }
    }
    
    saveCart();
    updateCartDisplay();
    showNotification(`${product.name} added to cart!`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartDisplay();
    showNotification('Item removed from cart', 'success');
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    const product = products.find(p => p.id === productId);
    
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > product.stock) {
        showNotification('Cannot exceed available stock!', 'error');
        return;
    }
    
    item.quantity = newQuantity;
    saveCart();
    updateCartDisplay();
}

function saveCart() {
    localStorage.setItem('storesync_cart', JSON.stringify(cart));
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Add some products to get started</p>
            </div>
        `;
        cartSummary.style.display = 'none';
        return;
    }
    
    cartItems.innerHTML = '';
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">${item.image}</div>
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <div style="font-weight: 600; color: var(--customer); min-width: 80px; text-align: right;">
                    $${itemTotal.toFixed(2)}
                </div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    // Update summary
    const shipping = 5.00;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    
    cartSummary.style.display = 'block';
}

// ========== ORDER MANAGEMENT ==========
function placeOrder(orderData) {
    // Generate order number
    const orderNumber = 'ORD-' + Date.now().toString().slice(-8);
    const orderDate = new Date().toLocaleDateString();
    const orderTime = new Date().toLocaleTimeString();
    
    // Calculate order total
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 5.00;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;
    
    currentOrder = {
        orderNumber,
        orderDate,
        orderTime,
        customer: orderData,
        items: [...cart],
        subtotal,
        shipping,
        tax,
        total,
        status: 'Processing'
    };
    
    // Save order to localStorage
    const orders = JSON.parse(localStorage.getItem('storesync_orders') || '[]');
    orders.push(currentOrder);
    localStorage.setItem('storesync_orders', JSON.stringify(orders));
    
    // Clear cart
    cart = [];
    saveCart();
    updateCartDisplay();
    
    // Generate receipt
    generateReceipt();
    
    // Show success message
    showNotification(`Order ${orderNumber} placed successfully!`, 'success');
    
    // Navigate to receipt section
    navigateToSection('receipt');
}

function generateReceipt() {
    const receiptContent = document.getElementById('receiptContent');
    const receiptActions = document.getElementById('receiptActions');
    
    if (!currentOrder) {
        receiptContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>No receipt generated</h3>
                <p>Place an order to generate your receipt</p>
            </div>
        `;
        receiptActions.style.display = 'none';
        return;
    }
    
    let itemsHTML = '';
    currentOrder.items.forEach(item => {
        itemsHTML += `
            <div class="receipt-item">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>Qty: ${item.quantity} × $${item.price.toFixed(2)}</small>
                </div>
                <div>$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `;
    });
    
    receiptContent.innerHTML = `
        <div class="receipt">
            <div class="receipt-header">
                <h2>StoreSync Receipt</h2>
                <p>Thank you for your purchase!</p>
            </div>
            
            <div class="receipt-details">
                <div>
                    <strong>Order Number:</strong><br>
                    ${currentOrder.orderNumber}
                </div>
                <div>
                    <strong>Order Date:</strong><br>
                    ${currentOrder.orderDate} ${currentOrder.orderTime}
                </div>
                <div>
                    <strong>Customer:</strong><br>
                    ${currentOrder.customer.customerName}<br>
                    ${currentOrder.customer.customerEmail}<br>
                    ${currentOrder.customer.customerPhone}
                </div>
                <div>
                    <strong>Shipping To:</strong><br>
                    ${currentOrder.customer.shippingAddress}
                </div>
            </div>
            
            <h3 style="margin: 30px 0 15px 0;">Order Items</h3>
            ${itemsHTML}
            
            <div class="receipt-total">
                <div>Total Amount</div>
                <div class="amount">$${currentOrder.total.toFixed(2)}</div>
                <div style="margin-top: 10px; font-size: 14px; opacity: 0.9;">
                    Order Status: ${currentOrder.status}
                </div>
            </div>
            
            <div style="text-align: center; color: var(--gray); margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--light-gray);">
                <p>Thank you for shopping with StoreSync!</p>
                <p>For any queries, contact support@storesync.com</p>
                <p>Receipt ID: ${currentOrder.orderNumber}</p>
            </div>
        </div>
    `;
    
    receiptActions.style.display = 'flex';
}

// ========== PDF GENERATION ==========
async function downloadReceipt() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add receipt content
    doc.setFontSize(20);
    doc.setTextColor(114, 9, 183);
    doc.text('StoreSync Receipt', 105, 20, null, null, 'center');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for your purchase!', 105, 30, null, null, 'center');
    
    // Order details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Order Number: ${currentOrder.orderNumber}`, 20, 50);
    doc.text(`Order Date: ${currentOrder.orderDate} ${currentOrder.orderTime}`, 20, 60);
    doc.text(`Customer: ${currentOrder.customer.customerName}`, 20, 70);
    doc.text(`Email: ${currentOrder.customer.customerEmail}`, 20, 80);
    doc.text(`Phone: ${currentOrder.customer.customerPhone}`, 20, 90);
    
    // Items table
    let y = 110;
    doc.text('Items:', 20, y);
    y += 10;
    
    currentOrder.items.forEach((item, index) => {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        doc.text(`${item.name}`, 25, y);
        doc.text(`Qty: ${item.quantity} × $${item.price.toFixed(2)}`, 140, y);
        doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 180, y);
        y += 10;
    });
    
    // Totals
    y += 10;
    doc.text(`Subtotal: $${currentOrder.subtotal.toFixed(2)}`, 140, y);
    y += 10;
    doc.text(`Shipping: $${currentOrder.shipping.toFixed(2)}`, 140, y);
    y += 10;
    doc.text(`Tax: $${currentOrder.tax.toFixed(2)}`, 140, y);
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(114, 9, 183);
    doc.text(`Total: $${currentOrder.total.toFixed(2)}`, 140, y);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for shopping with StoreSync!', 105, 280, null, null, 'center');
    doc.text('For any queries, contact support@storesync.com', 105, 285, null, null, 'center');
    
    // Save PDF
    doc.save(`receipt-${currentOrder.orderNumber}.pdf`);
    showNotification('Receipt downloaded successfully!', 'success');
}

function printReceipt() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt - ${currentOrder.orderNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .receipt-header { text-align: center; margin-bottom: 30px; }
                    .receipt-header h2 { color: #7209b7; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background-color: #f5f5f5; }
                    .total { font-size: 18px; font-weight: bold; color: #7209b7; }
                    .footer { text-align: center; margin-top: 40px; color: #666; }
                </style>
            </head>
            <body>
                <div class="receipt-header">
                    <h2>StoreSync Receipt</h2>
                    <p>Thank you for your purchase!</p>
                </div>
                
                <div>
                    <strong>Order Number:</strong> ${currentOrder.orderNumber}<br>
                    <strong>Order Date:</strong> ${currentOrder.orderDate} ${currentOrder.orderTime}<br>
                    <strong>Customer:</strong> ${currentOrder.customer.customerName}<br>
                    <strong>Email:</strong> ${currentOrder.customer.customerEmail}<br>
                    <strong>Phone:</strong> ${currentOrder.customer.customerPhone}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentOrder.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>$${item.price.toFixed(2)}</td>
                                <td>$${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div style="text-align: right;">
                    <div>Subtotal: $${currentOrder.subtotal.toFixed(2)}</div>
                    <div>Shipping: $${currentOrder.shipping.toFixed(2)}</div>
                    <div>Tax: $${currentOrder.tax.toFixed(2)}</div>
                    <div class="total">Total: $${currentOrder.total.toFixed(2)}</div>
                </div>
                
                <div class="footer">
                    <p>Thank you for shopping with StoreSync!</p>
                    <p>For any queries, contact support@storesync.com</p>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ========== AI ASSISTANT ==========
function askAIRecommendation(category) {
    const aiResponse = document.getElementById('aiResponse');
    
    // Simulate AI processing
    aiResponse.innerHTML = '<div class="loading"></div> Analyzing your request...';
    aiResponse.style.display = 'block';
    
    setTimeout(() => {
        const recommendations = {
            'best electronics': [
                'Smartphone X12 - Top rated with 48MP camera',
                'Laptop EliteBook - Best for professionals',
                'Wireless Headphones Pro - Excellent sound quality'
            ],
            'trending fashion': [
                'Summer Collection 2024 - Latest trends',
                'Casual Wear - Comfortable and stylish',
                'Formal Attire - Perfect for office wear'
            ],
            'home essentials': [
                'Smart Home Kit - Automate your home',
                'Kitchen Set - Premium quality utensils',
                'Bedding Collection - Comfortable sleep'
            ],
            'gifts under $50': [
                'Wireless Mouse - $29.99',
                'Power Bank - $49.99',
                'Smart Watch Band - $24.99'
            ]
        };
        
        const response = recommendations[category] || [
            'Here are some popular products you might like:',
            '• Smartphone X12 - $699.99',
            '• Wireless Headphones - $199.99',
            '• Smart Watch - $249.99'
        ];
        
        aiResponse.innerHTML = `
            <strong>🤖 AI Recommendation:</strong><br><br>
            ${response.map(item => `• ${item}`).join('<br>')}<br><br>
            <small>Based on customer preferences and trends</small>
        `;
    }, 1000);
}

function handleAIQuery() {
    const query = document.getElementById('aiQuery').value.trim();
    if (!query) return;
    
    const aiResponse = document.getElementById('aiResponse');
    aiResponse.innerHTML = '<div class="loading"></div> Processing your query...';
    aiResponse.style.display = 'block';
    
    // Simulate AI response
    setTimeout(() => {
        const responses = [
            `Based on "${query}", I recommend checking out our Electronics section. The Smartphone X12 and Laptop EliteBook are currently the most popular choices.`,
            `For "${query}", consider these options: Wireless Headphones Pro for audio, Smart Watch for fitness tracking, or Tablet Mini for portability.`,
            `I understand you're looking for "${query}". Our best-selling products in this category are: 1) Gaming Keyboard, 2) Bluetooth Speaker, 3) DSLR Camera.`,
            `Regarding "${query}", here are my suggestions: Check product ratings, read customer reviews, and compare specifications before deciding.`
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        aiResponse.innerHTML = `
            <strong>🤖 AI Response:</strong><br><br>
            ${randomResponse}<br><br>
            <small>Tip: You can filter products by category or price range for better results.</small>
        `;
        
        document.getElementById('aiQuery').value = '';
    }, 1500);
}

// ========== NAVIGATION ==========
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const section = this.dataset.section;
            navigateToSection(section);
        });
    });
    
    // Proceed to checkout
    document.getElementById('proceedToCheckout').addEventListener('click', function() {
        if (cart.length === 0) {
            showNotification('Your cart is empty!', 'error');
            return;
        }
        navigateToSection('place-order');
    });
    
    // Place order form
    document.getElementById('orderForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (cart.length === 0) {
            showNotification('Your cart is empty!', 'error');
            return;
        }
        
        const orderData = {
            customerName: document.getElementById('customerName').value,
            customerPhone: document.getElementById('customerPhone').value,
            customerEmail: document.getElementById('customerEmail').value,
            shippingAddress: document.getElementById('shippingAddress').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            specialInstructions: document.getElementById('specialInstructions').value
        };
        
        // Show loading
        const btn = document.getElementById('placeOrderBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<div class="loading"></div> Processing...';
        btn.disabled = true;
        
        // Simulate order processing
        setTimeout(() => {
            placeOrder(orderData);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1500);
    });
}

function navigateToSection(sectionId) {
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.section === sectionId) {
            tab.classList.add('active');
        }
    });
    
    // Show active section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        if (section.id === `${sectionId}-section`) {
            section.classList.add('active');
        }
    });
    
    // Special handling for sections
    if (sectionId === 'receipt') {
        generateReceipt();
    }
}

// ========== UTILITY FUNCTIONS ==========
function showNotification(message, type) {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
