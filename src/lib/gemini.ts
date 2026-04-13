export async function generateUserProfile(answers: string[]) {
  console.log("Fetching /backend/ai/generate-profile...");
  const response = await fetch("/backend/ai/generate-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers })
  });
  if (!response.ok) {
    const text = await response.text();
    console.error("Server error response:", text);
    try {
      const error = JSON.parse(text);
      throw new Error(error.error || "Failed to generate profile");
    } catch (e) {
      throw new Error(`Server returned non-JSON error: ${text.substring(0, 100)}`);
    }
  }
  return response.json();
}

export async function validateIdea(idea: any) {
  const response = await fetch("/backend/ai/validate-idea", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea })
  });
  if (!response.ok) {
    const text = await response.text();
    console.error("Server error response (validate-idea):", text);
    try {
      const error = JSON.parse(text);
      throw new Error(error.error || "Failed to validate idea");
    } catch (e) {
      throw new Error(`Server returned non-JSON error: ${text.substring(0, 100)}`);
    }
  }
  return response.json();
}

export async function rankCoFounderMatches(userProfile: any, otherProfiles: any[]) {
  const response = await fetch("/backend/ai/rank-matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userProfile, otherProfiles })
  });
  if (!response.ok) {
    const text = await response.text();
    console.error("Server error response (rank-matches):", text);
    try {
      const error = JSON.parse(text);
      throw new Error(error.error || "Failed to rank matches");
    } catch (e) {
      throw new Error(`Server returned non-JSON error: ${text.substring(0, 100)}`);
    }
  }
  const matches = await response.json();
  return matches.map((m: any) => ({
    ...otherProfiles[m.index],
    matchScore: m.score,
    matchReason: m.reason
  }));
}

export async function chatWithLearningAssistant(messages: any[], userContext: any) {
  const response = await fetch("/backend/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, userContext })
  });
  if (!response.ok) {
    const text = await response.text();
    console.error("Server error response (chat):", text);
    try {
      const error = JSON.parse(text);
      throw new Error(error.error || "Failed to chat with assistant");
    } catch (e) {
      throw new Error(`Server returned non-JSON error: ${text.substring(0, 100)}`);
    }
  }
  const data = await response.json();
  return data.text;
}
