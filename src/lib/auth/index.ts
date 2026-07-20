import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import type { NextAuthConfig } from "next-auth";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;
      const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db) as NextAuthConfig["adapter"],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/onboarding",
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null;
      }

      // Refresh role from DB periodically
      if (token.id && (!token.role || trigger === "update")) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, name: true, image: true, emailVerified: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.picture = dbUser.image;
          token.emailVerified = dbUser.emailVerified;
        }
      }

      if (trigger === "update" && session) {
        token.name = session.name ?? token.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
        session.user.emailVerified = (token.emailVerified as Date | null) ?? null;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        // Ensure profile exists for OAuth users
        const existing = await db.user.findUnique({
          where: { email: user.email.toLowerCase() },
          include: { profile: true },
        });
        if (existing && !existing.profile) {
          await db.profile.create({
            data: { userId: existing.id, completionPercent: 10 },
          });
        }
      }
      return true;
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
