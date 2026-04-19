"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Sparkles, Trophy, ScrollText, ShieldCheck } from "lucide-react";

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <nav className="relative z-20 px-6 md:px-10 pt-6">
      <div className="glass rounded-[28px] px-4 md:px-6 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="h-9 w-9 rounded-2xl glass grid place-items-center group-hover:scale-105 transition-transform duration-500 shine">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-mono font-semibold text-[15px] tracking-tight">
              repoglass<span className="text-white/30 mx-1">/</span>
              <span className="text-gradient-aurora">ui</span>
            </span>
            <span className="micro-cap mt-1">Public · Main</span>
          </div>
        </Link>

        <div className="flex-1 mx-auto max-w-md hidden md:block">
          <div className="glass rounded-full flex items-center gap-3 px-4 py-2">
            <Search className="h-3.5 w-3.5 text-white/40" />
            <span className="text-[13px] text-white/35 font-mono">
              Search code, files, symbols…
            </span>
            <span className="ml-auto micro-cap !text-[9px]">⌘K</span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Link
            href="/leaderboard"
            className={`droplet px-3.5 py-1.5 text-[12px] flex items-center gap-1.5 transition-colors ${
              isActive("/leaderboard") ? "text-white" : "text-white/70 hover:text-white"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Leaderboard</span>
          </Link>
          <Link
            href="/rubric"
            className={`droplet px-3.5 py-1.5 text-[12px] hidden md:flex items-center gap-1.5 transition-colors ${
              isActive("/rubric") ? "text-white" : "text-white/70 hover:text-white"
            }`}
          >
            <ScrollText className="h-3.5 w-3.5" />
            Rubric
          </Link>
          <Link
            href="/admin"
            className={`droplet px-3.5 py-1.5 text-[12px] hidden sm:flex items-center gap-1.5 transition-colors ${
              isActive("/admin") ? "text-white" : "text-white/70 hover:text-white"
            }`}
            title="Admin console"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
