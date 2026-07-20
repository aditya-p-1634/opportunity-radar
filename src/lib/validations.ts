import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  university: z.string().max(200).optional().nullable(),
  degree: z.enum(["Bachelors", "Masters", "PhD", "Dual"]).optional().nullable(),
  branch: z.string().max(100).optional().nullable(),
  year: z.number().int().min(1).max(10).optional().nullable(),
  cgpa: z.number().min(0).max(10).optional().nullable(),
  maxCgpa: z.number().min(1).max(10).optional(),
  skills: z.array(z.string()).optional(),
  programmingLanguages: z.array(z.string()).optional(),
  researchInterests: z.array(z.string()).optional(),
  preferredCountries: z.array(z.string()).optional(),
  preferredInstitutions: z.array(z.string()).optional(),
  portfolioUrl: z.string().url().optional().nullable().or(z.literal("")),
  githubUrl: z.string().url().optional().nullable().or(z.literal("")),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  bio: z.string().max(1000).optional().nullable(),
});

export const searchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  institution: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  funding: z.string().optional(),
  researchArea: z.string().optional(),
  degree: z.string().optional(),
  branch: z.string().optional(),
  mode: z.string().optional(),
  verified: z.enum(["true", "false"]).optional(),
  deadline: z.enum(["week", "month", "quarter", "any"]).optional(),
  sort: z.enum(["relevance", "deadline", "newest", "popular", "match"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const applicationSchema = z.object({
  opportunityId: z.string().min(1),
  status: z.enum(["APPLIED", "IN_PROGRESS", "SUBMITTED", "ACCEPTED", "REJECTED", "WITHDRAWN"]).optional(),
  notes: z.string().max(2000).optional(),
});
