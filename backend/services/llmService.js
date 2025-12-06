import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate playlist using LLM with strict JSON array output
 */
export async function generatePlaylist(mood, tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) return [];

  const trackList = tracks.map(t => ({
    id: t._id.toString(),
    title: t.title,
    artist: t.artist
  }));

  const prompt = `
You are a playlist generator. Mood: "${mood}"

Allowed tracks (USE ONLY THESE):
${JSON.stringify(trackList, null, 2)}

Return ONLY a JSON ARRAY.
No wrapper objects.
No markdown.
No text.

Correct format:
[
  { "trackId": "ID_HERE", "weight": 0.8 },
  { "trackId": "ID_HERE", "weight": 0.6 }
]

Rules:
- Choose 3 to 6 tracks.
- trackId MUST match one of the provided ids.
- weight must be 0.1 to 1.
- Output MUST be ONLY the JSON array.
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1
    });

    let content = response.choices[0].message.content.trim();

    // Extract array only
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("❌ LLM did NOT output JSON array:", content);
      return [];
    }

    // Parse final array
    const parsed = JSON.parse(jsonMatch[0]);

    // Validate
    return parsed.filter(item =>
      item.trackId &&
      tracks.find(t => t._id.toString() === item.trackId) &&
      item.weight >= 0.1 &&
      item.weight <= 1
    );

  } catch (err) {
    console.error("❌ LLM playlist generation FAILED:", err);
    return [];
  }
}

export default client;
