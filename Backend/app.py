from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
from pymongo import MongoClient
import certifi # Required for some SSL environments

app = Flask(__name__)
CORS(app)

# --- MongoDB Configuration ---
# Replace the URI with your local or MongoDB Atlas connection string
MONGO_URI = "mongodb://localhost:27017/" 
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client['ayurpulse_db']
patients_collection = db['patients']

# Load ML Model
model_path = 'dosha_model.pkl'
model = None
if os.path.exists(model_path):
    with open(model_path, 'rb') as f:
        model = pickle.load(f)

@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "online", "message": "AyurPulse API with MongoDB"})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data received"}), 400

        # Use .get() with a default value of 0 to prevent crashes if a key is missing
        features = [
            int(data.get('body_frame', 0)),
            int(data.get('appetite', 0)),
            int(data.get('sleep_pattern', 0)),
            int(data.get('stress_response', 0)),
            int(data.get('skin_type', 0))
        ]
        
        # Check if model is actually loaded
        if model is None:
             return jsonify({"error": "ML Model not loaded on server"}), 500

        prediction = model.predict([features])
        return jsonify({'dosha': str(prediction[0])})

    except Exception as e:
        # This will print the EXACT error in your terminal so you can see it
        print(f"Prediction Error: {e}")
        return jsonify({"error": str(e)}), 500
# --- NEW: Route to Save Full Patient Data ---
@app.route('/save-patient', methods=['POST'])
def save_patient():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Insert into MongoDB
        result = patients_collection.insert_one(data)
        
        return jsonify({
            "message": "Patient data saved successfully!",
            "id": str(result.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)