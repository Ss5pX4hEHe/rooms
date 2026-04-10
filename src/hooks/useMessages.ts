"use client";
import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import type { Message, Reaction } from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

function groupReactions(raw: any[], userId: string): Reaction[] {
  const map: { [emoji: string]: { count: number; users: string[] } } = {};
  for (const r of raw) {
    if (!map[r.emoji]) map[r.emoji] = { count: 0, users: [] };
    map[r.emoji].count++;
    map[r.emoji].users.push(r.user_id);
  }
  return Object.entries(map).map(([emoji, d]) => ({ emoji, count: d.count, users: d.users, hasOwn: d.users.includes(userId) }));
}

export function useMessages(chatId: string | null) {
  const { user, setMessages, addMessage, updateMessage, removeMessage, updateLastMsg, setTypingUsers, setPinnedMessages, showToast } = useStore();
  const chRef = useRef<RealtimeChannel | null>(null);

  const loadMessages = useCallback(async () => {
    if (!chatId || !user) return;
    const { data } = await supabase
      .from("messages").select("*, profiles:sender_id(username, display_name, avatar_url)")
      .eq("chat_id", chatId).order("created_at", { ascending: true }).limit(200);

    const msgIds = (data || []).map((m: any) => m.id);
    let reactionsMap: { [msgId: string]: any[] } = {};
    if (msgIds.length > 0) {
      const { data: rData } = await supabase.from("reactions").select("*").in("message_id", msgIds);
      for (const r of (rData || [])) {
        if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = [];
        reactionsMap[r.message_id].push(r);
      }
    }

    const replyIds = (data || []).filter((m: any) => m.reply_to).map((m: any) => m.reply_to);
    let replyMap: { [id: string]: any } = {};
    if (replyIds.length > 0) {
      const { data: rData } = await supabase.from("messages").select("id, content, profiles:sender_id(username, display_name)").in("id", replyIds);
      for (const r of (rData || [])) replyMap[r.id] = r;
    }

    const msgs: Message[] = (data || []).map((m: any) => {
      const reply = m.reply_to ? replyMap[m.reply_to] : null;
      return {
        id: m.id, chat_id: m.chat_id, sender_id: m.sender_id,
        content: m.deleted ? "" : m.content, status: m.status, created_at: m.created_at,
        sender_username: m.profiles?.username, sender_display_name: m.profiles?.display_name,
        sender_avatar_url: m.profiles?.avatar_url,
        reply_to: m.reply_to, reply_content: reply?.content, reply_sender: reply?.profiles?.display_name || reply?.profiles?.username,
        edited_at: m.edited_at, forwarded_from: m.forwarded_from, deleted: m.deleted,
        reactions: groupReactions(reactionsMap[m.id] || [], user.id),
      };
    });
    setMessages(msgs);
  }, [chatId, user, setMessages]);

  const loadPinned = useCallback(async () => {
    if (!chatId) return;
    const { data } = await supabase.from("pinned_messages").select("*, messages:message_id(content, sender_id, profiles:sender_id(display_name, username))")
      .eq("chat_id", chatId).order("pinned_at", { ascending: false }).limit(5);
    const pins = (data || []).map((p: any) => ({
      id: p.id, chat_id: p.chat_id, message_id: p.message_id, pinned_by: p.pinned_by, pinned_at: p.pinned_at,
      content: p.messages?.content, sender_name: p.messages?.profiles?.display_name || p.messages?.profiles?.username,
    }));
    setPinnedMessages(pins);
  }, [chatId, setPinnedMessages]);

  // Mark all unread messages from others as "read"
  const markAsRead = useCallback(async () => {
    if (!chatId || !user) return;
    // Update messages in DB: set status to "read" for messages sent by others that aren't read yet
    const { data: updated } = await supabase
      .from("messages")
      .update({ status: "read" })
      .eq("chat_id", chatId)
      .neq("sender_id", user.id)
      .neq("status", "read")
      .select("id");

    if (updated && updated.length > 0) {
      // Update local store
      const ids = updated.map((m: any) => m.id);
      const store = useStore.getState();
      const newMessages = store.messages.map(m => ids.includes(m.id) ? { ...m, status: "read" as const } : m);
      setMessages(newMessages);

      // Broadcast read event so sender sees blue checkmarks
      chRef.current?.send({
        type: "broadcast",
        event: "message:read",
        payload: { reader_id: user.id, message_ids: ids },
      });
    }
  }, [chatId, user, setMessages]);

  useEffect(() => {
    if (!chatId || !user) return;
    loadMessages();
    loadPinned();

    // Mark as read when entering chat
    supabase.from("chat_members").update({ last_read_at: new Date().toISOString() }).eq("chat_id", chatId).eq("user_id", user.id).then();
    supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", user.id).then();

    // Mark messages as read after loading
    setTimeout(() => markAsRead(), 500);

    const ch = supabase.channel(`chat:${chatId}`)
      .on("broadcast", { event: "message:new" }, ({ payload }) => {
        const msg = payload as Message;
        addMessage(msg);
        updateLastMsg(chatId, msg.content, msg.sender_id, msg.created_at);
        if (msg.sender_id !== user.id) {
          supabase.from("chat_members").update({ last_read_at: new Date().toISOString() }).eq("chat_id", chatId).eq("user_id", user.id).then();
          // Mark new incoming message as read immediately (we're in the chat)
          supabase.from("messages").update({ status: "read" }).eq("id", msg.id).then();
          // Broadcast read back to sender
          setTimeout(() => {
            ch.send({ type: "broadcast", event: "message:read", payload: { reader_id: user.id, message_ids: [msg.id] } });
          }, 300);
        }
      })
      .on("broadcast", { event: "message:edit" }, ({ payload }) => {
        updateMessage(payload.id, { content: payload.content, edited_at: payload.edited_at });
      })
      .on("broadcast", { event: "message:delete" }, ({ payload }) => {
        removeMessage(payload.id);
      })
      .on("broadcast", { event: "message:read" }, ({ payload }) => {
        // Someone read our messages — update checkmarks to blue
        if (payload.reader_id !== user.id && payload.message_ids) {
          const store = useStore.getState();
          const newMsgs = store.messages.map(m =>
            payload.message_ids.includes(m.id) ? { ...m, status: "read" as const } : m
          );
          setMessages(newMsgs);
        }
      })
      .on("broadcast", { event: "reaction:update" }, () => { loadMessages(); })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.user_id !== user.id) {
          const s = useStore.getState();
          const current = s.typingUsers[chatId] || [];
          if (!current.includes(payload.username)) {
            setTypingUsers(chatId, [...current, payload.username]);
          }
          setTimeout(() => {
            const s2 = useStore.getState();
            setTypingUsers(chatId, (s2.typingUsers[chatId] || []).filter((u: string) => u !== payload.username));
          }, 3000);
        }
      })
      .on("broadcast", { event: "pin:update" }, () => { loadPinned(); })
      .subscribe();
    chRef.current = ch;
    return () => { ch.unsubscribe(); chRef.current = null; };
  }, [chatId, user?.id]);

  const sendMessage = useCallback(async (content: string, replyToId?: string, forwardedId?: string) => {
    if (!chatId || !user || !content.trim()) return;
    const store = useStore.getState();
    const msg: Message = {
      id: crypto.randomUUID(), chat_id: chatId, sender_id: user.id,
      content: content.trim(), status: "sent", created_at: new Date().toISOString(),
      sender_username: store.profile?.username || undefined,
      sender_display_name: store.profile?.display_name || undefined,
      sender_avatar_url: store.profile?.avatar_url || undefined,
      reply_to: replyToId || null, forwarded_from: forwardedId || null,
    };
    if (replyToId) {
      const replyMsg = store.messages.find(m => m.id === replyToId);
      if (replyMsg) { msg.reply_content = replyMsg.content; msg.reply_sender = replyMsg.sender_display_name || replyMsg.sender_username; }
    }
    addMessage(msg);
    updateLastMsg(chatId, msg.content, msg.sender_id, msg.created_at);
    chRef.current?.send({ type: "broadcast", event: "message:new", payload: msg });
    const insert: any = { id: msg.id, chat_id: msg.chat_id, sender_id: msg.sender_id, content: msg.content, status: "sent" };
    if (replyToId) insert.reply_to = replyToId;
    if (forwardedId) insert.forwarded_from = forwardedId;
    const { error } = await supabase.from("messages").insert(insert);
    if (error) showToast("Send error");
  }, [chatId, user]);

  const editMessage = useCallback(async (msgId: string, newContent: string) => {
    if (!chatId || !user) return;
    const now = new Date().toISOString();
    updateMessage(msgId, { content: newContent, edited_at: now });
    chRef.current?.send({ type: "broadcast", event: "message:edit", payload: { id: msgId, content: newContent, edited_at: now } });
    await supabase.from("messages").update({ content: newContent, edited_at: now }).eq("id", msgId).eq("sender_id", user.id);
  }, [chatId, user]);

  const deleteMessage = useCallback(async (msgId: string) => {
    if (!chatId || !user) return;
    removeMessage(msgId);
    chRef.current?.send({ type: "broadcast", event: "message:delete", payload: { id: msgId } });
    await supabase.from("messages").update({ deleted: true, content: "" }).eq("id", msgId).eq("sender_id", user.id);
  }, [chatId, user]);

  const toggleReaction = useCallback(async (msgId: string, emoji: string) => {
    if (!user) return;
    const { data: existing } = await supabase.from("reactions").select("id").eq("message_id", msgId).eq("user_id", user.id).eq("emoji", emoji).single();
    if (existing) await supabase.from("reactions").delete().eq("id", existing.id);
    else await supabase.from("reactions").insert({ message_id: msgId, user_id: user.id, emoji });
    chRef.current?.send({ type: "broadcast", event: "reaction:update", payload: {} });
    await loadMessages();
  }, [user, loadMessages]);

  const pinMessage = useCallback(async (msgId: string) => {
    if (!chatId || !user) return;
    const store = useStore.getState();
    if (store.pinnedMessages.length >= 5) { showToast("Max 5 pinned messages"); return; }
    if (store.pinnedMessages.find(p => p.message_id === msgId)) { showToast("Already pinned"); return; }
    await supabase.from("pinned_messages").insert({ chat_id: chatId, message_id: msgId, pinned_by: user.id });
    chRef.current?.send({ type: "broadcast", event: "pin:update", payload: {} });
    await loadPinned();
    showToast("Pinned");
  }, [chatId, user, loadPinned]);

  const unpinMessage = useCallback(async (pinId: string) => {
    await supabase.from("pinned_messages").delete().eq("id", pinId);
    chRef.current?.send({ type: "broadcast", event: "pin:update", payload: {} });
    await loadPinned();
    showToast("Unpinned");
  }, [loadPinned]);

  const sendTyping = useCallback(() => {
    if (!chatId || !user) return;
    const store = useStore.getState();
    chRef.current?.send({ type: "broadcast", event: "typing", payload: { user_id: user.id, username: store.profile?.display_name || store.profile?.username || "" } });
  }, [chatId, user]);

  return { loadMessages, sendMessage, editMessage, deleteMessage, toggleReaction, pinMessage, unpinMessage, sendTyping, markAsRead };
}
