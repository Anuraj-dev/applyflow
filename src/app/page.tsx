"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  ListChecks,
  User,
  ArrowRight,
  Compass,
  Activity,
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

  const maxFunnel = Math.max(1, ...(stats?.funnel || []).map((f) => f.count));
  const maxWeek = Math.max(1, ...(stats?.weeklyApplied || []).map((w) => w.count));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your apply command center — discover, tailor, review, submit yourself, track."
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href="/discover">
                <Compass className="mr-1 size-4" /> Discover
              </Link>
            </Button>
            <Button asChild>
              <Link href="/opportunities">
                Opportunities <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        }
      />

      {stats && (
        <Card className="mb-8 glow-card border-primary/30 bg-gradient-to-br from-primary/10 via-card/80 to-violet-500/5">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Next best action
              </p>
              <p className="mt-1 text-sm text-foreground/90">
                {!stats.totals.profileComplete
                  ? "Complete your profile so tailoring uses real skills and education."
                  : stats.totals.resumes === 0
                    ? "Upload a PDF resume to attach to application packets."
                    : stats.totals.opportunities === 0
                      ? "Discover roles (Remotive / Greenhouse) or add manually."
                      : (stats.applications?.queued || 0) > 0 ||
                          (stats.applications?.ready || 0) > 0
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
                        ? "/discover"
                        : (stats.applications?.queued || 0) > 0 ||
                            (stats.applications?.ready || 0) > 0
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="glow-card border-border/60 bg-card/70 transition hover:-translate-y-0.5">
              <CardHeader className="pb-1">
                <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">
                  {stats?.opportunities?.[t.key] ?? "—"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <Card className="glow-card border-border/60 bg-card/70 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(stats?.funnel || []).map((f) => (
              <div key={f.stage} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize text-muted-foreground">{f.stage}</span>
                  <span className="tabular-nums font-medium">{f.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{ width: `${(f.count / maxFunnel) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {!stats?.funnel?.length && (
              <p className="text-xs text-muted-foreground">No funnel data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="glow-card border-border/60 bg-card/70 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Weekly applied</CardTitle>
            <span className="text-xs text-muted-foreground">
              Response rate{" "}
              <strong className="text-foreground">{stats?.responseRate ?? 0}%</strong>
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex h-24 items-end gap-1.5">
              {(stats?.weeklyApplied || []).map((w) => (
                <div key={w.label} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-400"
                    style={{ height: `${Math.max(4, (w.count / maxWeek) * 100)}%` }}
                    title={`${w.count}`}
                  />
                  <span className="text-[9px] text-muted-foreground">{w.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glow-card border-border/60 bg-card/70 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats?.bySource || {}).length === 0 && (
              <p className="text-xs text-muted-foreground">Import from Discover to see breakdown.</p>
            )}
            {Object.entries(stats?.bySource || {})
              .sort((a, b) => b[1] - a[1])
              .map(([src, n]) => (
                <div key={src} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{src}</span>
                  <span className="tabular-nums font-medium">{n}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/profile", icon: User, label: "Profile", hint: "Skills & education" },
          { href: "/resumes", icon: FileText, label: "Resumes", hint: `${stats?.totals.resumes ?? 0} uploaded` },
          { href: "/discover", icon: Compass, label: "Discover", hint: "Live job APIs" },
          { href: "/queue", icon: ListChecks, label: "Queue", hint: "Review packets" },
        ].map((q) => (
          <Link key={q.href} href={q.href}>
            <Card className="h-full border-border/60 bg-card/60 transition hover:-translate-y-0.5 hover:border-primary/40">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <q.icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{q.label}</p>
                  <p className="text-xs text-muted-foreground">{q.hint}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glow-card border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-sm">Recent applications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!stats?.recent?.length && (
              <p className="text-sm text-muted-foreground">Queue something to see activity here.</p>
            )}
            {stats?.recent?.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.title || "Application"}</p>
                  <p className="text-xs text-muted-foreground">{r.company}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glow-card border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="size-4" /> Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!stats?.activity?.length && (
              <p className="text-sm text-muted-foreground">Imports and status changes will land here.</p>
            )}
            {stats?.activity?.map((a) => (
              <div key={a.id} className="border-l-2 border-primary/30 pl-3 text-sm">
                <p className="text-foreground/90">{a.message}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString()} · {a.kind}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
