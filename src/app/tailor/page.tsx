"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { Opportunity, Resume } from "@/lib/types";

type TailorResponse = {
  matchedKeywords: string[];
  coverLetter: string;
  tailoredBullets: string[];
  commonAnswers: Record<string, string>;
};

export default function TailorPage() {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [opportunityId, setOpportunityId] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [result, setResult] = useState<TailorResponse | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      api<Opportunity[]>("/api/opportunities"),
      api<Resume[]>("/api/resumes"),
    ])
      .then(([o, r]) => {
        setOpps(o);
        setResumes(r);
        const def = r.find((x) => x.isDefault === 1);
        if (def) setResumeId(def.id);
      })
      .catch((e) => toast.error(e.message));
  }, []);

  async function run() {
    if (!opportunityId) {
      toast.error("Pick an opportunity");
      return;
    }
    setBusy(true);
    try {
      const data = await api<TailorResponse>("/api/tailor", {
        method: "POST",
        body: JSON.stringify({ opportunityId, resumeId: resumeId || undefined, save: true }),
      });
      setResult(data);
      toast.success("Packet tailored and saved to queue");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tailor failed");
    } finally {
      setBusy(false);
    }
  }

  if (!opps.length) {
    return (
      <div>
        <PageHeader title="Tailor workspace" description="Match an opportunity to your profile and resume." />
        <EmptyState
          icon={Wand2}
          title="Nothing to tailor"
          description="Add an opportunity (with JD text for best results) first."
          actionLabel="Add opportunity"
          actionHref="/opportunities"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Tailor workspace"
        description="Deterministic keyword matching — covers letters and bullets from your profile only. No invented credentials."
      />

      <Card className="mb-6 glow-card border-border/60 bg-card/70">
        <CardContent className="grid gap-4 p-6 md:grid-cols-3 md:items-end">
          <div className="space-y-1.5 md:col-span-1">
            <Label>Opportunity</Label>
            <Select value={opportunityId} onValueChange={setOpportunityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select opening" />
              </SelectTrigger>
              <SelectContent>
                {opps.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.title} @ {o.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Resume</Label>
            <Select value={resumeId} onValueChange={setResumeId}>
              <SelectTrigger>
                <SelectValue placeholder="Default resume" />
              </SelectTrigger>
              <SelectContent>
                {resumes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                    {r.isDefault === 1 ? " (default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={run} disabled={busy}>
            <Wand2 className="mr-2 size-4" />
            {busy ? "Tailoring…" : "Generate packet"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glow-card border-border/60 bg-card/70 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Matched keywords</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {result.matchedKeywords.length ? (
                result.matchedKeywords.map((k) => (
                  <Badge key={k} variant="secondary">
                    {k}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No overlaps found — add skills to your profile or paste a fuller JD.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="glow-card border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Cover letter</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea rows={16} value={result.coverLetter} readOnly className="font-mono text-xs" />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="glow-card border-border/60 bg-card/70">
              <CardHeader>
                <CardTitle className="text-base">Bullet highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-5 text-sm">
                  {result.tailoredBullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="glow-card border-border/60 bg-card/70">
              <CardHeader>
                <CardTitle className="text-base">Common answers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(result.commonAnswers).map(([q, a]) => (
                  <div key={q}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{q}</p>
                    <p className="mt-1 text-sm">{a}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
