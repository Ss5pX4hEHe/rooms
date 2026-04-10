"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore, isOnline, formatLastSeen } from "@/lib/store";
import { useMessages } from "@/hooks/useMessages";
import { useChats } from "@/hooks/useChats";
import { supabase } from "@/lib/supabase";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import { GroupInfoPanel } from "@/components/GroupInfoPanel";
import { DateDivider } from "@/components/DateDivider";
import { ChatSkeleton } from "@/components/Skeleton";
import { isSameDay } from "date-fns";

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const chatId = id as string;
  const { user, messages, chats, pinnedMessages, typingUsers, onlineUsers, setReplyTo, setEditMsg, setForwardMsg } = useStore();
  const clearUnread = useStore((s) => s.clearUnread);
  const setActive = useStore((s) => s.setActiveChatId);
  const { sendMessage, editMessage, deleteMessage, toggleReaction, pinMessage, unpinMessage, sendTyping } = useMessages(chatId);
  const { loadOnlineStatuses, getChatMembers, loadChats } = useChats();
  const endRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);

  const chat = chats.find((c) => c.chat_id === chatId);
  const name = chat?.chat_type === "direct" ? (chat.other_display_name || chat.other_username || "Chat") : (chat?.chat_name || "Group");
  const isOwner = chat?.member_role === "owner" || chat?.member_role === "admin";
  const isAnn = chat?.chat_type === "announcement";
  const adminId = process.env.NEXT_PUBLIC_ADMIN_ID;
  const canSend = !isAnn || user?.id === adminId;
  const typing = typingUsers[chatId] || [];
  const otherOnline = chat?.other_user_id ? isOnline(onlineUsers[chat.other_user_id]) : false;
  const otherLastSeen = chat?.other_user_id ? formatLastSeen(onlineUsers[chat.other_user_id]) : "";

  // UNREAD FIX: clear badge immediately, update DB, then reload after DB is updated
  useEffect(() => {
    setActive(chatId);
    setLoading(true);
    setTimeout(() => setLoading(false), 400);

    // Step 1: instantly clear badge in UI
    clearUnread(chatId);

    if (user) {
      // Step 2: update DB (await), then reload chats so server data also has 0
      (async () => {
        await supabase.from("chat_members")
          .update({ last_read_at: new Date().toISOString() })
          .eq("chat_id", chatId)
          .eq("user_id", user.id);
        // Step 3: now reload - server will return 0 unread because last_read_at is fresh
        await loadChats();
        // Step 4: clear again just in case of race condition
        clearUnread(chatId);
      })();
    }

    return () => { setActive(null); };
  }, [chatId, user?.id]);

  // When new messages arrive while in chat, keep badge at 0
  useEffect(() => {
    if (!user || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender_id !== user.id) {
      clearUnread(chatId);
      supabase.from("chat_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("chat_id", chatId)
        .eq("user_id", user.id)
        .then();
    }
  }, [messages.length]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  useEffect(() => {
    if (chat?.other_user_id) loadOnlineStatuses([chat.other_user_id]);
    if (chat?.chat_type === "group") {
      getChatMembers(chatId).then((members) => {
        setMemberCount(members.length);
        const ids = members.map((m: any) => m.user_id);
        loadOnlineStatuses(ids).then(() => {
          const s = useStore.getState();
          setOnlineCount(ids.filter((id: string) => isOnline(s.onlineUsers[id])).length);
        });
      });
    }
    const interval = setInterval(() => { if (chat?.other_user_id) loadOnlineStatuses([chat.other_user_id]); }, 30000);
    return () => clearInterval(interval);
  }, [chatId, chat?.other_user_id, chat?.chat_type]);

  const filtered = searchQ ? messages.filter(m => m.content.toLowerCase().includes(searchQ.toLowerCase())) : messages;

  let statusLine = "";
  if (typing.length > 0) statusLine = `${typing.join(", ")} typing...`;
  else if (chat?.chat_type === "direct") statusLine = otherLastSeen;
  else if (chat?.chat_type === "group" && memberCount > 0) statusLine = `${memberCount} members${onlineCount > 0 ? `, ${onlineCount} online` : ""}`;
  else if (isAnn) statusLine = "Announcement";

  if (loading) return <ChatSkeleton />;

  return (
    <div className="flex flex-col h-full" translate="no">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-brd shrink-0">
        <button onClick={() => router.push("/chat")} className="md:hidden p-1 -ml-1 rounded-lg hover:bg-surface transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => chat?.chat_type !== "direct" ? setShowInfo(!showInfo) : chat.other_user_id && router.push(`/profile/${chat.other_user_id}`)}>
          <h2 className="text-base font-semibold truncate">{name}</h2>
          <span className={`text-xs ${typing.length > 0 ? "text-pri animate-pulse" : otherOnline ? "text-emerald-500" : "text-tx2"}`}>{statusLine}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-lg hover:bg-surface transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          {pinnedMessages.length > 0 && (
            <button onClick={() => setShowPinned(!showPinned)} className="p-2 rounded-lg hover:bg-surface transition-colors relative">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/></svg>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-pri text-white text-[9px] flex items-center justify-center">{pinnedMessages.length}</span>
            </button>
          )}
          {chat?.chat_type !== "direct" && (
            <button onClick={() => setShowInfo(!showInfo)} className="p-2 rounded-lg hover:bg-surface transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </button>
          )}
        </div>
      </div>
      {showSearch && (
        <div className="px-4 py-2 border-b border-brd a-fi">
          <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search messages..." className="w-full px-3 py-2 rounded-xl bg-surface border border-brd text-sm text-tx focus:border-pri transition-colors" autoFocus />
        </div>
      )}
      {showPinned && pinnedMessages.length > 0 && (
        <div className="px-4 py-2 border-b border-brd bg-surface/50 max-h-[200px] overflow-y-auto a-fi">
          <div className="flex items-center justify-between mb-2"><p className="text-xs font-semibold text-tx2">📌 Pinned ({pinnedMessages.length}/5)</p><button onClick={() => setShowPinned(false)} className="text-xs text-tx2 hover:text-tx">Hide</button></div>
          {pinnedMessages.map((p) => (
            <div key={p.id} className="flex items-start gap-2 py-1.5 border-b border-brd last:border-0">
              <div className="flex-1 min-w-0"><p className="text-xs font-medium">{p.sender_name}</p><p className="text-xs text-tx2 truncate">{p.content}</p></div>
              <button onClick={() => unpinMessage(p.id)} className="text-[10px] text-red-500 hover:underline shrink-0">Unpin</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {filtered.length === 0 && <div className="flex items-center justify-center h-full text-tx2 text-sm">{searchQ ? "No matches" : "No messages yet"}</div>}
        {filtered.map((msg, i) => {
          const own = msg.sender_id === user?.id;
          const showSender = chat?.chat_type !== "direct" && !own && (i === 0 || filtered[i - 1].sender_id !== msg.sender_id);
          const showDate = i === 0 || !isSameDay(new Date(msg.created_at), new Date(filtered[i - 1].created_at));
          return (
            <div key={msg.id}>
              {showDate && <DateDivider date={msg.created_at} />}
              <MessageBubble message={msg} isOwn={own} showSender={showSender}
                onReply={(m) => setReplyTo(m)} onEdit={(m) => setEditMsg(m)} onDelete={deleteMessage}
                onForward={(m) => setForwardMsg(m)} onReact={toggleReaction} onPin={pinMessage}
                onProfileTap={(uid) => router.push(`/profile/${uid}`)} />
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {canSend ? <MessageInput onSend={sendMessage} onEdit={editMessage} onSendTyping={sendTyping} /> : <div className="px-4 py-3 text-center text-sm text-tx2 border-t border-brd">Only admin can post here</div>}
      {showInfo && chat?.chat_type !== "direct" && <GroupInfoPanel chatId={chatId} isOwner={isOwner} onClose={() => setShowInfo(false)} />}
    </div>
  );
}
