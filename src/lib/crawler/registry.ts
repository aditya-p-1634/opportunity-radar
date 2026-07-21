import { OpportunityInput } from "../engines/eligibility";
import { RETRIEVAL_PROFILES } from "./retriever";

export interface RawOpportunity {
  title: string;
  url: string;
  description: string;
  deadline?: Date | null;
  type?: string;
}

export interface InstitutionScraperConfig {
  slug: string;
  name: string;
  type: string;
  country: string;
  city?: string;
  crawlUrl: string;
  crawlType: "html" | "rss";
  retrievalProfile: keyof typeof RETRIEVAL_PROFILES;
  cookieUrl?: string; // Optional cookie pre-flight endpoint
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
    name: "Indian Institute of Science",
    type: "UNIVERSITY",
    country: "India",
    city: "Bangalore",
    crawlUrl: "https://iisc.ac.in/news-events/",
    crawlType: "html",
    retrievalProfile: "DEFAULT_STATIC",
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
    name: "IIT Bombay",
    type: "UNIVERSITY",
    country: "India",
    city: "Mumbai",
    crawlUrl: "https://www.ircc.iitb.ac.in/IRCC-Webpage/rnd/JobOpportunities.jsp",
    crawlType: "html",
    retrievalProfile: "DEFAULT_STATIC",
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
    name: "IIT Madras",
    type: "UNIVERSITY",
    country: "India",
    city: "Chennai",
    crawlUrl: "https://icsrstaff.iitm.ac.in/careers/",
    crawlType: "html",
    retrievalProfile: "DEFAULT_STATIC",
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
  "iit-gandhinagar": {
    slug: "iit-gandhinagar",
    name: "IIT Gandhinagar",
    type: "UNIVERSITY",
    country: "India",
    city: "Gandhinagar",
    crawlUrl: "https://srip.iitgn.ac.in/",
    crawlType: "html",
    retrievalProfile: "DEFAULT_STATIC",
    parse: (content: string) => {
      return parseHtmlRegex(
        content,
        /<div class=["']srip-project-card["']>[\s\S]*?<\/div>/gi,
        {
          title: /<h4 class=["']srip-title["']>([\s\S]*?)<\/h4>/i,
          url: /<a [^>]*href=["']([\s\S]*?)["']/i,
          description: /<div class=["']srip-description["']>([\s\S]*?)<\/div>/i,
          deadline: /<span class=["']srip-deadline["']>([\s\S]*?)<\/span>/i,
        }
      );
    },
  },
  "iit-kanpur": {
    slug: "iit-kanpur",
    name: "IIT Kanpur",
    type: "UNIVERSITY",
    country: "India",
    city: "Kanpur",
    crawlUrl: "https://surge.iitk.ac.in/",
    crawlType: "html",
    retrievalProfile: "LEGACY_STATIC",
    parse: (content: string) => {
      // Look for the active SURGE 2026 header card in the homepage
      const cardMatch = content.match(/<div class=["']course-card highlight["']>([\s\S]*?)<\/div>/i) ||
                        content.match(/<div class=["']course-card["']>[\s\S]*?SURGE[\s\S]*?<\/div>/i);
      
      if (!cardMatch) return [];

      const cardHtml = cardMatch[1] || cardMatch[0];
      const titleMatch = cardHtml.match(/<h3>([\s\S]*?)<\/h3>/i);
      const title = titleMatch ? `IIT Kanpur ${titleMatch[1].trim()}` : "IIT Kanpur SURGE Program";
      
      // Capture description and registration details
      const descMatch = cardHtml.match(/<p>([\s\S]*?)<\/p>/i);
      let description = descMatch ? descMatch[1].trim() : "Students-Undergraduate Research Graduate Excellence Program";
      
      // Look for registration block to extract deadline
      const regMatch = content.match(/<h3>Registration<\/h3>([\s\S]*?)<\/div>/i) ||
                       content.match(/<h3>Registration<\/h3>([\s\S]*?)<\/p>/i);
      let deadlineStr = "";
      if (regMatch) {
         const regText = regMatch[1];
         // extract deadline date like "February 22, 2026"
         const dateMatch = regText.match(/till\s+([A-Za-z]+\s+\d{1,2},\s*\d{4})/i) ||
                           regText.match(/till\s+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+,\s*\d{4})/i) ||
                           regText.match(/February\s+22,\s+2026/i);
         if (dateMatch) {
           deadlineStr = dateMatch[1] || dateMatch[0];
         }
         description += ` | Registration: ${regText.replace(/<[^>]*>/g, " ").trim()}`;
      }

      // Add About text to description
      const aboutMatch = content.match(/<h3 class=["']dark["']>About SURGE Program<\/h3>([\s\S]*?)<\/div>/i);
      if (aboutMatch) {
         description += ` | About: ${aboutMatch[1].replace(/<[^>]*>/g, " ").trim()}`;
      }

      // parse deadline date
      let deadline: Date | null = null;
      if (deadlineStr) {
         const parsedDate = new Date(deadlineStr);
         if (!isNaN(parsedDate.getTime())) {
           deadline = parsedDate;
         }
      }
      if (!deadline) {
         deadline = new Date("2026-02-22T23:59:59Z"); // fallback to standard surge deadline
      }

      return [{
         title,
         url: "https://surge.iitk.ac.in/",
         description: description.replace(/\s+/g, " ").slice(0, 1000),
         deadline
      }];
    },
  },
  "tifr-mumbai": {
    slug: "tifr-mumbai",
    name: "Tata Institute of Fundamental Research",
    type: "RESEARCH_INSTITUTE",
    country: "India",
    city: "Hyderabad",
    crawlUrl: "https://www.tifrh.res.in/academics/vsrp/",
    crawlType: "html",
    retrievalProfile: "DEFAULT_STATIC",
    parse: (content: string) => {
      function cleanText(html: string): string {
        return html
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }

      const deadlineMatch = content.match(/Last date to submit applications:\s*<strong>([\s\S]*?)<\/strong>/i) ||
                            content.match(/Last date to submit applications:[\s\S]*?(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
      let deadlineStr = "";
      if (deadlineMatch) {
        deadlineStr = cleanText(deadlineMatch[1]);
      }

      let deadline: Date | null = null;
      if (deadlineStr) {
        const rawClean = deadlineStr.replace(/,\s*\d{1,2}:\d{2}\s*hrs\.?/gi, "").trim();
        const parsedDate = new Date(rawClean);
        if (!isNaN(parsedDate.getTime())) {
          deadline = parsedDate;
        }
      }

      const eligibilityMatch = content.match(/<span>Eligibility<\/span>[\s\S]*?<div class=["']et_pb_blurb_description["']>([\s\S]*?)<\/div>/i);
      const stipendMatch = content.match(/<span>Stipend\s*\/\s*Accommodation<\/span>[\s\S]*?<div class=["']et_pb_blurb_description["']>([\s\S]*?)<\/div>/i);
      
      let description = "Visiting Students Research Programme (VSRP) at TIFR Hyderabad.";
      if (eligibilityMatch) {
        description += ` | Eligibility: ${cleanText(eligibilityMatch[1])}`;
      }
      if (stipendMatch) {
        description += ` | Stipend: ${cleanText(stipendMatch[1])}`;
      }

      return [{
        title: "TIFR Hyderabad Visiting Students Research Programme (VSRP)",
        url: "https://www.tifrh.res.in/academics/vsrp/",
        description: description.replace(/\s+/g, " ").slice(0, 1000),
        deadline,
      }];
    },
  },
  "iasc-srfp": {
    slug: "iasc-srfp",
    name: "Indian Academy of Sciences",
    type: "RESEARCH_INSTITUTE",
    country: "India",
    city: "Bangalore",
    crawlUrl: "https://webjapps.ias.ac.in/SEP/SummerFellowships.jsp",
    crawlType: "html",
    retrievalProfile: "DEFAULT_STATIC",
    parse: (content: string) => {
      function cleanText(html: string): string {
        return html
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }

      const introMatch = content.match(/<b>Introduction:<\/b><br\/>([\s\S]*?)<\/p>/i);
      let description = "Summer Fellowships are awarded to bright students and motivated teachers to work with Fellows of the Academy on research-oriented projects.";
      if (introMatch) {
        description = cleanText(introMatch[1]);
      }

      return [{
        title: "Science Academies' Summer Research Fellowship Programme (SRFP)",
        url: "https://webjapps.ias.ac.in/SEP/SummerFellowships.jsp",
        description: description.replace(/\s+/g, " ").slice(0, 1000),
        deadline: null,
      }];
    },
  },
};
