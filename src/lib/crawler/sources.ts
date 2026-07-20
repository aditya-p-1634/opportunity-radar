/**
 * @deprecated
 * This file is deprecated. Please do not write any new features that import this file.
 * It will be removed once the configuration-driven active crawler in registry.ts is fully verified.
 */
export interface SourceTemplate {
  title: string;
  type: string;
  description: string;
  researchArea?: string;
  eligibilityText?: string;
  minDegree?: string;
  maxDegree?: string;
  branches?: string[];
  minCgpa?: number;
  minYear?: number;
  maxYear?: number;
  funding?: string;
  fundingAmount?: string;
  location?: string;
  country?: string;
  state?: string;
  mode?: string;
  duration?: string;
  durationWeeks?: number;
  deadlineDaysFromNow?: number;
  officialUrl?: string;
  applicationUrl?: string;
  verified?: boolean;
  popularityScore?: number;
}

const researchInternship = (
  area: string,
  opts: Partial<SourceTemplate> = {}
): SourceTemplate => ({
  title: `{institution} Research Internship — ${area}`,
  type: "RESEARCH_INTERNSHIP",
  description: `Competitive research internship at {institution} focusing on ${area}. Students work with faculty mentors on active research projects, contribute to publications, and gain hands-on experience in a world-class research environment.`,
  researchArea: area,
  eligibilityText: "Open to undergraduate and master's students with strong academic record and relevant coursework.",
  minDegree: "BACHELORS",
  maxDegree: "MASTERS",
  branches: ["Computer Science", "Electrical Engineering", "Data Science", "AI / ML", "Physics", "Mathematics"],
  minCgpa: 7.5,
  minYear: 2,
  funding: "STIPEND",
  fundingAmount: "₹10,000–$5,000/month depending on location",
  mode: "ONSITE",
  duration: "8–12 weeks",
  durationWeeks: 10,
  verified: true,
  popularityScore: 7,
  ...opts,
});

export const SOURCE_CATALOGS: Record<string, SourceTemplate[]> = {
  global: [
    researchInternship("Artificial Intelligence"),
    researchInternship("Machine Learning"),
    researchInternship("Systems & Networking"),
    {
      title: "{institution} Summer Research Fellowship",
      type: "FELLOWSHIP",
      description:
        "Prestigious summer research fellowship at {institution}. Fellows receive mentorship, stipend, and present work at a closing symposium.",
      researchArea: "Data Science",
      minDegree: "BACHELORS",
      funding: "FULL",
      fundingAmount: "Full stipend + housing",
      mode: "ONSITE",
      duration: "10 weeks",
      durationWeeks: 10,
      verified: true,
      popularityScore: 8.5,
    },
    {
      title: "{institution} Undergraduate Scholarship",
      type: "SCHOLARSHIP",
      description:
        "Merit-based scholarship for outstanding undergraduate students pursuing STEM degrees. Covers tuition support and research opportunities.",
      minDegree: "BACHELORS",
      maxDegree: "BACHELORS",
      minCgpa: 8.0,
      funding: "PARTIAL",
      fundingAmount: "Up to $10,000",
      mode: "REMOTE",
      duration: "1 academic year",
      verified: true,
      popularityScore: 6,
    },
    {
      title: "{institution} AI Hackathon",
      type: "HACKATHON",
      description:
        "48-hour AI/ML hackathon hosted by {institution}. Build innovative solutions, network with researchers, and win prizes.",
      researchArea: "Artificial Intelligence",
      minDegree: "HIGH_SCHOOL",
      funding: "NONE",
      fundingAmount: "Prize pool $25,000",
      mode: "HYBRID",
      duration: "48 hours",
      durationWeeks: 0,
      verified: true,
      popularityScore: 9,
    },
  ],

  "type:UNIVERSITY": [
    researchInternship("Computer Vision"),
    researchInternship("Natural Language Processing"),
    researchInternship("Quantum Computing", { minCgpa: 8.0, funding: "FULL" }),
    {
      title: "{institution} International Summer School",
      type: "SUMMER_SCHOOL",
      description:
        "Intensive summer school covering advanced topics with lectures from leading researchers at {institution}. Certificate awarded upon completion.",
      researchArea: "Machine Learning",
      minDegree: "BACHELORS",
      funding: "PARTIAL",
      mode: "ONSITE",
      duration: "2 weeks",
      durationWeeks: 2,
      verified: true,
      popularityScore: 7.5,
    },
  ],

  "type:RESEARCH_LAB": [
    researchInternship("Deep Learning", { funding: "STIPEND", minCgpa: 8.0 }),
    researchInternship("Robotics"),
    {
      title: "{institution} Visiting Researcher Program",
      type: "FELLOWSHIP",
      description:
        "Visiting researcher positions at {institution} for exceptional students and early-career researchers.",
      researchArea: "Artificial Intelligence",
      minDegree: "MASTERS",
      funding: "FULL",
      mode: "ONSITE",
      duration: "3–6 months",
      durationWeeks: 16,
      verified: true,
      popularityScore: 8,
    },
  ],

  "type:INDUSTRY": [
    {
      title: "{institution} Research Internship",
      type: "RESEARCH_INTERNSHIP",
      description:
        "Industry research internship at {institution}. Work on production-scale ML systems and publish-worthy research.",
      researchArea: "Machine Learning",
      minDegree: "BACHELORS",
      maxDegree: "PHD",
      minCgpa: 8.0,
      funding: "STIPEND",
      fundingAmount: "Competitive industry stipend",
      mode: "HYBRID",
      duration: "12 weeks",
      durationWeeks: 12,
      verified: true,
      popularityScore: 9.5,
    },
    {
      title: "{institution} Student Researcher",
      type: "JOB",
      description:
        "Part-time / full-time student researcher role at {institution} collaborating with research scientists.",
      researchArea: "Artificial Intelligence",
      minDegree: "MASTERS",
      funding: "STIPEND",
      mode: "ONSITE",
      duration: "6 months",
      durationWeeks: 24,
      verified: true,
      popularityScore: 8,
    },
  ],

  "type:GOVERNMENT": [
    {
      title: "{institution} Student Internship Programme",
      type: "RESEARCH_INTERNSHIP",
      description:
        "Government research internship at {institution}. Contribute to national R&D projects in science and technology.",
      researchArea: "Systems & Networking",
      minDegree: "BACHELORS",
      branches: ["Computer Science", "Electronics", "Mechanical Engineering", "Aerospace", "Physics"],
      minCgpa: 7.0,
      funding: "STIPEND",
      fundingAmount: "₹5,000–₹25,000/month",
      mode: "ONSITE",
      duration: "6–8 weeks",
      durationWeeks: 8,
      country: "India",
      verified: true,
      popularityScore: 7,
    },
    {
      title: "{institution} Research Fellowship",
      type: "FELLOWSHIP",
      description:
        "Research fellowship supporting advanced projects at {institution} for postgraduate students.",
      researchArea: "Materials Science",
      minDegree: "MASTERS",
      funding: "FULL",
      mode: "ONSITE",
      duration: "1–2 years",
      verified: true,
      popularityScore: 6.5,
    },
  ],

  "country:India": [
    {
      title: "{institution} Summer Internship Programme",
      type: "RESEARCH_INTERNSHIP",
      description:
        "Flagship summer internship at {institution} for Indian undergraduates. Mentored research projects with faculty.",
      researchArea: "Data Science",
      minDegree: "BACHELORS",
      maxDegree: "BACHELORS",
      minYear: 2,
      maxYear: 4,
      minCgpa: 7.5,
      funding: "STIPEND",
      fundingAmount: "₹10,000–₹15,000/month",
      country: "India",
      mode: "ONSITE",
      duration: "8 weeks",
      durationWeeks: 8,
      verified: true,
      popularityScore: 8,
    },
  ],

  "country:United States": [
    {
      title: "{institution} REU / Summer Research",
      type: "RESEARCH_INTERNSHIP",
      description:
        "NSF-style Research Experience for Undergraduates at {institution}. Fully funded summer research with housing.",
      researchArea: "Computer Science",
      minDegree: "BACHELORS",
      maxDegree: "BACHELORS",
      funding: "FULL",
      fundingAmount: "$6,000 stipend + housing",
      country: "United States",
      mode: "ONSITE",
      duration: "10 weeks",
      durationWeeks: 10,
      verified: true,
      popularityScore: 9,
    },
  ],

  "country:United Kingdom": [
    {
      title: "{institution} Undergraduate Research Opportunity",
      type: "RESEARCH_INTERNSHIP",
      description:
        "Summer research placement at {institution} for undergraduates interested in advanced STEM research.",
      researchArea: "Physics",
      minDegree: "BACHELORS",
      funding: "STIPEND",
      country: "United Kingdom",
      mode: "ONSITE",
      duration: "8–10 weeks",
      durationWeeks: 9,
      verified: true,
      popularityScore: 7.5,
    },
  ],

  "country:Switzerland": [
    {
      title: "{institution} Summer Research Internship",
      type: "RESEARCH_INTERNSHIP",
      description:
        "Highly selective summer research internship at {institution} in Switzerland. International applicants welcome.",
      researchArea: "Robotics",
      minDegree: "BACHELORS",
      maxDegree: "MASTERS",
      minCgpa: 8.5,
      funding: "STIPEND",
      fundingAmount: "CHF 1,600–2,000/month",
      country: "Switzerland",
      mode: "ONSITE",
      duration: "3 months",
      durationWeeks: 12,
      verified: true,
      popularityScore: 9,
    },
  ],

  "country:Germany": [
    {
      title: "{institution} Internship / Praktikum",
      type: "RESEARCH_INTERNSHIP",
      description:
        "Research internship (Praktikum) at {institution}. Strong focus on experimental and theoretical research.",
      researchArea: "Materials Science",
      minDegree: "BACHELORS",
      funding: "STIPEND",
      country: "Germany",
      mode: "ONSITE",
      duration: "2–6 months",
      durationWeeks: 12,
      verified: true,
      popularityScore: 7,
    },
  ],

  fallback: [
    researchInternship("Software Engineering"),
    {
      title: "{institution} Open Call for Student Projects",
      type: "OTHER",
      description: "Open call for student research projects and collaborations at {institution}.",
      funding: "NONE",
      mode: "HYBRID",
      verified: false,
      popularityScore: 3,
    },
  ],
};

// Institution-specific high-value programs
SOURCE_CATALOGS["mit"] = [
  {
    title: "MIT UROP — Undergraduate Research Opportunities",
    type: "RESEARCH_INTERNSHIP",
    description:
      "MIT's flagship Undergraduate Research Opportunities Program. Work with MIT faculty on cutting-edge research across all departments.",
    researchArea: "Artificial Intelligence",
    minDegree: "BACHELORS",
    maxDegree: "BACHELORS",
    funding: "STIPEND",
    fundingAmount: "Hourly pay or credit",
    country: "United States",
    location: "Cambridge, MA",
    mode: "ONSITE",
    duration: "Semester / Summer",
    officialUrl: "https://urop.mit.edu",
    verified: true,
    popularityScore: 10,
  },
  researchInternship("Quantum Computing", {
    title: "MIT Center for Quantum Engineering Internship",
    country: "United States",
    location: "Cambridge, MA",
    funding: "FULL",
    officialUrl: "https://mit.edu",
  }),
];

SOURCE_CATALOGS["stanford"] = [
  {
    title: "Stanford CURIS Summer Internship",
    type: "RESEARCH_INTERNSHIP",
    description:
      "Computer Science Undergraduate Research Internship at Stanford. Work with CS faculty on AI, systems, theory, and HCI projects.",
    researchArea: "Artificial Intelligence",
    minDegree: "BACHELORS",
    maxDegree: "BACHELORS",
    branches: ["Computer Science", "Electrical Engineering", "Data Science"],
    funding: "STIPEND",
    country: "United States",
    location: "Stanford, CA",
    mode: "ONSITE",
    duration: "10 weeks",
    durationWeeks: 10,
    officialUrl: "https://curis.stanford.edu",
    verified: true,
    popularityScore: 10,
  },
];

SOURCE_CATALOGS["iisc-bangalore"] = [
  {
    title: "IISc Summer Research Fellowship Programme",
    type: "RESEARCH_INTERNSHIP",
    description:
      "IISc Bangalore's prestigious Summer Research Fellowship for undergraduate and postgraduate students across science and engineering.",
    researchArea: "Physics",
    minDegree: "BACHELORS",
    maxDegree: "MASTERS",
    minCgpa: 7.0,
    funding: "STIPEND",
    fundingAmount: "₹10,000/month",
    country: "India",
    location: "Bangalore",
    state: "Karnataka",
    mode: "ONSITE",
    duration: "8 weeks",
    durationWeeks: 8,
    officialUrl: "https://www.iisc.ac.in",
    verified: true,
    popularityScore: 9.5,
  },
];

SOURCE_CATALOGS["google-research"] = [
  {
    title: "Google Research Student Researcher",
    type: "RESEARCH_INTERNSHIP",
    description:
      "Student Researcher program at Google Research. Collaborate with research scientists on ML, systems, and responsible AI.",
    researchArea: "Machine Learning",
    minDegree: "BACHELORS",
    maxDegree: "PHD",
    funding: "STIPEND",
    fundingAmount: "Competitive Google stipend",
    country: "United States",
    mode: "HYBRID",
    duration: "12–16 weeks",
    durationWeeks: 14,
    officialUrl: "https://research.google",
    verified: true,
    popularityScore: 10,
  },
];

SOURCE_CATALOGS["openai"] = [
  {
    title: "OpenAI Residency / Research Internship",
    type: "RESEARCH_INTERNSHIP",
    description:
      "Research internship and residency programs at OpenAI focusing on frontier AI systems, alignment, and multimodal models.",
    researchArea: "Artificial Intelligence",
    minDegree: "MASTERS",
    maxDegree: "PHD",
    minCgpa: 8.5,
    funding: "FULL",
    fundingAmount: "Competitive compensation",
    country: "United States",
    location: "San Francisco, CA",
    mode: "ONSITE",
    duration: "6 months",
    durationWeeks: 24,
    officialUrl: "https://openai.com/careers",
    verified: true,
    popularityScore: 10,
  },
];

SOURCE_CATALOGS["eth-zurich"] = [
  {
    title: "ETH Student Summer Research Fellowship (ETH SSRF)",
    type: "FELLOWSHIP",
    description:
      "ETH Zurich Student Summer Research Fellowship for international computer science students. Fully funded research with ETH faculty.",
    researchArea: "Computer Science",
    minDegree: "BACHELORS",
    maxDegree: "MASTERS",
    funding: "FULL",
    fundingAmount: "CHF 1,750/month + housing support",
    country: "Switzerland",
    location: "Zurich",
    mode: "ONSITE",
    duration: "2 months",
    durationWeeks: 8,
    officialUrl: "https://inf.ethz.ch/studies/summer-research-fellowship.html",
    verified: true,
    popularityScore: 9.5,
  },
];

SOURCE_CATALOGS["isro"] = [
  {
    title: "ISRO Student Internship / Project Training",
    type: "RESEARCH_INTERNSHIP",
    description:
      "Internship and project training opportunities at ISRO centres for engineering and science students.",
    researchArea: "Aerospace",
    minDegree: "BACHELORS",
    branches: ["Aerospace", "Electronics", "Computer Science", "Mechanical Engineering", "Physics"],
    minCgpa: 6.5,
    funding: "NONE",
    country: "India",
    mode: "ONSITE",
    duration: "4–6 months",
    durationWeeks: 16,
    officialUrl: "https://www.isro.gov.in",
    verified: true,
    popularityScore: 8.5,
  },
];

SOURCE_CATALOGS["deepmind"] = [
  {
    title: "Google DeepMind Internship",
    type: "RESEARCH_INTERNSHIP",
    description:
      "Research internship at Google DeepMind working on reinforcement learning, neuroscience-inspired AI, and foundational models.",
    researchArea: "Artificial Intelligence",
    minDegree: "MASTERS",
    maxDegree: "PHD",
    funding: "FULL",
    country: "United Kingdom",
    location: "London",
    mode: "ONSITE",
    duration: "12–20 weeks",
    durationWeeks: 16,
    officialUrl: "https://deepmind.google/about/careers",
    verified: true,
    popularityScore: 10,
  },
];
