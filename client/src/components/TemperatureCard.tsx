import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FacilityWithFeedback } from "@shared/schema";
import { useSocket } from "@/lib/socket";
import { useTemperatureUnit } from "@/lib/temperatureUnit";
import { formatDistanceToNow } from "date-fns";
import { ArrowDown, ArrowUp } from "lucide-react";

interface TemperatureCardProps {
  facility: FacilityWithFeedback;
}

export default function TemperatureCard({ facility }: TemperatureCardProps) {
  const { submitFeedback } = useSocket();
  const { formatTemp, unit } = useTemperatureUnit();
  const [prevTemp, setPrevTemp] = useState<number>(facility.currentTemp);
  const [changing, setChanging] = useState<boolean>(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");

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
        <h3 className="font-heading font-semibold text-lg">{facility.name}</h3>
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
            <i className={facility.icon}></i>
          </div>
        </div>
        
        {/* Feedback Buttons */}
        <div className="border-t border-slate-200 pt-3 mb-3">
          <p className="text-sm text-slate-500 mb-2">How does it feel?</p>
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
