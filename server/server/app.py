from flask import Flask, Response, jsonify
from flask_cors import CORS
import numpy as np
import requests
import tensorflow as tf
import logging
import time
from threading import Thread, Event
import json
import os
import joblib
try:
    from sklearn.preprocessing import StandardScaler
except ImportError:
    StandardScaler = None

# Configuration
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

app = Flask(__name__)
CORS(app)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data storage (strictly tracks 15-point batches)
sensor_batches = {
    'actualsensor1': [],
    'actualsensor2': [],
    'actualsensor3': []
}

# Forecast storage
current_forecasts = {
    'actualsensor1': None,
    'actualsensor2': None,
    'actualsensor3': None
}
update_event = Event()

# Add a new variable to track whether we have initial data
initial_data_ready = {
    'actualsensor1': False,
    'actualsensor2': False,
    'actualsensor3': False
}

def check_requirements():
    missing_deps = []
    if StandardScaler is None:
        missing_deps.append("sklearn")
    
    if missing_deps:
        logger.error(f"Missing required dependencies: {', '.join(missing_deps)}")
        logger.info("Please install missing dependencies using: pip install scikit-learn")
        return False
    return True

# Load model and scaler
model = None
scaler = None
try:
    if check_requirements():
        logger.info("Loading prediction model and scaler...")
        model = tf.keras.models.load_model('models/30minsPredict.keras')
        scaler = joblib.load('models/scaler.pkl')
        logger.info(f"Model loaded. Input shape: {model.input_shape}")
    else:
        raise ImportError("Missing required dependencies")
except Exception as e:
    logger.error(f"Model or scaler loading error: {e}")
    logger.error("The application will not work correctly without the model and scaler")
    # Don't raise the error, let the app start but in a degraded state

def data_fetcher():
    """Strictly processes data in 15-value batches"""
    while True:
        try:
            response = requests.get('http://localhost:5000/api/actualsensor-data', timeout=10)
            if response.status_code != 200:
                logger.warning(f"Received status {response.status_code}")
                time.sleep(5)
                continue
                
            data = response.json()
            logger.info("Processing API response")
            
            for sensor in ['actualsensor1', 'actualsensor2', 'actualsensor3']:
                sensor_data = data.get(sensor)
                if not sensor_data:
                    logger.warning(f"No data structure found for {sensor}")
                    continue
                    
                values = sensor_data.get('value', [])
                
                # Validate values more strictly
                if not values or not isinstance(values, list):
                    logger.warning(f"Invalid or empty values for {sensor}")
                    continue
                
                # Filter out None, null, or invalid values
                valid_values = [float(v) for v in values if v is not None and str(v).strip()]
                
                if not valid_values:
                    logger.warning(f"No valid numerical values found for {sensor}")
                    continue
                
                if len(valid_values) < 15:
                    logger.warning(f"{sensor} has insufficient values: {len(valid_values)}")
                    continue
                
                logger.info(f"{sensor} received {len(valid_values)} valid values")
                
                # Store exactly 15 valid values
                sensor_batches[sensor] = valid_values[:15]
                logger.info(f"Stored 15-point batch for {sensor}: {valid_values[:15]}")
                
                if not initial_data_ready[sensor]:
                    initial_data_ready[sensor] = True
                    logger.info(f"{sensor} ready for forecasting")
                
                # Generate forecast only when all conditions are met
                if (initial_data_ready[sensor] and 
                    initial_data_ready['actualsensor1'] and 
                    len(sensor_batches[sensor]) == 15 and 
                    len(sensor_batches['actualsensor1']) == 15):
                    
                    combined_data = sensor_batches[sensor] + sensor_batches['actualsensor1']
                    logger.info(f"Generating forecast for {sensor} with combined data")
                    
                    forecast = generate_forecast(combined_data)
                    if forecast is not None:
                        current_forecasts[sensor] = forecast
                        update_event.set()
                        logger.info(f"Generated forecast for {sensor}: {forecast}")
                    else:
                        logger.error(f"Failed to generate forecast for {sensor}")
            
            time.sleep(60)  # Wait for 1 minute before next fetch
            
        except Exception as e:
            logger.error(f"Data fetcher error: {e}", exc_info=True)
            time.sleep(5)

def generate_forecast(input_values):
    """Generates single-step forecast from 30 input values with scaling"""
    try:
        # Reshape and scale input data
        input_data = np.array(input_values, dtype=np.float32)
        input_data = input_data.reshape(1, 30, 1)
        input_data_scaled = scaler.transform(input_data.reshape(-1, 1)).reshape(1, 30, 1)
        
        # Make prediction
        prediction_scaled = model.predict(input_data_scaled, verbose=0)
        
        # Inverse transform the prediction
        prediction_original = scaler.inverse_transform(prediction_scaled.reshape(-1, 1))
        
        return [float(prediction_original[0][0])]  # Return as single-item list for consistency
    except Exception as e:
        logger.error(f"Forecast failed: {e}")
        return None

@app.route('/forecast_updates')
def forecast_updates():
    def event_stream():
        while True:
            update_event.wait()
            try:
                data = {
                    "status": "ready" if any(current_forecasts.values()) else "collecting",
                    "forecasts": {
                        "sensor1": current_forecasts.get('actualsensor1'),
                        "sensor2": current_forecasts.get('actualsensor2'),
                        "sensor3": current_forecasts.get('actualsensor3')
                    },
                    "timestamp": time.time()
                }
                yield f"data: {json.dumps(data)}\n\n"
            finally:
                update_event.clear()
    
    return Response(event_stream(), mimetype="text/event-stream")

# Add a new endpoint for getting the current forecasts
@app.route('/api/forecast-data')
def get_forecast_data():
    current_time = time.time()
    return jsonify({
        "status": "ready" if any(current_forecasts.values()) else "collecting",
        "forecasts": {
            "sensor1": current_forecasts.get('actualsensor1'),
            "sensor2": current_forecasts.get('actualsensor2'),
            "sensor3": current_forecasts.get('actualsensor3')
        },
        "timestamp": current_time,
        "metadata": {
            "prediction_window": "30 minutes",
            "last_update": current_time
        }
    })

if __name__ == '__main__':
    Thread(target=data_fetcher, daemon=True).start()
    app.run(host="0.0.0.0", port=5001, debug=True, threaded=True)