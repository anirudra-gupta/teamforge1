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
  const response = await fetch("/backend/ai/validate-idea-detailed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, targetAudience, revenueModel, geography })
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error("Server error response (validate-idea-detailed):", text);
    try {
      const error = JSON.parse(text);
      throw new Error(error.error || "Failed to validate idea");
    } catch (e) {
      throw new Error(`Server returned non-JSON error: ${text.substring(0, 100)}`);
    }
  }
  
  return response.json();
}
