/**
 * Opportunity Crawler Architecture
 *
 * Configurable, modular crawler that ingests real opportunities from institutional
 * announcement portals using deterministic parsing and optional AI fallbacks.
 */

import { createHash } from "crypto";
import { db } from "@/lib/db";
import { slugify, uniqueSlug, hashString } from "@/lib/utils";
import { CRAWLER_REGISTRY } from "./registry";
import { fetchPageContent, parseFieldsDeterminstically, parseFieldsWithGemini } from "./parser";

export interface CrawlResult {
  jobId: string;
  status: "SUCCESS" | "FAILED";
  itemsFound: number;
  itemsAdded: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errorMessage?: string;
}

async function log(
  jobId: string,
  level: "INFO" | "WARN" | "ERROR" | "DEBUG",
  message: string,
  metadata?: Record<string, unknown>
) {
  await db.crawlerLog.create({
    data: {
      jobId,
      level,
      message,
      metadata: JSON.stringify(metadata ?? {}),
    },
  });
}

function classifyOpportunityType(title: string, description: string): string {
  const corpus = `${title} ${description}`.toLowerCase();
  if (/(?:summer school|seminar|camp|course)/i.test(corpus)) return "SUMMER_SCHOOL";
  if (/(?:fellowship)/i.test(corpus)) return "FELLOWSHIP";
  if (/(?:scholarship|grant|bursary)/i.test(corpus)) return "SCHOLARSHIP";
  if (/(?:hackathon|buildathon|makeathon)/i.test(corpus)) return "HACKATHON";
  if (/(?:compete|contest|competition|prize)/i.test(corpus)) return "COMPETITION";
  if (/(?:conference|symposium|workshop)/i.test(corpus)) return "CONFERENCE";
  if (/(?:job|post-doc|employment|position|staff)/i.test(corpus)) return "JOB";
  return "RESEARCH_INTERNSHIP"; // Default fallback
}

function classifyResearchArea(title: string, description: string): string {
  const corpus = `${title} ${description}`.toLowerCase();
  const areas = [
    "Artificial Intelligence",
    "Machine Learning",
    "Computer Vision",
    "Natural Language Processing",
    "Robotics",
    "Systems & Networking",
    "Security & Privacy",
    "Human-Computer Interaction",
    "Theory & Algorithms",
    "Quantum Computing",
    "Bioinformatics",
    "Computational Biology",
    "Materials Science",
    "Climate & Sustainability",
    "Neuroscience",
    "Physics",
    "Mathematics",
    "Data Science",
    "Software Engineering",
  ];
  for (const area of areas) {
    if (corpus.includes(area.toLowerCase())) return area;
  }
  return "Computer Science"; // Default fallback
}

function getFundingAmountLabel(funding: string, country?: string | null): string {
  if (funding === "FULL") return "Full funding + stipend";
  if (funding === "PARTIAL") return "Partial tuition / travel support";
  if (funding === "STIPEND") return country === "India" ? "₹15,000–₹45,000/month" : "$2,000–$5,000/month";
  if (funding === "UNPAID") return "Unpaid (academic credit)";
  return "None";
}

/**
 * Runs crawl job for targeting config-registered institutions (IISc, IITB, IITM).
 */
export async function runCrawler(institutionId?: string): Promise<CrawlResult> {
  const job = await db.crawlerJob.create({
    data: {
      institutionId: institutionId ?? null,
      name: institutionId ? `Crawl institution ${institutionId}` : "Modular MVP crawl (IISc, IITB, IITM)",
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  let totalFound = 0;
  let totalAdded = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  try {
    await log(job.id, "INFO", "Crawler job started", { institutionId });

    // Fetch target institutions. If running a complete crawl, target IISc Bangalore, IIT Bombay, and IIT Madras.
    const institutions = await db.institution.findMany({
      where: institutionId
        ? { id: institutionId }
        : {
            slug: { in: ["iisc-bangalore", "iit-bombay", "iit-madras"] },
          },
    });

    if (institutions.length === 0) {
      throw new Error("No target institutions found in database");
    }

    await log(job.id, "INFO", `Crawling ${institutions.length} target institution(s)`);

    for (const institution of institutions) {
      const config = CRAWLER_REGISTRY[institution.slug];
      if (!config) {
        await log(
          job.id,
          "WARN",
          `No registry scraper config found for institution ${institution.name} (${institution.slug}). Skipping.`
        );
        continue;
      }

      await db.institution.update({
        where: { id: institution.id },
        data: { crawlStatus: "RUNNING" },
      });

      const instStart = new Date();
      await log(job.id, "INFO", `Starting crawl for ${institution.name}`, { slug: institution.slug });

      let instFound = 0;
      let instAdded = 0;
      let instUpdated = 0;
      let instSkipped = 0;

      try {
        // 1. Fetch content from target page
        const html = await fetchPageContent(config.crawlUrl, config.slug);

        // 2. Parse raw opportunity details
        const rawOpps = config.parse(html);
        await log(job.id, "INFO", `Scraped ${rawOpps.length} opportunities from page`, { slug: institution.slug });

        for (const item of rawOpps) {
          instFound++;
          totalFound++;

          // 3. Normalization (Deterministic pattern match)
          let normalized = parseFieldsDeterminstically(item.title, item.description);

          // 4. optional Gemini fallback AI parser
          const needsFallback = !normalized.minCgpa || normalized.branches.length <= 1;
          if (needsFallback && process.env.GEMINI_API_KEY) {
            normalized = await parseFieldsWithGemini(item.title, item.description, normalized);
          }

          // 5. Stable hashing based on institution ID and posting URL
          const sourceHash = createHash("sha256")
            .update(`${institution.id}|${item.url.toLowerCase().trim()}`)
            .digest("hex")
            .slice(0, 32);

          const existing = await db.opportunity.findUnique({
            where: { sourceHash },
          });

          const type = classifyOpportunityType(item.title, item.description);
          const researchArea = classifyResearchArea(item.title, item.description);
          const fundingAmount = getFundingAmountLabel(normalized.funding, institution.country);
          const deadline = item.deadline ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

          if (existing) {
            // Update mutable fields in database
            await db.opportunity.update({
              where: { id: existing.id },
              data: {
                title: item.title,
                description: item.description,
                minDegree: normalized.minDegree,
                maxDegree: normalized.maxDegree,
                branches: JSON.stringify(normalized.branches),
                minCgpa: normalized.minCgpa,
                funding: normalized.funding,
                fundingAmount,
                mode: normalized.mode,
                deadline,
                crawledAt: new Date(),
              },
            });
            instUpdated++;
            totalUpdated++;
            continue;
          }

          // Soft duplicates check (same title + institution)
          const softDupe = await db.opportunity.findFirst({
            where: {
              institutionId: institution.id,
              title: item.title,
            },
          });

          if (softDupe) {
            instSkipped++;
            totalSkipped++;
            continue;
          }

          // Generate unique slug
          const slugBase = slugify(`${institution.shortName ?? institution.slug}-${item.title}`);
          const slug = uniqueSlug(slugBase, hashString(sourceHash).slice(0, 6));

          // Save opportunity record
          await db.opportunity.create({
            data: {
              title: item.title,
              type,
              description: item.description,
              researchArea,
              eligibilityText: `Requires ${normalized.minDegree ? normalized.minDegree.toLowerCase() : "bachelors"} degree in ${normalized.branches.join(", ")}.${normalized.minCgpa ? ` Minimum CGPA requirement: ${normalized.minCgpa}/10.` : ""}`,
              minDegree: normalized.minDegree,
              maxDegree: normalized.maxDegree,
              branches: JSON.stringify(normalized.branches),
              minCgpa: normalized.minCgpa,
              minYear: type === "RESEARCH_INTERNSHIP" ? 2 : null,
              maxYear: type === "RESEARCH_INTERNSHIP" ? 4 : null,
              funding: normalized.funding,
              fundingAmount,
              location: `${institution.city}, ${institution.country}`,
              country: institution.country,
              state: institution.state,
              mode: normalized.mode,
              duration: type === "RESEARCH_INTERNSHIP" ? "8–12 weeks" : "3 months",
              durationWeeks: 10,
              deadline,
              startDate: new Date(deadline.getTime() + 30 * 24 * 60 * 60 * 1000),
              officialUrl: item.url,
              applicationUrl: item.url,
              verified: true,
              status: "ACTIVE",
              popularityScore: 6.0,
              sourceUrl: config.crawlUrl,
              sourceHash,
              crawledAt: new Date(),
              publishedAt: new Date(),
              institutionId: institution.id,
              slug,
            },
          });

          instAdded++;
          totalAdded++;
        }

        // Calculate and update active opportunity count
        const count = await db.opportunity.count({
          where: { institutionId: institution.id, status: "ACTIVE" },
        });

        await db.institution.update({
          where: { id: institution.id },
          data: {
            crawlStatus: "SUCCESS",
            lastCrawledAt: new Date(),
            opportunityCount: count,
          },
        });

        const instEnd = new Date();
        await log(job.id, "INFO", `Completed crawl for ${institution.name}`, {
          slug: institution.slug,
          success: true,
          startTime: instStart.toISOString(),
          endTime: instEnd.toISOString(),
          itemsFound: instFound,
          itemsAdded: instAdded,
          itemsUpdated: instUpdated,
          itemsSkipped: instSkipped,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown scraping error";
        const instEnd = new Date();

        await db.institution.update({
          where: { id: institution.id },
          data: { crawlStatus: "FAILED", lastCrawledAt: new Date() },
        });

        await log(job.id, "ERROR", `Scraper failed for ${institution.name}: ${message}`, {
          slug: institution.slug,
          success: false,
          startTime: instStart.toISOString(),
          endTime: instEnd.toISOString(),
          errorMessage: message,
          itemsFound: instFound,
          itemsAdded: instAdded,
          itemsUpdated: instUpdated,
          itemsSkipped: instSkipped,
        });

        // Continue execution to remaining institutions
      }
    }

    // Close expired ones
    const closed = await db.opportunity.updateMany({
      where: {
        status: "ACTIVE",
        deadline: { lt: new Date() },
      },
      data: { status: "CLOSED" },
    });
    await log(job.id, "INFO", `Marked ${closed.count} opportunities as CLOSED`);

    await db.crawlerJob.update({
      where: { id: job.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        itemsFound: totalFound,
        itemsAdded: totalAdded,
        itemsUpdated: totalUpdated,
        itemsSkipped: totalSkipped,
      },
    });

    await log(job.id, "INFO", "Crawler job finished successfully", {
      totalFound,
      totalAdded,
      totalUpdated,
      totalSkipped,
    });

    return {
      jobId: job.id,
      status: "SUCCESS",
      itemsFound: totalFound,
      itemsAdded: totalAdded,
      itemsUpdated: totalUpdated,
      itemsSkipped: totalSkipped,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fatal crawler job error";
    await log(job.id, "ERROR", `Crawler run failed: ${message}`);
    await db.crawlerJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: message,
      },
    });
    return {
      jobId: job.id,
      status: "FAILED",
      itemsFound: totalFound,
      itemsAdded: totalAdded,
      itemsUpdated: totalUpdated,
      itemsSkipped: totalSkipped,
      errorMessage: message,
    };
  }
}

export async function getCrawlerHealth() {
  const recent = await db.crawlerJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const running = recent.filter((j) => j.status === "RUNNING").length;
  const failed = recent.filter((j) => j.status === "FAILED").length;
  const success = recent.filter((j) => j.status === "SUCCESS").length;
  const lastSuccess = recent.find((j) => j.status === "SUCCESS");

  return {
    running,
    failed,
    success,
    lastSuccessAt: lastSuccess?.finishedAt ?? null,
    recentJobs: recent,
  };
}
