import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  saved: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  queued: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  ready: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  applied: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  interview: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  offer: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  ghosted: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", styles[status] || styles.saved)}
    >
      {status}
    </Badge>
  );
}
