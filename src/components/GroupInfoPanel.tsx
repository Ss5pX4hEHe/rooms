"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChats } from "@/hooks/useChats";
import { useStore, isOnline, formatLastSeen } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import type { ChatMember } from "@/lib/types";

export function GroupInfoPanel({ chatId, isOwner, onClose }: { chatId: string; isOwner: boolean; onClose: () => void }) {
  const router = useRouter();
  const { getChatMembers, createInvite, removeMember, leaveChat, updateChatName, blockUser, loadOnlineStatuses } = useChats();
  const { user, onlineUsers, showToast } = useStore();
  const [members, setMembers] = useState<(ChatMember & { last_seen?: string })[]>([]);
  const [link, setLink] = useState("");
  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    getChatMembers(chatId).then((m) => {
      setMembers(m);
      loadOnlineStatuses(m.map((x: any) => x.user_id));
    });
  }, [chatId]);

  const onlineCount = members.filter(m => isOnline(onlineUsers[m.user_id])).length;

  async function makeLink() { const inv = await createInvite(chatId); if (inv) setLink(`${window.location.origin}/join/${inv.code}`); }
  async function copy() { await navigator.clipboard.writeText(link); showToast("Copied"); }
  async function kick(uid: string) { await removeMember(chatId, uid); setMembers(members.filter(m => m.user_id !== uid)); showToast("Removed"); }
  async function leave() { await leaveChat(chatId); router.push("/chat"); }
  async function saveName() { if (newName.trim()) { await updateChatName(chatId, newName.trim()); setEditName(false); showToast("Updated"); } }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-bg border border-brd rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[80vh] overflow-y-auto a-su" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-brd sticky top-0 bg-bg z-10">
          <div>
            <h3 className="text-base font-semibold">Info</h3>
            <p className="text-xs text-tx2">{members.length} members{onlineCount > 0 ? `, ${onlineCount} online` : ""}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface text-tx2">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {isOwner && <div>
            {editName
              ? <div className="flex gap-2"><input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveName()} className="flex-1 px-3 py-2 rounded-xl bg-surface border border-brd text-sm" autoFocus /><button onClick={saveName} className="px-4 py-2 rounded-xl bg-pri text-white text-sm">✓</button></div>
              : <button onClick={() => setEditName(true)} className="text-sm text-pri hover:underline">Rename group</button>}
          </div>}
          {isOwner && <div>
            <h4 className="text-sm font-medium mb-2">Invite link</h4>
            {link
              ? <div className="flex gap-2"><input readOnly value={link} className="flex-1 px-3 py-2 rounded-xl bg-surface border border-brd text-xs" /><button onClick={copy} className="px-4 py-2 rounded-xl bg-pri text-white text-sm shrink-0">Copy</button></div>
              : <button onClick={makeLink} className="px-4 py-2 rounded-xl bg-surface border border-brd text-sm hover:bg-surface-h transition-colors">Generate link</button>}
          </div>}
          <div>
            <h4 className="text-sm font-medium mb-2">Members</h4>
            <div className="space-y-1">
              {members.map(m => {
                const on = isOnline(onlineUsers[m.user_id]);
                return (
                  <div key={m.user_id} className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-surface transition-colors"
                    onClick={() => { onClose(); router.push(`/profile/${m.user_id}`); }}>
                    <Avatar src={m.avatar_url} name={m.display_name || m.username || "?"} size={36} online={on} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{m.display_name || m.username}</p>
                      <p className={`text-xs ${on ? "text-emerald-500" : "text-tx2"}`}>{m.role === "owner" ? "Owner · " : ""}{formatLastSeen(onlineUsers[m.user_id])}</p>
                    </div>
                    {m.user_id !== user?.id && isOwner && m.role !== "owner" && (
                      <button onClick={(e) => { e.stopPropagation(); kick(m.user_id); }} className="text-xs text-red-500 hover:underline">Remove</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {!isOwner && <button onClick={leave} className="w-full py-3 rounded-xl border border-red-500 text-red-500 text-sm hover:bg-red-500/10 transition-colors">Leave group</button>}
        </div>
      </div>
    </div>
  );
}
