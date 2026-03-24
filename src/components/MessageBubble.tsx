"use client";
import { useState } from "react";
import type { Message } from "@/lib/types";
import { format } from "date-fns";
import { Avatar } from "./Avatar";

const EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "😢"];

interface Props {
  message: Message;
  isOwn: boolean;
  showSender: boolean;
  onReply: (m: Message) => void;
  onEdit: (m: Message) => void;
  onDelete: (id: string) => void;
  onForward: (m: Message) => void;
  onReact: (msgId: string, emoji: string) => void;
  onPin: (msgId: string) => void;
}

export function MessageBubble({ message: m, isOwn, showSender, onReply, onEdit, onDelete, onForward, onReact, onPin }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const time = format(new Date(m.created_at), "HH:mm");

  if (m.deleted) {
    return (
      <div className={`flex mb-1 ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[75%] px-3 py-2 rounded-2xl bg-surface/50 text-tx2 italic text-xs">Message deleted</div>
      </div>
    );
  }

  return (
    <div className={`flex mb-1 a-fi group ${isOwn ? "justify-end" : "justify-start"}`}
      onContextMenu={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}>

      <div className="relative max-w-[75%] md:max-w-[60%]">
        {/* Avatar for others in groups */}
        {showSender && !isOwn && (
          <div className="flex items-center gap-2 mb-0.5 ml-1">
            <Avatar src={m.sender_avatar_url} name={m.sender_display_name || m.sender_username || "?"} size={20} />
            <span className="text-xs font-semibold text-pri">{m.sender_display_name || m.sender_username}</span>
          </div>
        )}

        {/* Forward indicator */}
        {m.forwarded_from && (
          <p className="text-[10px] text-tx2 italic mb-0.5 ml-3">↗ Forwarded</p>
        )}

        <div className={`px-3 py-2 rounded-2xl ${isOwn ? "bg-bub-own text-white rounded-br-md" : "bg-bub-other text-tx rounded-bl-md"}`}>
          {/* Reply preview */}
          {m.reply_to && m.reply_content && (
            <div className={`mb-1.5 pl-2 border-l-2 ${isOwn ? "border-white/40" : "border-pri/50"} text-xs`}>
              <p className={`font-semibold ${isOwn ? "text-white/80" : "text-pri"}`}>{m.reply_sender || "User"}</p>
              <p className={`truncate ${isOwn ? "text-white/60" : "text-tx2"}`}>{m.reply_content}</p>
            </div>
          )}

          <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>

          <div className={`flex items-center justify-end gap-1 mt-0.5 ${isOwn ? "text-white/60" : "text-tx2"}`}>
            {m.edited_at && <span className="text-[10px]">edited</span>}
            <span className="text-[10px]">{time}</span>
            {isOwn && <span className="text-[10px]">{m.status === "delivered" || m.status === "read" ? "✓✓" : "✓"}</span>}
          </div>
        </div>

        {/* Reactions display */}
        {m.reactions && m.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
            {m.reactions.map((r) => (
              <button key={r.emoji} onClick={() => onReact(m.id, r.emoji)}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${r.hasOwn ? "border-pri bg-pri/10" : "border-brd bg-surface hover:bg-surface-h"}`}>
                <span>{r.emoji}</span>
                <span className="text-tx2 text-[10px]">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Hover action button */}
        <button onClick={() => setShowMenu(!showMenu)}
          className={`absolute top-1 ${isOwn ? "left-0 -translate-x-8" : "right-0 translate-x-8"} opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-surface border border-brd text-tx2 hover:text-tx transition-all`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>

        {/* Context menu */}
        {showMenu && (
          <div className={`absolute z-50 ${isOwn ? "right-0" : "left-0"} top-full mt-1 bg-surface border border-brd rounded-xl shadow-lg py-1 a-fi min-w-[160px]`} onClick={() => setShowMenu(false)}>
            {/* Quick reactions */}
            <div className="flex items-center justify-center gap-1 px-2 py-2 border-b border-brd">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => { onReact(m.id, e); setShowMenu(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-h transition-colors text-base">{e}</button>
              ))}
            </div>
            <button onClick={() => onReply(m)} className="w-full px-3 py-2 text-left text-sm hover:bg-surface-h transition-colors">Reply</button>
            <button onClick={() => onForward(m)} className="w-full px-3 py-2 text-left text-sm hover:bg-surface-h transition-colors">Forward</button>
            <button onClick={() => onPin(m.id)} className="w-full px-3 py-2 text-left text-sm hover:bg-surface-h transition-colors">Pin</button>
            {isOwn && <>
              <button onClick={() => onEdit(m)} className="w-full px-3 py-2 text-left text-sm hover:bg-surface-h transition-colors">Edit</button>
              <button onClick={() => { if (confirm("Delete message?")) onDelete(m.id); }} className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-surface-h transition-colors">Delete</button>
            </>}
          </div>
        )}
      </div>
    </div>
  );
}
