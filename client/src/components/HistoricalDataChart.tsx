import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FacilityWithFeedback } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useTemperatureUnit } from "@/lib/temperatureUnit.tsx";
import Chart from "chart.js/auto";
import { Skeleton } from "@/components/ui/skeleton";

interface HistoricalDataChartProps {
  facilities: FacilityWithFeedback[];
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    pointRadius: number;
    pointHoverRadius: number;
  }[];
}

export default function HistoricalDataChart({ facilities }: HistoricalDataChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const { unit, convertTemp } = useTemperatureUnit();
  const [selectedFacility, setSelectedFacility] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("24");
  const [loading, setLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  // Colors for different facilities
  const facilityColors = {
    "Sauna 1": { border: "#F59E0B", background: "rgba(245, 158, 11, 0.1)" },
    "Sauna 2": { border: "#EF4444", background: "rgba(239, 68, 68, 0.1)" },
    "Steam Room": { border: "#6B7280", background: "rgba(107, 114, 128, 0.1)" },
    "Cold Plunge": { border: "#3B82F6", background: "rgba(59, 130, 246, 0.1)" }
  };

  // Fetch historical data
  const fetchHistoricalData = async () => {
    setLoading(true);
    
    try {
      let facilityIds = facilities.map(f => f.id);
      
      if (selectedFacility !== "all") {
        const facilityId = parseInt(selectedFacility);
        facilityIds = [facilityId];
      }
      
      const datasets = [];
      const hours = parseInt(timeRange);
      
      // Generate time labels
      const labels = [];
      const now = new Date();
      for (let i = hours - 1; i >= 0; i--) {
        const time = new Date(now);
        time.setHours(now.getHours() - i);
        labels.push(`${time.getHours()}:00`);
      }
      
      // Fetch data for each selected facility
      for (const facilityId of facilityIds) {
        const facility = facilities.find(f => f.id === facilityId);
        if (!facility) continue;
        
        const response = await apiRequest("GET", `/api/facilities/${facilityId}/history?hours=${hours}`);
        const historyData = await response.json();
        
        // Map history data to chart format
        const data = new Array(hours).fill(null);
        
        historyData.forEach((record: any) => {
          const date = new Date(record.timestamp);
          const hourIndex = hours - 1 - Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
          
          if (hourIndex >= 0 && hourIndex < hours) {
            // Convert temperature if needed
            data[hourIndex] = convertTemp(record.temperature);
          }
        });
        
        // Add dataset for this facility
        const facilityName = facility.name;
        const colors = facilityColors[facilityName as keyof typeof facilityColors];
        
        datasets.push({
          label: facilityName,
          data,
          borderColor: colors.border,
          backgroundColor: colors.background,
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 5
        });
      }
      
      setChartData({
        labels,
        datasets
      });
    } catch (error) {
      console.error("Error fetching historical data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize chart
  useEffect(() => {
    if (facilities.length === 0) return;
    
    fetchHistoricalData();
  }, [facilities, selectedFacility, timeRange, unit]);

  // Create or update chart when data changes
  useEffect(() => {
    if (!chartRef.current || !chartData) return;
    
    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Create new chart
    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;
    
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: "rgba(107, 114, 128, 0.1)"
            },
            title: {
              display: true,
              text: `Temperature (°${unit === 'celsius' ? 'C' : 'F'})`
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              pointStyle: "circle"
            }
          },
          tooltip: {
            backgroundColor: "rgba(30, 41, 59, 0.8)",
            titleColor: "#fff",
            bodyColor: "#fff",
            padding: 10,
            cornerRadius: 4,
            displayColors: true
          }
        },
        interaction: {
          mode: "index",
          intersect: false
        }
      }
    });
    
    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData]);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="text-lg font-heading">Temperature History</CardTitle>
          <div className="flex space-x-2">
            <Select
              value={selectedFacility}
              onValueChange={setSelectedFacility}
              disabled={loading || facilities.length === 0}
            >
              <SelectTrigger className="w-36 text-sm border border-slate-300 rounded">
                <SelectValue placeholder="All Facilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id.toString()}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
              disabled={loading || facilities.length === 0}
            >
              <SelectTrigger className="w-36 text-sm border border-slate-300 rounded">
                <SelectValue placeholder="Last 24 hours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">Last 24 hours</SelectItem>
                <SelectItem value="12">Last 12 hours</SelectItem>
                <SelectItem value="6">Last 6 hours</SelectItem>
                <SelectItem value="1">Last hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-64">
          {loading || facilities.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <canvas ref={chartRef} id="temperatureChart"></canvas>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
