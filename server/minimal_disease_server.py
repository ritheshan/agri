#!/usr/bin/env python3
"""
Streamlined disease detection test server 
This is a minimal version of the web app focused only on disease detection
"""
import os
import numpy as np
import tensorflow as tf
from PIL import Image
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback
import time
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['UPLOAD_FOLDER'] = './uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Global variables
disease_model = None
class_indices = None

def load_model():
    """Load the disease detection model"""
    global disease_model, class_indices
    
    try:
        print("Setting up working directory...")
        # First look in the current directory
        if os.path.exists("plant_disease_prediction_model.h5") and os.path.exists("class_indices.json"):
            model_path = "plant_disease_prediction_model.h5"
            class_indices_path = "class_indices.json"
        else:
            # Then check the server/deseasedectection directory
            model_dir = os.path.join("server", "deseasedectection")
            model_path = os.path.join(model_dir, "plant_disease_prediction_model.h5")
            class_indices_path = os.path.join(model_dir, "class_indices.json")
            
            if not os.path.exists(model_path):
                print(f"Error: Model file not found at {model_path}")
                return False
                
            if not os.path.exists(class_indices_path):
                print(f"Error: Class indices file not found at {class_indices_path}")
                return False
            
            # Change directory to match Streamlit environment
            print(f"Changing to directory: {model_dir}")
            original_dir = os.getcwd()
            os.chdir(model_dir)
            model_path = "plant_disease_prediction_model.h5"
            class_indices_path = "class_indices.json"
        
        # Load the model
        print(f"Loading model from {model_path}...")
        disease_model = tf.keras.models.load_model(model_path)
        print(f"Model loaded successfully: input={disease_model.input_shape}, output={disease_model.output_shape}")
        
        # Test with dummy input
        dummy_input = np.zeros((1, 224, 224, 3))
        test_prediction = disease_model.predict(dummy_input)
        print(f"Model test prediction shape: {test_prediction.shape}")
        
        # Load class indices
        with open(class_indices_path, "r") as f:
            class_indices = json.load(f)
            
        # Convert keys to integers if they're numeric
        if all(k.isdigit() for k in class_indices.keys()):
            class_indices = {int(k): v for k, v in class_indices.items()}
            
        print(f"Class indices loaded: {len(class_indices)} classes")
        print(f"Sample classes: {list(class_indices.items())[:3]}")
        
        # Reset directory if changed
        if 'original_dir' in locals():
            os.chdir(original_dir)
            
        return True
    
    except Exception as e:
        print(f"Error loading model: {e}")
        print(traceback.format_exc())
        
        # Reset directory if changed
        if 'original_dir' in locals():
            os.chdir(original_dir)
            
        return False

def preprocess_image(image):
    """Preprocess an image exactly like Streamlit app does"""
    image = image.convert("RGB")
    image = image.resize((224, 224))
    image_array = np.array(image) / 255.0
    return np.expand_dims(image_array, axis=0)

@app.route('/detect_disease', methods=['POST'])
def detect_disease():
    """Endpoint to detect diseases in plant images"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    print(f"Processing file: {file.filename}")
    
    try:
        # Save file temporarily
        filename = secure_filename(f"{int(time.time())}-{file.filename}")
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(temp_path)
        print(f"Saved to {temp_path}")
        
        # Open and preprocess
        img = Image.open(temp_path)
        img_array = preprocess_image(img)
        print(f"Image processed: shape={img_array.shape}")
        
        if disease_model is None:
            return jsonify({'error': 'Model not loaded'}), 500
            
        # Make prediction
        prediction = disease_model.predict(img_array)
        predicted_index = int(np.argmax(prediction))
        confidence = float(np.max(prediction))
        print(f"Prediction: index={predicted_index}, confidence={confidence:.4f}")
        
        if class_indices is not None:
            predicted_label = class_indices.get(predicted_index, "Unknown")
            print(f"Label: {predicted_label}")
            
            # Format the label nicely
            formatted_label = predicted_label.replace('_', ' ').replace('___', ' - ')
            
            # Clean up temp file
            try:
                os.remove(temp_path)
            except:
                pass
                
            return jsonify({
                'prediction': formatted_label,
                'confidence': round(float(confidence), 4)
            })
        else:
            return jsonify({'error': 'Class indices not loaded'}), 500
            
    except Exception as e:
        print(f"Error: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/test')
def test():
    """Test endpoint to verify API is running"""
    return jsonify({
        'status': 'ok',
        'model_loaded': disease_model is not None,
        'classes_loaded': class_indices is not None if class_indices else 0
    })

if __name__ == '__main__':
    # Load model on startup
    if load_model():
        print("Model loaded successfully, starting server...")
        app.run(debug=True, port=5001)  # Using different port to avoid conflicts
    else:
        print("Failed to load model, exiting.")
