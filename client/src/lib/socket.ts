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
  isOffline: boolean;
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
  isOffline: false
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [facilities, setFacilities] = useState<FacilityWithFeedback[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [recentFeedbacks, setRecentFeedbacks] = useState<RecentFeedback[]>([]);
  const [alert, setAlert] = useState<TemperatureAlert | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { toast } = useToast();

  // Listen for online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast({
        title: "You're back online",
        description: "Connected to the network",
        variant: "default",
      });
      // Force reconnect the socket
      setSocket(null);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setConnected(false);
      toast({
        title: "You're offline",
        description: "Some features may not be available",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Load cached data from localStorage when offline
  useEffect(() => {
    if (isOffline) {
      const cachedFacilities = localStorage.getItem('cached_facilities');
      const cachedChatMessages = localStorage.getItem('cached_chatMessages');
      const cachedRecentFeedbacks = localStorage.getItem('cached_recentFeedbacks');

      if (cachedFacilities) {
        try {
          setFacilities(JSON.parse(cachedFacilities));
        } catch (e) {
          console.error("Error parsing cached facilities:", e);
        }
      }

      if (cachedChatMessages) {
        try {
          setChatMessages(JSON.parse(cachedChatMessages));
        } catch (e) {
          console.error("Error parsing cached chat messages:", e);
        }
      }

      if (cachedRecentFeedbacks) {
        try {
          setRecentFeedbacks(JSON.parse(cachedRecentFeedbacks));
        } catch (e) {
          console.error("Error parsing cached recent feedbacks:", e);
        }
      }
    }
  }, [isOffline]);

  // Cache data to localStorage when it changes
  useEffect(() => {
    if (facilities.length > 0) {
      localStorage.setItem('cached_facilities', JSON.stringify(facilities));
    }
  }, [facilities]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem('cached_chatMessages', JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  useEffect(() => {
    if (recentFeedbacks.length > 0) {
      localStorage.setItem('cached_recentFeedbacks', JSON.stringify(recentFeedbacks));
    }
  }, [recentFeedbacks]);

  // WebSocket connection management
  useEffect(() => {
    if (isOffline) {
      return; // Don't try to connect if offline
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
      setReconnectAttempts(0);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
      
      // Try to reconnect with exponential backoff
      const maxReconnectDelay = 30000; // 30 seconds
      const baseDelay = 1000; // 1 second
      const delay = Math.min(
        maxReconnectDelay, 
        baseDelay * Math.pow(2, reconnectAttempts)
      );
      
      setTimeout(() => {
        if (!isOffline) {
          setReconnectAttempts(prev => prev + 1);
          setSocket(null);
        }
      }, delay);
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
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [toast, reconnectAttempts, isOffline]);

  const sendChatMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
    if (isOffline) {
      toast({
        title: "You're offline",
        description: "Messages can't be sent while offline.",
        variant: "destructive",
      });
      return;
    }
    
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
    if (isOffline) {
      toast({
        title: "You're offline",
        description: "Feedback can't be submitted while offline.",
        variant: "destructive",
      });
      return;
    }
    
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
    connected,
    isOffline
  };

  // @ts-ignore - This is a workaround for the JSX parsing issue
  return React.createElement(SocketContext.Provider, { value: socketContextValue }, children);
}
