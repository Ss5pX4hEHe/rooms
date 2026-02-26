"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useMessages } from "@/hooks/useMessages";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import { GroupInfoPanel } from "@/components/GroupInfoPanel";

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const chatId = id as string;
  const { user } = useStore();
  const messages = useStore((s) => s.messages);
  const chats = useStore((s) => s.chats);
  const setActive = useStore((s) => s.setActiveChatId);
  const { sendMessage } = useMessages(chatId);
  const endRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);

  const chat = chats.find((c) => c.chat_id === chatId);
  const name = chat?.chat_type === "direct" ? (chat.other_display_name || chat.other_username || "Чат") : (chat?.chat_name || "Группа");
  const isOwner = chat?.member_role === "owner" || chat?.member_role === "admin";
  const isAnn = chat?.chat_type === "announcement";
  const adminId = process.env.NEXT_PUBLIC_ADMIN_ID;
  const canSend = !isAnn || user?.id === adminId;

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
          {isAnn && <span className="text-xs text-amber-500">Announcement</span>}
          {chat?.chat_type === "group" && <span className="text-xs text-tx2">Нажми для деталей</span>}
        </div>
        {chat?.chat_type !== "direct" && (
          <button onClick={() => setShowInfo(!showInfo)} className="p-2 rounded-lg hover:bg-surface transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && <div className="flex items-center justify-center h-full text-tx2 text-sm">Нет сообщений</div>}
        {messages.map((msg, i) => {
          const own = msg.sender_id === user?.id;
          const showSender = chat?.chat_type !== "direct" && !own && (i === 0 || messages[i-1].sender_id !== msg.sender_id);
          return <MessageBubble key={msg.id} message={msg} isOwn={own} showSender={showSender} />;
        })}
        <div ref={endRef} />
      </div>

      {canSend ? <MessageInput onSend={sendMessage} /> : <div className="px-4 py-3 text-center text-sm text-tx2 border-t border-brd">Только администратор может писать</div>}
      {showInfo && chat?.chat_type !== "direct" && <GroupInfoPanel chatId={chatId} isOwner={isOwner} onClose={() => setShowInfo(false)} />}
    </div>
  );
}
