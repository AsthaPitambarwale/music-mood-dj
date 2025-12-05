import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // use environment variable, not hardcoded
});

/**
 * Generate a playlist for a given mood using available tracks.
 * Each track in result includes:
 *   - trackId: string (must match one of the provided track IDs)
 *   - weight: number (0 to 1)
 *
 * @param {string} mood - Mood for playlist generation
 * @param {Array} tracks - Array of Track objects from DB
 * @returns {Array} - Array of { trackId, weight }
 */
export async function generatePlaylist(mood, tracks) {
  if (!tracks || tracks.length === 0) return [];

  // Prepare track list for LLM
  const trackList = tracks
    .map(t => `ID: ${t._id.toString()} | ${t.title} — ${t.artist}`)
    .join("\n");

  const prompt = `
You are selecting the best matching tracks for the mood: "${mood}".

Available tracks (use ONLY these):
${trackList}

Return ONLY a valid JSON array.
Each item must look like:
{
  "trackId": "<ID from list>",
  "weight": <number between 0 and 1>
}

Rules:
- Choose 3 to 6 tracks.
- "trackId" must be EXACTLY one of the provided IDs.
- No additional commentary. Reply ONLY with JSON.
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // fast + cheap + reliable
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const content = response.choices[0].message.content.trim();

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("❌ LLM did not return JSON:", content);
      return [];
    }

    const result = JSON.parse(jsonMatch[0]);

    // Optional: filter invalid entries
    return result.filter(
      r => r.trackId && typeof r.weight === "number" && r.weight >= 0 && r.weight <= 1
    );
  } catch (err) {
    console.error("❌ LLM playlist generation error:", err);
    return [];
  }
}

export default client;
