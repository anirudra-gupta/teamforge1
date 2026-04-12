export interface ValidationResult {
  score: number;
  competition: {
    score: number;
    analysis: string;
  };
  demand: {
    score: number;
    analysis: string;
  };
  monetization: {
    score: number;
    analysis: string;
  };
  risks: {
    score: number;
    analysis: string;
  };
  future: {
    score: number;
    analysis: string;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  competitors: { name: string; link: string; description: string }[];
  nextSteps: string[];
}

export async function validateIdea(
  description: string,
  targetAudience: string,
  revenueModel: string,
  geography: string
): Promise<ValidationResult> {
  const response = await fetch("/api/ai/validate-idea-detailed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, targetAudience, revenueModel, geography })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to validate idea");
  }
  
  return response.json();
}
