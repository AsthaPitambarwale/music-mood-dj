import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generatePlaylist(mood, tracks) {
  // Create track dictionary for LLM
  const trackList = tracks
    .map(t => ({
      id: t._id.toString(),
      title: t.title,
      artist: t.artist
    }))
    .map(t => `ID: ${t.id} | ${t.title} — ${t.artist}`)
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
      temperature: 0.4
    });

    let content = response.choices[0].message.content.trim();

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("❌ LLM did not return JSON");
      return [];
    }

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("❌ LLM playlist generation error:", err);
    return [];
  }
}
