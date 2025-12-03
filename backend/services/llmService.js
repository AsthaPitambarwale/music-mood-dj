import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generatePlaylist(mood, tracks) {
  const trackList = tracks.map((t) => `${t.title} by ${t.artist}`).join("\n");

  const prompt = `
Suggest 3-6 tracks for the following mood: "${mood}".
Available tracks:
${trackList}
Return a JSON array of objects like [{ "title": "...", "weight": 0.8 }] matching available tracks.
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (err) {
    console.error("LLM response parse error:", err);
    return [];
  }
}
