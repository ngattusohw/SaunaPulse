import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, UserCircle, Send } from "lucide-react";
import { useSocket } from "@/lib/socket";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatInterfaceProps {
  username: string;
}

export default function ChatInterface({ username }: ChatInterfaceProps) {
  const { chatMessages, sendChatMessage, connected } = useSocket();
  const [message, setMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    sendChatMessage({
      userId: undefined,
      username,
      isStaff: false,
      message: message.trim(),
    });
    
    setMessage("");
  };

  const formatMessageTime = (timestamp: string | Date) => {
    return format(new Date(timestamp), "h:mm a");
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="bg-[#1F6E6E] text-white py-3 px-4">
        <CardTitle className="font-heading">Community Chat</CardTitle>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4 chat-messages" ref={scrollAreaRef}>
        <div className="space-y-4">
          {!connected ? (
            // Loading state
            Array(5).fill(0).map((_, idx) => (
              <div key={idx} className="flex items-start gap-2 mb-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-16 w-full mt-1 rounded-lg" />
                </div>
              </div>
            ))
          ) : chatMessages.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No messages yet. Be the first to say hello!
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2 mb-4">
                <div 
                  className={`flex-shrink-0 w-8 h-8 rounded-full ${
                    msg.isStaff 
                      ? "bg-[#1F6E6E] text-white" 
                      : "bg-slate-300 text-slate-600"
                  } flex items-center justify-center`}
                >
                  {msg.isStaff ? <User size={16} /> : <UserCircle size={16} />}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold">{msg.username}</span>
                    <span className="text-xs text-slate-400">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="bg-slate-100 rounded-lg p-3 mt-1">
                    <p>{msg.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="border-t border-slate-200 p-3">
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1F6E6E] focus:border-transparent"
            disabled={!connected}
          />
          <Button 
            type="submit" 
            className="bg-[#1F6E6E] text-white rounded-lg px-4 py-2 flex items-center justify-center hover:bg-opacity-90 transition"
            disabled={!message.trim() || !connected}
          >
            <Send size={16} />
          </Button>
        </form>
      </div>
    </Card>
  );
}
