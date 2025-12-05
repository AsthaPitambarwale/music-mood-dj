import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // secure
});

/**
 * Generate a playlist using LLM
 */
export async function generatePlaylist(mood, tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) return [];

  // Make precise list for LLM
  const trackList = tracks
    .map(t => `ID: ${t._id} | ${t.title} — ${t.artist}`)
    .join("\n");

  const prompt = `
Your task is to pick the best matching tracks for the mood: "${mood}".

ONLY use the tracks listed below:
${trackList}

Return ONLY a JSON array of objects:
[
  {
    "trackId": "ID_FROM_LIST",
    "weight": 0.8
  }
]

Rules:
- Choose 3 to 6 items.
- Do NOT create fake IDs.
- Do NOT change titles.
- Do NOT output anything except JSON.
  No text, no explanation, no markdown.
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    let content = response.choices[0].message.content.trim();

    // Extract JSON array safely
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("❌ LLM returned invalid output:", content);
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Filter out invalid entries
    return parsed.filter(
      r =>
        r.trackId &&
        typeof r.trackId === "string" &&
        typeof r.weight === "number" &&
        r.weight >= 0 &&
        r.weight <= 1
    );
  } catch (err) {
    console.error("❌ LLM playlist generation FAILED:", err);
    return [];
  }
}

export default client;
