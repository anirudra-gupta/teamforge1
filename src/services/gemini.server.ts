import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    console.error("GEMINI_API_KEY is missing in server environment.");
    return "";
  }
  return key;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export async function serverGenerateUserProfile(answers: string[]) {
  const prompt = `Analyze this user's answers from a startup onboarding chat and generate a structured profile.
  Answers:
  ${answers.join("\n")}
  
  Generate:
  - Short bio (max 2 lines)
  - Skills (array of strings)
  - Interests (array of strings)
  - Suggested role (developer, designer, marketer, founder, product manager, etc.)
  - Personality summary (1-2 lines)
  - Mindset traits (array of strings, e.g., "Risk-tolerant", "Detail-oriented", "Growth-focused")
  - Knowledge gaps (array of strings, e.g., "Weak on monetization", "Needs marketing help")
  - Badges (array of strings, e.g., "Video Editing", "Serial Founder")
  - Work style (string, e.g., "Async-preferred", "High-collaboration")
  - Recommendations (what kind of startups they should join)
  - LookingFor (a short summary of the type of co-founder they are looking for)`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bio: { type: Type.STRING },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          interests: { type: Type.ARRAY, items: { type: Type.STRING } },
          role: { type: Type.STRING },
          personality: { type: Type.STRING },
          mindsetTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
          knowledgeGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
          badges: { type: Type.ARRAY, items: { type: Type.STRING } },
          workStyle: { type: Type.STRING },
          recommendations: { type: Type.STRING },
          lookingFor: { type: Type.STRING }
        },
        required: ["bio", "skills", "interests", "role", "personality", "mindsetTraits", "knowledgeGaps", "badges", "workStyle", "recommendations", "lookingFor"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function serverValidateIdea(idea: any) {
  const prompt = `Analyze this startup idea and provide a comprehensive validation report.
  Title: ${idea.title}
  Description: ${idea.description}
  Problem: ${idea.problem}
  Solution: ${idea.solution}
  Target Audience: ${idea.targetAudience}
  Revenue Model: ${idea.revenueModel || "Not specified"}
  Geography: ${idea.geography || "Not specified"}
  
  Return a structured JSON with:
  - score (1-100)
  - viabilityStars (1-5)
  - metrics: {
      competition: number (1-10 score),
      demand: number (1-10 score),
      monetization: number (1-10 score),
      risks: number (1-10 score),
      futurePotential: number (1-10 score)
    }
  - metricAnalysis: {
      competition: string (short analysis),
      demand: string (short analysis),
      monetization: string (short analysis),
      risks: string (short analysis),
      futurePotential: string (short analysis)
    }
  - strengths (array of strings)
  - weaknesses (array of strings)
  - suggestions (array of strings)
  - competitors (array of strings, top 5 competitors)`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          viabilityStars: { type: Type.NUMBER },
          metrics: {
            type: Type.OBJECT,
            properties: {
              competition: { type: Type.NUMBER },
              demand: { type: Type.NUMBER },
              monetization: { type: Type.NUMBER },
              risks: { type: Type.NUMBER },
              futurePotential: { type: Type.NUMBER }
            },
            required: ["competition", "demand", "monetization", "risks", "futurePotential"]
          },
          metricAnalysis: {
            type: Type.OBJECT,
            properties: {
              competition: { type: Type.STRING },
              demand: { type: Type.STRING },
              monetization: { type: Type.STRING },
              risks: { type: Type.STRING },
              futurePotential: { type: Type.STRING }
            },
            required: ["competition", "demand", "monetization", "risks", "futurePotential"]
          },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          competitors: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "viabilityStars", "metrics", "metricAnalysis", "strengths", "weaknesses", "suggestions", "competitors"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function serverRankCoFounderMatches(userProfile: any, otherProfiles: any[]) {
  const prompt = `You are an expert startup matchmaker. Your goal is to find the best co-founder matches for a user based on their profiles.
  
  Current User Profile:
  Role: ${userProfile.role}
  Skills: ${userProfile.skills?.join(", ")}
  Interests: ${userProfile.interests?.join(", ")}
  Looking For: ${userProfile.lookingFor}
  
  Potential Matches:
  ${otherProfiles.map((p, i) => `
  Match #${i}:
  Name: ${p.displayName}
  Role: ${p.role}
  Skills: ${p.skills?.join(", ")}
  Interests: ${p.interests?.join(", ")}
  Bio: ${p.bio}
  `).join("\n")}
  
  Analyze the synergy between the current user and each potential match. Consider complementary skills (e.g., a dev looking for a designer), shared interests, and the "Looking For" criteria.
  
  Return a structured JSON with an array of "matches". Each match should include:
  - index (the number from the list above)
  - score (1-100)
  - reason (a short, punchy 1-sentence explanation of why they are a good match)
  
  Return only the top 3 matches, sorted by score descending.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matches: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                index: { type: Type.NUMBER },
                score: { type: Type.NUMBER },
                reason: { type: Type.STRING }
              },
              required: ["index", "score", "reason"]
            }
          }
        },
        required: ["matches"]
      }
    }
  });

  return JSON.parse(response.text || '{"matches":[]}');
}

export async function serverChatWithLearningAssistant(messages: any[], userContext: any) {
  const prompt = `You are a helpful Learning Assistant for a startup platform. 
  User Context:
  - Role: ${userContext.role}
  - Skills: ${userContext.skills?.join(", ")}
  - Knowledge Gaps: ${userContext.knowledgeGaps?.join(", ")}
  - Current Idea Validation: ${userContext.lastValidationScore || "N/A"}
  ${userContext.currentCourse ? `- Currently Watching: ${userContext.currentCourse.title} by ${userContext.currentCourse.instructor} (${userContext.currentCourse.category})` : ""}
  
  Help the user with their questions about startups, skills, or their current projects.
  If they are watching a course, provide specific insights or answer questions related to that topic.
  Keep responses concise, encouraging, and practical.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [
      { role: "user", parts: [{ text: prompt }] },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    ]
  });

  return response.text;
}

export async function serverValidateIdeaDetailed(
  description: string,
  targetAudience: string,
  revenueModel: string,
  geography: string
) {
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
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
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
          nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "competition", "demand", "monetization", "risks", "future", "strengths", "weaknesses", "recommendations", "competitors", "nextSteps"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
