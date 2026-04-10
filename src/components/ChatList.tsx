"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore, isOnline } from "@/lib/store";
import { useChats } from "@/hooks/useChats";
import { Avatar } from "@/components/Avatar";
import { ListSkeleton } from "@/components/Skeleton";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase";

function SwipeChat({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const [offset, setOffset] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  function onTouchStart(e: React.TouchEvent) { startX.current = e.touches[0].clientX; swiping.current = true; }
  function onTouchMove(e: React.TouchEvent) {
    if (!swiping.current) return;
    const diff = startX.current - e.touches[0].clientX;
    currentX.current = diff;
    if (diff > 0 && diff < 120) setOffset(diff);
  }
  function onTouchEnd() {
    swiping.current = false;
    if (currentX.current > 70) { setOffset(80); setShowConfirm(true); }
    else { setOffset(0); setShowConfirm(false); }
    currentX.current = 0;
  }
  function cancel() { setOffset(0); setShowConfirm(false); }
  return (
    <div className="relative overflow-hidden">
      {offset > 0 && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3" style={{ width: 80 }}>
          {showConfirm ? (
            <button onClick={() => { onDelete(); cancel(); }} className="w-full h-[calc(100%-8px)] rounded-xl bg-red-500 text-white text-xs font-semibold flex items-center justify-center active:bg-red-600">Delete</button>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </div>
          )}
        </div>
      )}
      <div style={{ transform: `translateX(-${offset}px)`, transition: swiping.current ? "none" : "transform 0.2s ease-out" }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onClick={() => { if (showConfirm) cancel(); }}>
        {children}
      </div>
    </div>
  );
}

export function ChatList() {
  const router = useRouter();
  const pathname = usePathname();
  const chats = useStore((s) => s.chats);
  const user = useStore((s) => s.user);
  const onlineUsers = useStore((s) => s.onlineUsers);
  const { deleteChat, loadOnlineStatuses, createDirectChat } = useChats();
  const [menuId, setMenuId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [avatars, setAvatars] = useState<{ [userId: string]: string | null }>({});
  const [foundUser, setFoundUser] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const ids = chats.filter(c => c.other_user_id).map(c => c.other_user_id!);
    if (ids.length) {
      loadOnlineStatuses(ids);
      supabase.from("profiles").select("id, avatar_url").in("id", ids).then(({ data }) => {
        const map: { [id: string]: string | null } = {};
        (data || []).forEach((p: any) => { map[p.id] = p.avatar_url; });
        setAvatars(map);
      });
    }
    setLoaded(true);
    const iv = setInterval(() => { if (ids.length) loadOnlineStatuses(ids); }, 30000);
    return () => clearInterval(iv);
  }, [chats.map(c => c.chat_id).join(",")]);

  async function searchNewUser(query: string) {
    if (query.length < 2) { setFoundUser(null); setSearched(false); return; }
    setSearching(true); setSearched(true);
    const clean = query.toLowerCase().trim().replace(/^@/, "");
    const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url, bio, last_seen")
      .eq("username", clean).neq("id", user?.id || "").single();
    setFoundUser(data || null); setSearching(false);
  }

  async function startChat(userId: string) {
    const chatId = await createDirectChat(userId);
    if (chatId) { setSearch(""); setFoundUser(null); setSearched(false); router.push(`/chat/${chatId}`); }
  }

  function handleSearchChange(v: string) { setSearch(v); setFoundUser(null); setSearched(false); }

  if (!loaded && chats.length === 0) return <ListSkeleton />;

  const q = search.toLowerCase().trim();
  const filtered = q ? chats.filter(c => {
    const name = c.chat_type === "direct" ? (c.other_display_name || c.other_username || "") : (c.chat_name || "");
    return name.toLowerCase().includes(q) || (c.last_message_content || "").toLowerCase().includes(q);
  }) : chats;
  const directs = filtered.filter(c => c.chat_type === "direct");
  const groups = filtered.filter(c => c.chat_type === "group");
  const announcements = filtered.filter(c => c.chat_type === "announcement");
  const hasResults = filtered.length > 0;

  function renderChat(c: typeof chats[0], isLast: boolean) {
    const active = pathname === `/chat/${c.chat_id}`;
    const ann = c.chat_type === "announcement";
    const name = c.chat_type === "direct" ? (c.other_display_name || c.other_username || "User") : (c.chat_name || "Group");
    const time = c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false }) : "";
    const online = c.other_user_id ? isOnline(onlineUsers[c.other_user_id]) : undefined;
    const avatarUrl = c.other_user_id ? avatars[c.other_user_id] : null;
    const chatContent = (
      <div className="px-2">
        <button onClick={() => { setMenuId(null); router.push(`/chat/${c.chat_id}`); }}
          onContextMenu={(e) => { e.preventDefault(); setMenuId(menuId === c.chat_id ? null : c.chat_id); }}
          className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-xl transition-all duration-150 ${active ? "bg-pri/10" : "hover:bg-surface active:bg-surface-h"}`}>
          <Avatar src={ann ? null : avatarUrl} name={ann ? "📢" : name} size={46} online={c.chat_type === "direct" ? online : undefined} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium truncate ${active ? "text-pri" : ""}`}>{name}</span>
              {time && <span className="text-[11px] text-tx2 ml-2 shrink-0">{time}</span>}
            </div>
            {c.last_message_content && <p className="text-xs text-tx2 truncate mt-0.5">{c.last_message_content}</p>}
          </div>
          {c.unread_count > 0 && <div className="w-5 h-5 rounded-full bg-pri text-white text-[10px] flex items-center justify-center font-bold shrink-0 shadow-sm shadow-pri/30">{c.unread_count > 9 ? "9+" : c.unread_count}</div>}
        </button>
        {!isLast && !active && <div className="ml-16 mr-2 h-px bg-brd/50" />}
        {menuId === c.chat_id && (<><div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} /><div className="absolute right-4 top-14 z-50 bg-surface border border-brd rounded-xl shadow-lg py-1 a-fi min-w-[160px]"><button onClick={async () => { setMenuId(null); if (confirm("Delete this chat?")) { await deleteChat(c.chat_id); if (active) router.push("/chat"); } }} className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-surface-h transition-colors flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>Delete chat</button></div></>)}
      </div>
    );
    return (
      <div key={c.chat_id} className="relative group">
        <div className="md:hidden"><SwipeChat onDelete={async () => { await deleteChat(c.chat_id); if (active) router.push("/chat"); }}>{chatContent}</SwipeChat></div>
        <div className="hidden md:block">{chatContent}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" onClick={() => setMenuId(null)}>
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-tx2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && search.trim().length >= 2) searchNewUser(search); }}
            placeholder="Search chats or find @username"
            className="w-full pl-9 pr-16 py-2.5 rounded-xl bg-surface border border-brd text-sm text-tx placeholder:text-tx2 focus:border-pri transition-colors" />
          {search && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button onClick={() => searchNewUser(search)} className="px-2.5 py-1 rounded-lg bg-pri text-white text-[10px] font-semibold hover:bg-pri-h transition-colors">Find</button>
              <button onClick={() => { setSearch(""); setFoundUser(null); setSearched(false); }} className="px-1.5 py-1 text-tx2 hover:text-tx text-sm">✕</button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {q && searched && !searching && foundUser && (
          <div className="px-3 mb-3 a-fi">
            <p className="px-2 py-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">New contact</p>
            <button onClick={() => startChat(foundUser.id)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-pri/30 bg-pri/5 hover:bg-pri/10 active:bg-pri/15 transition-colors">
              <Avatar src={foundUser.avatar_url} name={foundUser.display_name || foundUser.username || "?"} size={46} online={foundUser.last_seen ? isOnline(foundUser.last_seen) : false} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{foundUser.display_name || foundUser.username}</p>
                <p className="text-xs text-tx2">@{foundUser.username}</p>
                {foundUser.bio && <p className="text-xs text-tx2 truncate mt-0.5">{foundUser.bio}</p>}
              </div>
              <div className="shrink-0 w-9 h-9 rounded-full bg-pri flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
            </button>
          </div>
        )}
        {q && searching && <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-pri border-t-transparent rounded-full animate-spin" /></div>}
        {q && searched && !searching && !foundUser && !hasResults && <div className="text-center py-6 text-tx2"><p className="text-sm">No results</p><p className="text-xs mt-0.5">Check the username</p></div>}
        {q && !searched && !hasResults && <div className="text-center py-6 text-sm text-tx2">Press <span className="text-pri font-medium">Find</span> or Enter to search users</div>}
        {!q && chats.length === 0 && (
          <div className="flex items-center justify-center p-8 text-tx2 text-sm text-center"><div>
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
            <p className="font-medium mb-1">No chats yet</p><p className="text-xs">Type @username above to find someone</p>
          </div></div>
        )}
        {announcements.length > 0 && <div className="mb-2">{announcements.map((c, i) => renderChat(c, i === announcements.length - 1))}</div>}
        {directs.length > 0 && <div className="mb-2"><p className="px-5 py-2 text-[10px] font-bold text-tx2 uppercase tracking-widest">Direct Messages</p>{directs.map((c, i) => renderChat(c, i === directs.length - 1))}</div>}
        {groups.length > 0 && <div className="mb-2"><p className="px-5 py-2 text-[10px] font-bold text-tx2 uppercase tracking-widest">Groups</p>{groups.map((c, i) => renderChat(c, i === groups.length - 1))}</div>}
      </div>
    </div>
  );
}
