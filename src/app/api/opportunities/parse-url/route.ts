import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { parseFieldsDeterminstically, parseFieldsWithGemini } from "@/lib/crawler/parser";
import * as cheerio from "cheerio";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const { url } = body;
    if (!url) return jsonError("URL is required", 400);

    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let urlObj: URL;
    try {
      urlObj = new URL(cleanUrl);
    } catch {
      return jsonError("Invalid URL format", 400);
    }

    console.log(`🔍 Scraping metadata from: ${cleanUrl}`);

    // Fetch page text content
    const res = await fetch(cleanUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return jsonError(`Failed to fetch page. HTTP status ${res.status}`, 400);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract Title candidates
    const pageTitle =
      $("title").text().trim() ||
      $("h1").first().text().trim() ||
      "Spotted Opportunity";

    // Extract raw text blocks
    const paragraphText = $("p, li, .description, .content, #main, article")
      .map((_, el) => $(el).text())
      .get()
      .join(" ")
      .slice(0, 4000)
      .replace(/\s+/g, " ");

    const corpus = paragraphText.length > 100 
      ? paragraphText 
      : $.text().slice(0, 5000).replace(/\s+/g, " ");

    // Run deterministic extraction rules
    const normalized = parseFieldsDeterminstically(pageTitle, corpus);

    // Run optional Gemini AI refinement
    const refined = await parseFieldsWithGemini(pageTitle, corpus, normalized);

    // Attempt to match hostname to an existing institution in db
    const host = urlObj.hostname.toLowerCase();
    const allInstitutions = await db.institution.findMany({
      select: { id: true, name: true, website: true },
    });

    let matchedInstitutionName = "";
    let matchedInstitutionCountry = "";

    const matchedInst = allInstitutions.find((inst) => {
      if (!inst.website) return false;
      try {
        const instHost = new URL(inst.website).hostname.toLowerCase();
        return (
          host === instHost ||
          host.endsWith("." + instHost) ||
          instHost.endsWith("." + host)
        );
      } catch {
        return false;
      }
    });

    if (matchedInst) {
      matchedInstitutionName = matchedInst.name;
    } else {
      // Guess country or institution name roughly from URL or Title keywords
      if (host.endsWith(".edu")) {
        matchedInstitutionCountry = "United States";
      } else if (host.endsWith(".ac.in") || host.endsWith(".in")) {
        matchedInstitutionCountry = "India";
      } else if (host.endsWith(".ac.uk") || host.endsWith(".uk")) {
        matchedInstitutionCountry = "United Kingdom";
      }
    }

    // Return parsed properties to front-end
    return jsonOk({
      title: pageTitle.slice(0, 100),
      description: corpus.slice(0, 1000).trim(),
      institutionName: matchedInstitutionName,
      institutionCountry: matchedInstitutionCountry,
      minCgpa: refined.minCgpa,
      minDegree: refined.minDegree,
      maxDegree: refined.maxDegree,
      branches: refined.branches,
      funding: refined.funding,
      mode: refined.mode,
      officialUrl: cleanUrl,
    });
  } catch (err) {
    console.error("Scraper parse error:", err);
    return handleApiError(err);
  }
}
