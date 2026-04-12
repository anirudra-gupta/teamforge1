export async function generateUserProfile(answers: string[]) {
  const response = await fetch("/api/ai/generate-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate profile");
  }
  return response.json();
}

export async function validateIdea(idea: any) {
  const response = await fetch("/api/ai/validate-idea", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to validate idea");
  }
  return response.json();
}

export async function rankCoFounderMatches(userProfile: any, otherProfiles: any[]) {
  const response = await fetch("/api/ai/rank-matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userProfile, otherProfiles })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to rank matches");
  }
  const matches = await response.json();
  return matches.map((m: any) => ({
    ...otherProfiles[m.index],
    matchScore: m.score,
    matchReason: m.reason
  }));
}

export async function chatWithLearningAssistant(messages: any[], userContext: any) {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, userContext })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to chat with assistant");
  }
  const data = await response.json();
  return data.text;
}
