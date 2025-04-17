import { apiRequest } from "./queryClient";

export interface AIRecommendation {
  facility: string;
  assessment: string;
  duration: string;
  tips: string;
}

export interface AIRecommendationsResponse {
  recommendations: AIRecommendation[];
  disclaimer: string;
}

export async function getAIRecommendations(): Promise<AIRecommendationsResponse> {
  const response = await apiRequest("GET", "/api/recommendations");
  return response.json();
}
