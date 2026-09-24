"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const map: Record<string, string> = {
  d: "/",
  i: "/discover",
  o: "/opportunities",
  p: "/profile",
  r: "/resumes",
  q: "/queue",
  k: "/tracker",
  t: "/templates",
  s: "/settings",
};

export function KeyboardShortcuts() {
  const router = useRouter();
  const pending = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "g" || e.key === "G") {
        pending.current = true;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          pending.current = false;
        }, 800);
        return;
      }
      if (pending.current) {
        const href = map[e.key.toLowerCase()];
        if (href) {
          e.preventDefault();
          pending.current = false;
          router.push(href);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
