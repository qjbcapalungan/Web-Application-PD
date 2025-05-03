import React, { createContext, useState, useEffect } from "react";

export const SensorContext = createContext();

export const SensorProvider = ({ children }) => {
  const [currentSensorIndexes, setCurrentSensorIndexes] = useState(() => {
    try {
      const savedIndexes = localStorage.getItem("sensorIndexes");
      return savedIndexes
        ? JSON.parse(savedIndexes)
        : { actualsensor1: 0, actualsensor2: 0, actualsensor3: 0 };
    } catch (error) {
      console.error("Error parsing sensorIndexes from localStorage:", error);
      return { actualsensor1: 0, actualsensor2: 0, actualsensor3: 0 };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("sensorIndexes", JSON.stringify(currentSensorIndexes));
    } catch (error) {
      console.error("Error saving sensorIndexes to localStorage:", error);
    }
  }, [currentSensorIndexes]);

  return (
    <SensorContext.Provider value={{ currentSensorIndexes, setCurrentSensorIndexes }}>
      {children}
    </SensorContext.Provider>
  );
};
