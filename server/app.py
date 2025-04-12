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

# Load model
try:
    logger.info("Loading prediction model...")
    model = tf.keras.models.load_model('models/30minsPredict.keras')
    logger.info(f"Model loaded. Input shape: {model.input_shape}")
except Exception as e:
    logger.error(f"Model loading error: {e}")
    raise

def data_fetcher():
    """Strictly processes one 15-point batch at a time"""
    while True:
        try:
            # Fetch current data from Node.js
            response = requests.get('http://localhost:5000/api/actualsensor-data', timeout=10)
            if response.status_code != 200:
                logger.warning(f"Received status {response.status_code}")
                time.sleep(5)
                continue
                
            data = response.json()
            logger.info("Processing new 15-point batch")
            
            for sensor in ['actualsensor1', 'actualsensor2', 'actualsensor3']:
                sensor_data = data.get(sensor)
                if not sensor_data or sensor_data.get('value') is None:
                    continue
                
                # Get exactly 15 values (no more, no less)
                values = sensor_data['value']
                values = [values] if not isinstance(values, list) else values[:15]  # Strict 15-point limit
                
                # Store the complete 15-point batch
                sensor_batches[sensor] = values
                logger.info(f"Stored 15-point batch for {sensor}")
                
                # Check if we have two complete batches (15 + 15 = 30)
                if (len(sensor_batches.get('actualsensor1', [])) == 15 and
                    len(sensor_batches.get('actualsensor2', [])) == 15):
                    
                    # Combine the two 15-point batches
                    combined = (sensor_batches['actualsensor1'] + 
                               sensor_batches['actualsensor2'])[:30]  # Ensure exactly 30
                    
                    # Generate forecast
                    forecast = generate_forecast(combined)
                    current_forecasts['actualsensor1'] = forecast
                    current_forecasts['actualsensor2'] = forecast  # Using same forecast for both for demo
                    
                    # Clear batches after forecasting
                    sensor_batches['actualsensor1'] = []
                    sensor_batches['actualsensor2'] = []
                    update_event.set()
                    logger.info("Generated forecast from two 15-point batches")
            
            time.sleep(2)  # Mandatory delay between fetches
            
        except Exception as e:
            logger.error(f"Data fetcher error: {e}")
            time.sleep(5)

def generate_forecast(input_values):
    """Generates 30-point forecast from 30 input values"""
    try:
        input_data = np.array(input_values, dtype=np.float32).reshape(1, 30, 1)
        
        # If model outputs single value, create 30-point forecast recursively
        if model.output_shape[1] == 1:
            forecasts = []
            current_window = input_values.copy()
            
            for _ in range(30):
                prediction = model.predict(
                    np.array(current_window).reshape(1, 30, 1),
                    verbose=0
                )[0][0]
                forecasts.append(float(prediction))
                current_window = current_window[1:] + [prediction]
            
            return forecasts
        else:
            return [float(x) for x in model.predict(input_data, verbose=0)[0]]
            
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
                    "forecasts": current_forecasts,
                    "batches_available": {
                        'sensor1': len(sensor_batches.get('actualsensor1', [])),
                        'sensor2': len(sensor_batches.get('actualsensor2', [])),
                        'sensor3': len(sensor_batches.get('actualsensor3', []))
                    },
                    "timestamp": time.time()
                }
                yield f"data: {json.dumps(data)}\n\n"
            finally:
                update_event.clear()
    
    return Response(event_stream(), mimetype="text/event-stream")

if __name__ == '__main__':
    Thread(target=data_fetcher, daemon=True).start()
    app.run(port=5001, debug=True, threaded=True)