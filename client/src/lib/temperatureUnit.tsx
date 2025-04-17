import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";

export type TemperatureUnit = "celsius" | "fahrenheit";

interface TemperatureContextType {
  unit: TemperatureUnit;
  toggleUnit: () => void;
  convertTemp: (celsius: number) => number;
  formatTemp: (celsius: number) => string;
}

// Create context with default values
const TemperatureContext = createContext<TemperatureContextType>({
  unit: "celsius",
  toggleUnit: () => {},
  convertTemp: (c) => c,
  formatTemp: (c) => `${c.toFixed(1)}°C`
});

// Provider component
export function TemperatureUnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useState<TemperatureUnit>(() => {
    // Try to load from localStorage, default to celsius
    if (typeof window !== 'undefined') {
      const savedUnit = localStorage.getItem("temperatureUnit");
      return (savedUnit === "fahrenheit" ? "fahrenheit" : "celsius") as TemperatureUnit;
    }
    return "celsius";
  });

  // Save unit preference to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("temperatureUnit", unit);
    }
  }, [unit]);

  // Toggle between celsius and fahrenheit
  const toggleUnit = () => {
    setUnit(prev => prev === "celsius" ? "fahrenheit" : "celsius");
  };

  // Convert temperature from celsius to the current unit
  const convertTemp = (celsius: number): number => {
    if (unit === "fahrenheit") {
      return (celsius * 9/5) + 32;
    }
    return celsius;
  };

  // Format temperature with appropriate unit symbol
  const formatTemp = (celsius: number): string => {
    if (unit === "fahrenheit") {
      const fahrenheit = (celsius * 9/5) + 32;
      return `${fahrenheit.toFixed(1)}°F`;
    }
    return `${celsius.toFixed(1)}°C`;
  };

  const contextValue: TemperatureContextType = {
    unit,
    toggleUnit,
    convertTemp,
    formatTemp
  };

  return (
    <TemperatureContext.Provider value={contextValue}>
      {children}
    </TemperatureContext.Provider>
  );
}

// Custom hook to use the temperature context
export function useTemperatureUnit() {
  return useContext(TemperatureContext);
}