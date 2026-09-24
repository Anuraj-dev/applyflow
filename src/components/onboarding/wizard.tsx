"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Sparkles, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Stats } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProfileLite = { onboardingDone?: number | boolean; name?: string };

export function OnboardingWizard() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, p] = await Promise.all([
          api<Stats>("/api/stats"),
          api<ProfileLite>("/api/profile"),
        ]);
        if (cancelled) return;
        setStats(s);
        const done = Boolean(p?.onboardingDone) || Boolean(s.totals.onboardingDone);
        const hasProgress =
          s.totals.profileComplete || s.totals.resumes > 0 || s.totals.opportunities > 0;
        if (!done && !hasProgress) setOpen(true);
        else if (!done && hasProgress && !(s.totals.profileComplete && s.totals.resumes > 0 && s.totals.opportunities > 0)) {
          setOpen(true);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function dismiss() {
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ onboardingDone: true }),
      });
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open || !stats) return null;

  const steps = [
    {
      label: "Complete profile",
      done: stats.totals.profileComplete,
      href: "/profile",
    },
    {
      label: "Upload a resume PDF",
      done: stats.totals.resumes > 0,
      href: "/resumes",
    },
    {
      label: "Import or add an opportunity",
      done: stats.totals.opportunities > 0,
      href: "/discover",
    },
    {
      label: "Queue a packet & review",
      done: (stats.applications?.queued || 0) + (stats.applications?.ready || 0) + (stats.applications?.applied || 0) > 0,
      href: "/queue",
    },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(100%-2rem,360px)]">
      <Card className="glow-card border-primary/30 bg-card/95 shadow-2xl backdrop-blur-xl">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Get started
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Four steps to your first ethical apply loop.
            </p>
          </div>
          <Button variant="ghost" size="icon" className="size-7" onClick={dismiss} aria-label="Dismiss">
            <X className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          {steps.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50"
            >
              {s.done ? (
                <CheckCircle2 className="size-4 text-emerald-400" />
              ) : (
                <Circle className="size-4 text-muted-foreground" />
              )}
              <span className={s.done ? "text-muted-foreground line-through" : ""}>{s.label}</span>
            </Link>
          ))}
          <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={dismiss}>
            I&apos;ll explore on my own
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
