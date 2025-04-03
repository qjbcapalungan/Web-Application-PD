import io
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend to avoid Tkinter issues
import matplotlib.pyplot as plt
import pandas as pd
from flask import Flask, send_file, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

# MongoDB setup
MONGO_URI = "mongodb+srv://DenverMateo:admin123@Cluster0.jschv.mongodb.net/Cluster0?retryWrites=true&w=majority"
DB_NAME = "Cluster0"
COLLECTION_NAME = "Cluster0"  # Replace with the appropriate collection name

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# Load the LSTM model
MODEL_PATH = r'LSTM3.h5'
model = tf.keras.models.load_model(MODEL_PATH)


@app.route('/forecasted_psi', methods=['GET'])
def get_forecasted_psi():
    """
    Fetch the latest 15 PSI values from MongoDB for each collection and forecast the next 15 values.
    """
    try:
        # Fetch the latest 15 PSI values from each collection
        sim1_data = list(db["sim1_data"].find().sort("timestamp", -1).limit(15))
        sim2_data = list(db["sim2_data"].find().sort("timestamp", -1).limit(15))
        sim3_data = list(db["sim3_data"].find().sort("timestamp", -1).limit(15))

        # Reverse to maintain chronological order
        sim1_data.reverse()
        sim2_data.reverse()
        sim3_data.reverse()

        # Extract the PSI values
        sim1_psi_values = [doc['psi_values'] for doc in sim1_data]
        sim2_psi_values = [doc['psi_values'] for doc in sim2_data]
        sim3_psi_values = [doc['psi_values'] for doc in sim3_data]

        # Ensure enough data is available for forecasting
        if len(sim1_psi_values) < 15 or len(sim2_psi_values) < 15 or len(sim3_psi_values) < 15:
            return jsonify({'error': 'Not enough data for forecasting'}), 400

        # Prepare the input for the LSTM model
        sim1_input = np.array(sim1_psi_values).reshape(1, 15, 1)
        sim2_input = np.array(sim2_psi_values).reshape(1, 15, 1)
        sim3_input = np.array(sim3_psi_values).reshape(1, 15, 1)

        # Forecast the next 15 PSI values for each sensor
        sim1_forecasted = model.predict(sim1_input).flatten().tolist()
        sim2_forecasted = model.predict(sim2_input).flatten().tolist()
        sim3_forecasted = model.predict(sim3_input).flatten().tolist()

        # Debug logs
        print(f"DEBUG: Sim1 Latest PSI Values: {sim1_psi_values}")
        print(f"DEBUG: Sim1 Forecasted PSI Values: {sim1_forecasted}")
        print(f"DEBUG: Sim2 Latest PSI Values: {sim2_psi_values}")
        print(f"DEBUG: Sim2 Forecasted PSI Values: {sim2_forecasted}")
        print(f"DEBUG: Sim3 Latest PSI Values: {sim3_psi_values}")
        print(f"DEBUG: Sim3 Forecasted PSI Values: {sim3_forecasted}")

        # Return forecasted values in a format compatible with the frontend
        return jsonify({
            'sensor1': sim1_forecasted,
            'sensor2': sim2_forecasted,
            'sensor3': sim3_forecasted
        })
    except Exception as e:
        print(f"ERROR in /forecasted_psi: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/real_time_chart', methods=['GET'])
def real_time_chart():
    """
    Generate a real-time chart comparing actual and forecasted PSI values.
    """
    try:
        # Fetch the latest 15 PSI values from MongoDB
        latest_data = list(collection.find().sort("timestamp", -1).limit(15))
        latest_data.reverse()  # Reverse to maintain chronological order

        # Extract the PSI values
        psi_values = [doc['psi_values'] for doc in latest_data]
        if len(psi_values) < 15:
            return jsonify({'error': 'Not enough data for forecasting'}), 400

        # Prepare the input for the LSTM model
        input_data = np.array(psi_values).reshape(1, 15, 1)

        # Forecast the next 15 PSI values
        forecasted_values = model.predict(input_data).flatten().tolist()

        # Generate the plot
        plt.figure(figsize=(10, 6))
        plt.plot(range(15), psi_values, label="Actual", color='blue', marker='o', linewidth=2)
        plt.plot(range(15, 30), forecasted_values, label="Forecasted (Next 15 Minutes)", color='red', linestyle='--', marker='x', linewidth=2)

        # Adjust y-axis dynamically
        y_min = min(min(psi_values), min(forecasted_values))
        y_max = max(max(psi_values), max(forecasted_values))
        plt.ylim(y_min - 0.1 * abs(y_max - y_min), y_max + 0.1 * abs(y_max - y_min))

        # Add labels, title, and legend
        plt.title("Actual vs Forecasted PSI (Next 15 Minutes)")
        plt.xlabel("Time Steps")
        plt.ylabel("PSI Value")
        plt.legend()

        # Save the plot
        img = io.BytesIO()
        plt.savefig(img, format='png')
        img.seek(0)
        plt.close()

        return send_file(img, mimetype='image/png')

    except Exception as e:
        print(f"ERROR in /real_time_chart: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='localhost', port=5001, debug=True)