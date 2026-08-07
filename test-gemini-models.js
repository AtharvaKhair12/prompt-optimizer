require('dotenv').config({ path: '.env.local' });
const { generateText } = require('ai');
const { google } = require('@ai-sdk/google');

async function test(modelName) {
  try {
    const result = await generateText({
      model: google(modelName),
      prompt: "Hello",
    });
    console.log("SUCCESS:", modelName);
  } catch (err) {
    console.error("FAIL:", modelName, err.message);
  }
}

async function run() {
  await test('gemini-1.5-flash');
  await test('gemini-1.5-flash-latest');
  await test('gemini-1.5-pro');
  await test('gemini-1.5-pro-latest');
}

run();
