import { OpportunityInput } from "../engines/eligibility";

export interface RawOpportunity {
  title: string;
  url: string;
  description: string;
  deadline?: Date | null;
}

export interface InstitutionScraperConfig {
  slug: string;
  crawlUrl: string;
  crawlType: "html" | "rss";
  // Custom parser function to extract raw opportunities from the fetched resource page
  parse: (content: string) => RawOpportunity[];
}

/**
 * Helper to extract fields using regular expressions from HTML container blocks.
 */
export function parseHtmlRegex(
  html: string,
  containerPattern: RegExp,
  fields: {
    title: RegExp;
    url: RegExp;
    description?: RegExp;
    deadline?: RegExp;
  }
): RawOpportunity[] {
  const items: RawOpportunity[] = [];
  let match;

  // Make sure global patterns are reset
  const pattern = new RegExp(containerPattern.source, containerPattern.flags.includes("g") ? containerPattern.flags : containerPattern.flags + "g");
  pattern.lastIndex = 0;

  while ((match = pattern.exec(html)) !== null) {
    const block = match[0];

    const titleMatch = block.match(fields.title);
    const urlMatch = block.match(fields.url);
    const descMatch = fields.description ? block.match(fields.description) : null;
    const deadlineMatch = fields.deadline ? block.match(fields.deadline) : null;

    if (titleMatch && urlMatch) {
      // Clean tags from title / description
      const title = titleMatch[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const url = urlMatch[1].replace(/["']/g, "").trim();
      const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";

      let deadline: Date | null = null;
      if (deadlineMatch) {
        const dateStr = deadlineMatch[1].replace(/<[^>]*>/g, " ").trim();
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          deadline = parsedDate;
        }
      }

      items.push({ title, url, description, deadline });
    }
  }

  return items;
}

export const CRAWLER_REGISTRY: Record<string, InstitutionScraperConfig> = {
  "iisc-bangalore": {
    slug: "iisc-bangalore",
    crawlUrl: "https://iisc.ac.in/news-events/",
    crawlType: "html",
    parse: (content: string) => {
      // IISc lists projects in blocks like <div class="event-card">...</div> or <div class="news-item">...</div>
      return parseHtmlRegex(
        content,
        /<div class=["']news-item["']>[\s\S]*?<\/div>/gi,
        {
          title: /<h3 class=["']news-title["']>([\s\S]*?)<\/h3>/i,
          url: /<a href=["']([\s\S]*?)["']/i,
          description: /<div class=["']news-excerpt["']>([\s\S]*?)<\/div>/i,
          deadline: /<span class=["']news-date["']>([\s\S]*?)<\/span>/i,
        }
      );
    },
  },
  "iit-bombay": {
    slug: "iit-bombay",
    crawlUrl: "https://www.ircc.iitb.ac.in/IRCC-Webpage/rnd/JobOpportunities.jsp",
    crawlType: "html",
    parse: (content: string) => {
      // IIT Bombay lists opportunities in table rows or listing blocks
      return parseHtmlRegex(
        content,
        /<tr class=["']job-row["']>[\s\S]*?<\/tr>/gi,
        {
          title: /<td class=["']job-title["']>([\s\S]*?)<\/td>/i,
          url: /<a class=["']apply-link["'] href=["']([\s\S]*?)["']/i,
          description: /<td class=["']job-details["']>([\s\S]*?)<\/td>/i,
          deadline: /<span class=["']closing-date["']>([\s\S]*?)<\/span>/i,
        }
      );
    },
  },
  "iit-madras": {
    slug: "iit-madras",
    crawlUrl: "https://icsrstaff.iitm.ac.in/careers/",
    crawlType: "html",
    parse: (content: string) => {
      // IIT Madras lists careers in career cards
      return parseHtmlRegex(
        content,
        /<div class=["']career-card["']>[\s\S]*?<\/div>/gi,
        {
          title: /<h4 class=["']career-title["']>([\s\S]*?)<\/h4>/i,
          url: /<a href=["']([\s\S]*?)["'] class=["']btn-apply["']/i,
          description: /<p class=["']career-desc["']>([\s\S]*?)<\/p>/i,
          deadline: /<span class=["']deadline-info["']>([\s\S]*?)<\/span>/i,
        }
      );
    },
  },
};
