"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload, Palette, Database } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";

type Settings = {
  accent: string;
  confetti: boolean;
  denseLists: boolean;
};

const ACCENTS = [
  { id: "indigo", label: "Indigo" },
  { id: "violet", label: "Violet" },
  { id: "cyan", label: "Cyan" },
  { id: "emerald", label: "Emerald" },
  { id: "rose", label: "Rose" },
];

function applyAccent(accent: string) {
  document.documentElement.dataset.accent = accent;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<Settings>("/api/settings")
      .then((s) => {
        setSettings(s);
        applyAccent(s.accent);
      })
      .catch((e) => toast.error(e.message));
  }, []);

  async function save( partial: Partial<Settings>) {
    if (!settings) return;
    const next = { ...settings, ...partial };
    setSettings(next);
    if (partial.accent) applyAccent(partial.accent);
    try {
      await api("/api/settings", { method: "PUT", body: JSON.stringify(next) });
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function restore(file: File) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await api<{ importedOpps: number; importedTemplates: number }>(
        "/api/import-backup",
        { method: "POST", body: JSON.stringify(json) }
      );
      toast.success(
        `Restored ${res.importedOpps} opportunities, ${res.importedTemplates} templates`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Restore failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Theme, local backup, and workspace preferences. No accounts or paywalls — your data stays on disk."
        breadcrumbs={[{ label: "Settings" }]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glow-card border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="size-4 text-primary" /> Appearance
            </CardTitle>
            <CardDescription>Accent color and delightful feedback.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Accent</Label>
              <Select
                value={settings?.accent || "indigo"}
                onValueChange={(v) => save({ accent: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCENTS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Confetti on Mark Applied</Label>
                <p className="text-xs text-muted-foreground">A tiny celebration when you finish.</p>
              </div>
              <Switch
                checked={Boolean(settings?.confetti)}
                onCheckedChange={(v) => save({ confetti: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Dense lists</Label>
                <p className="text-xs text-muted-foreground">Tighter spacing on long boards.</p>
              </div>
              <Switch
                checked={Boolean(settings?.denseLists)}
                onCheckedChange={(v) => save({ denseLists: v })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glow-card border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="size-4 text-primary" /> Data
            </CardTitle>
            <CardDescription>Export JSON/CSV backups or restore opportunities.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <a href="/api/export?format=json" download>
                <Download className="mr-1.5 size-4" /> Export JSON
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/api/export?format=csv" download>
                <Download className="mr-1.5 size-4" /> Opportunities CSV
              </a>
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1.5 size-4" /> Restore JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) restore(f);
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-border/50 bg-muted/20">
        <CardContent className="space-y-2 p-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Keyboard</p>
          <p>
            <kbd className="rounded border px-1">⌘/Ctrl+K</kbd> command palette ·{" "}
            <kbd className="rounded border px-1">g</kbd> then{" "}
            <kbd className="rounded border px-1">d/i/o/q/k/s</kbd> to jump.
          </p>
          <p className="pt-2 text-xs">
            Soft multi-user ready: rows carry <code>workspace_id</code> / <code>user_id</code> ={" "}
            <code>local</code>. Auth can plug in later — no paywall now.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
