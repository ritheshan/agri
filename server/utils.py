import requests
import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta
import json

def fetch_weather_data(lat, lon):
    """Fetch current weather data from OpenWeatherMap API"""
    try:
        api_key = "demo_key" # Replace with your OpenWeatherMap API key in production
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            return {
                "temp": data['main']['temp'],
                "humidity": data['main']['humidity'],
                "pressure": data['main']['pressure'],
                "wind_speed": data['wind']['speed'],
                "visibility": data['visibility'] / 1000,  # convert to km
                "rain": data.get('rain', {}).get('1h', 0),
                "clouds": data.get('clouds', {}).get('all', 0),
                "description": data['weather'][0]['description']
            }
    except Exception as e:
        print(f"Error fetching weather data: {e}")
    
    # Return mock data if API call fails
    return {
        "temp": 25.5,
        "humidity": 65,
        "pressure": 1012,
        "wind_speed": 3.5,
        "visibility": 10,
        "rain": 0,
        "clouds": 40,
        "description": "scattered clouds"
    }

def get_hourly_forecast(lat, lon):
    """Get hourly forecast data for the next 48 hours"""
    try:
        api_key = "demo_key" # Replace with your OpenWeatherMap API key in production
        url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            hourly_data = []
            
            for item in data['list'][:16]:  # Get next 48 hours (3-hour steps)
                dt = datetime.fromtimestamp(item['dt'])
                hour = dt.hour
                temp = item['main']['temp']
                humidity = item['main']['humidity']
                wind = item['wind']['speed']
                rain = item.get('rain', {}).get('3h', 0)
                
                # Placeholder for ozone data which isn't in the free API
                ozone = 30 + np.random.normal(0, 3)  # Simulate ozone data
                
                hourly_data.append({
                    "hour": hour,
                    "temp": temp,
                    "humidity": humidity,
                    "wind": wind,
                    "rain": rain,
                    "ozone": ozone
                })
            
            return pd.DataFrame(hourly_data)
    except Exception as e:
        print(f"Error fetching hourly forecast: {e}")
    
    # Return mock data if API call fails
    mock_hours = list(range(24)) * 2
    mock_data = []
    
    for i, hour in enumerate(mock_hours[:16]):
        mock_data.append({
            "hour": hour,
            "temp": 22 + 5 * np.sin(hour / 12 * np.pi),  # Simulate daily temp cycle
            "humidity": 60 + 15 * np.sin(hour / 12 * np.pi + np.pi),  # Inverse to temp
            "wind": 3 + 2 * np.random.random(),
            "rain": 0.1 if 12 <= hour <= 16 else 0,  # Small chance of afternoon rain
            "ozone": 35 + 5 * np.sin(hour / 12 * np.pi) + np.random.normal(0, 2)
        })
    
    return pd.DataFrame(mock_data)

def get_7_day_forecast(lat, lon):
    """Get 7-day forecast data"""
    try:
        api_key = "demo_key" # Replace with your OpenWeatherMap API key in production
        url = f"https://api.openweathermap.org/data/2.5/onecall?lat={lat}&lon={lon}&exclude=minutely,hourly,current&appid={api_key}&units=metric"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            daily_data = []
            
            for item in data['daily']:
                date = datetime.fromtimestamp(item['dt']).strftime('%Y-%m-%d')
                temp = item['temp']['day']
                min_temp = item['temp']['min']
                max_temp = item['temp']['max']
                humidity = item['humidity']
                wind = item['wind_speed']
                rain = item.get('rain', 0)
                
                daily_data.append({
                    "date": date,
                    "temp": temp,
                    "min_temp": min_temp,
                    "max_temp": max_temp,
                    "humidity": humidity,
                    "wind": wind,
                    "rain": rain
                })
            
            return pd.DataFrame(daily_data)
    except Exception as e:
        print(f"Error fetching 7-day forecast: {e}")
    
    # Return mock data if API call fails
    mock_data = []
    today = datetime.now()
    
    for i in range(7):
        day = today + timedelta(days=i)
        date = day.strftime('%Y-%m-%d')
        
        # Simulate some weather patterns
        is_rainy = np.random.random() < 0.3  # 30% chance of rain
        
        mock_data.append({
            "date": date,
            "temp": 25 + np.random.normal(0, 3),
            "min_temp": 18 + np.random.normal(0, 2),
            "max_temp": 30 + np.random.normal(0, 2),
            "humidity": 65 + np.random.normal(0, 10),
            "wind": 4 + np.random.normal(0, 1.5),
            "rain": 5 + np.random.normal(0, 2) if is_rainy else 0
        })
    
    return pd.DataFrame(mock_data)

def generate_weather_alerts(forecast_df):
    """Generate weather alerts based on 7-day forecast data"""
    alerts = []
    
    # Temperature alerts
    if any(forecast_df['max_temp'] > 35):
        hot_days = forecast_df[forecast_df['max_temp'] > 35]
        hot_dates = hot_days['date'].tolist()
        if len(hot_days) > 1:
            alerts.append(f"High temperature alert: Temperatures exceeding 35°C expected on {hot_dates[0]} and {len(hot_days)-1} other day(s). Ensure adequate irrigation.")
        else:
            alerts.append(f"High temperature alert: Temperature exceeding 35°C expected on {hot_dates[0]}. Ensure adequate irrigation.")
    
    # Rainfall alerts
    total_rain = forecast_df['rain'].sum()
    if total_rain < 5:
        alerts.append("Low rainfall alert: Less than 5mm of rain expected in the next 7 days. Consider irrigation planning.")
    elif total_rain > 50:
        alerts.append(f"Heavy rainfall alert: {total_rain:.1f}mm of rainfall expected in the next 7 days. Be prepared for potential waterlogging.")
    
    # Wind alerts
    high_wind_days = forecast_df[forecast_df['wind'] > 7]
    if not high_wind_days.empty:
        wind_dates = high_wind_days['date'].tolist()
        if len(wind_dates) > 1:
            alerts.append(f"High wind alert: Wind speeds above 7 m/s expected on {wind_dates[0]} and {len(wind_dates)-1} other day(s). Not suitable for spraying.")
        else:
            alerts.append(f"High wind alert: Wind speeds above 7 m/s expected on {wind_dates[0]}. Not suitable for spraying.")
    
    # Humidity alerts
    avg_humidity = forecast_df['humidity'].mean()
    if avg_humidity > 80:
        alerts.append("High humidity alert: Average humidity above 80% expected. Monitor for potential fungal diseases.")
    elif avg_humidity < 40:
        alerts.append("Low humidity alert: Average humidity below 40% expected. Plants may face water stress.")
    
    # Temperature variation alerts
    temp_range = forecast_df['max_temp'].max() - forecast_df['min_temp'].min()
    if temp_range > 15:
        alerts.append(f"Large temperature variations expected (range of {temp_range:.1f}°C). Plants may experience stress.")
    
    # If no alerts, add a positive message
    if not alerts:
        alerts.append("Weather conditions look favorable for farming activities in the next 7 days.")
    
    return alerts

def recommend_fertilizer(input_df, model):
    """Recommend fertilizer based on soil and environmental conditions"""
    # In a real system, this would use the model to predict
    # For this demo, we'll return a simple recommendation
    conditions = input_df.iloc[0]
    
    if conditions['rain'] > 5:
        return "Hold application due to rain forecast"
    
    if conditions['soil'] < 0.2:
        base = "Water soluble fertilizer with higher nitrogen content"
    elif conditions['soil'] > 0.4:
        base = "Slow-release granular fertilizer"
    else:
        base = "Balanced NPK fertilizer"
    
    if conditions['temp'] > 30:
        timing = "Apply in early morning or evening"
    else:
        timing = "Apply during daytime"
    
    return f"{base}. {timing}"

def predict_stress_level(model, input_df):
    """Predict crop stress level based on environmental and visual indicators"""
    # In a real system, this would use the model to predict
    # For this demo, we'll use simple rules
    conditions = input_df.iloc[0]
    
    stress_level = 0
    explanations = []
    
    # Temperature stress
    if conditions['temp'] > 32:
        stress_level += 2
        explanations.append("High temperature stress")
    elif conditions['temp'] < 10:
        stress_level += 2
        explanations.append("Cold stress")
    
    # Humidity stress
    if conditions['humidity'] > 85:
        stress_level += 1
        explanations.append("High humidity conditions")
    elif conditions['humidity'] < 30:
        stress_level += 1
        explanations.append("Low humidity stress")
    
    # Ozone stress
    if conditions['ozone'] > 50:
        stress_level += 2
        explanations.append("High ground-level ozone")
    
    # Visual indicators
    if conditions['color'] == 'yellow':
        stress_level += 2
        explanations.append("Yellowing leaves indicate nutrient deficiency")
    elif conditions['color'] == 'brown':
        stress_level += 3
        explanations.append("Browning indicates severe stress or disease")
    
    if conditions['symptom'] == 'wilting':
        stress_level += 2
        explanations.append("Wilting indicates water stress")
    elif conditions['symptom'] == 'spots':
        stress_level += 3
        explanations.append("Spots indicate potential disease")
    
    # Determine overall stress level
    if stress_level <= 2:
        level = "Low"
    elif stress_level <= 5:
        level = "Moderate"
    else:
        level = "High"
    
    explanation = " | ".join(explanations) if explanations else "No significant stress indicators"
    
    return level, explanation

def get_ai_insights_for_disease(disease_name):
    """
    Get AI-powered insights about a detected plant disease using Groq's Llama3 model
    """
    try:
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            return "AI insights unavailable: API key not configured"
        
        # Prepare the request to Groq API
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            "model": "llama3-8b-8192",
            "messages": [
                {
                    "role": "system",
                    "content": """You are an agricultural expert specializing in plant diseases. 
                    Provide detailed information about plant diseases including:
                    1. Disease characteristics and symptoms
                    2. Causes and spread mechanisms
                    3. Treatment options and recommendations
                    4. Preventive measures
                    5. Impact on crop yield
                    6. Organic/chemical treatment options
                    Format your response in clear sections with emoji icons where appropriate."""
                },
                {
                    "role": "user",
                    "content": f"Provide detailed information about {disease_name} in plants. Include symptoms, causes, treatment options, preventive measures, and impact on crop yield."
                }
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        response = requests.post('https://api.groq.com/openai/v1/chat/completions', headers=headers, json=data)
        
        if response.status_code == 200:
            response_data = response.json()
            if 'choices' in response_data and len(response_data['choices']) > 0:
                return {
                    'status': 'success',
                    'insights': response_data['choices'][0]['message']['content']
                }
            else:
                return {
                    'status': 'error',
                    'message': 'No insights generated'
                }
        else:
            return {
                'status': 'error',
                'message': f'Failed to get insights. Status code: {response.status_code}'
            }
            
    except Exception as e:
        print(f"Error getting AI insights: {e}")
        return {
            'status': 'error',
            'message': str(e)
        }
