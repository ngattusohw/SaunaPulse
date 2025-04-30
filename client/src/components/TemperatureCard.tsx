import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FacilityWithFeedback } from "@shared/schema";
import { useSocket } from "@/lib/socket";
import { useTemperatureUnit } from "@/lib/temperatureUnit";
import { formatDistanceToNow } from "date-fns";
import { ArrowDown, ArrowUp, ThumbsDown, ThumbsUp, ChevronUp, ChevronDown, Dices } from "lucide-react";
import FacilityIcon from "./FacilityIcon";

interface TemperatureCardProps {
  facility: FacilityWithFeedback;
}

export default function TemperatureCard({ facility }: TemperatureCardProps) {
  const { submitFeedback } = useSocket();
  const { formatTemp, unit, convertTemp } = useTemperatureUnit();
  const [prevTemp, setPrevTemp] = useState<number>(facility.currentTemp);
  const [changing, setChanging] = useState<boolean>(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
  const [tempValue, setTempValue] = useState<number>(facility.currentTemp);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Track previous temperature to show change indicator
  useEffect(() => {
    if (facility.currentTemp !== prevTemp) {
      setPrevTemp(facility.currentTemp);
      setChanging(true);
      setTimeout(() => setChanging(false), 1500);
    }
  }, [facility.currentTemp, prevTemp]);

  // Update the "last updated" text
  useEffect(() => {
    const updateTime = () => {
      if (facility.lastUpdate) {
        const date = new Date(facility.lastUpdate);
        setLastUpdateTime(formatDistanceToNow(date, { addSuffix: true }));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [facility.lastUpdate]);

  // Handle feedback submission
  const handleFeedback = (rating: string) => {
    submitFeedback(facility.id, undefined, rating);
  };
  
  // Store temperature in Celsius internally, but display in the selected unit
  const [internalTemp, setInternalTemp] = useState<number>(facility.currentTemp);
  
  // Initialize internal temp value when facility temperature changes
  useEffect(() => {
    setInternalTemp(facility.currentTemp);
    setTempValue(facility.currentTemp);
  }, [facility.currentTemp]);
  
  // Update display temperature when unit changes
  useEffect(() => {
    // When unit changes, convert internal celsius temperature to the displayed unit
    if (unit === 'celsius') {
      setTempValue(internalTemp);
    } else {
      // Convert from Celsius to Fahrenheit for display
      setTempValue((internalTemp * 9/5) + 32);
    }
  }, [unit, internalTemp]);

  // Tracking for manual temperature input
  const [isManualInputOpen, setIsManualInputOpen] = useState<boolean>(false);
  const [manualInputValue, setManualInputValue] = useState<string>("");
  
  // Define min/max values based on facility type and temperature unit
  const minTemp = facility.name.includes("Cold Plunge") 
    ? (unit === 'celsius' ? 0 : 32) 
    : (unit === 'celsius' ? 50 : 122);
  
  const maxTemp = facility.name.includes("Cold Plunge") 
    ? (unit === 'celsius' ? 15 : 59) 
    : (unit === 'celsius' ? 110 : 230);
  
  const stepSize = facility.name.includes("Cold Plunge") 
    ? 0.1 
    : (unit === 'celsius' ? 0.5 : 1.0);
  
  // The slider change is now handled directly in the input element's onChange event
  
  // Handle manual input submission
  const handleManualInputSubmit = () => {
    const newValue = parseFloat(manualInputValue);
    if (!isNaN(newValue)) {
      setTempValue(newValue);
      
      // Update internal Celsius temperature
      if (unit === 'celsius') {
        setInternalTemp(newValue);
      } else {
        // Convert from Fahrenheit to Celsius for internal storage
        setInternalTemp(((newValue - 32) * 5/9));
      }
      
      // Close the dialog
      setIsManualInputOpen(false);
    }
  };
  
  // Functions for increment/decrement buttons (keeping them for reference)
  const incrementTemp = () => {
    if (unit === 'celsius') {
      // In Celsius mode, increment by 0.1°C and update both internal and display values
      const newTemp = parseFloat((internalTemp + 0.1).toFixed(1));
      setInternalTemp(newTemp);
      setTempValue(newTemp);
    } else {
      // In Fahrenheit mode, increment by 0.2°F
      const newTempF = parseFloat((tempValue + 0.2).toFixed(1));
      setTempValue(newTempF);
      // Convert back to Celsius for internal storage
      setInternalTemp(((newTempF - 32) * 5/9));
    }
  };

  const decrementTemp = () => {
    if (unit === 'celsius') {
      // In Celsius mode, decrement by 0.1°C and update both internal and display values
      const newTemp = parseFloat((internalTemp - 0.1).toFixed(1));
      setInternalTemp(newTemp);
      setTempValue(newTemp);
    } else {
      // In Fahrenheit mode, decrement by 0.2°F
      const newTempF = parseFloat((tempValue - 0.2).toFixed(1));
      setTempValue(newTempF);
      // Convert back to Celsius for internal storage
      setInternalTemp(((newTempF - 32) * 5/9));
    }
  };
  
  // Handle temperature submission
  const handleTempSubmit = () => {
    setSubmitting(true);
    
    // Submit temperature reading via websocket - always use the internal celsius temperature
    const socket = new WebSocket(
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
    );
    
    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'temperature_reading',
        payload: {
          username: 'Anonymous User',
          facilityId: facility.id,
          temperature: parseFloat(internalTemp.toFixed(1)),
        }
      }));
      
      // Reset temperature values to current facility temp and close socket
      setInternalTemp(facility.currentTemp);
      // Update displayed temp based on unit
      if (unit === 'celsius') {
        setTempValue(facility.currentTemp);
      } else {
        setTempValue((facility.currentTemp * 9/5) + 32);
      }
      setSubmitting(false);
      socket.close();
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setSubmitting(false);
    };
  };

  // Determine temperature trend indicator
  const getTrendIndicator = () => {
    // In a real app, this would compare to historical data
    // For now, randomly determine if temperature is trending up or down
    const random = Math.random();
    const unitSuffix = unit === 'celsius' ? '°C' : '°F';
    const changeAmount = unit === 'celsius' ? 1 : 1.8; // 1°C = 1.8°F
    
    if (random > 0.6) {
      return { 
        trend: "up", 
        change: `+${changeAmount.toFixed(1)}${unitSuffix} (15 min)`, 
        className: "text-green-600" 
      };
    } else if (random > 0.3) {
      return { 
        trend: "down", 
        change: `-${changeAmount.toFixed(1)}${unitSuffix} (15 min)`, 
        className: "text-red-600" 
      };
    } else {
      return { 
        trend: "stable", 
        change: `0${unitSuffix} (stable)`, 
        className: "text-gray-600" 
      };
    }
  };

  const { trend, change, className } = getTrendIndicator();

  return (
    <Card className="overflow-hidden border border-slate-200">
      <CardHeader className={`${facility.colorClass} text-white py-3 px-4`}>
        <h3 className="font-heading font-semibold text-lg flex items-center">
          <FacilityIcon iconName={facility.icon} size={20} className="mr-2 text-white" />
          {facility.name}
        </h3>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-slate-500">Current Temperature</p>
            <div className={`text-3xl font-semibold ${changing ? 'animate-pulse' : ''}`}>
              {formatTemp(facility.currentTemp)}
            </div>
            <div className={`text-sm ${className} flex items-center`}>
              {trend === "up" ? (
                <ArrowUp className="mr-1 h-4 w-4" />
              ) : trend === "down" ? (
                <ArrowDown className="mr-1 h-4 w-4" />
              ) : null}
              <span>{change}</span>
            </div>
          </div>
          <div className={`text-5xl ${facility.colorClass.replace('bg-', 'text-')}`}>
            <FacilityIcon iconName={facility.icon} size={48} />
          </div>
        </div>
        
        {/* Temperature Input with Slider and Dialog */}
        <div className="border-t border-slate-200 pt-3 mb-3">
          <p className="text-sm text-slate-500 mb-2">Add Current Temperature</p>
          <div className="space-y-5">
            {/* Temperature display with click-to-edit */}
            <Dialog 
              open={isManualInputOpen} 
              onOpenChange={(open) => {
                setIsManualInputOpen(open);
                if (open) {
                  // Set the manual input value to the current temperature
                  setManualInputValue(tempValue.toString());
                }
              }}
            >
              <DialogTrigger asChild>
                <button className="w-full flex justify-center">
                  <div className="text-2xl font-medium px-6 py-2 rounded-md border border-slate-200 hover:border-blue-400 transition-colors cursor-pointer flex items-center">
                    {unit === 'celsius' 
                      ? `${tempValue.toFixed(1)}°C` 
                      : `${tempValue.toFixed(1)}°F`}
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Enter Temperature</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Input 
                      id="temperature" 
                      type="number" 
                      className="col-span-3"
                      placeholder={`Temperature in ${unit === 'celsius' ? 'Celsius' : 'Fahrenheit'}`}
                      step={stepSize}
                      min={minTemp}
                      max={maxTemp}
                      value={manualInputValue} 
                      onChange={(e) => setManualInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleManualInputSubmit();
                        }
                      }}
                    />
                    <span className="text-lg">{unit === 'celsius' ? '°C' : '°F'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsManualInputOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleManualInputSubmit}>
                      Apply
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Temperature Controls */}
            <div className="px-1">
              {/* Custom Temperature Input Range */}
              <div className="relative pt-4 pb-2">
                <input 
                  type="range"
                  min={minTemp}
                  max={maxTemp}
                  step={stepSize}
                  value={tempValue}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value);
                    if (unit === 'celsius') {
                      setInternalTemp(newValue);
                      setTempValue(newValue);
                    } else {
                      setTempValue(newValue);
                      setInternalTemp(((newValue - 32) * 5/9));
                    }
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{minTemp}°{unit === 'celsius' ? 'C' : 'F'}</span>
                  <span>{maxTemp}°{unit === 'celsius' ? 'C' : 'F'}</span>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <Button
              className={`${facility.colorClass} hover:opacity-90 text-white w-full`}
              onClick={handleTempSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Temperature"}
            </Button>
          </div>
        </div>
        
        {/* Recent Temperature Readings */}
        <div className="mb-3">
          <p className="text-sm text-slate-500 mb-2">Recent Readings</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {facility.recentReadings && facility.recentReadings.length > 0 ? (
              facility.recentReadings.map((reading) => (
                <div key={reading.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div>
                    <span className="font-medium">{formatTemp(reading.temperature)}</span>
                    <span className="text-xs text-slate-500 ml-2">{reading.timeSinceSubmission}</span>
                    <span className="text-xs text-slate-500 ml-2">by {reading.username}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className="text-slate-500 hover:text-green-600 flex items-center"
                      onClick={() => {
                        // Send upvote via WebSocket
                        const socket = new WebSocket(
                          `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
                        );
                        
                        socket.onopen = () => {
                          socket.send(JSON.stringify({
                            type: 'temperature_vote',
                            payload: {
                              username: 'Anonymous User',
                              readingId: reading.id,
                              isUpvote: true
                            }
                          }));
                          socket.close();
                        };
                      }}
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      <span className="text-xs">{reading.upvotes || 0}</span>
                    </button>
                    <button 
                      className="text-slate-500 hover:text-red-600 flex items-center"
                      onClick={() => {
                        // Send downvote via WebSocket
                        const socket = new WebSocket(
                          `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
                        );
                        
                        socket.onopen = () => {
                          socket.send(JSON.stringify({
                            type: 'temperature_vote',
                            payload: {
                              username: 'Anonymous User',
                              readingId: reading.id,
                              isUpvote: false
                            }
                          }));
                          socket.close();
                        };
                      }}
                    >
                      <ThumbsDown className="h-3 w-3 mr-1" />
                      <span className="text-xs">{reading.downvotes || 0}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-2 text-sm text-slate-500">
                No temperature readings yet.
              </div>
            )}
          </div>
        </div>
        
        {/* Comfort Feedback (moved below temperature input) */}
        <div className="border-t border-slate-200 pt-3 mb-3">
          <p className="text-sm text-slate-500 mb-2">Comfort Rating</p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
              onClick={() => handleFeedback("too-cold")}
            >
              Too Cold <span className="ml-1">{facility.feedback.tooColdPercent}%</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
              onClick={() => handleFeedback("perfect")}
            >
              Perfect <span className="ml-1">{facility.feedback.perfectPercent}%</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
              onClick={() => handleFeedback("too-hot")}
            >
              Too Hot <span className="ml-1">{facility.feedback.tooHotPercent}%</span>
            </Button>
          </div>
        </div>
        
        {/* Satisfaction Meter */}
        <Progress 
          value={facility.satisfactionPercent} 
          className="w-full bg-gray-200 h-2.5 mb-3" 
        />
        
        {/* Last Update */}
        <div className="text-xs text-slate-500 text-right">
          Updated {lastUpdateTime}
        </div>
      </CardContent>
    </Card>
  );
}