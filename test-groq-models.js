require('dotenv').config({ path: '.env.local' });

async function getModels() {
  const apiKey = process.env.GROQ_API_KEY;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    const data = await res.json();
    console.log(data.data.map(m => m.id).filter(id => id.includes('llama')));
  } catch (err) {
    console.error(err);
  }
}
getModels();
