"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, ListChecks, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { Application, ChecklistItem } from "@/lib/types";

export default function QueuePage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [active, setActive] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const all = await api<Application[]>("/api/applications");
      setApps(all.filter((a) => ["queued", "ready"].includes(a.status)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function markReady() {
    for (const id of selected) {
      await api(`/api/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ready" }),
      });
    }
    toast.success("Marked ready");
    setSelected([]);
    await load();
  }

  async function markApplied(app: Application, notes?: string) {
    const incomplete = (app.checklist || []).filter((c) => !c.done);
    if (incomplete.length) {
      const ok = confirm(
        `${incomplete.length} checklist item(s) still open. Mark Applied only after you submitted yourself on the company site. Continue?`
      );
      if (!ok) return;
    } else {
      const ok = confirm(
        "Confirm you already submitted this application yourself (ApplyFlow does not auto-submit). Mark as Applied?"
      );
      if (!ok) return;
    }
    await api(`/api/applications/${app.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "applied", applyNotes: notes ?? app.applyNotes }),
    });
    toast.success("Marked applied — nice work reviewing first");
    setActive(null);
    await load();
  }

  async function saveChecklist(app: Application, checklist: ChecklistItem[]) {
    const updated = await api<Application>(`/api/applications/${app.id}`, {
      method: "PATCH",
      body: JSON.stringify({ checklist }),
    });
    setActive(updated);
    setApps((rows) => rows.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
  }

  async function saveNotes(app: Application, applyNotes: string) {
    const updated = await api<Application>(`/api/applications/${app.id}`, {
      method: "PATCH",
      body: JSON.stringify({ applyNotes }),
    });
    setActive(updated);
  }

  return (
    <div>
      <div className="mb-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
        <strong className="font-semibold">Ethics note:</strong> ApplyFlow never auto-submits to LinkedIn, Indeed, or other boards.
        Open the apply URL, review your packet, then submit yourself and mark Applied here.
      </div>
      <PageHeader
        title="Application queue"
        description="Batch-review packets, open the apply URL yourself, complete the checklist, then mark Applied. ApplyFlow never auto-submits."
        actions={
          selected.length > 0 ? (
            <Button onClick={markReady}>
              <CheckCircle2 className="mr-2 size-4" /> Mark ready ({selected.length})
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !apps.length ? (
        <EmptyState
          icon={ListChecks}
          title="Queue is empty"
          description="Select opportunities and run Queue & tailor, or generate a packet in Tailor."
          actionLabel="Go to opportunities"
          actionHref="/opportunities"
        />
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <Card key={a.id} className="glow-card border-border/60 bg-card/70">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <Checkbox checked={selected.includes(a.id)} onCheckedChange={() => toggle(a.id)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{a.opportunity?.title}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{a.opportunity?.company}</p>
                  {a.resume && (
                    <p className="mt-1 text-xs text-muted-foreground">Resume: {a.resume.label}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.opportunity?.url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={a.opportunity.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1 size-3.5" /> Open apply URL
                      </a>
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setActive(a)}>
                    Review packet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {active.opportunity?.title} · {active.opportunity?.company}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={active.status} />
                  {active.opportunity?.url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={active.opportunity.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1 size-3.5" /> Open apply URL
                      </a>
                    </Button>
                  )}
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Checklist</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(active.checklist || []).map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={c.done}
                          onCheckedChange={(checked) => {
                            const checklist = active.checklist.map((x) =>
                              x.id === c.id ? { ...x, done: Boolean(checked) } : x
                            );
                            saveChecklist(active, checklist);
                          }}
                        />
                        {c.label}
                      </label>
                    ))}
                  </CardContent>
                </Card>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Cover letter</p>
                  <Textarea rows={10} value={active.coverLetter || ""} readOnly className="font-mono text-xs" />
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Highlights</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {(active.tailoredBullets || []).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Common answers</p>
                  <div className="space-y-2 text-sm">
                    {Object.entries(active.commonAnswers || {}).map(([q, a]) => (
                      <div key={q}>
                        <Badge variant="outline" className="mb-1">
                          {q}
                        </Badge>
                        <p>{a}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Apply notes</p>
                  <Textarea
                    rows={3}
                    defaultValue={active.applyNotes || ""}
                    onBlur={(e) => saveNotes(active, e.target.value)}
                    placeholder="Optional notes after you submit…"
                  />
                </div>

                <Button className="w-full" onClick={() => markApplied(active)}>
                  Mark as Applied
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
