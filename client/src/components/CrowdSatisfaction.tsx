import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useSocket } from "@/lib/socket";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function CrowdSatisfaction() {
  const { facilities, recentFeedbacks, connected } = useSocket();

  // Function to determine feedback color class
  const getFeedbackColorClass = (rating: string) => {
    switch (rating) {
      case "too-cold":
        return "bg-blue-500";
      case "perfect":
        return "bg-green-500";
      case "too-hot":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Function to format rating text
  const formatRating = (rating: string) => {
    switch (rating) {
      case "too-cold":
        return "Too Cold";
      case "perfect":
        return "Perfect";
      case "too-hot":
        return "Too Hot";
      default:
        return rating;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Community Satisfaction Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Satisfaction by Facility */}
          <div className="border border-slate-200 rounded p-3">
            <h4 className="font-semibold text-sm text-slate-500 mb-2">Satisfaction by Facility</h4>
            {!connected || facilities.length === 0 ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {facilities.map((facility) => (
                  <div key={facility.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{facility.name}</span>
                      <span>{facility.satisfactionPercent}%</span>
                    </div>
                    <Progress
                      value={facility.satisfactionPercent}
                      className="h-2 bg-gray-200"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Recent Feedback Activity */}
          <div className="border border-slate-200 rounded p-3">
            <h4 className="font-semibold text-sm text-slate-500 mb-2">Recent Feedback Activity</h4>
            {!connected || recentFeedbacks.length === 0 ? (
              <div className="space-y-2 text-sm">
                {Array(5).fill(0).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-8 ml-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {recentFeedbacks.map((feedback) => {
                  const formattedTime = formatDistanceToNow(new Date(feedback.timestamp), { addSuffix: true });
                  return (
                    <div key={feedback.id} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getFeedbackColorClass(feedback.rating)}`}></div>
                      <span>
                        {feedback.username} voted "{formatRating(feedback.rating)}" for {feedback.facilityName}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">{formattedTime}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
