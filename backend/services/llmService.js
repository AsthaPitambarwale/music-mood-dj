const { OpenAI } = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generatePlaylist(mood, tracks) {
  const trackList = tracks.map(t => `${t.title} by ${t.artist}`).join('\n');
  const prompt = `
  Suggest 3-6 tracks for the following mood: "${mood}".
  Available tracks:
  ${trackList}
  Return JSON array [{ "title": "...", "weight": 0.8 }] matching available tracks.
  `;
  
  const response = await client.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }]
  });

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch (err) {
    console.error("LLM response parse error:", err);
    return [];
  }
}

module.exports = { generatePlaylist };
