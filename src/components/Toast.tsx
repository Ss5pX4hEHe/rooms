"use client";
import { useStore } from "@/lib/store";
export function Toast() {
  const toast = useStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 a-ti">
      <div className="bg-surface border border-brd rounded-xl px-4 py-3 shadow-lg text-sm text-tx max-w-sm">{toast}</div>
    </div>
  );
}
