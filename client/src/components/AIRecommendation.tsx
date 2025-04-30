import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AIRecommendation as AIRecommendationType, AIRecommendationsResponse, getAIRecommendations } from "@/lib/openai";

export default function AIRecommendationSection() {
  const [recommendations, setRecommendations] = useState<AIRecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const data = await getAIRecommendations();
        setRecommendations(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching AI recommendations:", err);
        setError("Unable to load recommendations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
    
    // Refresh recommendations every 10 minutes
    const interval = setInterval(fetchRecommendations, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="mb-6 border-l-4 border-[#1F6E6E]">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start">
          <div className="mr-4 text-2xl text-[#1F6E6E]">
            <Bot size={32} />
          </div>
          <div className="flex-1">
            <CardTitle className="mb-2 font-heading">AI Recommendations</CardTitle>
            
            {loading ? (
              <div className="space-y-2 mt-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="mt-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : error ? (
              <div className="text-red-500 mt-2">{error}</div>
            ) : recommendations ? (
              <div className="text-slate-700 mb-3">
                {recommendations.recommendations.map((rec: AIRecommendationType, idx: number) => (
                  <p key={idx} className="mb-2">
                    <strong>{rec.facility}:</strong> {rec.assessment} Recommended session: {rec.duration}. {rec.tips}
                  </p>
                ))}
                <div className="text-xs text-slate-500 italic mt-4">
                  <p>Disclaimer: {recommendations.disclaimer}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
