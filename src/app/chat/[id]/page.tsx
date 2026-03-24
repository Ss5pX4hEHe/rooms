"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useMessages } from "@/hooks/useMessages";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import { GroupInfoPanel } from "@/components/GroupInfoPanel";
import { Avatar } from "@/components/Avatar";

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const chatId = id as string;
  const { user, messages, chats, pinnedMessages, typingUsers, setReplyTo, setEditMsg, setForwardMsg } = useStore();
  const setActive = useStore((s) => s.setActiveChatId);
  const { sendMessage, editMessage, deleteMessage, toggleReaction, pinMessage, unpinMessage, sendTyping } = useMessages(chatId);
  const endRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showPinned, setShowPinned] = useState(false);

  const chat = chats.find((c) => c.chat_id === chatId);
  const name = chat?.chat_type === "direct" ? (chat.other_display_name || chat.other_username || "Chat") : (chat?.chat_name || "Group");
  const isOwner = chat?.member_role === "owner" || chat?.member_role === "admin";
  const isAnn = chat?.chat_type === "announcement";
  const adminId = process.env.NEXT_PUBLIC_ADMIN_ID;
  const canSend = !isAnn || user?.id === adminId;
  const typing = typingUsers[chatId] || [];

  useEffect(() => { setActive(chatId); return () => setActive(null); }, [chatId, setActive]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-brd shrink-0">
        <button onClick={() => router.push("/chat")} className="md:hidden p-1 -ml-1 rounded-lg hover:bg-surface transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => chat?.chat_type !== "direct" && setShowInfo(!showInfo)}>
          <h2 className="text-base font-semibold truncate">{name}</h2>
          {typing.length > 0 && <span className="text-xs text-pri animate-pulse">{typing.join(", ")} typing...</span>}
          {typing.length === 0 && isAnn && <span className="text-xs text-amber-500">Announcement</span>}
          {typing.length === 0 && chat?.chat_type === "group" && <span className="text-xs text-tx2">Tap for details</span>}
        </div>
        <div className="flex items-center gap-1">
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

      {/* Pinned messages panel */}
      {showPinned && pinnedMessages.length > 0 && (
        <div className="px-4 py-2 border-b border-brd bg-surface/50 max-h-[200px] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-tx2">📌 Pinned ({pinnedMessages.length}/5)</p>
            <button onClick={() => setShowPinned(false)} className="text-xs text-tx2 hover:text-tx">Hide</button>
          </div>
          {pinnedMessages.map((p) => (
            <div key={p.id} className="flex items-start gap-2 py-1.5 border-b border-brd last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{p.sender_name}</p>
                <p className="text-xs text-tx2 truncate">{p.content}</p>
              </div>
              <button onClick={() => unpinMessage(p.id)} className="text-[10px] text-red-500 hover:underline shrink-0">Unpin</button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3" onClick={() => {}}>
        {messages.length === 0 && <div className="flex items-center justify-center h-full text-tx2 text-sm">No messages yet</div>}
        {messages.map((msg, i) => {
          const own = msg.sender_id === user?.id;
          const showSender = chat?.chat_type !== "direct" && !own && (i === 0 || messages[i - 1].sender_id !== msg.sender_id);
          return <MessageBubble key={msg.id} message={msg} isOwn={own} showSender={showSender}
            onReply={(m) => setReplyTo(m)} onEdit={(m) => setEditMsg(m)} onDelete={deleteMessage}
            onForward={(m) => setForwardMsg(m)} onReact={toggleReaction} onPin={pinMessage} />;
        })}
        <div ref={endRef} />
      </div>

      {canSend ? <MessageInput onSend={sendMessage} onEdit={editMessage} onSendTyping={sendTyping} /> : <div className="px-4 py-3 text-center text-sm text-tx2 border-t border-brd">Only admin can post here</div>}
      {showInfo && chat?.chat_type !== "direct" && <GroupInfoPanel chatId={chatId} isOwner={isOwner} onClose={() => setShowInfo(false)} />}
    </div>
  );
}
