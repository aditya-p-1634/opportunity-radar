"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Radar,
  Menu,
  X,
  Bell,
  Search,
  LayoutDashboard,
  LogOut,
  User,
  Shield,
  Bookmark,
  Send,
  Building2,
  Briefcase,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Radar className="h-4 w-4" />
          </span>
          <span>Opportunity Radar</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-zinc-600 dark:text-zinc-400 md:flex">
          <Link href="/#features" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
            Features
          </Link>
          <Link href="/#how" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
            How it works
          </Link>
          <Link href="/institutions" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
            Institutions
          </Link>
          <Link href="/opportunities" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
            Explore
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <Link
              href="/dashboard"
              className="inline-flex h-8 items-center rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden h-8 items-center rounded-lg px-3 text-sm font-medium hover:bg-zinc-100 sm:inline-flex dark:hover:bg-zinc-800"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-8 items-center rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Get started
              </Link>
            </>
          )}
          <button className="p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="space-y-3 border-t border-zinc-200 px-4 py-4 text-sm dark:border-zinc-800 md:hidden">
          <Link href="/#features" className="block" onClick={() => setOpen(false)}>
            Features
          </Link>
          <Link href="/institutions" className="block" onClick={() => setOpen(false)}>
            Institutions
          </Link>
          <Link href="/opportunities" className="block" onClick={() => setOpen(false)}>
            Explore
          </Link>
          {!session && (
            <Link href="/login" className="block" onClick={() => setOpen(false)}>
              Log in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

const appLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/search", label: "Search", icon: Search },
  { href: "/institutions", label: "Institutions", icon: Building2 },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/applied", label: "Applied", icon: Send },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50 lg:block">
      <div className="flex h-full flex-col gap-1 p-4">
        <Link href="/dashboard" className="mb-4 flex items-center gap-2 px-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Radar className="h-4 w-4" />
          </span>
          Radar
        </Link>
        {appLinks.map((l) => {
          const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-white font-medium text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 hover:bg-white hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          );
        })}
        {session?.user?.role === "ADMIN" && (
          <Link
            href="/admin"
            className={cn(
              "mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
              pathname.startsWith("/admin")
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                : "text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
            )}
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        )}
        <div className="mt-auto space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="truncate px-3 text-xs text-zinc-500">{session?.user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  );
}

export function AppTopbar() {
  return (
    <div className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 lg:px-6">
      <Link
        href="/search"
        className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <Search className="h-4 w-4" />
        Search opportunities, institutions...
      </Link>
      <div className="ml-4 flex items-center gap-2">
        <ThemeToggle />
        <Link href="/notifications">
          <Button variant="ghost" size="icon-sm" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
