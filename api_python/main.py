from flask import Flask, request, jsonify
import os

app = Flask(__name__)

# Simple health check
@app.route('/ping', methods=['GET'])
def legacy_ping():
    return 'pong', 200

# Store endpoint handling both creation (POST) and listing (GET)
@app.route('/api/stores', methods=['GET', 'POST'])
def stores_handler():
    if request.method == 'POST':
        data = request.get_json()
        store_id = os.urandom(4).hex()
        response = {
            'id': store_id,
            'name': data.get('name'),
            'owner_id': data.get('owner_id')
        }
        return jsonify(response), 201
    else:  # GET
        # Placeholder: return empty list or mock data
        return jsonify([]), 200

# Order endpoint handling both creation (POST) and listing (GET)
@app.route('/api/orders', methods=['GET', 'POST'])
def orders_handler():
    if request.method == 'POST':
        data = request.get_json()
        order_id = os.urandom(4).hex()
        response = {
            'id': order_id,
            'store_id': data.get('store_id'),
            'items': data.get('items')
        }
        return jsonify(response), 201
    else:  # GET
        return jsonify([]), 200

# Email confirmation placeholder endpoint
@app.route('/api/auth/confirm-email', methods=['POST'])
def confirm_email():
    # In a real implementation, verify token and activate user
    data = request.get_json()
    token = data.get('token')
    # Simulate success
    return jsonify({'status': 'email_confirmed', 'token': token}), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
