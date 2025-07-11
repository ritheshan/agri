import streamlit as st
st.set_page_config(page_title="🌿 Plant Disease Predictor", layout="centered")

import tensorflow as tf
import numpy as np
from PIL import Image
import json
import io

# --- Load the model ---
@st.cache_resource
def load_model():
    try:
        model = tf.keras.models.load_model("plant_disease_prediction_model.h5")
        return model
    except Exception as e:
        st.error(f"❌ Model loading failed: {e}")
        return None

model = load_model()

# --- Load class indices ---
@st.cache_data
def load_class_indices():
    try:
        with open("class_indices.json", "r") as f:
            class_indices = json.load(f)

        if all(k.isdigit() for k in class_indices.keys()):
            return {int(k): v for k, v in class_indices.items()}
        else:
            return class_indices
    except Exception as e:
        st.error(f"❌ Failed to load class indices: {e}")
        return {}

index_to_class = load_class_indices()

# --- Image Preprocessing ---
def preprocess_image(image: Image.Image):
    image = image.convert("RGB")
    image = image.resize((224, 224))
    image_array = np.array(image) / 255.0
    return np.expand_dims(image_array, axis=0)

# --- Streamlit UI ---
st.title("🌿 Plant Disease Prediction")
st.markdown("Upload a plant leaf image and the model will predict the disease.")

uploaded_file = st.file_uploader("Choose an image", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    try:
        image = Image.open(uploaded_file)
        st.image(image, caption="Uploaded Leaf Image", use_column_width=True)

        if model is not None:
            image_tensor = preprocess_image(image)
            prediction = model.predict(image_tensor)
            predicted_index = int(np.argmax(prediction))
            confidence = float(np.max(prediction))
            predicted_label = index_to_class.get(predicted_index, "Unknown")

            st.success(f"🩺 **Prediction:** {predicted_label}")
            st.info(f"📊 **Confidence:** {confidence:.3f}")

        else:
            st.error("❌ Model not loaded. Cannot predict.")

    except Exception as e:
        st.error(f"❌ Error processing image: {e}")
