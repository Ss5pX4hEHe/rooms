"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChats } from "@/hooks/useChats";
import { useStore } from "@/lib/store";
import type { ChatMember } from "@/lib/types";

export function GroupInfoPanel({ chatId, isOwner, onClose }: { chatId: string; isOwner: boolean; onClose: () => void }) {
  const router = useRouter();
  const { getChatMembers, createInvite, removeMember, leaveChat, updateChatName } = useChats();
  const { user, showToast } = useStore();
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [link, setLink] = useState("");
  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => { getChatMembers(chatId).then(setMembers); }, [chatId]);

  async function makeLink() {
    const inv = await createInvite(chatId);
    if (inv) setLink(`${window.location.origin}/join/${inv.code}`);
  }
  async function copy() { await navigator.clipboard.writeText(link); showToast("Скопировано"); }
  async function kick(uid: string) { await removeMember(chatId, uid); setMembers(members.filter(m => m.user_id !== uid)); showToast("Удалён"); }
  async function leave() { await leaveChat(chatId); router.push("/chat"); }
  async function saveName() { if (newName.trim()) { await updateChatName(chatId, newName.trim()); setEditName(false); showToast("Обновлено"); } }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-bg border border-brd rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[80vh] overflow-y-auto a-su" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-brd sticky top-0 bg-bg z-10">
          <h3 className="text-base font-semibold">Информация</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface text-tx2">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {isOwner && <div>
            {editName
              ? <div className="flex gap-2"><input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveName()} className="flex-1 px-3 py-2 rounded-xl bg-surface border border-brd text-sm" autoFocus/><button onClick={saveName} className="px-4 py-2 rounded-xl bg-pri text-white text-sm">✓</button></div>
              : <button onClick={()=>setEditName(true)} className="text-sm text-pri hover:underline">Изменить название</button>
            }
          </div>}

          {isOwner && <div>
            <h4 className="text-sm font-medium mb-2">Пригласительная ссылка</h4>
            {link
              ? <div className="flex gap-2"><input readOnly value={link} className="flex-1 px-3 py-2 rounded-xl bg-surface border border-brd text-xs"/><button onClick={copy} className="px-4 py-2 rounded-xl bg-pri text-white text-sm shrink-0">Копировать</button></div>
              : <button onClick={makeLink} className="px-4 py-2 rounded-xl bg-surface border border-brd text-sm hover:bg-surface-h transition-colors">Создать ссылку</button>
            }
          </div>}

          <div>
            <h4 className="text-sm font-medium mb-2">Участники ({members.length})</h4>
            <div className="space-y-1">
              {members.map(m => (
                <div key={m.user_id} className="flex items-center gap-3 px-3 py-2 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-pri/20 text-pri flex items-center justify-center text-xs font-semibold">{(m.display_name||m.username||"?").charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm truncate">{m.display_name||m.username}</p><p className="text-xs text-tx2">{m.role==="owner"?"Владелец":"Участник"}</p></div>
                  {isOwner && m.user_id !== user?.id && m.role !== "owner" && <button onClick={()=>kick(m.user_id)} className="text-xs text-red-500 hover:underline">Удалить</button>}
                </div>
              ))}
            </div>
          </div>

          {!isOwner && <button onClick={leave} className="w-full py-3 rounded-xl border border-red-500 text-red-500 text-sm hover:bg-red-500/10 transition-colors">Покинуть группу</button>}
        </div>
      </div>
    </div>
  );
}
