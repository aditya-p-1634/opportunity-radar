import { Agent } from "undici";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export type RetrievalStrategy = "static" | "cookie" | "browser" | "pdf";
export type TransportPolicy = "STRICT" | "DEFAULT" | "LEGACY";

export interface RetrievalProfile {
  strategy: RetrievalStrategy;
  transportPolicy: TransportPolicy;
}

export const RETRIEVAL_PROFILES: Record<string, RetrievalProfile> = {
  STRICT_STATIC: { strategy: "static", transportPolicy: "STRICT" },
  DEFAULT_STATIC: { strategy: "static", transportPolicy: "DEFAULT" },
  LEGACY_STATIC: { strategy: "static", transportPolicy: "LEGACY" },
  DEFAULT_COOKIE: { strategy: "cookie", transportPolicy: "DEFAULT" },
  BROWSER_STEALTH: { strategy: "browser", transportPolicy: "DEFAULT" },
};

export interface RetrievalOptions {
  headers?: Record<string, string>;
  transportPolicy?: TransportPolicy;
  cookieUrl?: string;
  retries?: number;
  timeoutMs?: number;
  backoffFactor?: number;
}

export interface RetrievalResult {
  content: string;
  statusCode: number;
  headers: Record<string, string>;
  finalUrl: string;
  retrievalTime: number;
  strategyUsed: RetrievalStrategy;
  error?: string;
}

function getAgentForPolicy(policy: TransportPolicy) {
  if (policy === "STRICT") {
    return undefined;
  }
  if (policy === "DEFAULT") {
    return new Agent({
      connect: {
        rejectUnauthorized: false,
      },
    });
  }
  if (policy === "LEGACY") {
    return new Agent({
      connect: {
        rejectUnauthorized: false,
        ciphers: "DEFAULT:@SECLEVEL=1",
      },
    });
  }
  return undefined;
}

async function getCookies(cookieUrl: string, agent: any, timeoutMs: number): Promise<string> {
  try {
    const res = await fetch(cookieUrl, {
      method: "GET",
      signal: AbortSignal.timeout(timeoutMs),
      dispatcher: agent,
    } as any);
    
    const setCookieHeaders = (res.headers as any).getSetCookie
      ? (res.headers as any).getSetCookie()
      : (res.headers.get("set-cookie") ? [res.headers.get("set-cookie")!] : []);

    if (setCookieHeaders.length > 0) {
      return setCookieHeaders
        .map((h: string) => h.split(";")[0])
        .filter(Boolean)
        .join("; ");
    }
  } catch (err) {
    console.warn(`Cookie handshake failed for ${cookieUrl}:`, err);
  }
  return "";
}

function getExtensionFromContentType(contentType: string | null): string {
  if (!contentType) return "html";
  const mt = contentType.toLowerCase();
  if (mt.includes("application/pdf")) return "pdf";
  if (mt.includes("application/json") || mt.includes("text/json")) return "json";
  if (mt.includes("application/xml") || mt.includes("text/xml")) return "xml";
  return "html";
}

function cacheRawContent(slug: string, content: string, ext: string) {
  try {
    const cacheDir = join(process.cwd(), "tmp", "crawler-cache");
    mkdirSync(cacheDir, { recursive: true });
    const cachePath = join(cacheDir, `${slug}.${ext}`);
    writeFileSync(cachePath, content, "utf8");
    console.log(`[Cache] Successfully cached raw content to ${cachePath}`);
  } catch (err) {
    console.error(`[Cache Error] Failed to write cache for ${slug}:`, err);
  }
}

async function retrieveWithBrowser(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<{ content: string; statusCode: number; finalUrl: string; headers: Record<string, string> }> {
  try {
    const { chromium } = require("playwright");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      extraHTTPHeaders: headers,
    });
    const page = await context.newPage();
    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: timeoutMs,
    });
    const content = await page.content();
    const statusCode = response ? response.status() : 200;
    const finalUrl = page.url();
    const respHeaders = response ? response.headers() : {};
    await browser.close();
    return { content, statusCode, finalUrl, headers: respHeaders };
  } catch (err: any) {
    console.warn("Playwright execution failed:", err.message);
    throw new Error(`Browser retrieval failed: Playwright not available or error occurred. ${err.message}`);
  }
}

export async function retrieve(
  slug: string,
  url: string,
  profileName: keyof typeof RETRIEVAL_PROFILES,
  overrides?: RetrievalOptions
): Promise<RetrievalResult> {
  const profile = RETRIEVAL_PROFILES[profileName];
  if (!profile) {
    throw new Error(`Unknown retrieval profile: ${profileName}`);
  }

  const options: RetrievalOptions = {
    transportPolicy: profile.transportPolicy,
    ...overrides,
  };

  const retries = options.retries ?? 3;
  const timeoutMs = options.timeoutMs ?? 10000;
  const backoffFactor = options.backoffFactor ?? 2;
  const transportPolicy = options.transportPolicy ?? "STRICT";
  const agent = getAgentForPolicy(transportPolicy);

  const initialHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    ...options.headers,
  };

  const startTime = Date.now();
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = 1000 * Math.pow(backoffFactor, attempt - 1);
        console.log(`[Retriever] Retrying ${slug} (attempt ${attempt}/${retries}) in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      console.log(
        `[Retriever] Fetching ${url} using strategy '${profile.strategy}', policy '${transportPolicy}' (attempt ${attempt}/${retries})`
      );

      let content = "";
      let statusCode = 200;
      let finalUrl = url;
      let headersMap: Record<string, string> = {};

      if (profile.strategy === "browser") {
        const result = await retrieveWithBrowser(url, initialHeaders, timeoutMs);
        content = result.content;
        statusCode = result.statusCode;
        finalUrl = result.finalUrl;
        headersMap = result.headers;
      } else {
        const requestHeaders = { ...initialHeaders };
        if (profile.strategy === "cookie" && options.cookieUrl) {
          const cookies = await getCookies(options.cookieUrl, agent, timeoutMs);
          if (cookies) {
            requestHeaders["Cookie"] = cookies;
          }
        }

        const fetchOptions: any = {
          method: "GET",
          headers: requestHeaders,
          signal: AbortSignal.timeout(timeoutMs),
        };
        if (agent) {
          fetchOptions.dispatcher = agent;
        }

        const res = await fetch(url, fetchOptions);
        if (!res.ok && res.status !== 304) {
          throw new Error(`HTTP Error Status: ${res.status} ${res.statusText}`);
        }

        content = await res.text();
        statusCode = res.status;
        finalUrl = res.url;
        res.headers.forEach((val, key) => {
          headersMap[key] = val;
        });
      }

      const retrievalTime = Date.now() - startTime;

      // Cache raw response on disk based on content-type
      const ext = getExtensionFromContentType(headersMap["content-type"] || null);
      cacheRawContent(slug, content, ext);

      return {
        content,
        statusCode,
        headers: headersMap,
        finalUrl,
        retrievalTime,
        strategyUsed: profile.strategy,
      };
    } catch (err: any) {
      console.warn(`[Retriever Failed] Attempt ${attempt} failed for ${slug}:`, err.message || err);
      lastError = err;
    }
  }

  const errorMsg = lastError?.message || `Failed to retrieve ${url}`;
  return {
    content: "",
    statusCode: 500,
    headers: {},
    finalUrl: url,
    retrievalTime: Date.now() - startTime,
    strategyUsed: profile.strategy,
    error: errorMsg,
  };
}
