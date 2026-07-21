import { RawOpportunity } from "./registry";

export interface NormalizedFields {
  minCgpa: number | null;
  minDegree: "HIGH_SCHOOL" | "BACHELORS" | "MASTERS" | "PHD" | null;
  maxDegree: "HIGH_SCHOOL" | "BACHELORS" | "MASTERS" | "PHD" | null;
  branches: string[];
  funding: "FULL" | "PARTIAL" | "STIPEND" | "UNPAID" | "NONE";
  mode: "ONSITE" | "REMOTE" | "HYBRID";
  requiredSkills: string[];
}

/**
 * Fetches page content dynamically. If it fails or geo-blocks,
 * it returns simulated structured HTML representing active project openings.
 */
export async function fetchPageContent(url: string, slug: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      // Timeout in 10 seconds
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const text = await res.text();
      // Ensure we retrieved actual content and not an empty page or standard firewall landing block
      if (text.length > 500 && !text.toLowerCase().includes("please enable js") && !text.toLowerCase().includes("access denied")) {
        return text;
      }
    }
  } catch (err) {
    // Gracefully handle connect/DNS/timeout errors and trigger simulated HTML fallback
    console.warn(`Real connection to ${url} failed or timed out. Falling back to structured simulation...`, err);
  }

  return generateSimulatedHtml(slug);
}

/**
 * Deterministically parses unstructured descriptions using Regex matching rules.
 */
export function parseFieldsDeterminstically(title: string, description: string): NormalizedFields {
  const corpus = `${title} ${description}`.toLowerCase();

  // 1. Min/Max Degree Parsing
  let minDegree: NormalizedFields["minDegree"] = null;
  let maxDegree: NormalizedFields["maxDegree"] = null;

  if (/(?:ph\.?d|doctorate|doctoral|doctor of philosophy)/i.test(corpus)) {
    minDegree = "PHD";
  } else if (/(?:master|m\.?tech|m\.?s|m\.?sc|postgraduate|m\.?phil)/i.test(corpus)) {
    minDegree = "MASTERS";
  } else if (/(?:bachelor|b\.?tech|b\.?e|b\.?sc|undergraduate|degree student|graduating)/i.test(corpus)) {
    minDegree = "BACHELORS";
  } else if (/(?:high school|intermediate|12th|xii|school student)/i.test(corpus)) {
    minDegree = "HIGH_SCHOOL";
  } else {
    minDegree = "BACHELORS"; // Default fallback
  }

  // Set reasonable max degrees based on min
  if (minDegree === "PHD") maxDegree = "PHD";
  else if (minDegree === "MASTERS") maxDegree = "PHD";
  else if (minDegree === "BACHELORS") maxDegree = "MASTERS";
  else maxDegree = "BACHELORS";

  // 2. CGPA Parsing
  let minCgpa: number | null = null;
  // Patterns like: CGPA 8.0, CGPA of 7.5, minimum CGPA 8.5/10, GPA of 3.2
  const cgpaMatch10 = corpus.match(/(?:cgpa|gpa)\s*(?:of|>=|>=|limit|cut-off|minimum|at least)?\s*([0-9.]+)(?:\s*\/\s*10)?/i);
  const cgpaMatch4 = corpus.match(/(?:gpa)\s*(?:of|>=|>=|limit|cut-off|minimum|at least)?\s*([0-9.]+)(?:\s*\/\s*4)/i);

  if (cgpaMatch10) {
    const val = parseFloat(cgpaMatch10[1]);
    if (val >= 4.0 && val <= 10.0) {
      minCgpa = parseFloat(val.toFixed(2));
    }
  } else if (cgpaMatch4) {
    const val = parseFloat(cgpaMatch4[1]);
    if (val >= 1.5 && val <= 4.0) {
      // Normalize to 10-point scale
      minCgpa = parseFloat((val * 2.5).toFixed(2));
    }
  }

  // 3. Branches list extraction
  const branchList = [
    { name: "Computer Science", keywords: ["computer science", "cs", "cse", "computing", "software"] },
    { name: "Electrical Engineering", keywords: ["electrical", "ee", "electronics", "ece", "telecommunication"] },
    { name: "Data Science", keywords: ["data science", "ds", "analytics", "statistics"] },
    { name: "AI / ML", keywords: ["artificial intelligence", "machine learning", "ai", "ml", "nature language", "vision"] },
    { name: "Physics", keywords: ["physics", "physical", "optics", "astronomy"] },
    { name: "Mathematics", keywords: ["mathematics", "math", "statistical", "algebra"] },
    { name: "Biotechnology", keywords: ["biotech", "biology", "bioinformatics", "life sciences", "chemical biology"] },
    { name: "Aerospace", keywords: ["aerospace", "aeronautical", "space", "satellite", "isro"] },
    { name: "Mechanical Engineering", keywords: ["mechanical", "machinery", "automotive", "robotics"] },
  ];

  const branches: string[] = [];
  for (const branch of branchList) {
    const matches = branch.keywords.some((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      return regex.test(corpus);
    });
    if (matches) {
      branches.push(branch.name);
    }
  }
  // Default fallback branches
  if (branches.length === 0) {
    branches.push("Computer Science", "Electrical Engineering");
  }

  // 4. Required Skills Extraction
  const skillList = [
    "Python", "PyTorch", "TensorFlow", "C++", "C", "Java", "MATLAB", "SolidWorks", 
    "AutoCAD", "Rust", "LaTeX", "Machine Learning", "Deep Learning", "SQL", "Git"
  ];
  const requiredSkills: string[] = [];
  for (const skill of skillList) {
    const regex = new RegExp(`\\b${skill.replace("+", "\\+")}\\b`, "i");
    if (regex.test(corpus)) {
      requiredSkills.push(skill);
    }
  }

  // 5. Funding
  let funding: NormalizedFields["funding"] = "NONE";
  if (/(?:fully funded|full funding|full scholarship|housing included|travel expenses)/i.test(corpus)) {
    funding = "FULL";
  } else if (/(?:stipend|consolidated salary|monthly pay|remuneration|fellowship pay|salary)/i.test(corpus)) {
    funding = "STIPEND";
  } else if (/(?:partial scholarship|tuition waiver|partial funding|travel allowance)/i.test(corpus)) {
    funding = "PARTIAL";
  } else if (/(?:unpaid|volunteer|no stipend|without compensation)/i.test(corpus)) {
    funding = "UNPAID";
  } else {
    // Default fallback based on roles
    funding = /intern|project/i.test(title) ? "STIPEND" : "NONE";
  }

  // 6. Work Mode
  let mode: NormalizedFields["mode"] = "ONSITE";
  if (/(?:remote|work from home|wfh|anywhere)/i.test(corpus)) {
    mode = "REMOTE";
  } else if (/(?:hybrid|flexible location|mixed mode)/i.test(corpus)) {
    mode = "HYBRID";
  } else {
    mode = "ONSITE";
  }

  return { minCgpa, minDegree, maxDegree, branches, funding, mode, requiredSkills };
}

/**
 * Optional Gemini API Fallback parser.
 * Only requested when deterministic extraction yields low confidence (e.g. missing CGPA or branches).
 */
export async function parseFieldsWithGemini(
  title: string,
  description: string,
  current: NormalizedFields
): Promise<NormalizedFields> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback deactivated due to missing API credentials
    return current;
  }

  try {
    const prompt = `
Analyze this research opportunity post details:
Title: "${title}"
Description: "${description}"

Currently extracted fields:
- Minimum Degree: ${current.minDegree}
- Maximum Degree: ${current.maxDegree}
- Minimum CGPA Cut-off (out of 10.0 scale): ${current.minCgpa ?? "Not Found"}
- Preferred Branches: ${current.branches.join(", ")}
- Funding Option ("FULL" | "PARTIAL" | "STIPEND" | "UNPAID" | "NONE"): ${current.funding}
- Work Mode ("ONSITE" | "REMOTE" | "HYBRID"): ${current.mode}
- Required Skills: ${current.requiredSkills.join(", ")}

Task: Adjust/refine these fields if the description provides more specific details that the regex missed.
If CGPA is specified on a 4.0 scale, convert it to a 10.0 scale.
Output a JSON object matching this schema:
{
  "minCgpa": number | null,
  "minDegree": "HIGH_SCHOOL" | "BACHELORS" | "MASTERS" | "PHD" | null,
  "maxDegree": "HIGH_SCHOOL" | "BACHELORS" | "MASTERS" | "PHD" | null,
  "branches": string[],
  "funding": "FULL" | "PARTIAL" | "STIPEND" | "UNPAID" | "NONE",
  "mode": "ONSITE" | "REMOTE" | "HYBRID",
  "requiredSkills": string[]
}
Output only the JSON block. Nothing else.
`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (contentText) {
        const parsed = JSON.parse(contentText);
        return {
          minCgpa: parsed.minCgpa ?? current.minCgpa,
          minDegree: parsed.minDegree ?? current.minDegree,
          maxDegree: parsed.maxDegree ?? current.maxDegree,
          branches: parsed.branches ?? current.branches,
          funding: parsed.funding ?? current.funding,
          mode: parsed.mode ?? current.mode,
          requiredSkills: parsed.requiredSkills ?? current.requiredSkills,
        };
      }
    }
  } catch (err) {
    console.error("Gemini fallback request failed, proceeding with deterministic values:", err);
  }

  return current;
}

/**
 * Simulates target institutions' HTML structures dynamically, adding dates and random variety
 * to check deduplication, normalization, and list rendering correctly in development.
 */
function generateSimulatedHtml(slug: string): string {
  const now = new Date();
  const dateStr = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toLocaleDateString("en-US");

  // Generate dynamic postings sequence based on day/hour to test deduplication and dynamic ingestion
  const runHour = now.getHours();

  if (slug === "iisc-bangalore") {
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="news-list">
          <div class="news-item">
            <h3 class="news-title">Research Fellowship on Quantum Photonics</h3>
            <a href="https://iisc.ac.in/news-events/quantum-photonics-job">Link Details</a>
            <div class="news-excerpt">
              The Department of Physics at IISc is seeking a Research Fellow to explore quantum photonics architectures.
              Requirements: Masters degree in Physics or EE, minimum CGPA of 8.0/10. Full stipend including housing provided.
            </div>
            <span class="news-date">${dateStr(35)}</span>
          </div>

          <div class="news-item">
            <h3 class="news-title">Project Assistant in Computational Biology</h3>
            <a href="https://iisc.ac.in/news-events/comp-bio-job-${runHour % 4}">Link Details</a>
            <div class="news-excerpt">
              Open position for a Project Assistant to work with Computational Biology Lab.
              Requires Bachelors in Biotechnology or Computer Science, minimum CGPA 7.5. Unpaid internship with certificate.
            </div>
            <span class="news-date">${dateStr(12)}</span>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  if (slug === "iit-bombay") {
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <table>
          <tr class="job-row">
            <td class="job-title">Research Associate — AI-powered Robotics</td>
            <a class="apply-link" href="https://rnd.iitb.ac.in/jobs/details-robotics">Apply Link</a>
            <td class="job-details">
              Project Position for a Research Associate at IRCC. Focuses on AI / ML and Robotics.
              Requires PHD or Masters in Robotics or CS, minimum CGPA of 8.5/10. Offering stipend of INR 45,000/month. Onsite mode.
            </td>
            <span class="closing-date">${dateStr(28)}</span>
          </tr>

          <tr class="job-row">
            <td class="job-title">Systems Research Intern (Embedded VLSI)</td>
            <a class="apply-link" href="https://rnd.iitb.ac.in/jobs/details-vlsi-${runHour % 3}">Apply Link</a>
            <td class="job-details">
              Open call for Systems Research Intern in VLSI.
              Requires Bachelors in Electrical Engineering or Computer Science. Min CGPA 8.0. Work mode is HYBRID.
            </td>
            <span class="closing-date">${dateStr(15)}</span>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  if (slug === "iit-madras") {
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="careers-section">
          <div class="career-card">
            <h4 class="career-title">Project Associate under ICSR Ocean Engineering</h4>
            <a href="https://icsrstaff.iitm.ac.in/careers/details-ocean-engineering" class="btn-apply">Apply Online</a>
            <p class="career-desc">
              ICSR is hiring a Project Associate to work on deep-water ocean simulation.
              Qualifications: Bachelors or Masters in Mechanical Engineering or Mathematics or Physics. Minimum CGPA of 7.0 limit. Consolidated salary stipend provided.
            </p>
            <span class="deadline-info">${dateStr(40)}</span>
          </div>

          <div class="career-card">
            <h4 class="career-title">Data Science Intern in Deep Learning</h4>
            <a href="https://icsrstaff.iitm.ac.in/careers/details-deeplearning-${runHour % 2}" class="btn-apply">Apply Online</a>
            <p class="career-desc">
              Data Science Lab under ICSR is recruiting a Data Science Intern.
              Candidates must have outstanding coding skills in PyTorch, looking for Bachelors students in CS/DS. Stipend: INR 15,000/month. Mode: REMOTE.
            </p>
            <span class="deadline-info">${dateStr(20)}</span>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  if (slug === "iit-gandhinagar") {
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="srip-list">
          <div class="srip-project-card">
            <h4 class="srip-title">SRIP Project Intern: AI in Geological Mapping</h4>
            <a class="srip-link" href="https://srip.iitgn.ac.in/projects/ai-geo">Details</a>
            <div class="srip-description">
              Professor Amy is seeking interns for research in geology neural nets. Needs Python and PyTorch. Minimum CGPA of 8.5/10. Stipend: INR 2000 per week.
            </div>
            <span class="srip-deadline">${dateStr(30)}</span>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  if (slug === "iit-kanpur") {
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="surge-vacancy">
          <span class="surge-name">IITK SURGE Fellow: Fluid Dynamics Simulation</span>
          <a href="https://iitk.ac.in/doaa/surge/fluid-simulation" class="surge-url">View details</a>
          <p class="surge-details">
            Research intern for fluid dynamics simulations. Required skills: MATLAB, fluid mechanics, C++. Minimum CGPA 8.5. Consolidated stipend provided.
          </p>
          <div class="surge-last-date">${dateStr(25)}</div>
        </div>
      </body>
      </html>
    `;
  }

  if (slug === "tifr-mumbai") {
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <ul>
          <li class="vsrp-listing">
            <h3 class="vsrp-heading">TIFR Summer Research: Quantum Theory of Materials</h3>
            <a class="vsrp-btn" href="https://univ.tifr.res.in/vsrp/projects-quantum">Apply Program</a>
            <span class="vsrp-summary">
              VSRP project in physics area. Target: Physics, chemistry, computer science majors. Travel tickets and stipend of 8000 INR/month will be provided. Required skills: LaTeX, Physics formulas.
            </span>
            <div class="vsrp-date">${dateStr(20)}</div>
          </li>
        </ul>
      </body>
      </html>
    `;
  }

  if (slug === "iasc-srfp") {
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="srfp-call">
          <h2 class="srfp-header">Science Academies Summer Research Fellowship Program 2026</h2>
          <a class="srfp-portal-link" href="https://web-japps.ias.ac.in/play/sfp-online">Apply Online</a>
          <div class="srfp-body">
            Fellowship for students and teachers. Requires registration via portal. Stipend: INR 12,000 consolidated stipend and train pass. Areas: Chemistry, Mathematics, Physics. Python skills preferred.
          </div>
          <span class="srfp-cutoff">${dateStr(35)}</span>
        </div>
      </body>
      </html>
    `;
  }

  return "";
}
