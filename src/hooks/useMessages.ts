"use client";
import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import type { Message } from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useMessages(chatId: string | null) {
  const { user, setMessages, addMessage, updateLastMsg, showToast } = useStore();
  const chRef = useRef<RealtimeChannel | null>(null);

  const loadMessages = useCallback(async () => {
    if (!chatId) return;
    const { data } = await supabase
      .from("messages").select("*, profiles:sender_id(username, display_name)")
      .eq("chat_id", chatId).order("created_at", { ascending: true }).limit(200);
    const msgs: Message[] = (data || []).map((m: any) => ({
      id: m.id, chat_id: m.chat_id, sender_id: m.sender_id,
      content: m.content, status: m.status, created_at: m.created_at,
      sender_username: m.profiles?.username, sender_display_name: m.profiles?.display_name,
    }));
    setMessages(msgs);
  }, [chatId, setMessages]);

  useEffect(() => {
    if (!chatId || !user) return;
    loadMessages();
    supabase.from("chat_members").update({ last_read_at: new Date().toISOString() }).eq("chat_id", chatId).eq("user_id", user.id).then();

    const ch = supabase.channel(`chat:${chatId}`)
      .on("broadcast", { event: "message:new" }, ({ payload }) => {
        const msg = payload as Message;
        addMessage(msg);
        updateLastMsg(chatId, msg.content, msg.sender_id, msg.created_at);
        if (msg.sender_id !== user.id) {
          supabase.from("messages").update({ status: "delivered" }).eq("id", msg.id).then();
          supabase.from("chat_members").update({ last_read_at: new Date().toISOString() }).eq("chat_id", chatId).eq("user_id", user.id).then();
        }
      })
      .subscribe();
    chRef.current = ch;
    return () => { ch.unsubscribe(); chRef.current = null; };
  }, [chatId, user?.id]);

  const sendMessage = useCallback(async (content: string) => {
    if (!chatId || !user || !content.trim()) return;
    const store = useStore.getState();
    const msg: Message = {
      id: crypto.randomUUID(), chat_id: chatId, sender_id: user.id,
      content: content.trim(), status: "sent", created_at: new Date().toISOString(),
      sender_username: store.profile?.username || undefined,
      sender_display_name: store.profile?.display_name || undefined,
    };
    addMessage(msg);
    updateLastMsg(chatId, msg.content, msg.sender_id, msg.created_at);
    chRef.current?.send({ type: "broadcast", event: "message:new", payload: msg });
    const { error } = await supabase.from("messages").insert({
      id: msg.id, chat_id: msg.chat_id, sender_id: msg.sender_id, content: msg.content, status: "sent",
    });
    if (error) showToast("Ошибка отправки");
  }, [chatId, user]);

  return { loadMessages, sendMessage };
}
