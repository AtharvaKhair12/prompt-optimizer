require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: 'hi',
    });
    console.log("SUCCESS:", response.text);
  } catch (e) {
    console.error("ERROR:", e.message);
  }
}
run();
