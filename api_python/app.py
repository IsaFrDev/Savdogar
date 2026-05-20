from flask import Flask, request, jsonify
import os

app = Flask(__name__)

# Simple health check
@app.route('/ping', methods=['GET'])
def ping():
    return 'pong', 200

# Store creation endpoint (placeholder)
@app.route('/api/stores', methods=['POST'])
def create_store():
    data = request.get_json()
    # In a real app you'd write this to Supabase or another DB
    # Here we just echo back with a generated id
    store_id = os.urandom(4).hex()
    response = {
        'id': store_id,
        'name': data.get('name'),
        'owner_id': data.get('owner_id')
    }
    return jsonify(response), 201

# Order creation endpoint (placeholder)
@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    order_id = os.urandom(4).hex()
    response = {
        'id': order_id,
        'store_id': data.get('store_id'),
        'items': data.get('items')
    }
    return jsonify(response), 201

if __name__ == '__main__':
    # Railway provides the port via PORT env var, default to 5000 locally
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
