"use client";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export function ChatList() {
  const router = useRouter();
  const pathname = usePathname();
  const chats = useStore((s) => s.chats);

  if (chats.length === 0)
    return <div className="flex-1 flex items-center justify-center p-8 text-tx2 text-sm text-center"><div><p className="mb-1">Пока нет чатов</p><p className="text-xs">Создай новый чат или группу</p></div></div>;

  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map((c) => {
        const active = pathname === `/chat/${c.chat_id}`;
        const ann = c.chat_type === "announcement";
        const name = c.chat_type === "direct" ? (c.other_display_name || c.other_username || "User") : (c.chat_name || "Группа");
        const time = c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false, locale: ru }) : "";

        return (
          <button key={c.chat_id} onClick={() => router.push(`/chat/${c.chat_id}`)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${active ? "bg-pri/10" : "hover:bg-surface-h"}`}>
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${ann ? "bg-amber-500" : c.chat_type === "group" ? "bg-emerald-500" : "bg-pri"}`}>
              {ann ? "📢" : name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{ann && <span className="text-amber-500 mr-1">📌</span>}{name}</span>
                {time && <span className="text-xs text-tx2 ml-2 shrink-0">{time}</span>}
              </div>
              {c.last_message_content && <p className="text-xs text-tx2 truncate mt-0.5">{c.last_message_content}</p>}
            </div>
            {c.unread_count > 0 && <div className="w-5 h-5 rounded-full bg-pri text-white text-[10px] flex items-center justify-center font-medium shrink-0">{c.unread_count > 9 ? "9+" : c.unread_count}</div>}
          </button>
        );
      })}
    </div>
  );
}
