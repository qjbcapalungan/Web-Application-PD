import React, { createContext, useState, useContext, useEffect } from 'react';

const SensorDataContext = createContext();

export const SensorDataProvider = ({ children }) => {
  const [actualSensorValues, setActualSensorValues] = useState({
    actualsensor1: null,
    actualsensor2: null,
    actualsensor3: null,
  });
  
  const [currentIndexes, setCurrentIndexes] = useState(() => {
    const saved = localStorage.getItem('sensorIndexes');
    return saved ? JSON.parse(saved) : {
      actualsensor1: 0,
      actualsensor2: 0,
      actualsensor3: 0,
    };
  });

  const [faultHistory, setFaultHistory] = useState(() => {
    const saved = localStorage.getItem('faultHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Save indexes and fault history to localStorage
  useEffect(() => {
    localStorage.setItem('sensorIndexes', JSON.stringify(currentIndexes));
  }, [currentIndexes]);

  useEffect(() => {
    localStorage.setItem('faultHistory', JSON.stringify(faultHistory));
  }, [faultHistory]);

  // Update data synchronously across all components
  const updateSensorData = (data) => {
    setActualSensorValues(prev => ({
      ...prev,
      actualsensor1: data.actualsensor1?.value[currentIndexes.actualsensor1] || null,
      actualsensor2: data.actualsensor2?.value[currentIndexes.actualsensor2] || null,
      actualsensor3: data.actualsensor3?.value[currentIndexes.actualsensor3] || null,
    }));
    setLastUpdate(new Date().getTime());
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("http://localhost:5000/api/actualsensor-data");
        const data = await response.json();
        updateSensorData(data);
      } catch (error) {
        console.error("Error fetching sensor data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [currentIndexes]);

  const value = {
    actualSensorValues,
    setActualSensorValues,
    currentIndexes,
    setCurrentIndexes,
    lastUpdate,
    isLoading,
    faultHistory,
    setFaultHistory,
    updateSensorData
  };

  return (
    <SensorDataContext.Provider value={value}>
      {children}
    </SensorDataContext.Provider>
  );
};

export const useSensorData = () => {
  const context = useContext(SensorDataContext);
  if (!context) {
    throw new Error('useSensorData must be used within a SensorDataProvider');
  }
  return context;
};
