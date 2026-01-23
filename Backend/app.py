from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
import pandas as pd

app = Flask(__name__)
CORS(app) # Fixes the "Failed to fetch" handshake

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, 'dosha_model.pkl')
encoder_path = os.path.join(BASE_DIR, 'label_encoders.pkl')

model = None
label_encoders = None

if os.path.exists(model_path) and os.path.exists(encoder_path):
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    with open(encoder_path, 'rb') as f:
        label_encoders = pickle.load(f)
    print("✅ Model and Encoders loaded successfully!")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        # This list must match your CSV columns exactly
        feature_order = [
            "Body Size", "Body Weight", "Height", "Bone Structure", "Complexion",
            "General feel of skin", "Texture of Skin", "Hair Color", "Appearance of Hair",
            "Shape of face", "Eyes", "Eyelashes", "Blinking of Eyes", "Cheeks", "Nose",
            "Teeth and gums", "Lips", "Nails", "Appetite", "Liking tastes",
            "Metabolism Type", "Climate Preference", "Stress Levels", "Sleep Patterns",
            "Dietary Habits", "Physical Activity Level", "Water Intake", 
            "Digestion Quality", "Skin Sensitivity"
        ]

        processed_features = []
        for feature in feature_order:
            val = str(data.get(feature, "Medium"))
            try:
                encoded_val = label_encoders[feature].transform([val])[0]
            except Exception as e:
                print(f"⚠️ Mapping failed for {feature} with value {val}. Error: {e}")
    # Fallback to the first known class for that feature
                encoded_val = label_encoders[feature].transform([label_encoders[feature].classes_[0]])[0]
            processed_features.append(encoded_val)

        if model:
            feature_df = pd.DataFrame([processed_features], columns=feature_order)
            prediction_id = model.predict(feature_df)[0]
            # Convert numeric 0 to text "Vata"
            predicted_name = label_encoders['Dosha'].inverse_transform([prediction_id])[0]
            return jsonify({'dosha': str(predicted_name)})
        
        return jsonify({"error": "Model not ready"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # use_reloader=False stops the Windows WinError 10038
    app.run(debug=True, port=5000, threaded=True, use_reloader=False)