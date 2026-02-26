"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";

export function useGlobalRealtime() {
  const { user, chats, updateLastMsg, showToast } = useStore();

  useEffect(() => {
    if (!user || chats.length === 0) return;
    const channels = chats.map((chat) =>
      supabase.channel(`g:${chat.chat_id}`)
        .on("broadcast", { event: "message:new" }, ({ payload }) => {
          const msg = payload as any;
          updateLastMsg(chat.chat_id, msg.content, msg.sender_id, msg.created_at);
          const s = useStore.getState();
          if (msg.sender_id !== user.id && s.activeChatId !== chat.chat_id) {
            showToast(`${msg.sender_display_name || msg.sender_username || "Сообщение"}: ${msg.content.slice(0, 50)}`);
          }
        })
        .subscribe()
    );
    return () => { channels.forEach((c) => c.unsubscribe()); };
  }, [user?.id, chats.map((c) => c.chat_id).join(",")]);
}
