import { useSocket } from "@/lib/socket";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";

export default function OfflineIndicator() {
  const { isOffline } = useSocket();
  
  if (!isOffline) return null;
  
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-white shadow-lg">
      <WifiOff className="h-5 w-5" />
      <span className="font-medium">You're offline</span>
    </div>
  );
}