"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Nav } from "@/components/nav";

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }
      toast.success("Welcome back, admin.");
      const from = sp.get("from") || "/admin";
      router.push(from);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="aurora-bg opacity-70" />
      <div className="absolute inset-0 grid-bg z-0" />
      <Nav />
      <section className="relative z-10 max-w-md mx-auto px-6 pt-20 pb-24">
        <div className="glass rounded-[28px] p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="h-9 w-9 rounded-xl glass grid place-items-center">
              <ShieldCheck className="h-4 w-4 text-[#00F5A0]" />
            </div>
            <div>
              <div className="micro-cap">Admin</div>
              <h1 className="text-xl font-semibold tracking-tight">
                Sign in to the console
              </h1>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="glass rounded-full flex items-center gap-3 px-4 h-11">
              <Mail className="h-4 w-4 text-white/45" />
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 border-0 focus:ring-0 text-[14px] font-mono placeholder:text-white/25 h-11 px-0"
              />
            </div>
            <div className="glass rounded-full flex items-center gap-3 px-4 h-11">
              <Lock className="h-4 w-4 text-white/45" />
              <Input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 border-0 focus:ring-0 text-[14px] font-mono placeholder:text-white/25 h-11 px-0"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="droplet droplet-solid w-full h-11 text-sm font-semibold flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-[11px] text-white/35 font-mono leading-relaxed">
            Access restricted. Session is valid for 24 hours.
          </div>
        </div>
      </section>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
