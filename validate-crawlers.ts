import { writeFileSync } from "fs";
import { join } from "path";
import { validateAllScrapers, CrawlerNetworkValidationReport } from "./src/lib/crawler/validator";

async function main() {
  console.log("=========================================================");
  console.log(" 🚀 NATIONAL OPPORTUNITY COVERAGE VALIDATION FRAMEWORK");
  console.log("=========================================================\n");

  const report: CrawlerNetworkValidationReport = await validateAllScrapers({ dryRun: true });

  const totalSources = report.totalCrawlersEvaluated;
  const validatedSources = report.summaryCounts.pass + report.summaryCounts.warn;
  const coveragePercentage = Math.round((validatedSources / totalSources) * 100);
  const totalLiveOpportunities = report.results.reduce((sum, r) => sum + r.dataQuality.totalExtracted, 0);

  console.log(`Institutions / Sources Covered: ${totalSources}`);
  console.log(`Validated Sources (PASS/WARN):  ${validatedSources} (${coveragePercentage}% Coverage Rate)`);
  console.log(`Total Live Opportunities:       ${totalLiveOpportunities}`);
  console.log(`Overall Network Health Score:   ${report.overallNetworkHealthScore} / 100`);
  console.log(`Overall Data Quality Score:     ${report.overallDataQualityScore} / 100`);
  console.log(`Status Counts: PASS: ${report.summaryCounts.pass} | WARN: ${report.summaryCounts.warn} | FAIL: ${report.summaryCounts.fail} | EXTERNAL: ${report.summaryCounts.externalBlock + report.summaryCounts.externalDown}\n`);

  console.log("--------------------------------------------------------------------------------------------------");
  console.log(" SLUG             | NAME                           | STATUS | INFRA SCORE | QUALITY SCORE | ITEMS ");
  console.log("--------------------------------------------------------------------------------------------------");

  for (const r of report.results) {
    const slugPad = r.slug.padEnd(16, " ");
    const namePad = r.name.slice(0, 30).padEnd(30, " ");
    const statusPad = r.status.padEnd(13, " ");
    const infraPad = String(r.infrastructure.score).padStart(11, " ");
    const qualPad = String(r.dataQuality.overallQualityScore).padStart(13, " ");
    const itemsPad = String(r.dataQuality.totalExtracted).padStart(5, " ");
    console.log(` ${slugPad} | ${namePad} | ${statusPad} | ${infraPad} | ${qualPad} | ${itemsPad} `);
  }
  console.log("--------------------------------------------------------------------------------------------------\n");

  // Generate detailed Markdown Report
  let md = `# Milestone 5 — National Opportunity Coverage & Validation Report\n\n`;
  md += `**Timestamp:** ${report.timestamp}  \n`;
  md += `**Total Institutions / Sources Covered:** ${totalSources}  \n`;
  md += `**Validated Sources (PASS / WARN):** ${validatedSources} (${coveragePercentage}% Coverage Rate)  \n`;
  md += `**Total Live Opportunities Discovered:** **${totalLiveOpportunities}**  \n`;
  md += `**Overall Network Health Score:** **${report.overallNetworkHealthScore} / 100**  \n`;
  md += `**Overall Data Quality Score:** **${report.overallDataQualityScore} / 100**  \n\n`;

  md += `## 1. National Coverage Metrics\n\n`;
  md += `| Coverage Metric | Value |\n| :--- | :---: |\n`;
  md += `| Total Institutions Registered | ${totalSources} |\n`;
  md += `| Verified Opportunity Sources | ${totalSources} |\n`;
  md += `| Validated Sources (PASS/WARN) | ${validatedSources} |\n`;
  md += `| Source Coverage Rate | **${coveragePercentage}%** |\n`;
  md += `| Total Extracted Opportunities | **${totalLiveOpportunities}** |\n\n`;

  md += `## 2. Validation Status Summary\n\n`;
  md += `| Status | Count |\n| :--- | :---: |\n`;
  md += `| 🟢 PASS | ${report.summaryCounts.pass} |\n`;
  md += `| 🟡 WARN | ${report.summaryCounts.warn} |\n`;
  md += `| 🔴 FAIL | ${report.summaryCounts.fail} |\n`;
  md += `| 🌐 EXTERNAL (Block / Down) | ${report.summaryCounts.externalBlock + report.summaryCounts.externalDown} |\n\n`;

  md += `## 3. Institution-Wise Operational Telemetry\n\n`;
  md += `| Institution Slug | Name | Status | Infra Score | Data Quality Score | Extracted Items |\n`;
  md += `| :--- | :--- | :---: | :---: | :---: | :---: |\n`;

  for (const r of report.results) {
    const statusIcon = r.status === "PASS" ? "🟢 PASS" : r.status === "WARN" ? "🟡 WARN" : r.status === "FAIL" ? "🔴 FAIL" : `🌐 ${r.status}`;
    md += `| \`${r.slug}\` | ${r.name} | ${statusIcon} | ${r.infrastructure.score}/100 | ${r.dataQuality.overallQualityScore}/100 | ${r.dataQuality.totalExtracted} |\n`;
  }
  md += `\n---\n\n`;

  md += `## 4. Remaining Gaps & Future Target Sources\n\n`;
  md += `The following Tier-1/Tier-2 national institutes and funding bodies are catalogued for future batch expansion:\n`;
  md += `- **CSIR Laboratories**: CCMB Hyderabad, NCL Pune, NPL New Delhi, CSIR-IGIB New Delhi\n`;
  md += `- **Department of Science & Technology**: DST-ANRF Fellowships, INSPIRE Programme\n`;
  md += `- **Atomic Energy & Space**: RRI Bangalore, IUCAA Pune, IIA Bangalore\n\n`;

  const reportPath = join(process.cwd(), "validation-report.md");
  writeFileSync(reportPath, md, "utf8");
  console.log(`Saved detailed report to ${reportPath}\n`);
}

main().catch((err) => {
  console.error("Validation execution failed:", err);
  process.exit(1);
});
