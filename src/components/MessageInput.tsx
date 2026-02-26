"use client";
import { useState, useRef, useEffect } from "react";

export function MessageInput({ onSend }: { onSend: (s: string) => void }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { const el = ref.current; if (el) { el.style.height = "0"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; } }, [text]);

  function send() { if (!text.trim()) return; onSend(text); setText(""); }

  return (
    <div className="px-3 py-2 border-t border-brd shrink-0">
      <div className="flex items-end gap-2 bg-surface rounded-2xl px-3 py-2">
        <textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Сообщение..." rows={1} className="flex-1 resize-none text-sm text-tx bg-transparent py-1 max-h-[120px]" />
        <button onClick={send} disabled={!text.trim()} className="p-2 rounded-full bg-pri text-white disabled:opacity-30 transition-opacity shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  );
}
