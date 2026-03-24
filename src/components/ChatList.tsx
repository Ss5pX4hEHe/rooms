"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore, isOnline } from "@/lib/store";
import { useChats } from "@/hooks/useChats";
import { Avatar } from "@/components/Avatar";
import { ListSkeleton } from "@/components/Skeleton";
import { formatDistanceToNow } from "date-fns";

export function ChatList() {
  const router = useRouter();
  const pathname = usePathname();
  const chats = useStore((s) => s.chats);
  const onlineUsers = useStore((s) => s.onlineUsers);
  const { deleteChat, loadOnlineStatuses } = useChats();
  const [menuId, setMenuId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const ids = chats.filter(c => c.other_user_id).map(c => c.other_user_id!);
    if (ids.length) loadOnlineStatuses(ids);
    setLoaded(true);
    const iv = setInterval(() => { if (ids.length) loadOnlineStatuses(ids); }, 30000);
    return () => clearInterval(iv);
  }, [chats.map(c => c.chat_id).join(",")]);

  if (!loaded && chats.length === 0) return <ListSkeleton />;

  if (chats.length === 0) return (
    <div className="flex-1 flex items-center justify-center p-8 text-tx2 text-sm text-center">
      <div>
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <p className="font-medium mb-1">No chats yet</p><p className="text-xs">Start a conversation</p>
      </div>
    </div>
  );

  const directs = chats.filter(c => c.chat_type === "direct");
  const groups = chats.filter(c => c.chat_type === "group");
  const announcements = chats.filter(c => c.chat_type === "announcement");

  function renderChat(c: typeof chats[0]) {
    const active = pathname === `/chat/${c.chat_id}`;
    const ann = c.chat_type === "announcement";
    const name = c.chat_type === "direct" ? (c.other_display_name || c.other_username || "User") : (c.chat_name || "Group");
    const time = c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false }) : "";
    const online = c.other_user_id ? isOnline(onlineUsers[c.other_user_id]) : undefined;

    return (
      <div key={c.chat_id} className="relative group">
        <button onClick={() => { setMenuId(null); router.push(`/chat/${c.chat_id}`); }}
          onContextMenu={(e) => { e.preventDefault(); setMenuId(menuId === c.chat_id ? null : c.chat_id); }}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all rounded-xl mx-1 ${active ? "bg-pri/10" : "hover:bg-surface"}`}>
          <Avatar src={null} name={ann ? "📢" : name} size={44} online={c.chat_type === "direct" ? online : undefined} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate">{name}</span>
              {time && <span className="text-[11px] text-tx2 ml-2 shrink-0">{time}</span>}
            </div>
            {c.last_message_content && <p className="text-xs text-tx2 truncate mt-0.5">{c.last_message_content}</p>}
          </div>
          {c.unread_count > 0 && <div className="w-5 h-5 rounded-full bg-pri text-white text-[10px] flex items-center justify-center font-bold shrink-0">{c.unread_count > 9 ? "9+" : c.unread_count}</div>}
        </button>
        {menuId === c.chat_id && (
          <div className="absolute right-4 top-12 z-50 bg-surface border border-brd rounded-xl shadow-lg py-1 a-fi min-w-[160px]">
            <button onClick={async () => { setMenuId(null); if (confirm("Delete this chat?")) { await deleteChat(c.chat_id); if (active) router.push("/chat"); } }}
              className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-surface-h transition-colors flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Delete chat
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-2" onClick={() => setMenuId(null)}>
      {announcements.length > 0 && <div className="mb-1">{announcements.map(renderChat)}</div>}
      {directs.length > 0 && <div className="mb-1"><p className="px-5 py-2 text-[11px] font-semibold text-tx2 uppercase tracking-wider">Direct Messages</p>{directs.map(renderChat)}</div>}
      {groups.length > 0 && <div className="mb-1"><p className="px-5 py-2 text-[11px] font-semibold text-tx2 uppercase tracking-wider">Groups</p>{groups.map(renderChat)}</div>}
    </div>
  );
}
