"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Compass,
  Search,
  Download,
  ExternalLink,
  BookmarkPlus,
  Building2,
  Filter,
  Loader2,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";

type Job = {
  externalId: string;
  title: string;
  company: string;
  url: string;
  location: string;
  type: string;
  description: string;
  source: string;
  tags?: string[];
  alreadySaved?: boolean;
};

type SavedSearch = {
  id: string;
  name: string;
  source: string;
  keywords: string;
  location: string;
  remoteOnly: boolean;
  internship: boolean;
};

const SOURCES = [
  { id: "remotive", label: "Remotive", hint: "Remote jobs · free" },
  { id: "arbeitnow", label: "Arbeitnow", hint: "EU/global · free" },
  { id: "greenhouse", label: "Greenhouse", hint: "Company board URL" },
  { id: "lever", label: "Lever", hint: "Company board slug" },
  { id: "usajobs", label: "USAJobs", hint: "Optional API key" },
  { id: "adzuna", label: "Adzuna", hint: "Optional API key" },
] as const;

const sourceBadge: Record<string, string> = {
  remotive: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  arbeitnow: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  greenhouse: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  lever: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  usajobs: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  adzuna: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
};

export default function DiscoverPage() {
  const [source, setSource] = useState("remotive");
  const [keywords, setKeywords] = useState("software intern");
  const [location, setLocation] = useState("");
  const [board, setBoard] = useState("stripe");
  const [internship, setInternship] = useState(true);
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchName, setSearchName] = useState("");

  const loadSearches = useCallback(async () => {
    try {
      const data = await api<SavedSearch[]>("/api/saved-searches");
      setSavedSearches(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadSearches();
  }, [loadSearches]);

  async function search() {
    setLoading(true);
    setNote(null);
    setSelected([]);
    try {
      const params = new URLSearchParams({
        source,
        keywords,
        location,
        internship: internship ? "1" : "0",
        remote: remoteOnly ? "1" : "0",
      });
      if (source === "greenhouse" || source === "lever") {
        if (!board.trim()) {
          toast.error("Enter a company board slug or URL");
          setLoading(false);
          return;
        }
        params.set("board", board.trim());
      }
      const data = await api<{ jobs: Job[]; note?: string; count: number }>(
        `/api/discover?${params}`
      );
      setJobs(data.jobs || []);
      setNote(data.note || null);
      toast.success(`Found ${data.count} roles`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function toggleAllVisible() {
    const importable = jobs.filter((j) => !j.alreadySaved).map((j) => j.externalId);
    if (selected.length === importable.length) setSelected([]);
    else setSelected(importable);
  }

  async function importSelected() {
    const picked = jobs.filter((j) => selected.includes(j.externalId) && !j.alreadySaved);
    if (!picked.length) {
      toast.message("Select unsaved jobs first");
      return;
    }
    try {
      const res = await api<{ imported: number; skipped: number }>("/api/discover/import", {
        method: "POST",
        body: JSON.stringify({ jobs: picked }),
      });
      toast.success(`Imported ${res.imported} · skipped ${res.skipped} duplicates`);
      setJobs((prev) =>
        prev.map((j) =>
          selected.includes(j.externalId) ? { ...j, alreadySaved: true } : j
        )
      );
      setSelected([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    }
  }

  async function queueImported() {
    // Import then queue — user flows to Opportunities; shortcut: import + batch queue by refetching
    await importSelected();
    toast.message("Imported as Saved — open Opportunities to multi-select → Queue");
  }

  async function saveSearch() {
    if (!searchName.trim()) {
      toast.error("Name this search");
      return;
    }
    try {
      await api("/api/saved-searches", {
        method: "POST",
        body: JSON.stringify({
          name: searchName,
          source,
          keywords,
          location,
          remoteOnly,
          internship,
        }),
      });
      toast.success("Saved search");
      setSearchName("");
      await loadSearches();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function applySearch(s: SavedSearch) {
    setSource(s.source);
    setKeywords(s.keywords);
    setLocation(s.location);
    setRemoteOnly(s.remoteOnly);
    setInternship(s.internship);
    toast.message(`Loaded “${s.name}” — hit Search`);
  }

  async function deleteSearch(id: string) {
    await api(`/api/saved-searches/${id}`, { method: "DELETE" });
    await loadSearches();
  }

  const needsBoard = source === "greenhouse" || source === "lever";
  const selectedCount = useMemo(() => selected.length, [selected]);

  return (
    <div>
      <PageHeader
        title="Discover"
        description="Pull live listings from free public APIs and company boards. Import to Saved, then Queue — you still submit yourself."
        actions={
          <Button onClick={importSelected} disabled={!selectedCount}>
            <Download className="mr-1.5 size-4" />
            Import {selectedCount || ""} selected
          </Button>
        }
      />

      <Card className="mb-6 glow-card border-border/60 bg-card/60 backdrop-blur-md">
        <CardContent className="grid gap-4 p-5 md:grid-cols-12">
          <div className="md:col-span-3 space-y-2">
            <Label>Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label} — {s.hint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label>Keywords</Label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="intern, junior, react…"
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Optional"
            />
          </div>
          {needsBoard ? (
            <div className="md:col-span-4 space-y-2">
              <Label>{source === "greenhouse" ? "Greenhouse slug / URL" : "Lever slug / URL"}</Label>
              <Input
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                placeholder={
                  source === "greenhouse"
                    ? "stripe or boards.greenhouse.io/stripe"
                    : "company slug from jobs.lever.co/{slug}"
                }
              />
            </div>
          ) : (
            <div className="md:col-span-4 flex flex-wrap items-end gap-4 pb-1">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={internship} onCheckedChange={(v) => setInternship(Boolean(v))} />
                Internship / junior filter
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={remoteOnly} onCheckedChange={(v) => setRemoteOnly(Boolean(v))} />
                Prefer remote
              </label>
            </div>
          )}
          <div className="md:col-span-12 flex flex-wrap items-center gap-2">
            <Button onClick={search} disabled={loading}>
              {loading ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Search className="mr-1.5 size-4" />}
              Search
            </Button>
            <Button variant="secondary" onClick={toggleAllVisible} disabled={!jobs.length}>
              Select all unsaved
            </Button>
            <Button variant="outline" onClick={queueImported} disabled={!selectedCount}>
              <Sparkles className="mr-1.5 size-4" />
              Import → Opportunities
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Input
                className="h-9 w-40"
                placeholder="Save as…"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              <Button variant="ghost" size="sm" onClick={saveSearch}>
                <BookmarkPlus className="mr-1 size-4" /> Save search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {savedSearches.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="size-3.5" /> Saved:
          </span>
          {savedSearches.map((s) => (
            <Badge
              key={s.id}
              variant="outline"
              className="cursor-pointer gap-1.5 py-1 hover:bg-primary/10"
              onClick={() => applySearch(s)}
            >
              {s.name}
              <button
                className="ml-1 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSearch(s.id);
                }}
                aria-label="Delete saved search"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      {note && (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {note}
        </p>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-border/40 bg-card/40"
            />
          ))}
        </div>
      ) : !jobs.length ? (
        <EmptyState
          icon={Compass}
          title="Search to discover roles"
          description="Try Remotive with “software intern”, or paste a Greenhouse board like stripe."
          actionLabel="Run Remotive search"
          onAction={search}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((j, i) => {
            const checked = selected.includes(j.externalId);
            return (
              <motion.div
                key={j.externalId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
              >
                <Card
                  className={`group h-full border-border/50 bg-card/70 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10 ${
                    checked ? "ring-1 ring-primary/50" : ""
                  } ${j.alreadySaved ? "opacity-60" : ""}`}
                >
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={checked}
                        disabled={j.alreadySaved}
                        onCheckedChange={() => toggle(j.externalId)}
                        aria-label={`Select ${j.title}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${
                              sourceBadge[j.source] || "bg-muted text-muted-foreground"
                            }`}
                          >
                            {j.source}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {j.type}
                          </Badge>
                          {j.alreadySaved && (
                            <Badge variant="outline" className="text-[10px]">
                              Saved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold leading-snug">{j.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="size-3" />
                          {j.company}
                          {j.location ? ` · ${j.location}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="line-clamp-3 text-xs text-muted-foreground/90">
                      {j.description || "No description preview."}
                    </p>
                    {j.url && (
                      <a
                        href={j.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        View posting <ExternalLink className="size-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
