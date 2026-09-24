"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

export function AccentLoader() {
  useEffect(() => {
    api<{ accent?: string }>("/api/settings")
      .then((s) => {
        if (s.accent) document.documentElement.dataset.accent = s.accent;
      })
      .catch(() => {});
  }, []);
  return null;
}
