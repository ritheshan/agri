from fastapi import FastAPI, Request, HTTPException, Depends, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import joblib
import pandas as pd
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
import cloudinary
import cloudinary.uploader
from pymongo import MongoClient
from bson import ObjectId
import os
import numpy as np
# import tensorflow as tf  # Temporarily disabled for deployment
from PIL import Image
import io
import json
from sklearn.preprocessing import LabelEncoder, StandardScaler
from dotenv import load_dotenv
from utils import fetch_weather_data, get_hourly_forecast, recommend_fertilizer, predict_stress_level

# Load environment variables
load_dotenv()

app = FastAPI()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://ritheshan18:Qi1yQ1QU3m6jYwU3@agrimaster-cluster.4vqnod7.mongodb.net/?retryWrites=true&w=majority&appName=agriMaster-cluster")
PORT = int(os.getenv("PORT", 8000))

# Global variables for disease detection models
disease_image_model = None  # For image-based detection
disease_env_model = None    # For environmental-based detection (LSTM)
class_indices = None

# Helper functions for disease detection
def find_model_path():
    """Find the path to the disease detection model"""
    possible_paths = [
        "plant_disease_prediction_model.h5",
        os.path.join("server", "deseasedectection", "plant_disease_prediction_model.h5"),
        os.path.join("..", "plant_disease_prediction_model.h5")
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    raise FileNotFoundError("Disease detection model file not found")

def find_class_indices_path():
    """Find the path to the class indices JSON file"""
    possible_paths = [
        "class_indices.json",
        os.path.join("server", "deseasedectection", "class_indices.json"),
        os.path.join("..", "class_indices.json")
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    raise FileNotFoundError("Class indices file not found")

# Cloudinary Configuration
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "dvgjh3yvh"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "783536581798318"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "KOyLuAQW_i29_7SaeMs9aDLSZwk")
)

# MongoDB Connection
try:
    client = MongoClient(MONGODB_URL)
    db = client.agrimaster
    users_collection = db.users
    posts_collection = db.posts
    print("✅ Connected to MongoDB successfully!")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    # Use local fallback or handle appropriately
    db = None

# Add CORS middleware
allowed_origins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173", 
    "http://localhost:5174", 
    "http://127.0.0.1:5174",
    "https://agrimaster.vercel.app",
    "https://smart-agri.vercel.app",
    "https://*.vercel.app"  # Allow all subdomains on vercel.app
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Load models
try:
    fert_model = joblib.load('model/fert_model.pkl')
    time_model = joblib.load('model/time_model.pkl')
    yield_model = joblib.load('model/yield_model.pkl')
    stress_model = joblib.load('model/stress_model.pkl')
    crop_model = joblib.load('model/crop_model.pkl')
    
    # Load disease detection models - separate for image and environmental prediction
    try:
        # LSTM model for environmental prediction - temporarily disabled for deployment
        # disease_env_model = tf.keras.models.load_model('actual/potato_disease_lstm_model.h5')
        disease_env_model = None  # Temporarily set to None
        print("⚠️ Environmental disease model temporarily disabled for deployment")
    except Exception as e:
        print(f"❌ Environmental disease model loading failed: {e}")
        disease_env_model = None
    
    # Create label encoder for disease prediction
    disease_labels = ['Late Blight', 'Early Blight', 'Black Rot', 'Common Scab', 'Healthy']
    
    print("✅ All models loaded successfully!")
except FileNotFoundError as e:
    print(f"❌ Model loading failed: {e}")
    fert_model = time_model = yield_model = stress_model = crop_model = disease_env_model = None

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/get_agri_data")
def get_agri_data(lat: float, lon: float):
    weather = fetch_weather_data(lat, lon)
    if not weather:
        return JSONResponse({'error': 'Weather data unavailable'}, status_code=500)
    recommendations = "Use the dashboard features for yield, fertilizer, and stress prediction."
    return {"weather": weather, "recommendations": recommendations}

@app.get("/predict_yield")
def predict_yield(lat: float, lon: float, ozone: float, soil: float):
    weather = fetch_weather_data(lat, lon)
    if not weather:
        return JSONResponse({'result': None}, status_code=400)
    temp = weather['temp']
    rain = weather['rain']
    features = pd.DataFrame([[ozone, temp, rain, soil]], columns=["ozone", "temp", "rain", "soil"])
    prediction = yield_model.predict(features)[0]
    return {"result": f"Predicted Potato Yield: {prediction:.2f} tonnes/hectare"}

@app.get("/recommend_fertilizer")
def recommend_fertilizer_api(lat: float, lon: float, ozone: float, soil: float, ph: float, stage: str):
    weather = fetch_weather_data(lat, lon)
    if not weather:
        return JSONResponse({'result': None}, status_code=400)
    temp = weather['temp']
    rain = weather['rain']
    input_df = pd.DataFrame([{
        "ozone": ozone,
        "temp": temp,
        "rain": rain,
        "soil": soil,
        "ph": ph,
        "stage": stage
    }])
    result = recommend_fertilizer(input_df, fert_model)
    return {"result": f"Recommended Fertilizer: {result}"}

@app.get("/predict_stress")
def predict_stress(lat: float, lon: float, ozone: float, temp: float, humidity: float, color: str, symptom: str):
    input_df = pd.DataFrame([[ozone, temp, humidity, color, symptom]],
                            columns=["ozone", "temp", "humidity", "color", "symptom"])
    level, explanation = predict_stress_level(stress_model, input_df)
    return {"result": f"Stress Level: {level}", "explanation": explanation}

@app.get("/recommend_crop")
def recommend_crop(N: float, P: float, K: float, temperature: float, humidity: float, ph: float, rainfall: float, ozone: float):
    features = [[N, P, K, temperature, humidity, ph, rainfall, ozone]]
    try:
        pred = crop_model.predict(features)[0]
        known_crops = set(str(c) for c in crop_model.classes_)
        if str(pred).strip().lower() in (c.strip().lower() for c in known_crops):
            return {"recommended_crop": pred}
        else:
            return {"recommended_crop": None, "message": "No preferred crop available for the given conditions."}
    except Exception as e:
        return {"recommended_crop": None, "message": f"Prediction error: {e}"}

# Disease Detection Endpoints
@app.post("/detect_disease")
async def detect_disease_from_image(file: UploadFile = File(...)):
    """
    Detect plant disease from uploaded image using the trained CNN model.
    """
    try:
        # Load model and class indices if not already loaded
        global disease_image_model, class_indices
        
        # Explicitly load the image-based disease model - temporarily disabled for deployment
        if disease_image_model is None:
            try:
                model_path = find_model_path()
                print(f"Loading image disease model from {model_path}")
                # disease_image_model = tf.keras.models.load_model(model_path)
                disease_image_model = None  # Temporarily set to None
                print("⚠️ Image disease model temporarily disabled for deployment")
                
                # Verify the model input shape to make sure it matches what we expect
                # input_shape = disease_image_model.input_shape
                # print(f"Image disease model input shape: {input_shape}")
                
                # if input_shape and len(input_shape) > 1 and input_shape[1:] != (224, 224, 3):
                #     print(f"Warning: Model expects shape {input_shape}, but we're feeding (224, 224, 3)")
            except Exception as e:
                print(f"Error loading disease image model: {e}")
                print("Will use color analysis fallback method instead")
                disease_image_model = None
        
        if class_indices is None:
            class_indices_path = find_class_indices_path()
            with open(class_indices_path, "r") as f:
                class_indices = json.load(f)
                # Convert keys to integers if they're numeric
                if all(k.isdigit() for k in class_indices.keys()):
                    class_indices = {int(k): v for k, v in class_indices.items()}
        
        # Read and process the image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Preprocess the image for the model
        image = image.resize((224, 224))
        img_array = np.array(image) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # Make prediction using the model
        if disease_image_model is not None:
            try:
                prediction = disease_image_model.predict(img_array)
                predicted_index = int(np.argmax(prediction))
                confidence = float(np.max(prediction))
                
                # Get the predicted label
                predicted_label = class_indices.get(predicted_index, "Unknown")
                
                # Format the label nicely
                disease = predicted_label.replace('_', ' ').replace('___', ' - ')
                using_fallback = False
            except Exception as e:
                print(f"Error making prediction with model: {e}")
                # Fall back to color analysis
                using_fallback = True
        else:
            # Fallback to color analysis when model is not available
            using_fallback = True
        
        # Use color analysis as fallback method if model fails
        if using_fallback or disease_image_model is None:
            print("Using color analysis fallback method")
            # Simple heuristic based on color analysis
            img_array_raw = np.array(image)
            avg_green = np.mean(img_array_raw[:, :, 1])  # Green channel
            avg_brown = np.mean(img_array_raw[:, :, 0] + img_array_raw[:, :, 2]) / 2  # Red + Blue for brown tones
            
            if avg_green > 120 and avg_brown < 100:
                disease = "Healthy"
                confidence = 0.75
            elif avg_brown > 120:
                disease = "Late Blight"
                confidence = 0.65
            else:
                disease = "Early Blight"
                confidence = 0.60
        
        # Generate recommendations based on the disease
        if "healthy" in disease.lower():
            recommendations = ["Continue current care routine", "Monitor regularly for any changes"]
        elif "blight" in disease.lower():
            if "late" in disease.lower():
                recommendations = [
                    "Remove affected leaves immediately",
                    "Apply copper-based fungicide",
                    "Improve air circulation",
                    "Reduce watering frequency"
                ]
            else:  # Early blight
                recommendations = [
                    "Remove infected plant material",
                    "Apply preventive fungicide spray",
                    "Ensure proper plant spacing",
                    "Avoid overhead irrigation"
                ]
        elif "rust" in disease.lower():
            recommendations = [
                "Apply fungicides containing triazoles or strobilurins",
                "Remove severely infected leaves",
                "Improve air circulation between plants",
                "Avoid overhead irrigation"
            ]
        elif "spot" in disease.lower():
            recommendations = [
                "Remove and destroy infected leaves",
                "Apply appropriate fungicide",
                "Avoid wetting leaves during irrigation",
                "Ensure proper plant spacing"
            ]
        elif "mold" in disease.lower() or "mildew" in disease.lower():
            recommendations = [
                "Improve air circulation around plants",
                "Apply fungicides containing sulfur or potassium bicarbonate",
                "Reduce humidity levels",
                "Space plants properly"
            ]
        else:
            recommendations = [
                "Consult with a plant pathologist for accurate diagnosis",
                "Isolate affected plants to prevent spread",
                "Remove severely affected plant parts",
                "Consider appropriate fungicide or pesticide after identification"
            ]
        
        return {
            "prediction": disease,  # Changed to match client expectations
            "confidence": confidence,
            "recommendations": recommendations,
            "severity": "Low" if "healthy" in disease.lower() else "Medium",
            "treatment_urgency": "Low" if "healthy" in disease.lower() else "High",
            "using_fallback": using_fallback if 'using_fallback' in locals() else False
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/predict_disease_environmental")
def predict_disease_environmental(
    temperature: float, 
    humidity: float, 
    rainfall: float, 
    cloud_cover: float, 
    wind_speed: float, 
    leaf_wetness: float
):
    """
    Predict disease risk based on environmental conditions using LSTM model.
    """
    try:
        if not disease_env_model:
            raise HTTPException(status_code=503, detail="Environmental disease model not available")
        
        # Prepare input features (matching the training data format)
        features = np.array([[temperature, humidity, rainfall, cloud_cover, wind_speed, leaf_wetness]])
        
        # For LSTM, we need sequence data. Since we have only one timestep, 
        # we'll simulate a sequence by repeating the data
        sequence_length = 5
        features_sequence = np.repeat(features.reshape(1, 1, 6), sequence_length, axis=1)
        
        # Make prediction
        prediction = disease_env_model.predict(features_sequence)
        predicted_class = np.argmax(prediction[0])
        confidence = float(np.max(prediction[0]))
        
        disease = disease_labels[predicted_class] if predicted_class < len(disease_labels) else "Unknown"
        
        # Determine risk level based on confidence and disease type
        if disease == "Healthy":
            risk_level = "Low"
            recommendations = ["Current conditions are favorable", "Continue monitoring"]
        elif confidence > 0.7:
            risk_level = "High"
            recommendations = [
                f"High risk of {disease} detected",
                "Take immediate preventive measures",
                "Monitor plants closely",
                "Consider fungicide application"
            ]
        else:
            risk_level = "Medium"
            recommendations = [
                f"Moderate risk of {disease}",
                "Monitor environmental conditions",
                "Ensure good plant hygiene"
            ]
        
        return {
            "predicted_disease": disease,
            "confidence": confidence,
            "risk_level": risk_level,
            "environmental_conditions": {
                "temperature": temperature,
                "humidity": humidity,
                "rainfall": rainfall,
                "cloud_cover": cloud_cover,
                "wind_speed": wind_speed,
                "leaf_wetness": leaf_wetness
            },
            "recommendations": recommendations
        }
        
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

@app.post("/detect_disease_environmental")
def detect_disease_environmental(environmental_data: dict):
    """
    Predict disease risk based on environmental conditions.
    """
    try:
        temperature = environmental_data.get('temperature', 25)
        humidity = environmental_data.get('humidity', 60)
        soil_moisture = environmental_data.get('soil_moisture', 50)
        ph = environmental_data.get('ph', 6.5)
        nitrogen = environmental_data.get('nitrogen', 50)
        phosphorus = environmental_data.get('phosphorus', 50)
        potassium = environmental_data.get('potassium', 50)
        
        # Simple risk assessment based on conditions
        risk_score = 0
        
        # Temperature risk (diseases thrive in certain temperature ranges)
        if 20 <= temperature <= 30:
            risk_score += 0.3
        elif temperature > 35 or temperature < 10:
            risk_score += 0.1
            
        # Humidity risk (high humidity increases disease risk)
        if humidity > 80:
            risk_score += 0.4
        elif humidity > 60:
            risk_score += 0.2
            
        # Soil moisture risk
        if soil_moisture > 80:
            risk_score += 0.2
        elif soil_moisture < 30:
            risk_score += 0.1
            
        # pH risk (extreme pH can stress plants)
        if ph < 5.5 or ph > 8:
            risk_score += 0.1
            
        # Determine disease based on risk score
        if risk_score > 0.6:
            disease = "Late Blight"
            recommendations = [
                "High disease risk detected",
                "Apply preventive fungicide",
                "Improve drainage",
                "Reduce irrigation frequency"
            ]
        elif risk_score > 0.4:
            disease = "Early Blight"
            recommendations = [
                "Moderate disease risk",
                "Monitor plants closely",
                "Ensure good air circulation",
                "Consider preventive measures"
            ]
        else:
            disease = "Healthy"
            recommendations = [
                "Low disease risk",
                "Continue current practices",
                "Regular monitoring advised"
            ]
            
        confidence = min(0.9, max(0.6, risk_score + 0.3))
        
        return {
            "disease": disease,
            "confidence": confidence,
            "risk_level": "High" if risk_score > 0.6 else "Medium" if risk_score > 0.4 else "Low",
            "environmental_conditions": environmental_data,
            "recommendations": recommendations
        }
        
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

# Authentication Models
from pydantic import BaseModel

class UserCreate(BaseModel):
    phone: str
    password: str
    username: Optional[str] = None

class UserLogin(BaseModel):
    phone: str
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None

# Authentication Endpoints
@app.post("/auth/register")
async def register(user_data: UserCreate):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Check if user already exists
    existing_user = users_collection.find_one({"phone": user_data.phone})
    if existing_user:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user_doc = {
        "phone": user_data.phone,
        "password": hashed_password,
        "username": user_data.username or f"User_{user_data.phone[-4:]}",
        "created_at": datetime.utcnow()
    }
    
    result = users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Generate JWT token
    token = jwt.encode({
        "user_id": user_id,
        "phone": user_data.phone,
        "exp": datetime.utcnow() + timedelta(days=30)
    }, SECRET_KEY, algorithm="HS256")
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "phone": user_data.phone,
            "username": user_doc["username"]
        }
    }

@app.post("/auth/login")
async def login(user_data: UserLogin):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Find user
    user = users_collection.find_one({"phone": user_data.phone})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    
    # Check password
    if not bcrypt.checkpw(user_data.password.encode('utf-8'), user["password"]):
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    
    user_id = str(user["_id"])
    
    # Generate JWT token
    token = jwt.encode({
        "user_id": user_id,
        "phone": user_data.phone,
        "exp": datetime.utcnow() + timedelta(days=30)
    }, SECRET_KEY, algorithm="HS256")
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "phone": user_data.phone,
            "username": user.get("username", f"User_{user_data.phone[-4:]}")
        }
    }

# User Profile Endpoints
@app.put("/auth/profile")
async def update_profile(
    user_data: UserUpdate,
    current_user: str = Depends(get_current_user)
):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        update_fields = {}
        if user_data.username is not None:
            update_fields["username"] = user_data.username
        
        if update_fields:
            users_collection.update_one(
                {"_id": ObjectId(current_user)},
                {"$set": update_fields}
            )
        
        # Get updated user
        updated_user = users_collection.find_one({"_id": ObjectId(current_user)})
        
        return {
            "user": {
                "id": current_user,
                "phone": updated_user["phone"],
                "username": updated_user.get("username", f"User_{updated_user['phone'][-4:]}")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update profile")

@app.get("/auth/profile")
async def get_profile(current_user: str = Depends(get_current_user)):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        user = users_collection.find_one({"_id": ObjectId(current_user)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user": {
                "id": current_user,
                "phone": user["phone"],
                "username": user.get("username", f"User_{user['phone'][-4:]}")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get profile")

# Community Endpoints
@app.get("/community/posts")
async def get_posts():
    if db is None:
        return []
    
    try:
        posts = list(posts_collection.find().sort("created_at", -1).limit(50))
        
        # Convert ObjectId to string and add author info
        for post in posts:
            post["_id"] = str(post["_id"])
            # Get author info
            author = users_collection.find_one({"_id": ObjectId(post["user_id"])})
            if author:
                post["author_phone"] = author["phone"]
                post["author_username"] = author.get("username", f"User_{author['phone'][-4:]}")
            else:
                post["author_phone"] = "Unknown"
                post["author_username"] = "Unknown User"
            
        return posts
    except Exception as e:
        print(f"Error fetching posts: {e}")
        return []

@app.post("/community/posts")
async def create_post(
    title: str = Form(...),
    content: str = Form(...),
    user_id: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: str = Depends(get_current_user)
):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Verify user owns this post
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    image_url = None
    
    # Upload image to Cloudinary if provided
    if image:
        try:
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                image.file,
                folder="agrimaster/posts",
                resource_type="auto"
            )
            image_url = upload_result.get("secure_url")
        except Exception as e:
            print(f"Error uploading image: {e}")
            # Continue without image if upload fails
    
    # Create post document
    post_doc = {
        "user_id": user_id,
        "title": title,
        "content": content,
        "image_url": image_url,
        "likes": [],
        "created_at": datetime.utcnow()
    }
    
    try:
        result = posts_collection.insert_one(post_doc)
        post_doc["_id"] = str(result.inserted_id)
        
        # Add author info
        author = users_collection.find_one({"_id": ObjectId(user_id)})
        if author:
            post_doc["author_phone"] = author["phone"]
            post_doc["author_username"] = author.get("username", f"User_{author['phone'][-4:]}")
        
        return post_doc
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create post")

@app.post("/community/posts/{post_id}/like")
async def like_post(
    post_id: str,
    current_user: str = Depends(get_current_user)
):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        # Check if user already liked the post
        post = posts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        likes = post.get("likes", [])
        
        if current_user in likes:
            # Unlike the post
            posts_collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$pull": {"likes": current_user}}
            )
        else:
            # Like the post
            posts_collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$addToSet": {"likes": current_user}}
            )
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to like post")

# Comments endpoints
class CommentCreate(BaseModel):
    content: str
    user_id: str

@app.post("/community/posts/{post_id}/comments")
async def add_comment(post_id: str, comment_data: CommentCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Verify token and get user
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        current_user = payload.get("user_id")
        if current_user != comment_data.user_id:
            raise HTTPException(status_code=403, detail="Token doesn't match user")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        # Get user info
        user = users_collection.find_one({"_id": ObjectId(current_user)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if post exists
        post = posts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Create comment
        comment = {
            "content": comment_data.content,
            "user_id": current_user,
            "user_phone": user["phone"],
            "created_at": datetime.utcnow()
        }
        
        # Add comment to post
        posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$push": {"comments": comment}}
        )
        
        return {"success": True, "comment": comment}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to add comment")

@app.get("/community/posts/{post_id}/comments")
async def get_comments(post_id: str):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        post = posts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        comments = post.get("comments", [])
        
        # Convert datetime objects to strings for JSON serialization
        for comment in comments:
            if "created_at" in comment:
                comment["created_at"] = comment["created_at"].isoformat()
        
        return comments
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get comments")

@app.delete("/community/posts/{post_id}/comments/{comment_index}")
async def delete_comment(post_id: str, comment_index: int, credentials: HTTPAuthorizationCredentials = Depends(security)):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Verify token
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        current_user = payload.get("user_id")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        post = posts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        comments = post.get("comments", [])
        if comment_index >= len(comments):
            raise HTTPException(status_code=404, detail="Comment not found")
        
        # Check if user owns the comment or the post
        comment = comments[comment_index]
        if comment["user_id"] != current_user and post["user_id"] != current_user:
            raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        
        # Remove comment
        posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$unset": {f"comments.{comment_index}": 1}}
        )
        
        # Remove null elements
        posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$pull": {"comments": None}}
        )
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete comment")

@app.post("/predict_crop")
def predict_crop(crop_data: dict):
    """
    Predict the best crop based on soil and climate conditions
    """
    try:
        features = [[
            crop_data.get('nitrogen', 50),
            crop_data.get('phosphorus', 50), 
            crop_data.get('potassium', 50),
            crop_data.get('temperature', 25),
            crop_data.get('humidity', 60),
            crop_data.get('ph', 6.5),
            crop_data.get('rainfall', 100),
            crop_data.get('lat', 0)  # ozone approximation based on location
        ]]
        
        if crop_model:
            pred = crop_model.predict(features)[0]
            return {"crop": pred, "confidence": 0.85}
        else:
            # Mock response when model is not available
            return {"crop": "potato", "confidence": 0.75}
    except Exception as e:
        return {"crop": "potato", "confidence": 0.5, "message": f"Using default recommendation: {e}"}

# Weather and Spray Window Endpoints
@app.get("/spray_window")
def spray_window(lat: float, lon: float):
    """
    Get the best 3-hour window for spraying based on weather conditions
    """
    try:
        # This is a simplified implementation
        # In production, you would use actual weather forecast data
        import random
        from datetime import datetime, timedelta
        
        # Simulate hourly weather data for next 24 hours
        current_hour = datetime.now().hour
        best_windows = []
        
        for hour in range(current_hour, current_hour + 24):
            display_hour = hour % 24
            # Simulate weather conditions (in production, get from weather API)
            temp = random.uniform(20, 35)
            humidity = random.uniform(40, 80)
            wind = random.uniform(0, 15)
            rain_prob = random.uniform(0, 0.3)
            
            # Calculate spray suitability score
            score = 0.0
            if 20 <= temp <= 30:  # Ideal temperature
                score += 0.3
            if 50 <= humidity <= 70:  # Ideal humidity
                score += 0.3
            if wind <= 10:  # Low wind
                score += 0.2
            if rain_prob <= 0.1:  # Low rain probability
                score += 0.2
            
            best_windows.append({
                'hour': display_hour,
                'score': score,
                'temp': temp,
                'humidity': humidity,
                'wind': wind,
                'rain_prob': rain_prob
            })
        
        # Find best 3-hour window
        best_score = -1
        best_window = None
        best_start_hour = None
        
        for i in range(len(best_windows) - 2):
            window_score = sum(w['score'] for w in best_windows[i:i+3]) / 3
            if window_score > best_score:
                best_score = window_score
                best_start_hour = best_windows[i]['hour']
                best_window = f"{best_start_hour}:00 to {(best_start_hour + 3) % 24}:00"
        
        if best_score >= 0.5:
            msg = f"Best 3-hour window to spray: {best_window} (Confidence: {best_score:.2f})"
            recommendation = "Ideal conditions for spraying"
        elif best_score >= 0.3:
            msg = f"Acceptable window: {best_window} (Confidence: {best_score:.2f})"
            recommendation = "Moderate conditions - proceed with caution"
        else:
            msg = f"Poor conditions today. Best available: {best_window} (Confidence: {best_score:.2f})"
            recommendation = "Consider postponing spray application"
        
        return {
            "result": msg, 
            "window": best_window, 
            "confidence": best_score,
            "recommendation": recommendation,
            "conditions": best_windows[0] if best_windows else None
        }
        
    except Exception as e:
        return {"error": f"Failed to calculate spray window: {str(e)}"}

@app.get("/weather_alerts")
def weather_alerts(lat: float, lon: float):
    """
    Generate weather alerts for farming activities
    """
    try:
        # Get current weather
        weather = fetch_weather_data(lat, lon)
        if not weather:
            return {"alerts": ["No weather data available for alerts."]}
        
        alerts = []
        
        # Temperature alerts
        if weather['temp'] > 35:
            alerts.append("🌡️ High temperature alert: Consider providing shade for crops and increase irrigation")
        elif weather['temp'] < 10:
            alerts.append("❄️ Cold temperature alert: Protect sensitive crops from frost damage")
        
        # Humidity alerts  
        if weather['humidity'] > 85:
            alerts.append("💧 High humidity alert: Increased risk of fungal diseases - monitor crops closely")
        elif weather['humidity'] < 30:
            alerts.append("🏜️ Low humidity alert: Increase irrigation frequency to prevent plant stress")
        
        # Wind alerts
        if weather.get('wind_speed', 0) > 25:
            alerts.append("💨 High wind alert: Avoid spraying pesticides and fertilizers")
        
        # Rain alerts
        if weather.get('rain', 0) > 10:
            alerts.append("🌧️ Heavy rain alert: Delay irrigation and outdoor farming activities")
        elif weather.get('rain', 0) > 0:
            alerts.append("🌦️ Light rain detected: Good time for planting, avoid chemical applications")
        
        # Pressure alerts
        if weather.get('pressure', 1013) < 1000:
            alerts.append("📉 Low pressure system: Expect weather changes, prepare for possible storms")
        
        # General recommendations
        if 20 <= weather['temp'] <= 30 and 50 <= weather['humidity'] <= 70 and weather.get('wind_speed', 0) <= 10:
            alerts.append("✅ Ideal weather conditions for most farming activities")
        
        if not alerts:
            alerts.append("🌟 No weather alerts - conditions are normal for farming activities")
        
        return {"alerts": alerts}
        
    except Exception as e:
        return {"alerts": [f"Error generating weather alerts: {str(e)}"]}
