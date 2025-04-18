import { useState, useEffect } from 'react';
import axios from 'axios';

export const useForecastData = () => {
  const [forecastData, setForecastData] = useState({
    sensor1: null,
    sensor2: null,
    sensor3: null
  });

  const fetchForecastData = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/forecast-data');
      if (response.data.status === 'ready' && response.data.forecasts) {
        // Convert forecasted values to numbers
        const forecasts = {
          sensor1: parseFloat(response.data.forecasts.sensor1?.[0]) || null,
          sensor2: parseFloat(response.data.forecasts.sensor2?.[0]) || null,
          sensor3: parseFloat(response.data.forecasts.sensor3?.[0]) || null
        };
        setForecastData(forecasts);
      }
    } catch (error) {
      console.error('Error fetching forecast data:', error);
    }
  };

  useEffect(() => {
    fetchForecastData();
    const interval = setInterval(fetchForecastData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return forecastData;
};
