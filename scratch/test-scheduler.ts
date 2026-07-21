import { executeScheduledCrawl } from "../src/lib/crawler/scheduler";

async function main() {
  console.log("Testing Crawl Scheduler & Lifecycle Engine...");
  const res = await executeScheduledCrawl({ trigger: "CLI", targetGroup: "TIER1_IITS" });
  console.log("Crawl Result Status:", res.status);
  console.log("Job ID:", res.jobId);
  console.log("Lifecycle Stats:", res.lifecycleStats);
}

main().catch(console.error);
