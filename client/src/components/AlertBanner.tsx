import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  message: string;
  onDismiss: () => void;
}

export default function AlertBanner({ message, onDismiss }: AlertBannerProps) {
  return (
    <Alert variant="destructive" className="bg-red-100 border-l-4 border-red-500 text-red-700 mb-6 rounded shadow-sm">
      <div className="flex items-center">
        <AlertCircle className="h-4 w-4 mr-2" />
        <div className="flex-1">
          <AlertTitle>Temperature Alert</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onDismiss} className="h-5 w-5">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
