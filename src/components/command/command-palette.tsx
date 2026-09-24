"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  User,
  FileText,
  Briefcase,
  Wand2,
  ListChecks,
  Kanban,
  Settings,
  FilePenLine,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const commands = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, keywords: "home g d" },
  { href: "/discover", label: "Discover jobs", icon: Compass, keywords: "search remotive greenhouse g i" },
  { href: "/profile", label: "Profile", icon: User, keywords: "g p" },
  { href: "/resumes", label: "Resumes", icon: FileText, keywords: "pdf g r" },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase, keywords: "jobs g o" },
  { href: "/templates", label: "Cover templates", icon: FilePenLine, keywords: "letter g t" },
  { href: "/tailor", label: "Tailor", icon: Wand2, keywords: "cover" },
  { href: "/queue", label: "Queue", icon: ListChecks, keywords: "review apply g q" },
  { href: "/tracker", label: "Tracker", icon: Kanban, keywords: "pipeline kanban g k" },
  { href: "/settings", label: "Settings", icon: Settings, keywords: "export theme g s" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("applyflow:open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("applyflow:open-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(needle) ||
        c.keywords.toLowerCase().includes(needle) ||
        c.href.includes(needle)
    );
  }, [q]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border/60 px-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter" && filtered[active]) {
                e.preventDefault();
                go(filtered[active].href);
              }
            }}
            placeholder="Jump to… (dashboard, discover, queue)"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {!filtered.length && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matches</li>
          )}
          {filtered.map((c, i) => {
            const Icon = c.icon;
            return (
              <li key={c.href}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    i === active ? "bg-primary/15 text-primary" : "hover:bg-muted/60"
                  )}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(c.href)}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1 font-medium">{c.label}</span>
                  <span className="text-[10px] text-muted-foreground">{c.href}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
