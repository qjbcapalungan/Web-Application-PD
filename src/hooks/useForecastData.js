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
      console.log('Raw forecast response:', response.data);
      
      if (response.data.status === 'ready' && response.data.forecasts) {
        const forecasts = response.data.forecasts;
        console.log('Processing forecasts:', forecasts);
        
        // Extract the first value if it's an array, otherwise use the value directly
        setForecastData({
          sensor1: Array.isArray(forecasts.sensor1) ? forecasts.sensor1[0] : forecasts.sensor1,
          sensor2: Array.isArray(forecasts.sensor2) ? forecasts.sensor2[0] : forecasts.sensor2,
          sensor3: Array.isArray(forecasts.sensor3) ? forecasts.sensor3[0] : forecasts.sensor3
        });
      }
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      // Log more details about the error
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  useEffect(() => {
    fetchForecastData();
    const interval = setInterval(fetchForecastData, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return forecastData;
};
