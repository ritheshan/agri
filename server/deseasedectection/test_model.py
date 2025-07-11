"""
Plant Disease Detection Model Test Script

This script tests the plant disease detection model directly to help diagnose issues.
"""
import os
import json
import numpy as np
import tensorflow as tf
from PIL import Image
import traceback

# Configuration
MODEL_PATH = "/Users/ritheshn/Desktop/smart_agri/server/deseasedectection/plant_disease_prediction_model.h5"
CLASS_INDICES_PATH = "/Users/ritheshn/Desktop/smart_agri/server/deseasedectection/class_indices.json"
IMAGE_DIR = "/Users/ritheshn/Desktop/smart_agri/server/deseasedectection/dataset"

def load_model():
    """Load the model"""
    print(f"Loading model from {MODEL_PATH}...")
    
    try:
        if not os.path.exists(MODEL_PATH):
            print(f"ERROR: Model file not found at {MODEL_PATH}")
            return None
            
        model = tf.keras.models.load_model(MODEL_PATH)
        print(f"Model loaded successfully")
        print(f"Input shape: {model.input_shape}")
        print(f"Output shape: {model.output_shape}")
        return model
    except Exception as e:
        print(f"ERROR loading model: {e}")
        print(traceback.format_exc())
        return None

def load_class_indices():
    """Load class indices mapping"""
    print(f"Loading class indices from {CLASS_INDICES_PATH}...")
    
    try:
        if not os.path.exists(CLASS_INDICES_PATH):
            print(f"ERROR: Class indices file not found at {CLASS_INDICES_PATH}")
            return None
            
        with open(CLASS_INDICES_PATH, "r") as f:
            class_indices = json.load(f)
            
        print(f"Class indices loaded: {len(class_indices)} classes")
        print(f"First few classes: {list(class_indices.items())[:3]}")
        
        # Convert keys to integers if they're numeric (match Streamlit approach)
        if all(k.isdigit() for k in class_indices.keys()):
            class_indices = {int(k): v for k, v in class_indices.items()}
            print("Converted string keys to integers")
            
        return class_indices
    except Exception as e:
        print(f"ERROR loading class indices: {e}")
        print(traceback.format_exc())
        return None

def preprocess_image(image_path):
    """Preprocess an image for prediction"""
    try:
        print(f"Processing image: {image_path}")
        img = Image.open(image_path)
        img = img.convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        print(f"Image preprocessed: shape={img_array.shape}, dtype={img_array.dtype}")
        print(f"Value range: min={np.min(img_array)}, max={np.max(img_array)}")
        return img_array
    except Exception as e:
        print(f"ERROR preprocessing image: {e}")
        print(traceback.format_exc())
        return None

def find_test_images():
    """Find test images in the dataset directory"""
    test_images = []
    
    if not os.path.exists(IMAGE_DIR):
        print(f"WARNING: Image directory not found at {IMAGE_DIR}")
        return test_images
        
    # Look for images up to 2 levels deep
    for root, dirs, files in os.walk(IMAGE_DIR):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                test_images.append(os.path.join(root, file))
                
    print(f"Found {len(test_images)} test images")
    return test_images

def main():
    """Main test function"""
    print("==== Plant Disease Detection Test ====")
    
    # Load model
    model = load_model()
    if model is None:
        print("Model loading failed, exiting test")
        return
        
    # Load class indices
    class_indices = load_class_indices()
    if class_indices is None:
        print("Class indices loading failed, exiting test")
        return
        
    # Find test images
    test_images = find_test_images()
    if len(test_images) == 0:
        print("No test images found")
        # Create a simple test array
        print("Testing with dummy input")
        dummy_input = np.zeros((1, 224, 224, 3))
        prediction = model.predict(dummy_input)
        print(f"Prediction shape: {prediction.shape}")
        print(f"Prediction argmax: {np.argmax(prediction)}")
        return
        
    # Test with real images
    print("\nTesting with real images...")
    for i, image_path in enumerate(test_images[:3]):  # Test with first 3 images
        print(f"\nTest {i+1}/{min(3, len(test_images))}: {image_path}")
        
        # Extract class from path
        path_parts = image_path.split(os.path.sep)
        expected_class = None
        for part in path_parts:
            if "___" in part:
                expected_class = part
                break
                
        if expected_class:
            print(f"Expected class (from path): {expected_class}")
        
        # Preprocess image
        img_array = preprocess_image(image_path)
        if img_array is None:
            print("Image preprocessing failed, skipping this image")
            continue
            
        # Make prediction
        print("Making prediction...")
        prediction = model.predict(img_array)
        predicted_index = int(np.argmax(prediction))
        confidence = float(np.max(prediction))
        
        print(f"Predicted index: {predicted_index}")
        print(f"Confidence: {confidence:.4f}")
        
        # Get class name
        if predicted_index in class_indices:
            predicted_class = class_indices[predicted_index]
        elif str(predicted_index) in class_indices:
            predicted_class = class_indices[str(predicted_index)]
        else:
            predicted_class = f"Unknown (index {predicted_index})"
            
        print(f"Predicted class: {predicted_class}")
        
    print("\nTest completed!")

if __name__ == "__main__":
    main()
