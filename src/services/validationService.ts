import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is missing or using a placeholder. Please configure it in the AI Studio Secrets panel.");
    return "";
  }
  console.log("Gemini API Key is present and configured in validationService.");
  return key;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

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
  const prompt = `Validate this startup idea:
Idea Description: ${description}
Target Audience: ${targetAudience}
Revenue Model: ${revenueModel}
Geography: ${geography}

Provide a detailed breakdown including scores (1-10) for:
1. Competition: Analyze the competitive landscape. Provide specific details on how this proposed idea differentiates itself from top competitors (Unique Selling Proposition).
2. Demand: Evaluate market need and trend data.
3. Monetization: Analyze the feasibility and scalability of the provided revenue model. If the current model seems weak or unscalable, suggest 2-3 alternative models.
4. Risks: Identify major technical, regulatory, or market risks.
5. Future: Assess long-term potential and exit possibilities.

Also provide:
- Strengths and Weaknesses.
- Strategic Recommendations.
- A list of 5 direct/indirect competitors. For each competitor, provide their name, a brief description, and a valid website link (URL).
- Next steps for the founder.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          competition: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              analysis: { type: Type.STRING }
            },
            required: ["score", "analysis"]
          },
          demand: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              analysis: { type: Type.STRING }
            },
            required: ["score", "analysis"]
          },
          monetization: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              analysis: { type: Type.STRING }
            },
            required: ["score", "analysis"]
          },
          risks: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              analysis: { type: Type.STRING }
            },
            required: ["score", "analysis"]
          },
          future: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              analysis: { type: Type.STRING }
            },
            required: ["score", "analysis"]
          },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          weaknesses: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          competitors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                link: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["name", "link", "description"]
            }
          },
          nextSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: [
          "score", 
          "competition", 
          "demand", 
          "monetization", 
          "risks", 
          "future", 
          "strengths", 
          "weaknesses", 
          "recommendations", 
          "competitors", 
          "nextSteps"
        ]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
