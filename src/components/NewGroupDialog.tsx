"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChats } from "@/hooks/useChats";

export function NewGroupDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { createGroup } = useChats();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setLoading(true);
    const id = await createGroup(name.trim());
    setLoading(false);
    if (id) { onClose(); router.push(`/chat/${id}`); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-bg border border-brd rounded-2xl w-full max-w-md a-su" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-brd">
          <h3 className="text-base font-semibold">Новая группа</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface text-tx2">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} placeholder="Название группы" maxLength={50}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-brd text-sm text-tx focus:border-pri transition-colors" autoFocus />
          <button onClick={create} disabled={loading||!name.trim()} className="w-full py-3 rounded-xl bg-pri text-white font-medium text-sm hover:bg-pri-h transition-colors disabled:opacity-50">{loading ? "..." : "Создать"}</button>
        </div>
      </div>
    </div>
  );
}
