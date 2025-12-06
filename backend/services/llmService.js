import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate playlist using LLM with safe JSON output
 */
export async function generatePlaylist(mood, tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) return [];

  // Provide strict item list
  const trackList = tracks.map(t => ({
    id: t._id.toString(),
    title: t.title,
    artist: t.artist
  }));

  const prompt = `
You are a playlist generator. Mood: "${mood}"

Here are the ONLY allowed tracks (use ONLY these):
${JSON.stringify(trackList, null, 2)}

Return ONLY a JSON ARRAY, like this example:
[
  { "trackId": "6567abcd...", "weight": 0.9 },
  { "trackId": "6567bcde...", "weight": 0.7 }
]

Rules:
- Choose 3 to 6 tracks.
- trackId MUST be one of the IDs given.
- weight MUST be between 0.1 and 1.
- Output strictly pure JSON. No markdown. No explanation.
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }  // ENSURES VALID JSON (VERY IMPORTANT)
    });

    // NEW: enforce JSON wrapper format from response_format
    let result = response.choices[0].message.content;

    // Parse entire JSON object
    let parsedObj = JSON.parse(result);

    // LLM may return: { playlist: [ ... ] }
    let playlist = parsedObj.playlist || parsedObj.data || parsedObj.result || parsedObj;

    if (!Array.isArray(playlist)) {
      console.error("❌ Invalid structured format:", result);
      return [];
    }

    // Final cleanup + validation
    return playlist
      .map(item => ({
        trackId: item.trackId?.toString(),
        weight: Number(item.weight) || 0.5
      }))
      .filter(item => {
        return (
          item.trackId &&
          tracks.find(t => t._id.toString() === item.trackId) &&
          item.weight > 0 &&
          item.weight <= 1
        );
      });
  } catch (err) {
    console.error("❌ LLM playlist generation FAILED:", err);
    return [];
  }
}

export default client;
