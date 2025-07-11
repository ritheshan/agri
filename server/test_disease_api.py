#!/usr/bin/env python3
"""
Quick test script for disease detection API
"""
import requests
import sys
import os
import json
from PIL import Image
import base64
import io
import time

# Configuration
API_URL = "http://localhost:5000/detect_disease"
TEST_IMAGE_DIR = "/Users/ritheshn/Desktop/smart_agri/server/deseasedectection/dataset"

def find_test_image(disease_name=None):
    """Find a test image for a specific disease or any disease"""
    if not os.path.exists(TEST_IMAGE_DIR):
        print(f"Error: Test image directory not found: {TEST_IMAGE_DIR}")
        return None
    
    # Look for specific disease folder if provided
    if disease_name:
        disease_dir = os.path.join(TEST_IMAGE_DIR, disease_name)
        if os.path.exists(disease_dir) and os.path.isdir(disease_dir):
            # Find first image in this directory
            for file in os.listdir(disease_dir):
                if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    return os.path.join(disease_dir, file)
    
    # Otherwise find any image in the dataset
    for root, dirs, files in os.walk(TEST_IMAGE_DIR):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                return os.path.join(root, file)
    
    return None

def test_disease_detection(image_path=None, disease_name=None):
    """Test the disease detection API with a single image"""
    # Find a test image if not provided
    if not image_path:
        if disease_name:
            print(f"Looking for a {disease_name} image...")
            image_path = find_test_image(disease_name)
        else:
            print("Looking for any test image...")
            image_path = find_test_image()
    
    if not image_path or not os.path.exists(image_path):
        print(f"Error: Could not find a valid test image")
        return
    
    print(f"Testing with image: {image_path}")
    
    # Open the image file
    try:
        with open(image_path, 'rb') as f:
            image_data = f.read()
    except Exception as e:
        print(f"Error reading image file: {e}")
        return
    
    # Create multipart form data with the image
    try:
        files = {'file': (os.path.basename(image_path), image_data, 'image/jpeg')}
        
        # Send request to API
        print(f"Sending request to {API_URL}...")
        start_time = time.time()
        response = requests.post(API_URL, files=files)
        elapsed_time = time.time() - start_time
        
        print(f"Response received in {elapsed_time:.2f} seconds, status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\nAPI Response:")
            print(json.dumps(result, indent=2))
            
            # Extract prediction and confidence
            if 'prediction' in result:
                print(f"\nPredicted disease: {result['prediction']}")
                print(f"Confidence: {result.get('confidence', 'Unknown')}")
                
                # Show similar diseases if any
                if 'similar_diseases' in result and result['similar_diseases']:
                    for disease in result['similar_diseases']:
                        print(f"Similar disease: {disease['name']} (Confidence: {disease['confidence']})")
        else:
            print(f"Error: API returned status code {response.status_code}")
            print(response.text)
    
    except Exception as e:
        print(f"Error during API request: {e}")

def main():
    """Main function"""
    if len(sys.argv) > 1:
        # Test with specific image
        test_disease_detection(sys.argv[1])
    elif len(sys.argv) > 2 and sys.argv[1] == "--disease":
        # Test with specific disease
        test_disease_detection(disease_name=sys.argv[2])
    else:
        # Test with any image
        test_disease_detection()

if __name__ == "__main__":
    main()
