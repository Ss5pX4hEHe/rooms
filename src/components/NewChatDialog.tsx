"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChats } from "@/hooks/useChats";
import { Avatar } from "@/components/Avatar";
import { isOnline, formatLastSeen } from "@/lib/store";

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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4" onClick={onClose}>
      <div className="bg-bg border border-brd rounded-t-2xl md:rounded-2xl w-full md:max-w-md a-su safe-bottom" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-brd">
          <h3 className="text-base font-semibold">New Chat</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface text-tx2 transition-colors">✕</button>
        </div>

        {/* Search */}
        <div className="p-4">
          <p className="text-xs text-tx2 mb-3">Enter the exact username to find someone</p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-tx2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input value={q} onChange={(e) => { setQ(e.target.value.replace(/[^a-zA-Z0-9_]/g, "")); setSearched(false); setResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="username"
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-surface border border-brd text-sm text-tx focus:border-pri transition-colors" autoFocus />
            </div>
            <button onClick={search} disabled={loading || q.trim().length < 2}
              className="px-5 py-3 rounded-xl bg-pri text-white text-sm font-medium hover:bg-pri-h transition-colors disabled:opacity-50 shrink-0 active:scale-95">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : "Find"}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="px-4 pb-4 min-h-[80px]">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-2 border-pri border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {!loading && searched && !result && (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mx-auto mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-tx2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
              </div>
              <p className="text-sm text-tx2">User not found</p>
              <p className="text-xs text-tx2 mt-0.5">Check the username and try again</p>
            </div>
          )}
          {!loading && result && (
            <button onClick={() => pick(result.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-brd hover:bg-surface active:bg-surface-h transition-colors">
              <Avatar src={result.avatar_url} name={result.display_name || result.username || "?"} size={48}
                online={result.last_seen ? isOnline(result.last_seen) : false} />
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-semibold">{result.display_name || result.username}</p>
                <p className="text-xs text-tx2">@{result.username}</p>
                {result.bio && <p className="text-xs text-tx2 truncate mt-0.5">{result.bio}</p>}
              </div>
              <div className="shrink-0 w-10 h-10 rounded-full bg-pri flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
            </button>
          )}
          {!loading && !searched && (
            <div className="text-center py-4">
              <p className="text-xs text-tx2">Type a username and tap Find</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
