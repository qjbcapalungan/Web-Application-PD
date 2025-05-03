import { useState, useEffect } from 'react';

export function useForecastData() {
  const [forecastData, setForecastData] = useState({
    sensor1: null,
    sensor2: null,
    sensor3: null
  });

  useEffect(() => {
    const eventSource = new EventSource('http://178.128.48.126:8082/forecast_updates');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received forecast data:", data); // Debug log
      if (data.forecasts) {
        setForecastData(data.forecasts);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return forecastData;
}
