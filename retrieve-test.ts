import { retrieve } from "./src/lib/crawler/retriever";

async function main() {
  const url = process.argv[2];
  const profile = (process.argv[3] || "DEFAULT_STATIC") as any;
  if (!url) {
    console.error("Usage: npx tsx retrieve-test.ts <url> [profile]");
    process.exit(1);
  }
  console.log(`Retrieving ${url} using profile ${profile}...`);
  const res = await retrieve("test-b2", url, profile);
  console.log(`Status: ${res.statusCode}`);
  console.log(`Error: ${res.error}`);
  console.log(`Length: ${res.content.length}`);
  console.log(`Preview: ${res.content.slice(0, 1000)}`);
}

main().catch(console.error);
