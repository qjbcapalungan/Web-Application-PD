# Models Directory

This directory contains the trained Keras models for sensor forecasting.

Expected files:
- sensor1_model.keras
- sensor2_model.keras
- sensor3_model.keras

Each model should be trained to accept 30 time steps of input data and produce a single prediction value.

Model input shape: (None, 30, 1)
Model output shape: (None, 1)
