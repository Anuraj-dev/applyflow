"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Briefcase, Plus, Trash2, Upload, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { OPP_TYPES, type Opportunity } from "@/lib/types";

const blank = {
  title: "",
  company: "",
  url: "",
  location: "",
  type: "full-time",
  notes: "",
  jdText: "",
  deadline: "",
};

export default function OpportunitiesPage() {
  const [rows, setRows] = useState<Opportunity[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const csvRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const data = await api<Opportunity[]>("/api/opportunities");
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    try {
      await api("/api/opportunities", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success("Opportunity added");
      setForm(blank);
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this opportunity and related applications?")) return;
    try {
      await api(`/api/opportunities/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      setSelected((s) => s.filter((x) => x !== id));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function importCsv(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/opportunities/import", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Import failed");
      return;
    }
    toast.success(`Imported ${data.imported} opportunities`);
    await load();
  }

  async function queueSelected() {
    if (!selected.length) return;
    try {
      const data = await api<{ count: number }>("/api/applications/batch", {
        method: "POST",
        body: JSON.stringify({ opportunityIds: selected, action: "queue", tailor: true }),
      });
      toast.success(`Queued ${data.count} applications with tailored packets`);
      setSelected([]);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed — complete profile first?");
    }
  }

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  const filtered = rows.filter((r) => (filter === "all" ? true : r.status === filter));

  return (
    <div>
      <PageHeader
        title="Opportunities"
        description="Add openings manually, import CSV, or paste a job description. Multi-select to queue."
        actions={
          <>
            <input
              ref={csvRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importCsv(f);
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => csvRef.current?.click()}>
              <Upload className="mr-2 size-4" /> CSV import
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>New opportunity</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  {(
                    [
                      ["title", "Title"],
                      ["company", "Company"],
                      ["url", "Apply URL"],
                      ["location", "Location"],
                      ["deadline", "Deadline"],
                    ] as const
                  ).map(([k, label]) => (
                    <div key={k} className="space-y-1">
                      <Label>{label}</Label>
                      <Input
                        type={k === "deadline" ? "date" : "text"}
                        value={form[k]}
                        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPP_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Job description (paste)</Label>
                    <Textarea
                      rows={6}
                      value={form.jdText}
                      onChange={(e) => setForm({ ...form, jdText: e.target.value })}
                      placeholder="Paste the JD text for better keyword matching…"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Notes</Label>
                    <Textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                  <Button onClick={create}>Save opportunity</Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["saved", "queued", "applied", "interview", "offer", "rejected", "ghosted"].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected.length > 0 && (
          <Button onClick={queueSelected}>
            Queue & tailor ({selected.length})
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !filtered.length ? (
        <EmptyState
          icon={Briefcase}
          title="No opportunities"
          description="Add a role manually or import a CSV with title,company,url,location,type,notes,deadline."
          actionLabel="Add opportunity"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <Card key={o.id} className="glow-card border-border/60 bg-card/70">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <Checkbox
                  checked={selected.includes(o.id)}
                  onCheckedChange={() => toggle(o.id)}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{o.title}</h3>
                    <StatusBadge status={o.status} />
                    <BadgeTone type={o.type} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {o.company}
                    {o.location ? ` · ${o.location}` : ""}
                  </p>
                  {o.jdText && (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{o.jdText}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {o.url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={o.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1 size-3.5" /> Open
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(o.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BadgeTone({ type }: { type: string }) {
  return (
    <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
      {type}
    </span>
  );
}
