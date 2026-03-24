"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChats } from "@/hooks/useChats";

export function NewChatDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { searchUserExact, createDirectChat } = useChats();
  const [q, setQ] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function search() {
    const clean = q.trim().toLowerCase().replace(/^@/, "");
    if (clean.length < 2) return;
    setLoading(true);
    setSearched(true);
    const user = await searchUserExact(clean);
    setResult(user);
    setLoading(false);
  }

  async function pick(uid: string) {
    const id = await createDirectChat(uid);
    if (id) { onClose(); router.push(`/chat/${id}`); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-bg border border-brd rounded-2xl w-full max-w-md a-su" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-brd">
          <h3 className="text-base font-semibold">New Chat</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface text-tx2">✕</button>
        </div>
        <div className="p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tx2 text-sm">@</span>
              <input value={q} onChange={(e) => { setQ(e.target.value.replace(/[^a-zA-Z0-9_]/g, "")); setSearched(false); setResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="Enter exact username"
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-surface border border-brd text-sm text-tx focus:border-pri transition-colors" autoFocus />
            </div>
            <button onClick={search} disabled={loading || q.trim().length < 2}
              className="px-5 py-3 rounded-xl bg-pri text-white text-sm font-medium hover:bg-pri-h transition-colors disabled:opacity-50 shrink-0">
              {loading ? "..." : "Find"}
            </button>
          </div>
        </div>
        <div className="px-4 pb-4">
          {loading && <p className="text-sm text-tx2 text-center py-4">Searching...</p>}
          {!loading && searched && !result && <p className="text-sm text-tx2 text-center py-4">User not found. Check the username.</p>}
          {!loading && result && (
            <button onClick={() => pick(result.id)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface transition-colors border border-brd">
              <div className="w-11 h-11 rounded-full bg-pri flex items-center justify-center text-white text-sm font-semibold">{(result.display_name || result.username || "?").charAt(0).toUpperCase()}</div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium">{result.display_name || result.username}</p>
                <p className="text-xs text-tx2">@{result.username}</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pri"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
