from flask import Flask, request, jsonify
from flask_cors import CORS  # type: ignore
import tensorflow as tf
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the model
model = tf.keras.models.load_model('LSTM.h5')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    try:
        inputs = np.array(data['inputs']).reshape(1, -1, 1)  # Adjust input shape as needed
        prediction = model.predict(inputs)
        return jsonify({'prediction': prediction.flatten().tolist()})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='localhost', port=5001, debug=True)
