import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ChatMessage, FacilityWithFeedback } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type TemperatureAlert = {
  facilityName: string;
  temperature: number;
  message: string;
};

type RecentFeedback = {
  id: number;
  facilityId: number;
  userId?: number;
  rating: string;
  timestamp: Date;
  facilityName: string;
  username: string;
};

interface SocketContextType {
  facilities: FacilityWithFeedback[];
  chatMessages: ChatMessage[];
  recentFeedbacks: RecentFeedback[];
  alert: TemperatureAlert | null;
  sendChatMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  submitFeedback: (facilityId: number, userId: number | undefined, rating: string) => void;
  dismissAlert: () => void;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  facilities: [],
  chatMessages: [],
  recentFeedbacks: [],
  alert: null,
  sendChatMessage: () => {},
  submitFeedback: () => {},
  dismissAlert: () => {},
  connected: false,
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [facilities, setFacilities] = useState<FacilityWithFeedback[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [recentFeedbacks, setRecentFeedbacks] = useState<RecentFeedback[]>([]);
  const [alert, setAlert] = useState<TemperatureAlert | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        setSocket(null);
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case "facilities_update":
          setFacilities(data.payload);
          break;
        case "chat_history":
          setChatMessages(data.payload);
          break;
        case "chat_message":
          setChatMessages(prev => [...prev, data.payload]);
          break;
        case "recent_feedbacks":
          setRecentFeedbacks(data.payload);
          break;
        case "temperature_alert":
          setAlert(data.payload);
          toast({
            title: "Temperature Alert",
            description: data.payload.message,
            variant: "destructive",
          });
          break;
        case "error":
          toast({
            title: "Error",
            description: data.payload,
            variant: "destructive",
          });
          break;
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [toast]);

  const sendChatMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "chat",
        payload: message,
      }));
    } else {
      toast({
        title: "Connection Error",
        description: "Unable to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const submitFeedback = (facilityId: number, userId: number | undefined, rating: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "feedback",
        payload: {
          facilityId,
          userId,
          rating,
        },
      }));
    } else {
      toast({
        title: "Connection Error",
        description: "Unable to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const dismissAlert = () => {
    setAlert(null);
  };

  const socketContextValue: SocketContextType = {
    facilities,
    chatMessages,
    recentFeedbacks,
    alert,
    sendChatMessage,
    submitFeedback,
    dismissAlert,
    connected
  };

  // @ts-ignore - This is a workaround for the JSX parsing issue
  return React.createElement(SocketContext.Provider, { value: socketContextValue }, children);
}
