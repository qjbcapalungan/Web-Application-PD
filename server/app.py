from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import tensorflow as tf
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Path to the input data CSV file
CSV_FILE_PATH = r'C:\Users\Denver\Desktop\Web-Application-PD\server\inputdata.csv'

# Load input data from the CSV
input_data = pd.read_csv(CSV_FILE_PATH)

# Load the machine learning model
MODEL_PATH = r'C:\Users\Denver\Desktop\Web-Application-PD\server\LSTM3.h5'
model = tf.keras.models.load_model(MODEL_PATH)

# Global index to simulate real-time streaming of actual values
current_index = 0

@app.route('/current_psi', methods=['GET'])
def get_current_psi():
    """
    Serve the current PSI value incrementally (one value at a time).
    """
    global current_index
    try:
        if current_index >= len(input_data):
            current_index = 0  # Reset if we exceed the dataset length

        current_psi_value = input_data['psi'].iloc[current_index]  # Get one value
        current_index += 1  # Move to the next value
        return jsonify({'current_psi': [current_psi_value]})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/predict', methods=['GET'])
def predict_future():
    """
    Predict future PSI values based on the most recent 10 actual values.
    """
    global current_index
    try:
        # Check if we have at least 10 values for prediction
        if current_index < 1:
            return jsonify({'prediction': []})  # Not enough data to make predictions

        # Get the last 10 PSI values as a sequence
        inputs = input_data['psi'].iloc[current_index-1:current_index].values.reshape(1, 1, 1)

        # Predict the next PSI value(s)
        predictions = model.predict(inputs)
        return jsonify({'prediction': predictions.flatten().tolist()})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    app.run(host='localhost', port=5001, debug=True)