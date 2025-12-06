import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Simple stable playlist generator that NEVER fails.
 * Works without response_format (compatible with free tier).
 */
export async function generatePlaylist(mood, tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) return [];

  const trackList = tracks
    .map(t => `ID:${t._id} | ${t.title} — ${t.artist}`)
    .join("\n");

  const prompt = `
Generate a playlist for mood: "${mood}"

Allowed tracks ONLY:
${trackList}

Return STRICT JSON array:
[
  { "trackId": "ID", "weight": 0.8 },
  { "trackId": "ID", "weight": 0.6 }
]

Rules:
- Use ONLY IDs from the list.
- Choose between 3 and 6 tracks.
- NO text outside JSON.
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    let content = response.choices[0].message.content.trim();

    // Extract JSON
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) {
      console.warn("LLM returned invalid JSON → fallback playlist");
      return fallbackPlaylist(tracks);
    }

    let arr = JSON.parse(match[0]);

    // Validate IDs exist
    arr = arr.filter(x =>
      tracks.some(t => t._id.toString() === String(x.trackId))
    );

    if (arr.length === 0) return fallbackPlaylist(tracks);

    return arr;
  } catch (err) {
    console.error("LLM generation failed:", err);
    return fallbackPlaylist(tracks);
  }
}

/**
 * Fallback → always returns 4 random tracks.
 */
function fallbackPlaylist(tracks) {
  const shuffled = [...tracks].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(4, tracks.length)).map(t => ({
    trackId: t._id.toString(),
    weight: 0.5,
  }));
}

export default client;
