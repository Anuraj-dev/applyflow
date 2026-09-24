"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Star, Trash2, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Resume } from "@/lib/types";

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [label, setLabel] = useState("General resume");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const rows = await api<Resume[]>("/api/resumes");
      setResumes(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("label", label || file.name);
      fd.append("isDefault", resumes.length === 0 ? "true" : "false");
      const res = await fetch("/api/resumes", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast.success("Resume uploaded");
      setLabel("General resume");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function setDefault(id: string) {
    try {
      await api(`/api/resumes/${id}/default`, { method: "POST" });
      toast.success("Default resume updated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this resume?")) return;
    try {
      await api(`/api/resumes/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Resume vault"
        description="Upload PDF versions, label them, and pick a default for packets."
      />

      <Card className="mb-8 glow-card border-border/60 bg-card/70">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. SWE Intern 2026"
            />
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
            <Button disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 size-4" />
              {uploading ? "Uploading…" : "Upload PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !resumes.length ? (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Upload a PDF to start building application packets."
          actionLabel="Upload PDF"
          onAction={() => fileRef.current?.click()}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resumes.map((r) => (
            <Card key={r.id} className="glow-card border-border/60 bg-card/70">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.filename}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(r.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  {r.isDefault === 1 && <Badge>Default</Badge>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/resumes/${r.id}/file`} target="_blank" rel="noreferrer">
                      View PDF
                    </a>
                  </Button>
                  {r.isDefault !== 1 && (
                    <Button variant="secondary" size="sm" onClick={() => setDefault(r.id)}>
                      <Star className="mr-1 size-3.5" /> Set default
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(r.id)}>
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
