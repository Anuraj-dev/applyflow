"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FilePenLine, Plus, Trash2, Star } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

type Template = {
  id: string;
  name: string;
  body: string;
  isDefault: number;
};

export default function TemplatesPage() {
  const [rows, setRows] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState(
    "Dear {{company}} Hiring Team,\n\nI am applying for {{title}}…\n\n{{name}}"
  );
  const [editId, setEditId] = useState<string | null>(null);

  async function load() {
    setRows(await api<Template[]>("/api/templates"));
  }

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, []);

  async function save() {
    try {
      if (editId) {
        await api(`/api/templates/${editId}`, {
          method: "PUT",
          body: JSON.stringify({ name, body }),
        });
        toast.success("Template updated");
      } else {
        await api("/api/templates", {
          method: "POST",
          body: JSON.stringify({ name, body }),
        });
        toast.success("Template created");
      }
      setOpen(false);
      setEditId(null);
      setName("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function setDefault(id: string) {
    await api(`/api/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify({ isDefault: true }),
    });
    toast.success("Default set");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this template?")) return;
    await api(`/api/templates/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <PageHeader
        title="Cover templates"
        description="Reusable letter skeletons. Placeholders: {{name}}, {{title}}, {{company}}, {{skills}}."
        breadcrumbs={[{ label: "Templates" }]}
        actions={
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setEditId(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditId(null);
                  setName("");
                  setBody(
                    "Dear {{company}} Hiring Team,\n\nI am applying for {{title}}…\n\n{{name}}"
                  );
                }}
              >
                <Plus className="mr-1.5 size-4" /> New template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editId ? "Edit template" : "New template"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Body</Label>
                  <Textarea
                    rows={12}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <Button onClick={save} className="w-full">
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {!rows.length ? (
        <EmptyState
          icon={FilePenLine}
          title="No templates yet"
          description="Create a few cover letter skeletons for internships and new-grad roles."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((t) => (
            <Card key={t.id} className="glow-card border-border/60 bg-card/70">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-base">
                  {t.name}{" "}
                  {t.isDefault ? (
                    <span className="ml-1 text-xs font-normal text-amber-300">default</span>
                  ) : null}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => setDefault(t.id)}
                    aria-label="Set default"
                  >
                    <Star className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => {
                      setEditId(t.id);
                      setName(t.name);
                      setBody(t.body);
                      setOpen(true);
                    }}
                  >
                    <FilePenLine className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive"
                    onClick={() => remove(t.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  {t.body}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
