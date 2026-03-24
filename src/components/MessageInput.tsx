"use client";
import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";

export function MessageInput({ onSend, onEdit, onSendTyping }: {
  onSend: (s: string, replyTo?: string, forward?: string) => void;
  onEdit: (id: string, content: string) => void;
  onSendTyping: () => void;
}) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const { replyTo, setReplyTo, editMsg, setEditMsg, forwardMsg, setForwardMsg } = useStore();
  const lastTyping = useRef(0);

  useEffect(() => {
    if (editMsg) { setText(editMsg.content); ref.current?.focus(); }
  }, [editMsg]);

  useEffect(() => {
    if (forwardMsg) { ref.current?.focus(); }
  }, [forwardMsg]);

  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = "0"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }
  }, [text]);

  function handleInput(v: string) {
    setText(v);
    const now = Date.now();
    if (now - lastTyping.current > 2000) {
      onSendTyping();
      lastTyping.current = now;
    }
  }

  function send() {
    if (!text.trim() && !forwardMsg) return;
    if (editMsg) {
      onEdit(editMsg.id, text.trim());
      setEditMsg(null);
      setText("");
      return;
    }
    if (forwardMsg) {
      onSend(forwardMsg.content, undefined, forwardMsg.id);
      setForwardMsg(null);
      setText("");
      return;
    }
    onSend(text.trim(), replyTo?.id);
    setReplyTo(null);
    setText("");
  }

  const bar = replyTo || editMsg || forwardMsg;

  return (
    <div className="shrink-0 border-t border-brd">
      {/* Reply / Edit / Forward bar */}
      {bar && (
        <div className="px-3 pt-2 flex items-center gap-2">
          <div className="flex-1 pl-3 border-l-2 border-pri">
            <p className="text-xs font-semibold text-pri">
              {editMsg ? "Editing" : forwardMsg ? "Forwarding" : `Reply to ${replyTo?.sender_display_name || replyTo?.sender_username || "User"}`}
            </p>
            <p className="text-xs text-tx2 truncate">{editMsg?.content || forwardMsg?.content || replyTo?.content}</p>
          </div>
          <button onClick={() => { setReplyTo(null); setEditMsg(null); setForwardMsg(null); setText(""); }}
            className="p-1 rounded-lg hover:bg-surface text-tx2">✕</button>
        </div>
      )}

      <div className="px-3 py-2">
        <div className="flex items-end gap-2 bg-surface rounded-2xl px-3 py-2">
          <textarea ref={ref} value={text} onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={forwardMsg ? "Add a message (optional)..." : "Message..."} rows={1}
            className="flex-1 resize-none text-sm text-tx bg-transparent py-1 max-h-[120px]" />
          <button onClick={send} disabled={!text.trim() && !forwardMsg}
            className="p-2 rounded-full bg-pri text-white disabled:opacity-30 transition-opacity shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
