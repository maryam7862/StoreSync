// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Get token from localStorage
function getToken() {
    return localStorage.getItem('storesync_token');
}

// Set token in localStorage
function setToken(token) {
    localStorage.setItem('storesync_token', token);
}

// Remove token from localStorage
function removeToken() {
    localStorage.removeItem('storesync_token');
}

// Get current user from localStorage
function getCurrentUser() {
    const user = localStorage.getItem('storesync_current_user');
    return user ? JSON.parse(user) : null;
}

// Set current user in localStorage
function setCurrentUser(user) {
    localStorage.setItem('storesync_current_user', JSON.stringify(user));
}

// API Request helper
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        // Token expired or invalid
        removeToken();
        localStorage.removeItem('storesync_current_user');
        window.location.href = 'index.html';
        return;
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

// ========== AUTHENTICATION API ==========

async function registerUser(userData) {
    const response = await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    
    if (response.token && response.user) {
        setToken(response.token);
        setCurrentUser(response.user);
    }
    
    return response;
}

async function loginUser(credentials) {
    const response = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
    
    if (response.token && response.user) {
        setToken(response.token);
        setCurrentUser(response.user);
    }
    
    return response;
}

function logoutUser() {
    removeToken();
    localStorage.removeItem('storesync_current_user');
}

// ========== PRODUCTS API ==========

async function getProducts(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/products?${params}`);
}

async function getProduct(id) {
    return apiRequest(`/products/${id}`);
}

async function createProduct(productData, imageFile = null) {
    const formData = new FormData();
    
    Object.keys(productData).forEach(key => {
        formData.append(key, productData[key]);
    });
    
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
}

async function updateProduct(id, productData, imageFile = null) {
    const formData = new FormData();
    
    Object.keys(productData).forEach(key => {
        formData.append(key, productData[key]);
    });
    
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
}

async function deleteProduct(id) {
    return apiRequest(`/products/${id}`, {
        method: 'DELETE'
    });
}

// ========== ORDERS API ==========

async function createOrder(orderData) {
    return apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
    });
}

async function getMyOrders(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/orders/my-orders?${params}`);
}

async function getAllOrders(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/orders?${params}`);
}

async function updateOrderStatus(orderId, statusData) {
    return apiRequest(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData)
    });
}

// ========== CART API ==========

async function getCart() {
    return apiRequest('/cart');
}

async function addToCart(productId, quantity = 1) {
    return apiRequest('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity })
    });
}

async function updateCartItem(productId, quantity) {
    return apiRequest(`/cart/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity })
    });
}

async function removeFromCart(productId) {
    return apiRequest(`/cart/${productId}`, {
        method: 'DELETE'
    });
}

// ========== PROFILE API ==========

async function getProfile() {
    return apiRequest('/profile');
}

async function updateProfile(profileData) {
    return apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
    });
}

// ========== DASHBOARD API ==========

async function getDashboardStats(period = 'month') {
    return apiRequest(`/dashboard/stats?period=${period}`);
}

// ========== NOTIFICATIONS API ==========

async function getNotifications(unreadOnly = false) {
    return apiRequest(`/notifications?unreadOnly=${unreadOnly}`);
}

async function markNotificationAsRead(notificationId) {
    return apiRequest(`/notifications/${notificationId}/read`, {
        method: 'PUT'
    });
}

async function markAllNotificationsAsRead() {
    return apiRequest('/notifications/read-all', {
        method: 'PUT'
    });
}

// ========== CUSTOMERS API ==========

async function getCustomers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/customers?${params}`);
}

// Export all functions
window.StoreSyncAPI = {
    // Authentication
    registerUser,
    loginUser,
    logoutUser,
    getToken,
    getCurrentUser,
    
    // Products
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    
    // Orders
    createOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    
    // Cart
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    
    // Profile
    getProfile,
    updateProfile,
    
    // Dashboard
    getDashboardStats,
    
    // Notifications
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    
    // Customers
    getCustomers
};