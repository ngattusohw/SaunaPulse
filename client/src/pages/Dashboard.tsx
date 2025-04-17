import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AlertBanner from "@/components/AlertBanner";
import TemperatureCard from "@/components/TemperatureCard";
import HistoricalDataChart from "@/components/HistoricalDataChart";
import AIRecommendationSection from "@/components/AIRecommendation";
import CrowdSatisfaction from "@/components/CrowdSatisfaction";
import ChatInterface from "@/components/ChatInterface";
import { useSocket } from "@/lib/socket";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { facilities, alert, dismissAlert, connected } = useSocket();
  const [username, setUsername] = useState<string>(() => {
    // Generate a random username for the chat if not already stored
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) return storedUsername;
    
    const randomName = `User${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem("username", randomName);
    return randomName;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-2">Temperature Dashboard</h2>
          <p className="text-slate-600">Real-time temperature monitoring and community feedback</p>
        </div>

        {/* Temperature Alert Banner */}
        {alert && (
          <AlertBanner 
            message={alert.message} 
            onDismiss={dismissAlert} 
          />
        )}

        {/* Real-time Temperature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {!connected || facilities.length === 0 ? (
            // Loading skeletons for facilities
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
                <Skeleton className="h-12 rounded-none" />
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-8 w-16 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-8 w-full mb-3" />
                  <Skeleton className="h-2 w-full mb-3" />
                  <Skeleton className="h-3 w-32 ml-auto" />
                </div>
              </div>
            ))
          ) : (
            facilities.map((facility) => (
              <TemperatureCard
                key={facility.id}
                facility={facility}
              />
            ))
          )}
        </div>

        {/* Main Content Area: Charts and Chat */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Charts */}
          <div className="w-full lg:w-2/3">
            <HistoricalDataChart facilities={facilities} />
            <AIRecommendationSection />
            <CrowdSatisfaction />
          </div>
          
          {/* Right Column: Chat */}
          <div className="w-full lg:w-1/3">
            <ChatInterface username={username} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
