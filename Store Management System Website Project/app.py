import os
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import logging

from database import db

# Serve the static site files from the project folder
STATIC_DIR = os.path.join(os.path.dirname(__file__), "Store Management System Website Project")
app = Flask(__name__, static_folder=STATIC_DIR)
CORS(app)

# Simple logging for debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_db():
    """Check if database is available"""
    if db is None:
        return jsonify({
            "success": False, 
            "error": "Database not available. Using SQLite on Vercel requires a cloud database like PostgreSQL."
        }), 503
    return None

@app.route('/api/health')
def health_check():
    db_status = "available" if db else "unavailable (requires cloud database)"
    return jsonify({
        "status": "ok",
        "database": db_status,
        "environment": os.getenv("VERCEL_ENV", "local")
    })


@app.route("/")
def home():
    return send_from_directory(STATIC_DIR, "index.html")


@app.route("/register")
def register_page():
    return send_from_directory(STATIC_DIR, "register.html")


@app.route('/<path:filename>')
def serve_static(filename):
    # Serve files from the static project folder if they exist
    file_path = os.path.join(STATIC_DIR, filename)
    if os.path.exists(file_path):
        return send_from_directory(STATIC_DIR, filename)
    return jsonify({"error": "Not found"}), 404


@app.route("/api/products", methods=["GET"])
def api_get_products():
    db_error = check_db()
    if db_error:
        return db_error
    products = db.get_all_products()
    return jsonify({"success": True, "products": products})


@app.route("/api/orders", methods=["POST"])
def api_create_order():
    db_error = check_db()
    if db_error:
        return db_error
    data = request.get_json() or {}
    user = data.get('user')
    user_id = None
    if user and isinstance(user, dict):
        # accept numeric id if provided
        user_id = user.get('id')

    customer_data = data.get('customer') or {}
    items = data.get('items') or []
    total = data.get('total') or 0

    try:
        result = db.create_order(user_id, customer_data, items, total)
        return jsonify(result)
    except Exception as e:
        logger.exception('Error creating order')
        return jsonify({"success": False, "error": "Internal server error"}), 500


@app.route("/api/orders", methods=["GET"])
def api_get_orders():
    db_error = check_db()
    if db_error:
        return db_error
    # optional ?user_id=
    user_id = request.args.get('user_id')
    try:
        if user_id:
            orders = db.get_user_orders(user_id)
        else:
            orders = db.get_all_orders()
        return jsonify({"success": True, "orders": orders})
    except Exception:
        logger.exception('Error fetching orders')
        return jsonify({"success": False, "error": "Internal server error"}), 500


@app.route("/api/register", methods=["POST"])
def register_api():
    db_error = check_db()
    if db_error:
        return db_error
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')

    logger.info('Register request received: username=%s, email=%s', username, email)

    if not (username and email and password):
        return jsonify({"success": False, "error": "username, email and password are required"}), 400

    try:
        result = db.register_user(username, email, password, first_name, last_name)
        return jsonify(result)
    except Exception as e:
        logger.exception('Error during registration')
        return jsonify({"success": False, "error": "Internal server error"}), 500


@app.route("/api/login", methods=["POST"])
def login_api():
    db_error = check_db()
    if db_error:
        return db_error
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    logger.info('Login request received: username=%s', username)

    if not (username and password):
        return jsonify({"success": False, "error": "username and password required"}), 400

    try:
        result = db.login_user(username, password)
        return jsonify(result)
    except Exception as e:
        logger.exception('Error during login')
        return jsonify({"success": False, "error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

