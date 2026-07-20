/**
 * Opportunity Radar — Production Seed
 * 50+ institutions · 500+ opportunities · demo users · admin
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const db = new PrismaClient();

const INSTITUTIONS = [
  // Indian Institutes
  { name: "Indian Institute of Science", shortName: "IISc", slug: "iisc-bangalore", type: "UNIVERSITY", country: "India", state: "Karnataka", city: "Bangalore", website: "https://www.iisc.ac.in", prestige: 96, verified: true, research: ["Physics", "Computer Science", "Materials Science", "Biology"] },
  { name: "IIT Bombay", shortName: "IITB", slug: "iit-bombay", type: "UNIVERSITY", country: "India", state: "Maharashtra", city: "Mumbai", website: "https://www.iitb.ac.in", prestige: 95, verified: true, research: ["Artificial Intelligence", "Systems & Networking", "Electrical Engineering"] },
  { name: "IIT Delhi", shortName: "IITD", slug: "iit-delhi", type: "UNIVERSITY", country: "India", state: "Delhi", city: "New Delhi", website: "https://home.iitd.ac.in", prestige: 94, verified: true, research: ["Machine Learning", "Robotics", "Energy"] },
  { name: "IIT Madras", shortName: "IITM", slug: "iit-madras", type: "UNIVERSITY", country: "India", state: "Tamil Nadu", city: "Chennai", website: "https://www.iitm.ac.in", prestige: 95, verified: true, research: ["Data Science", "Ocean Engineering", "AI"] },
  { name: "IIT Kanpur", shortName: "IITK", slug: "iit-kanpur", type: "UNIVERSITY", country: "India", state: "Uttar Pradesh", city: "Kanpur", website: "https://www.iitk.ac.in", prestige: 93, verified: true, research: ["Aerospace", "Computer Science", "Materials"] },
  { name: "IIT Kharagpur", shortName: "IITKGP", slug: "iit-kharagpur", type: "UNIVERSITY", country: "India", state: "West Bengal", city: "Kharagpur", website: "https://www.iitkgp.ac.in", prestige: 92, verified: true, research: ["Mining", "CS", "Architecture"] },
  { name: "IIT Roorkee", shortName: "IITR", slug: "iit-roorkee", type: "UNIVERSITY", country: "India", state: "Uttarakhand", city: "Roorkee", website: "https://www.iitr.ac.in", prestige: 90, verified: true, research: ["Civil Engineering", "Hydrology", "Earthquake Engineering"] },
  { name: "IIT Guwahati", shortName: "IITG", slug: "iit-guwahati", type: "UNIVERSITY", country: "India", state: "Assam", city: "Guwahati", website: "https://www.iitg.ac.in", prestige: 89, verified: true, research: ["Biotechnology", "Design", "CS"] },
  { name: "IIT Hyderabad", shortName: "IITH", slug: "iit-hyderabad", type: "UNIVERSITY", country: "India", state: "Telangana", city: "Hyderabad", website: "https://www.iith.ac.in", prestige: 91, verified: true, research: ["AI", "VLSI", "Liberal Arts"] },
  { name: "IIIT Hyderabad", shortName: "IIITH", slug: "iiit-hyderabad", type: "UNIVERSITY", country: "India", state: "Telangana", city: "Hyderabad", website: "https://www.iiit.ac.in", prestige: 90, verified: true, research: ["Computer Vision", "NLP", "Robotics", "Security"] },
  { name: "IIIT Delhi", shortName: "IIITD", slug: "iiit-delhi", type: "UNIVERSITY", country: "India", state: "Delhi", city: "New Delhi", website: "https://www.iiitd.ac.in", prestige: 87, verified: true, research: ["ML", "HCI", "Mobile Computing"] },
  { name: "IIIT Bangalore", shortName: "IIITB", slug: "iiit-bangalore", type: "UNIVERSITY", country: "India", state: "Karnataka", city: "Bangalore", website: "https://www.iiitb.ac.in", prestige: 86, verified: true, research: ["Data Science", "Software Engineering"] },
  { name: "Indian Statistical Institute", shortName: "ISI", slug: "isi-kolkata", type: "UNIVERSITY", country: "India", state: "West Bengal", city: "Kolkata", website: "https://www.isical.ac.in", prestige: 94, verified: true, research: ["Statistics", "Machine Learning", "Mathematics", "Computer Science"] },
  { name: "IISER Pune", shortName: "IISER-P", slug: "iiser-pune", type: "UNIVERSITY", country: "India", state: "Maharashtra", city: "Pune", website: "https://www.iiserpune.ac.in", prestige: 88, verified: true, research: ["Physics", "Chemistry", "Biology", "Mathematics"] },
  { name: "IISER Kolkata", shortName: "IISER-K", slug: "iiser-kolkata", type: "UNIVERSITY", country: "India", state: "West Bengal", city: "Kolkata", website: "https://www.iiserkol.ac.in", prestige: 86, verified: true, research: ["Physics", "Earth Sciences", "Biology"] },
  { name: "NIT Trichy", shortName: "NITT", slug: "nit-trichy", type: "UNIVERSITY", country: "India", state: "Tamil Nadu", city: "Tiruchirappalli", website: "https://www.nitt.edu", prestige: 82, verified: true, research: ["Engineering", "CS", "Management"] },
  { name: "NIT Surathkal", shortName: "NITK", slug: "nit-surathkal", type: "UNIVERSITY", country: "India", state: "Karnataka", city: "Surathkal", website: "https://www.nitk.ac.in", prestige: 81, verified: true, research: ["CS", "ECE", "Mechanical"] },
  { name: "NIT Warangal", shortName: "NITW", slug: "nit-warangal", type: "UNIVERSITY", country: "India", state: "Telangana", city: "Warangal", website: "https://www.nitw.ac.in", prestige: 80, verified: true, research: ["CS", "Chemical", "Civil"] },
  { name: "ISRO", shortName: "ISRO", slug: "isro", type: "GOVERNMENT", country: "India", state: "Karnataka", city: "Bangalore", website: "https://www.isro.gov.in", prestige: 93, verified: true, research: ["Aerospace", "Remote Sensing", "Satellite Systems"] },
  { name: "DRDO", shortName: "DRDO", slug: "drdo", type: "GOVERNMENT", country: "India", city: "New Delhi", website: "https://www.drdo.gov.in", prestige: 88, verified: true, research: ["Defense Systems", "Electronics", "Materials"] },
  { name: "BARC", shortName: "BARC", slug: "barc", type: "GOVERNMENT", country: "India", state: "Maharashtra", city: "Mumbai", website: "https://www.barc.gov.in", prestige: 90, verified: true, research: ["Nuclear Science", "Physics", "Chemistry"] },
  // Global universities
  { name: "Massachusetts Institute of Technology", shortName: "MIT", slug: "mit", type: "UNIVERSITY", country: "United States", state: "Massachusetts", city: "Cambridge", website: "https://www.mit.edu", prestige: 100, verified: true, research: ["AI", "Physics", "Biology", "CS", "Economics"] },
  { name: "Stanford University", shortName: "Stanford", slug: "stanford", type: "UNIVERSITY", country: "United States", state: "California", city: "Stanford", website: "https://www.stanford.edu", prestige: 99, verified: true, research: ["AI", "CS", "Medicine", "Entrepreneurship"] },
  { name: "Carnegie Mellon University", shortName: "CMU", slug: "cmu", type: "UNIVERSITY", country: "United States", state: "Pennsylvania", city: "Pittsburgh", website: "https://www.cmu.edu", prestige: 97, verified: true, research: ["Robotics", "CS", "HCI", "ML"] },
  { name: "University of California, Berkeley", shortName: "UC Berkeley", slug: "uc-berkeley", type: "UNIVERSITY", country: "United States", state: "California", city: "Berkeley", website: "https://www.berkeley.edu", prestige: 98, verified: true, research: ["CS", "EECS", "Physics", "Chemistry"] },
  { name: "Harvard University", shortName: "Harvard", slug: "harvard", type: "UNIVERSITY", country: "United States", state: "Massachusetts", city: "Cambridge", website: "https://www.harvard.edu", prestige: 99, verified: true, research: ["Biology", "CS", "Economics", "Medicine"] },
  { name: "Princeton University", shortName: "Princeton", slug: "princeton", type: "UNIVERSITY", country: "United States", state: "New Jersey", city: "Princeton", website: "https://www.princeton.edu", prestige: 97, verified: true, research: ["Theory", "Physics", "Math", "CS"] },
  { name: "University of Oxford", shortName: "Oxford", slug: "oxford", type: "UNIVERSITY", country: "United Kingdom", city: "Oxford", website: "https://www.ox.ac.uk", prestige: 98, verified: true, research: ["AI", "Physics", "Medicine", "Humanities"] },
  { name: "University of Cambridge", shortName: "Cambridge", slug: "cambridge", type: "UNIVERSITY", country: "United Kingdom", city: "Cambridge", website: "https://www.cam.ac.uk", prestige: 98, verified: true, research: ["Math", "Physics", "CS", "Engineering"] },
  { name: "Imperial College London", shortName: "Imperial", slug: "imperial", type: "UNIVERSITY", country: "United Kingdom", city: "London", website: "https://www.imperial.ac.uk", prestige: 95, verified: true, research: ["Engineering", "Medicine", "Business", "CS"] },
  { name: "ETH Zurich", shortName: "ETH", slug: "eth-zurich", type: "UNIVERSITY", country: "Switzerland", city: "Zurich", website: "https://ethz.ch", prestige: 98, verified: true, research: ["Robotics", "CS", "Physics", "Architecture"] },
  { name: "EPFL", shortName: "EPFL", slug: "epfl", type: "UNIVERSITY", country: "Switzerland", city: "Lausanne", website: "https://www.epfl.ch", prestige: 96, verified: true, research: ["Neuroscience", "CS", "Microengineering"] },
  { name: "Max Planck Society", shortName: "Max Planck", slug: "max-planck", type: "RESEARCH_LAB", country: "Germany", city: "Munich", website: "https://www.mpg.de", prestige: 97, verified: true, research: ["Physics", "Biology", "Chemistry", "CS"] },
  { name: "Technical University of Munich", shortName: "TUM", slug: "tum", type: "UNIVERSITY", country: "Germany", city: "Munich", website: "https://www.tum.de", prestige: 93, verified: true, research: ["Engineering", "CS", "Medicine"] },
  { name: "National University of Singapore", shortName: "NUS", slug: "nus", type: "UNIVERSITY", country: "Singapore", city: "Singapore", website: "https://www.nus.edu.sg", prestige: 94, verified: true, research: ["AI", "CS", "Business", "Medicine"] },
  { name: "Nanyang Technological University", shortName: "NTU", slug: "ntu-singapore", type: "UNIVERSITY", country: "Singapore", city: "Singapore", website: "https://www.ntu.edu.sg", prestige: 92, verified: true, research: ["Materials", "Engineering", "AI"] },
  { name: "University of Toronto", shortName: "UofT", slug: "uoft", type: "UNIVERSITY", country: "Canada", city: "Toronto", website: "https://www.utoronto.ca", prestige: 95, verified: true, research: ["ML", "Medicine", "CS"] },
  { name: "University of Tokyo", shortName: "UTokyo", slug: "utokyo", type: "UNIVERSITY", country: "Japan", city: "Tokyo", website: "https://www.u-tokyo.ac.jp", prestige: 94, verified: true, research: ["Physics", "Robotics", "Engineering"] },
  { name: "KAIST", shortName: "KAIST", slug: "kaist", type: "UNIVERSITY", country: "South Korea", city: "Daejeon", website: "https://www.kaist.ac.kr", prestige: 91, verified: true, research: ["AI", "EE", "Materials"] },
  { name: "University of Melbourne", shortName: "UniMelb", slug: "unimelb", type: "UNIVERSITY", country: "Australia", city: "Melbourne", website: "https://www.unimelb.edu.au", prestige: 90, verified: true, research: ["CS", "Medicine", "Climate"] },
  // Industry research
  { name: "Google Research", shortName: "Google", slug: "google-research", type: "INDUSTRY", country: "United States", city: "Mountain View", website: "https://research.google", prestige: 98, verified: true, research: ["ML", "Systems", "Quantum", "Health"] },
  { name: "Microsoft Research", shortName: "MSR", slug: "microsoft-research", type: "INDUSTRY", country: "United States", city: "Redmond", website: "https://www.microsoft.com/research", prestige: 97, verified: true, research: ["AI", "Systems", "HCI", "Theory"] },
  { name: "OpenAI", shortName: "OpenAI", slug: "openai", type: "INDUSTRY", country: "United States", state: "California", city: "San Francisco", website: "https://openai.com", prestige: 99, verified: true, research: ["Artificial Intelligence", "Alignment", "Multimodal"] },
  { name: "Google DeepMind", shortName: "DeepMind", slug: "deepmind", type: "INDUSTRY", country: "United Kingdom", city: "London", website: "https://deepmind.google", prestige: 99, verified: true, research: ["RL", "Neuroscience", "AI", "Science"] },
  { name: "Meta AI Research", shortName: "FAIR", slug: "meta-ai", type: "INDUSTRY", country: "United States", city: "Menlo Park", website: "https://ai.meta.com", prestige: 96, verified: true, research: ["CV", "NLP", "PyTorch", "AR/VR"] },
  { name: "IBM Research", shortName: "IBM", slug: "ibm-research", type: "INDUSTRY", country: "United States", city: "Yorktown Heights", website: "https://research.ibm.com", prestige: 92, verified: true, research: ["Quantum", "AI", "Hybrid Cloud"] },
  { name: "Apple Machine Learning Research", shortName: "Apple ML", slug: "apple-ml", type: "INDUSTRY", country: "United States", state: "California", city: "Cupertino", website: "https://machinelearning.apple.com", prestige: 94, verified: true, research: ["On-device ML", "Privacy", "CV"] },
  { name: "Amazon Science", shortName: "Amazon", slug: "amazon-science", type: "INDUSTRY", country: "United States", city: "Seattle", website: "https://www.amazon.science", prestige: 93, verified: true, research: ["ML", "Robotics", "Speech", "Operations"] },
  { name: "CERN", shortName: "CERN", slug: "cern", type: "RESEARCH_LAB", country: "Switzerland", city: "Geneva", website: "https://home.cern", prestige: 98, verified: true, research: ["Particle Physics", "Computing", "Engineering"] },
  { name: "RIKEN", shortName: "RIKEN", slug: "riken", type: "RESEARCH_LAB", country: "Japan", city: "Wako", website: "https://www.riken.jp", prestige: 93, verified: true, research: ["Biology", "Physics", "AI", "Chemistry"] },
  { name: "Inria", shortName: "Inria", slug: "inria", type: "RESEARCH_LAB", country: "France", city: "Rocquencourt", website: "https://www.inria.fr", prestige: 91, verified: true, research: ["CS", "Applied Math", "Digital Science"] },
  { name: "CSIRO", shortName: "CSIRO", slug: "csiro", type: "GOVERNMENT", country: "Australia", city: "Canberra", website: "https://www.csiro.au", prestige: 88, verified: true, research: ["Climate", "Agriculture", "Data61", "Materials"] },
];

const TYPES = [
  "RESEARCH_INTERNSHIP",
  "SUMMER_SCHOOL",
  "SCHOLARSHIP",
  "FELLOWSHIP",
  "HACKATHON",
  "COMPETITION",
  "CONFERENCE",
  "JOB",
] as const;

const AREAS = [
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
  "Astronomy & Astrophysics",
  "Data Science",
  "Software Engineering",
  "Distributed Systems",
  "Hardware & Architecture",
  "Signal Processing",
  "Control Systems",
  "Physics",
  "Mathematics",
];

const FUNDING = ["FULL", "PARTIAL", "STIPEND", "UNPAID", "NONE"] as const;
const MODES = ["ONSITE", "REMOTE", "HYBRID"] as const;
const BRANCHES = [
  "Computer Science",
  "Electrical Engineering",
  "Electronics",
  "Mechanical Engineering",
  "Physics",
  "Mathematics",
  "Data Science",
  "AI / ML",
  "Biotechnology",
  "Aerospace",
];

const TITLE_TEMPLATES: Record<string, string[]> = {
  RESEARCH_INTERNSHIP: [
    "{area} Research Internship",
    "Summer Research Internship in {area}",
    "Undergraduate Research Program — {area}",
    "Visiting Student Researcher ({area})",
    "{short} Research Internship {year}",
  ],
  SUMMER_SCHOOL: [
    "{area} Summer School",
    "International Summer School on {area}",
    "{short} Summer Academy — {area}",
    "Advanced Topics in {area} Summer Program",
  ],
  SCHOLARSHIP: [
    "{short} Merit Scholarship",
    "International Student Scholarship — {area}",
    "{short} Excellence Award",
    "STEM Scholarship Program {year}",
  ],
  FELLOWSHIP: [
    "{short} Research Fellowship",
    "Graduate Fellowship in {area}",
    "Postgraduate Research Fellowship",
    "{short} Visiting Fellowship",
  ],
  HACKATHON: [
    "{short} AI Hackathon",
    "{area} Innovation Challenge",
    "{short} Buildathon {year}",
    "Global {area} Hackathon",
  ],
  COMPETITION: [
    "{short} Programming Contest",
    "{area} Challenge Competition",
    "Student Innovation Competition",
    "{short} Research Paper Competition",
  ],
  CONFERENCE: [
    "Student Travel Grant — {area} Conference",
    "{short} Open Symposium {year}",
    "Young Researchers Workshop on {area}",
  ],
  JOB: [
    "Student Researcher — {area}",
    "Research Engineer Intern",
    "ML Engineer Intern — {area}",
    "Research Assistant Position",
  ],
};

function hash(s: string) {
  return createHash("sha256").update(s).digest("hex").slice(0, 32);
}

function slugify(t: string) {
  return t
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

function daysFromNow(n: number) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("🌱 Seeding Opportunity Radar...\n");

  // Clean
  const tables = [
    "recommendationScore",
    "eligibilityRecord",
    "crawlerLog",
    "crawlerJob",
    "searchHistory",
    "notification",
    "application",
    "bookmark",
    "opportunity",
    "department",
    "institution",
    "profile",
    "passwordResetToken",
    "emailVerificationToken",
    "session",
    "account",
    "user",
    "rateLimitEntry",
    "systemMetric",
    "verificationToken",
  ] as const;

  for (const t of tables) {
    // @ts-expect-error dynamic
    await db[t].deleteMany();
  }

  // Admin + demo users
  const passwordHash = await bcrypt.hash("Password123!", 12);
  const admin = await db.user.create({
    data: {
      name: "Admin",
      email: "admin@opportunityradar.app",
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
      profile: {
        create: {
          university: "Opportunity Radar",
          degree: "Masters",
          branch: "Computer Science",
          year: 2,
          cgpa: 9.2,
          skills: JSON.stringify(["TypeScript", "System Design", "Product"]),
          programmingLanguages: JSON.stringify(["TypeScript", "Python", "Go"]),
          researchInterests: JSON.stringify(["Machine Learning", "Systems"]),
          preferredCountries: JSON.stringify(["India", "United States"]),
          completionPercent: 100,
          bio: "Platform administrator",
        },
      },
    },
  });

  const demo = await db.user.create({
    data: {
      name: "Aditya Sharma",
      email: "demo@opportunityradar.app",
      passwordHash,
      role: "USER",
      emailVerified: new Date(),
      profile: {
        create: {
          university: "IIT Delhi",
          degree: "Bachelors",
          branch: "Computer Science",
          year: 3,
          cgpa: 8.7,
          maxCgpa: 10,
          skills: JSON.stringify([
            "Deep Learning",
            "PyTorch",
            "Research Writing",
            "System Design",
            "Algorithms",
          ]),
          programmingLanguages: JSON.stringify(["Python", "C++", "TypeScript", "Rust"]),
          researchInterests: JSON.stringify([
            "Artificial Intelligence",
            "Machine Learning",
            "Computer Vision",
            "Natural Language Processing",
          ]),
          preferredCountries: JSON.stringify([
            "India",
            "United States",
            "Switzerland",
            "United Kingdom",
            "Germany",
          ]),
          preferredInstitutions: JSON.stringify(["MIT", "Stanford", "ETH", "IISc", "Google"]),
          githubUrl: "https://github.com/demo",
          linkedinUrl: "https://linkedin.com/in/demo",
          portfolioUrl: "https://demo.dev",
          bio: "CS undergrad passionate about AI research and open-source. Looking for summer research internships and fellowships.",
          completionPercent: 100,
        },
      },
    },
  });

  console.log(`✓ Users: admin@opportunityradar.app / demo@opportunityradar.app (Password123!)`);

  // Institutions
  const institutionRecords = [];
  for (const inst of INSTITUTIONS) {
    const record = await db.institution.create({
      data: {
        name: inst.name,
        slug: inst.slug,
        shortName: inst.shortName,
        type: inst.type,
        country: inst.country,
        state: inst.state ?? null,
        city: inst.city,
        website: inst.website,
        logoUrl: `/logos/${inst.slug}.svg`,
        overview: `${inst.name} (${inst.shortName}) is a leading ${inst.type.toLowerCase().replace("_", " ")} based in ${inst.city}, ${inst.country}. Known for excellence in ${(inst.research as string[]).slice(0, 3).join(", ")} and related fields.`,
        researchAreas: JSON.stringify(inst.research),
        prestigeScore: inst.prestige,
        verified: inst.verified,
        crawlUrl: inst.website,
        crawlStatus: "SUCCESS",
        lastCrawledAt: daysAgo(Math.floor(Math.random() * 5)),
        opportunityCount: 0,
      },
    });
    institutionRecords.push(record);

    // Departments
    for (const area of (inst.research as string[]).slice(0, 3)) {
      await db.department.create({
        data: {
          institutionId: record.id,
          name: `Department of ${area}`,
          website: inst.website,
        },
      });
    }
  }
  console.log(`✓ Institutions: ${institutionRecords.length}`);

  // Generate 500+ opportunities
  let oppCount = 0;
  const year = new Date().getFullYear();
  const opportunityIds: string[] = [];

  for (let i = 0; i < 520; i++) {
    const inst = institutionRecords[i % institutionRecords.length];
    const type = pick(TYPES, i);
    const area = pick(AREAS, i * 3 + 1);
    const templates = TITLE_TEMPLATES[type] ?? TITLE_TEMPLATES.RESEARCH_INTERNSHIP;
    const titleTpl = pick(templates, i);
    const title = titleTpl
      .replace("{area}", area)
      .replace("{short}", INSTITUTIONS[i % INSTITUTIONS.length].shortName)
      .replace("{year}", String(year));

    const funding = pick(FUNDING, i + 2);
    const mode = pick(MODES, i + 1);
    const deadlineDays = 5 + ((i * 7) % 120);
    const sourceHash = hash(`${inst.id}|${type}|${title}|${i}`);
    const slug = `${slugify(title)}-${sourceHash.slice(0, 6)}`;

    const minCgpa = type === "HACKATHON" || type === "COMPETITION" ? null : 7 + (i % 3) * 0.5;
    const minDegree =
      type === "JOB" || type === "FELLOWSHIP"
        ? i % 2 === 0
          ? "MASTERS"
          : "BACHELORS"
        : type === "HACKATHON"
          ? "HIGH_SCHOOL"
          : "BACHELORS";

    const branches = [
      pick(BRANCHES, i),
      pick(BRANCHES, i + 3),
      pick(BRANCHES, i + 5),
    ].filter((v, idx, a) => a.indexOf(v) === idx);

    const description = [
      `${title} at ${inst.name}.`,
      `This ${type.replace(/_/g, " ").toLowerCase()} focuses on ${area} and related disciplines.`,
      `Participants work closely with researchers and mentors, contribute to ongoing projects, and gain exposure to a world-class research environment.`,
      funding === "FULL"
        ? "The program is fully funded including stipend and housing support."
        : funding === "STIPEND"
          ? "A competitive monthly stipend is provided."
          : funding === "PARTIAL"
            ? "Partial funding or travel support may be available."
            : "Please review the official page for funding details.",
      `Location: ${inst.city}, ${inst.country}. Mode: ${mode}.`,
      `Apply via the official application portal before the deadline.`,
    ].join(" ");

    const fundingAmounts: Record<string, string> = {
      FULL: "Full funding + stipend",
      PARTIAL: "Partial tuition / travel support",
      STIPEND: inst.country === "India" ? "₹10,000–₹50,000/month" : "$2,000–$8,000/month",
      UNPAID: "Unpaid (academic credit possible)",
      NONE: "Prize / recognition based",
    };

    const opp = await db.opportunity.create({
      data: {
        institutionId: inst.id,
        title,
        slug,
        type,
        description,
        researchArea: area,
        eligibilityText: `Open to students in ${branches.join(", ")}. Minimum degree: ${minDegree}.${minCgpa ? ` Preferred CGPA ≥ ${minCgpa}.` : ""} Strong interest in ${area} required.`,
        minDegree,
        maxDegree: type === "SCHOLARSHIP" ? "BACHELORS" : type === "JOB" ? "PHD" : "MASTERS",
        branches: JSON.stringify(branches),
        minCgpa,
        minYear: type === "RESEARCH_INTERNSHIP" ? 2 : null,
        maxYear: type === "RESEARCH_INTERNSHIP" ? 4 : null,
        funding,
        fundingAmount: fundingAmounts[funding],
        location: `${inst.city}, ${inst.country}`,
        country: inst.country,
        state: inst.state ?? null,
        mode,
        duration:
          type === "HACKATHON"
            ? "48 hours"
            : type === "SUMMER_SCHOOL"
              ? "1–3 weeks"
              : type === "FELLOWSHIP"
                ? "3–12 months"
                : "8–12 weeks",
        durationWeeks:
          type === "HACKATHON" ? 0 : type === "SUMMER_SCHOOL" ? 2 : type === "FELLOWSHIP" ? 24 : 10,
        deadline: daysFromNow(deadlineDays),
        startDate: daysFromNow(deadlineDays + 30),
        officialUrl: inst.website,
        applicationUrl: `${inst.website}/apply`,
        verified: inst.verified && i % 7 !== 0,
        status: deadlineDays < 0 ? "CLOSED" : "ACTIVE",
        popularityScore: 1 + (i % 10) + (inst.prestigeScore / 20),
        viewCount: 50 + ((i * 17) % 2000),
        applyCount: 5 + ((i * 3) % 200),
        saveCount: 2 + ((i * 5) % 150),
        sourceUrl: inst.website,
        sourceHash,
        crawledAt: daysAgo(i % 10),
        publishedAt: daysAgo((i * 2) % 45),
      },
    });

    opportunityIds.push(opp.id);
    oppCount++;
  }

  // Update institution counts
  for (const inst of institutionRecords) {
    const count = await db.opportunity.count({
      where: { institutionId: inst.id, status: "ACTIVE" },
    });
    await db.institution.update({
      where: { id: inst.id },
      data: { opportunityCount: count },
    });
  }
  console.log(`✓ Opportunities: ${oppCount}`);

  // Bookmarks & applications for demo user
  for (let i = 0; i < 12; i++) {
    await db.bookmark.create({
      data: {
        userId: demo.id,
        opportunityId: opportunityIds[i * 7],
      },
    });
  }
  for (let i = 0; i < 5; i++) {
    await db.application.create({
      data: {
        userId: demo.id,
        opportunityId: opportunityIds[i * 11 + 3],
        status: pick(["APPLIED", "IN_PROGRESS", "SUBMITTED", "APPLIED"] as const, i),
        notes: "Tracking this application from Opportunity Radar.",
      },
    });
  }

  // Notifications
  await db.notification.createMany({
    data: [
      {
        userId: demo.id,
        type: "NEW_MATCH",
        title: "12 new high-match opportunities",
        body: "We found new research internships matching AI and Machine Learning.",
        link: "/dashboard",
        read: false,
      },
      {
        userId: demo.id,
        type: "DEADLINE",
        title: "Deadline in 3 days",
        body: "A saved opportunity is closing soon — review and apply.",
        link: "/saved",
        read: false,
      },
      {
        userId: demo.id,
        type: "SYSTEM",
        title: "Welcome to Opportunity Radar",
        body: "Your profile is complete. Recommendations are ready on your dashboard.",
        link: "/dashboard",
        read: true,
      },
    ],
  });

  // Crawler job history
  const job = await db.crawlerJob.create({
    data: {
      name: "Initial full catalog seed crawl",
      status: "SUCCESS",
      startedAt: daysAgo(1),
      finishedAt: daysAgo(1),
      itemsFound: oppCount,
      itemsAdded: oppCount,
      itemsUpdated: 0,
      itemsSkipped: 0,
    },
  });
  await db.crawlerLog.createMany({
    data: [
      { jobId: job.id, level: "INFO", message: "Seed crawl started" },
      { jobId: job.id, level: "INFO", message: `Processed ${institutionRecords.length} institutions` },
      { jobId: job.id, level: "INFO", message: `Added ${oppCount} opportunities` },
      { jobId: job.id, level: "INFO", message: "Seed crawl completed" },
    ],
  });

  // System metrics
  await db.systemMetric.createMany({
    data: [
      { key: "users_total", value: 2 },
      { key: "opportunities_total", value: oppCount },
      { key: "institutions_total", value: institutionRecords.length },
      { key: "crawler_success_rate", value: 100 },
    ],
  });

  console.log("\n✅ Seed complete!");
  console.log("─────────────────────────────────────");
  console.log("Admin: admin@opportunityradar.app / Password123!");
  console.log("Demo:  demo@opportunityradar.app  / Password123!");
  console.log(`Institutions: ${institutionRecords.length}`);
  console.log(`Opportunities: ${oppCount}`);
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
