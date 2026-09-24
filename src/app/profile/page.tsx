"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { EducationItem, Profile } from "@/lib/types";

const empty: Profile = {
  id: "default",
  name: "",
  email: "",
  phone: "",
  linkedin: "",
  github: "",
  portfolio: "",
  education: [],
  skills: [],
  workAuth: "",
  preferredRoles: [],
  preferredLocations: [],
  salaryFloor: null,
  notes: "",
  createdAt: null,
  updatedAt: null,
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(empty);
  const [skillInput, setSkillInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [locInput, setLocInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Profile>("/api/profile")
      .then((p) => setProfile({ ...empty, ...p }))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  function addTag(
    field: "skills" | "preferredRoles" | "preferredLocations",
    value: string,
    clear: (v: string) => void
  ) {
    const v = value.trim();
    if (!v || profile[field].includes(v)) return;
    setProfile({ ...profile, [field]: [...profile[field], v] });
    clear("");
  }

  function removeTag(
    field: "skills" | "preferredRoles" | "preferredLocations",
    value: string
  ) {
    setProfile({ ...profile, [field]: profile[field].filter((x) => x !== value) });
  }

  function updateEdu(i: number, patch: Partial<EducationItem>) {
    setProfile({
      ...profile,
      education: profile.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    });
  }

  async function save() {
    setSaving(true);
    try {
      const saved = await api<Profile>("/api/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      setProfile({ ...empty, ...saved });
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading profile…</p>;

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Source of truth for tailoring. Only these facts are used — nothing is invented."
        actions={
          <Button onClick={save} disabled={saving}>
            <Save className="mr-2 size-4" />
            {saving ? "Saving…" : "Save profile"}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glow-card border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Basics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["name", "Full name"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["linkedin", "LinkedIn URL"],
                ["github", "GitHub URL"],
                ["portfolio", "Portfolio URL"],
                ["workAuth", "Work authorization"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={profile[key] || ""}
                  onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="salaryFloor">Salary floor (USD)</Label>
              <Input
                id="salaryFloor"
                type="number"
                value={profile.salaryFloor ?? ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    salaryFloor: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={profile.notes || ""}
                onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glow-card border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Add skill and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag("skills", skillInput, setSkillInput);
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={() => addTag("skills", skillInput, setSkillInput)}>
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1 pr-1">
                    {s}
                    <button type="button" className="rounded-full p-0.5 hover:bg-background/40" onClick={() => removeTag("skills", s)}>
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glow-card border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Preferred roles</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag("preferredRoles", roleInput, setRoleInput);
                      }
                    }}
                    placeholder="e.g. Software Engineer Intern"
                  />
                  <Button type="button" variant="secondary" onClick={() => addTag("preferredRoles", roleInput, setRoleInput)}>
                    <Plus className="size-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.preferredRoles.map((s) => (
                    <Badge key={s} variant="outline" className="gap-1 pr-1">
                      {s}
                      <button type="button" onClick={() => removeTag("preferredRoles", s)}>
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Preferred locations</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    value={locInput}
                    onChange={(e) => setLocInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag("preferredLocations", locInput, setLocInput);
                      }
                    }}
                    placeholder="e.g. Remote, NYC"
                  />
                  <Button type="button" variant="secondary" onClick={() => addTag("preferredLocations", locInput, setLocInput)}>
                    <Plus className="size-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.preferredLocations.map((s) => (
                    <Badge key={s} variant="outline" className="gap-1 pr-1">
                      {s}
                      <button type="button" onClick={() => removeTag("preferredLocations", s)}>
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glow-card border-border/60 bg-card/70 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Education</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setProfile({
                  ...profile,
                  education: [...profile.education, { school: "", degree: "", field: "", year: "" }],
                })
              }
            >
              <Plus className="mr-1 size-4" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {!profile.education.length && (
              <p className="text-sm text-muted-foreground">No education entries yet.</p>
            )}
            {profile.education.map((e, i) => (
              <div key={i} className="grid gap-3 rounded-xl border border-border/50 bg-background/30 p-4 sm:grid-cols-4">
                {(
                  [
                    ["school", "School"],
                    ["degree", "Degree"],
                    ["field", "Field"],
                    ["year", "Year"],
                  ] as const
                ).map(([k, label]) => (
                  <div key={k} className="space-y-1">
                    <Label>{label}</Label>
                    <Input value={e[k] || ""} onChange={(ev) => updateEdu(i, { [k]: ev.target.value })} />
                  </div>
                ))}
                <div className="sm:col-span-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() =>
                      setProfile({
                        ...profile,
                        education: profile.education.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
