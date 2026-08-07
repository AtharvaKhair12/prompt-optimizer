require('dotenv').config({ path: '.env.local' });
const { generateText } = require('ai');
const { google } = require('@ai-sdk/google');

async function run() {
  try {
    const res = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: 'hi'
    });
    console.log('SUCCESS:', res.text);
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}
run();
