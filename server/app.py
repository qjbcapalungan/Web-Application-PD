import io
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend to avoid Tkinter issues
import matplotlib.pyplot as plt
import pandas as pd
from flask import Flask, send_file, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np

app = Flask(__name__)
CORS(app)

# Load your model and data
CSV_FILE_PATH = r'C:\Users\Denver\Desktop\Web-Application-PD\server\inputdata2.csv'
MODEL_PATH = r'C:\Users\Denver\Desktop\Web-Application-PD\server\LSTM3.h5'

input_data = pd.read_csv(CSV_FILE_PATH)
model = tf.keras.models.load_model(MODEL_PATH)

current_index = 0  # Global index for current data simulation


@app.route('/current_psi', methods=['GET'])
def get_current_psi():
    """
    Simulate fetching the current PSI value and increment the global index.
    """
    global current_index
    try:
        if current_index >= len(input_data):
            current_index = 0  # Reset index if it exceeds data length

        current_psi_value = input_data['psi'].iloc[current_index]
        current_index += 1  # Increment the index

        # Debug logs
        print(f"DEBUG: Current Index: {current_index}, Current PSI: {current_psi_value}")
        return jsonify({'current_psi': [current_psi_value]})
    except Exception as e:
        print(f"ERROR in /current_psi: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/real_time_chart', methods=['GET'])
def real_time_chart():
    global current_index
    try:
        print(f"DEBUG: Current Index: {current_index}, Total Data Points: {len(input_data)}")

        # Ensure enough data for prediction
        if current_index < 5:  # Ensure at least 5 data points are available
            print("DEBUG: Not enough data for prediction")
            return jsonify({'error': 'Not enough data for prediction'}), 400

        # Separate actual and predicted values
        actual_data = []  # To store actual values
        predicted_data = []  # To store predicted values
        x_actual = []  # Indices for actual values
        x_predicted = []  # Indices for predicted values

        # Start building the sequence
        current_sequence = input_data['psi'].iloc[:current_index].tolist()

        for i in range(len(current_sequence)):
            # Add the actual value
            actual_value = current_sequence[i]
            actual_data.append(actual_value)
            x_actual.append(i)

            # If enough data is available for prediction
            if i >= 4:
                recent_data = np.array(current_sequence[i-4:i+1]).reshape(1, 5, 1)
                predictions = model.predict(recent_data).flatten().tolist()

                # Add predictions to the predicted_data list
                predicted_data.extend(predictions)
                x_predicted.extend(range(i + 1, i + 1 + len(predictions)))

        print(f"DEBUG: Actual Data: {actual_data}")
        print(f"DEBUG: Predicted Data: {predicted_data}")

        # Generate the plot
        plt.figure(figsize=(10, 6))
        plt.plot(x_actual, actual_data, label="Actual", color='blue', marker='o', linewidth=2)
        plt.plot(x_predicted, predicted_data, label="Predicted (5 Steps Ahead)", color='red', linestyle='--', marker='x', linewidth=2)

        # Adjust y-axis dynamically
        y_min = min(min(actual_data), min(predicted_data))
        y_max = max(max(actual_data), max(predicted_data))
        plt.ylim(y_min - 0.1 * abs(y_max - y_min), y_max + 0.1 * abs(y_max - y_min))

        # Add labels, title, and legend
        plt.title("Actual vs Predicted PSI (5 Steps Ahead)")
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
