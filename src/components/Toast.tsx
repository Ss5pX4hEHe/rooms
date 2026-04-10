"use client";
import { useStore } from "@/lib/store";

export function Toast() {
  const toast = useStore((s) => s.toast);
  if (!toast) return null;

  // Parse toast: "SenderName: message" or just text
  const colonIdx = toast.indexOf(": ");
  const isMessage = colonIdx > 0 && colonIdx < 30;
  const sender = isMessage ? toast.slice(0, colonIdx) : null;
  const body = isMessage ? toast.slice(colonIdx + 2) : toast;
  const letter = sender ? sender.charAt(0).toUpperCase() : "ℹ";
  const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"];
  const color = sender ? colors[sender.charCodeAt(0) % colors.length] : "bg-pri";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 toast-slide-in pointer-events-none">
      <div className="flex items-center gap-3 bg-surface/95 backdrop-blur-sm border border-brd rounded-2xl px-4 py-3 shadow-xl shadow-black/10 max-w-sm">
        <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-semibold shrink-0`}>
          {letter}
        </div>
        <div className="flex-1 min-w-0">
          {sender && <p className="text-xs font-semibold text-tx truncate">{sender}</p>}
          <p className={`text-xs text-tx2 truncate ${!sender ? "text-sm text-tx" : ""}`}>{body}</p>
        </div>
      </div>
    </div>
  );
}
