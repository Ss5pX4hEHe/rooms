"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChats } from "@/hooks/useChats";

export function NewChatDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { searchUsers, createDirectChat } = useChats();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function search(v: string) {
    setQ(v);
    if (v.length < 2) { setResults([]); return; }
    setLoading(true);
    setResults(await searchUsers(v));
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
          <h3 className="text-base font-semibold">Новый чат</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface text-tx2">✕</button>
        </div>
        <div className="p-4">
          <input value={q} onChange={(e) => search(e.target.value)} placeholder="Поиск по username..." className="w-full px-4 py-3 rounded-xl bg-surface border border-brd text-sm text-tx focus:border-pri transition-colors" autoFocus />
        </div>
        <div className="max-h-64 overflow-y-auto px-2 pb-3">
          {loading && <p className="text-sm text-tx2 text-center py-4">Поиск...</p>}
          {!loading && q.length >= 2 && results.length === 0 && <p className="text-sm text-tx2 text-center py-4">Не найдено</p>}
          {results.map((u) => (
            <button key={u.id} onClick={() => pick(u.id)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface transition-colors">
              <div className="w-10 h-10 rounded-full bg-pri flex items-center justify-center text-white text-sm font-semibold">{(u.display_name||u.username||"?").charAt(0).toUpperCase()}</div>
              <div className="text-left"><p className="text-sm font-medium">{u.display_name||u.username}</p><p className="text-xs text-tx2">@{u.username}</p></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
