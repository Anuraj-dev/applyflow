"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Briefcase,
  FileText,
  ListChecks,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Stats } from "@/lib/types";

const tiles = [
  { key: "saved", label: "Saved" },
  { key: "queued", label: "Queued" },
  { key: "applied", label: "Applied" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "rejected", label: "Rejected" },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Stats>("/api/stats")
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your ethical apply cockpit — prepare, tailor, review, then submit yourself."
        actions={
          <Button asChild>
            <Link href="/opportunities">
              Add opportunity <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        }
      />

      {stats && (
        <Card className="mb-8 glow-card border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Next best action</p>
              <p className="mt-1 text-sm text-foreground/90">
                {!stats.totals.profileComplete
                  ? "Complete your profile so tailoring uses real skills and education."
                  : stats.totals.resumes === 0
                    ? "Upload a PDF resume to attach to application packets."
                    : stats.totals.opportunities === 0
                      ? "Add your first opportunity (or import the sample CSV)."
                      : (stats.applications?.queued || 0) > 0 || (stats.applications?.ready || 0) > 0
                        ? "Review queued packets, open the apply URL yourself, then mark Applied."
                        : "Select opportunities and Queue & tailor to prepare packets."}
              </p>
            </div>
            <Button asChild>
              <Link
                href={
                  !stats.totals.profileComplete
                    ? "/profile"
                    : stats.totals.resumes === 0
                      ? "/resumes"
                      : stats.totals.opportunities === 0
                        ? "/opportunities"
                        : (stats.applications?.queued || 0) > 0 || (stats.applications?.ready || 0) > 0
                          ? "/queue"
                          : "/opportunities"
                }
              >
                Continue <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t, i) => (
          <motion.div
            key={t.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="glow-card border-border/60 bg-card/70 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">
                  {stats?.opportunities?.[t.key] ?? 0}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glow-card border-border/60 bg-card/70 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tracker">Open tracker</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!stats?.recent?.length ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
                <Sparkles className="size-8 text-primary/60" />
                <p className="text-sm">No applications yet. Queue your first packet from Opportunities.</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/opportunities">Browse opportunities</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {stats.recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.title || "Application"}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.company}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glow-card border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Quick links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {[
                { href: "/profile", icon: User, label: "Complete profile", hint: stats?.totals.profileComplete ? "Ready" : "Needs setup" },
                { href: "/resumes", icon: FileText, label: "Resume vault", hint: `${stats?.totals.resumes ?? 0} files` },
                { href: "/queue", icon: ListChecks, label: "Review queue", hint: `${stats?.applications?.ready ?? 0} ready` },
                { href: "/opportunities", icon: Briefcase, label: "Opportunities", hint: `${stats?.totals.opportunities ?? 0} total` },
              ].map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 px-3 py-3 transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <q.icon className="size-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{q.label}</p>
                    <p className="text-xs text-muted-foreground">{q.hint}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
