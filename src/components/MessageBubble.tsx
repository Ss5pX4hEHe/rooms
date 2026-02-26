"use client";
import type { Message } from "@/lib/types";
import { format } from "date-fns";

export function MessageBubble({ message: m, isOwn, showSender }: { message: Message; isOwn: boolean; showSender: boolean }) {
  const time = format(new Date(m.created_at), "HH:mm");
  return (
    <div className={`flex mb-1 a-fi ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] md:max-w-[60%] px-3 py-2 rounded-2xl ${isOwn ? "bg-bub-own text-white rounded-br-md" : "bg-bub-other text-tx rounded-bl-md"}`}>
        {showSender && <p className="text-xs font-semibold text-pri mb-0.5">{m.sender_display_name || m.sender_username || "User"}</p>}
        <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
        <div className={`flex items-center justify-end gap-1 mt-0.5 ${isOwn ? "text-white/60" : "text-tx2"}`}>
          <span className="text-[10px]">{time}</span>
          {isOwn && <span className="text-[10px]">{m.status === "delivered" || m.status === "read" ? "✓✓" : "✓"}</span>}
        </div>
      </div>
    </div>
  );
}
