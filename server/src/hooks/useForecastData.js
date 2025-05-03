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
      console.log('Fetching forecast data...');
      const response = await axios.get('http://178.128.48.126:8082/api/forecast-data');
      console.log('Forecast response:', response.data);
      
      if (response.data.status === 'ready' && response.data.forecasts) {
        const forecasts = {
          sensor1: response.data.forecasts.sensor1?.[0] ?? null,
          sensor2: response.data.forecasts.sensor2?.[0] ?? null,
          sensor3: response.data.forecasts.sensor3?.[0] ?? null,
          timestamp: response.data.timestamp
        };
        console.log('Processed forecasts:', forecasts);
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
