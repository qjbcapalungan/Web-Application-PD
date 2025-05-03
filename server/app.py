from flask import Flask, Response, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd  # Added for DataFrame handling
import requests
import tensorflow as tf
import logging
import time
from threading import Thread, Event
import json
import os
import joblib  # Correct import for joblib

# Configuration
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

app = Flask(__name__)
CORS(app)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data storage for sensor batches
sensor_batches = {
    'actualsensor1': {
        'first_batch': [],
        'second_batch': [],
        'last_timestamp': None
    },
    'actualsensor2': {
        'first_batch': [],
        'second_batch': [],
        'last_timestamp': None
    },
    'actualsensor3': {
        'first_batch': [],
        'second_batch': [],
        'last_timestamp': None
    }
}

# Forecast storage
current_forecasts = {
    'sensor1': None,
    'sensor2': None,
    'sensor3': None
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

# Load the scaler
try:
    logger.info("Loading scaler...")
    scaler = joblib.load('models/scaler.pkl')  # Adjust path if necessary
    logger.info("Scaler loaded successfully.")
except Exception as e:
    logger.error(f"Scaler loading error: {e}")
    raise

def data_fetcher():
    """Fetches data in batches of 15 points to form 30-point input for forecasting."""
    while True:
        try:
            # Log the fetch attempt
            logger.info("Attempting to fetch new data...")
            response = requests.get('http://178.128.48.126:8081/api/actualsensor-data', timeout=10)
            if response.status_code != 200:
                logger.warning(f"Received status {response.status_code}")
                time.sleep(5)
                continue

            data = response.json()
            logger.info("Received data from API")

            for sensor_key in ['actualsensor1', 'actualsensor2', 'actualsensor3']:
                sensor_data = data.get(sensor_key)
                if not sensor_data or not sensor_data.get('value'):
                    logger.info(f"{sensor_key}: No data available")
                    continue

                new_values = sensor_data['value']
                new_timestamp = sensor_data.get('timestamp')

                if not isinstance(new_values, list):
                    new_values = [new_values]
                new_values = new_values[:15]

                # Debug log the current state
                logger.info(f"Current state for {sensor_key}:")
                logger.info(f"- First batch size: {len(sensor_batches[sensor_key]['first_batch'])}")
                logger.info(f"- Second batch size: {len(sensor_batches[sensor_key]['second_batch'])}")
                logger.info(f"- New values size: {len(new_values)}")
                logger.info(f"- Last timestamp: {sensor_batches[sensor_key]['last_timestamp']}")
                logger.info(f"- New timestamp: {new_timestamp}")

                # Check if this is new data by comparing timestamps
                if new_timestamp != sensor_batches[sensor_key]['last_timestamp']:
                    logger.info(f"{sensor_key}: Processing new data batch")
                    
                    # If first batch is empty, store there
                    if not sensor_batches[sensor_key]['first_batch']:
                        sensor_batches[sensor_key]['first_batch'] = new_values
                        sensor_batches[sensor_key]['last_timestamp'] = new_timestamp
                        logger.info(f"{sensor_key}: Stored first batch ({len(new_values)} values)")
                    
                    # If we have first batch but second is empty, store in second
                    elif not sensor_batches[sensor_key]['second_batch']:
                        sensor_batches[sensor_key]['second_batch'] = new_values
                        sensor_batches[sensor_key]['last_timestamp'] = new_timestamp
                        logger.info(f"{sensor_key}: Stored second batch ({len(new_values)} values)")
                        
                        # Now we should have 30 values, generate forecast
                        combined_values = (
                            sensor_batches[sensor_key]['first_batch'] +
                            sensor_batches[sensor_key]['second_batch']
                        )
                        
                        if len(combined_values) == 30:
                            forecast_num = int(sensor_key[-1])
                            forecast_key = f'sensor{forecast_num}'
                            forecast = generate_forecast(combined_values)
                            
                            if forecast is not None:
                                logger.info(f"Generated forecast for {forecast_key}: {forecast}")
                                current_forecasts[forecast_key] = forecast
                                update_event.set()
                            
                            # Move second batch to first and clear second
                            sensor_batches[sensor_key]['first_batch'] = sensor_batches[sensor_key]['second_batch']
                            sensor_batches[sensor_key]['second_batch'] = []
                            logger.info(f"{sensor_key}: Reset batches after forecast")
                    
                    else:
                        # If both batches are full, move second to first and store new values in second
                        sensor_batches[sensor_key]['first_batch'] = sensor_batches[sensor_key]['second_batch']
                        sensor_batches[sensor_key]['second_batch'] = new_values
                        sensor_batches[sensor_key]['last_timestamp'] = new_timestamp
                        logger.info(f"{sensor_key}: Updated batches with new values")

            # Wait for 1 minute before next fetch
            logger.info("Waiting 60 seconds before next fetch...")
            time.sleep(60)

        except Exception as e:
            logger.error(f"Data fetcher error: {e}")
            time.sleep(5)

def generate_forecast(input_values):
    """Generates a single forecast value from 30 input values"""
    try:
        # Convert input values to a NumPy array
        input_data = np.array(input_values, dtype=np.float32).reshape(-1, 1)

        # Ensure input data has valid feature names if the scaler was fitted with feature names
        if hasattr(scaler, "feature_names_in_"):
            input_data = pd.DataFrame(input_data, columns=scaler.feature_names_in_)

        # Scale input data
        input_data_scaled = scaler.transform(input_data).reshape(1, 30, 1)

        # Predict a single value (output shape is (0, 1, 0))
        prediction = model.predict(input_data_scaled, verbose=0)[0][0]

        # Scale back prediction
        prediction_rescaled = scaler.inverse_transform([[prediction]])[0][0]

        return float(prediction_rescaled)

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
                        "sensor1": current_forecasts.get('sensor1'),
                        "sensor2": current_forecasts.get('sensor2'),
                        "sensor3": current_forecasts.get('sensor3')
                    },
                    "timestamp": time.time()
                }
                yield f"data: {json.dumps(data)}\n\n"
            except Exception as e:
                logger.error(f"Error in event stream: {e}")
            finally:
                update_event.clear()
    
    response = Response(event_stream(), mimetype="text/event-stream")
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['Connection'] = 'keep-alive'
    return response

@app.route('/api/forecast-data')
def get_forecast_data():
    """API endpoint to fetch the current forecast data along with batch status."""
    return jsonify({
        "status": "ready" if any(current_forecasts.values()) else "collecting",
        "forecasts": current_forecasts,
        "batch_status": {
            "sensor1": {
                "first_batch_size": len(sensor_batches['actualsensor1']['first_batch']),
                "second_batch_size": len(sensor_batches['actualsensor1']['second_batch']),
                "last_update": sensor_batches['actualsensor1']['last_timestamp']
            },
            "sensor2": {
                "first_batch_size": len(sensor_batches['actualsensor2']['first_batch']),
                "second_batch_size": len(sensor_batches['actualsensor2']['second_batch']),
                "last_update": sensor_batches['actualsensor2']['last_timestamp']
            },
            "sensor3": {
                "first_batch_size": len(sensor_batches['actualsensor3']['first_batch']),
                "second_batch_size": len(sensor_batches['actualsensor3']['second_batch']),
                "last_update": sensor_batches['actualsensor3']['last_timestamp']
            }
        },
        "timestamp": time.time()
    })

if __name__ == '__main__':
    Thread(target=data_fetcher, daemon=True).start()
    app.run(host='0.0.0.0', port=5002, debug=True, threaded=True)