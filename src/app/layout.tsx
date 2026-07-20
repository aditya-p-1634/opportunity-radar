import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Opportunity Radar — Never Miss a Research Opportunity",
    template: "%s · Opportunity Radar",
  },
  description:
    "AI-powered opportunity intelligence for students. Discover research internships, scholarships, fellowships, and more from top universities and labs — ranked for you.",
  keywords: [
    "research internship",
    "scholarship",
    "fellowship",
    "summer school",
    "student opportunities",
    "IIT",
    "MIT",
    "Stanford",
  ],
  openGraph: {
    title: "Opportunity Radar",
    description: "AI-powered opportunity intelligence for students.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
