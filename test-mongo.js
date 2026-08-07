const { MongoClient } = require('mongodb');

async function test(uri) {
  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("SUCCESS! Connection works for:", uri.replace(/:([^:@]+)@/, ':****@'));
    await client.close();
  } catch (err) {
    console.error("FAIL for:", uri.replace(/:([^:@]+)@/, ':****@'));
    console.error(err.message);
  }
}

async function run() {
  await test("mongodb+srv://prompt-admin:optimizerAdmin123@cluster1.cnus7rj.mongodb.net/prompt_optimizer?appName=Cluster1");
  await test("mongodb+srv://khairatharva441_db_user:H9ImCxO7VUqs7qOs@cluster1.cnus7rj.mongodb.net/prompt_optimizer?appName=Cluster1");
}

run();
