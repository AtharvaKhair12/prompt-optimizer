async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: "Write about AI" })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error(err);
  }
}
test();
