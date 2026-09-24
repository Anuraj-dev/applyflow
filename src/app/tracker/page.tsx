"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Kanban, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { TRACKER_STATUSES, type Opportunity, type Stats } from "@/lib/types";

export default function TrackerPage() {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [o, s] = await Promise.all([
        api<Opportunity[]>("/api/opportunities"),
        api<Stats>("/api/stats"),
      ]);
      setOpps(o);
      setStats(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    try {
      await api(`/api/opportunities/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      // Keep applications in sync for pipeline statuses
      const apps = await api<Array<{ id: string; opportunityId: string }>>("/api/applications");
      const app = apps.find((a) => a.opportunityId === id);
      if (app && ["applied", "interview", "offer", "rejected", "ghosted", "queued"].includes(status)) {
        await api(`/api/applications/${app.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: status === "queued" ? "queued" : status }),
        });
      }
      toast.success(`Moved to ${status}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Tracker"
        description="Saved → Queued → Applied → Interview → Offer / Rejected / Ghosted. Update status as you hear back."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {TRACKER_STATUSES.map((s) => (
          <Card key={s} className="glow-card border-border/60 bg-card/70">
            <CardHeader className="pb-1">
              <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {s}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">
                {stats?.opportunities?.[s] ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !opps.length ? (
        <EmptyState
          icon={Kanban}
          title="Nothing to track"
          description="Add opportunities and move them through the pipeline as you apply."
          actionLabel="Add opportunity"
          actionHref="/opportunities"
        />
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max gap-4">
            {TRACKER_STATUSES.map((status) => {
              const column = opps.filter((o) => o.status === status);
              return (
                <div
                  key={status}
                  className="flex w-72 shrink-0 flex-col rounded-2xl border border-border/50 bg-background/30"
                >
                  <div className="flex items-center justify-between border-b border-border/40 px-3 py-3">
                    <StatusBadge status={status} />
                    <span className="text-xs text-muted-foreground">{column.length}</span>
                  </div>
                  <div className="flex flex-col gap-2 p-2">
                    {!column.length && (
                      <p className="px-2 py-6 text-center text-xs text-muted-foreground">Empty</p>
                    )}
                    {column.map((o) => (
                      <Card key={o.id} className="border-border/60 bg-card/80">
                        <CardContent className="space-y-3 p-3">
                          <div>
                            <p className="text-sm font-medium leading-snug">{o.title}</p>
                            <p className="text-xs text-muted-foreground">{o.company}</p>
                          </div>
                          <Select value={o.status} onValueChange={(v) => setStatus(o.id, v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TRACKER_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {o.url && (
                            <Button variant="ghost" size="sm" className="h-7 w-full text-xs" asChild>
                              <a href={o.url} target="_blank" rel="noreferrer">
                                <ExternalLink className="mr-1 size-3" /> Open URL
                              </a>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
