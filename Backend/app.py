from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
import pandas as pd
import json
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

# ------------------ near the top, after imports ------------------

# Optional – makes development much easier
try:
    from dotenv import load_dotenv
    load_dotenv()                      # ← add these 2–3 lines
    print("Loaded .env file (if exists)")
except ImportError:
    print("python-dotenv not installed – continuing without it")

# Initialize diet chart generator
try:
    # You can keep DietChartGenerator() if env var is set
    # or explicitly pass key during dev (comment out when done)
    diet_generator = DietChartGenerator(
        # api_key="AIza..."   # ← uncomment only for quick testing
    )
    print("✅ Diet Chart Generator initialized successfully!")
except ValueError as e:
    print(f"⚠️  Warning: {e}")
    print("   → Please set environment variable GEMINI_API_KEY")
    print("   → or pass api_key= argument to DietChartGenerator()")
    diet_generator = None
except Exception as e:
    print(f"⚠️  Warning: Failed to initialize Diet Chart Generator: {e}")
    diet_generator = None

# Import our custom diet chart generator
from diet_chart_generator import DietChartGenerator

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, 'dosha_model.pkl')
encoder_path = os.path.join(BASE_DIR, 'label_encoders.pkl')

model = None
label_encoders = None

# Initialize diet chart generator
diet_generator = None

# Load ML models for dosha prediction
if os.path.exists(model_path) and os.path.exists(encoder_path):
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    with open(encoder_path, 'rb') as f:
        label_encoders = pickle.load(f)
    print("✅ Model and Encoders loaded successfully!")
else:
    print("⚠️  Warning: ML model files not found. Dosha prediction will not work.")

# Initialize diet chart generator
try:
    diet_generator = DietChartGenerator()
    print("✅ Diet Chart Generator initialized successfully!")
except ValueError as e:
    print(f"⚠️  Warning: {e}")
    print("   Diet chart generation will not work without a valid API key.")
except Exception as e:
    print(f"⚠️  Warning: Failed to initialize Diet Chart Generator: {e}")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify server status"""
    status = {
        'status': 'running',
        'ml_model_loaded': model is not None,
        'diet_generator_ready': diet_generator is not None,
        'timestamp': datetime.now().isoformat()
    }
    return jsonify(status)


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict user's Ayurvedic dosha based on physical and behavioral characteristics
    
    Expected payload: Dictionary with 29 features matching the trained model
    Returns: {'dosha': 'Vata'|'Pitta'|'Kapha'}
    """
    try:
        data = request.json
        
        # Define the exact feature order used during model training
        feature_order = [
            "Body Size", "Body Weight", "Height", "Bone Structure", "Complexion",
            "General feel of skin", "Texture of Skin", "Hair Color", "Appearance of Hair",
            "Shape of face", "Eyes", "Eyelashes", "Blinking of Eyes", "Cheeks", "Nose",
            "Teeth and gums", "Lips", "Nails", "Appetite", "Liking tastes",
            "Metabolism Type", "Climate Preference", "Stress Levels", "Sleep Patterns",
            "Dietary Habits", "Physical Activity Level", "Water Intake", 
            "Digestion Quality", "Skin Sensitivity"
        ]

        # Process and encode features
        processed_features = []
        for feature in feature_order:
            val = str(data.get(feature, "Medium"))
            try:
                encoded_val = label_encoders[feature].transform([val])[0]
            except Exception as e:
                print(f"⚠️ Mapping failed for {feature} with value '{val}'. Error: {e}")
                # Fallback to first known class for that feature
                encoded_val = label_encoders[feature].transform([label_encoders[feature].classes_[0]])[0]
            processed_features.append(encoded_val)

        # Make prediction
        if model:
            feature_df = pd.DataFrame([processed_features], columns=feature_order)
            prediction_id = model.predict(feature_df)[0]
            predicted_name = label_encoders['Dosha'].inverse_transform([prediction_id])[0]
            
            return jsonify({
                'success': True,
                'dosha': str(predicted_name)
            })
        
        return jsonify({
            'success': False,
            'error': "Model not ready"
        }), 500
        
    except Exception as e:
        print(f"Error in predict endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/generate-diet-chart', methods=['POST'])
def generate_diet_chart():
    """
    Generate personalized 7-day diet chart using Gemini API
    
    Expected payload: User profile including personal info, health data,
                     dietary preferences, and wellness goals
    Returns: Complete 7-day meal plan with recommendations
    """
    try:
        # Check if diet generator is initialized
        if diet_generator is None:
            return jsonify({
                'success': False,
                'error': 'Diet chart generator not initialized. Please check API key configuration.'
            }), 500
        
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'dominantDosha', 'dietType']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Generate diet chart using the dedicated module
        diet_chart = diet_generator.generate_diet_chart(data)
        
        return jsonify({
            'success': True,
            'dietChart': diet_chart
        })
        
    except ValueError as e:
        print(f"Validation Error: {e}")
        return jsonify({
            'success': False,
            'error': f'Validation error: {str(e)}'
        }), 400
        
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to parse diet chart from AI. Please try again.',
            'details': str(e)
        }), 500
        
    except Exception as e:
        print(f"Error generating diet chart: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to generate diet chart: {str(e)}'
        }), 500


@app.route('/regenerate-day', methods=['POST'])
def regenerate_day():
    """
    Regenerate a specific day in the diet chart
    
    Expected payload: User profile data + day_number (1-7)
    Returns: Single day meal plan
    """
    try:
        if diet_generator is None:
            return jsonify({
                'success': False,
                'error': 'Diet chart generator not initialized.'
            }), 500
        
        data = request.json
        day_number = data.get('day_number')
        
        if not day_number or not (1 <= int(day_number) <= 7):
            return jsonify({
                'success': False,
                'error': 'Invalid day_number. Must be between 1 and 7.'
            }), 400
        
        # Regenerate single day
        day_plan = diet_generator.regenerate_single_day(data, int(day_number))
        
        return jsonify({
            'success': True,
            'dayPlan': day_plan
        })
        
    except Exception as e:
        print(f"Error regenerating day: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/save-patient', methods=['POST'])
def save_patient():
    """
    Save patient data and diet chart to database
    
    TODO: Implement actual database logic (SQLite, PostgreSQL, MongoDB, etc.)
    Currently just logs the data and returns a temporary ID
    """
    try:
        data = request.json
        
        # Log received data for debugging
        print("=" * 80)
        print("📝 Received patient data for saving:")
        print(f"   Name: {data.get('name')}")
        print(f"   Dosha: {data.get('dominantDosha')}")
        print(f"   Diet Type: {data.get('dietType')}")
        print(f"   Has Diet Chart: {'dietChart' in data}")
        print("=" * 80)
        
        # TODO: Implement your database saving logic here
        # Example with SQLAlchemy:
        # patient = Patient(
        #     name=data.get('name'),
        #     age=data.get('age'),
        #     dosha=data.get('dominantDosha'),
        #     diet_chart=json.dumps(data.get('dietChart'))
        # )
        # db.session.add(patient)
        # db.session.commit()
        
        # Generate temporary patient ID
        patient_id = f"PT_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        return jsonify({
            'success': True,
            'message': 'Patient data saved successfully',
            'patientId': patient_id,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error saving patient data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/patients', methods=['GET'])
def get_patients():
    """
    Retrieve list of all patients
    
    TODO: Implement actual database query
    Returns paginated list of patients
    """
    # TODO: Implement database query
    # patients = Patient.query.order_by(Patient.created_at.desc()).limit(50).all()
    
    return jsonify({
        'success': True,
        'message': 'Database not yet implemented',
        'patients': []
    })


@app.route('/patient/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    """
    Retrieve specific patient data and diet chart
    
    Args:
        patient_id: Unique patient identifier
    
    TODO: Implement actual database query
    """
    # TODO: Implement database query
    # patient = Patient.query.filter_by(id=patient_id).first()
    
    return jsonify({
        'success': True,
        'message': 'Database not yet implemented',
        'patient': None
    })


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    print("\n" + "=" * 80)
    print("🌿 Ayurveda Diet Chart Generator - Flask Backend 🌿")
    print("=" * 80)
    print(f"ML Model Status: {'✅ Loaded' if model else '❌ Not Loaded'}")
    print(f"Diet Generator Status: {'✅ Ready' if diet_generator else '❌ Not Ready'}")
    print("=" * 80)
    print("\nStarting Flask server on http://localhost:5000")
    print("Press CTRL+C to stop\n")
    
    app.run(debug=True, port=5000, threaded=True, use_reloader=False)