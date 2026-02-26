"use client";
import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { nanoid } from "nanoid";

export function useChats() {
  const { user, setChats, showToast } = useStore();

  const loadChats = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.rpc("get_my_chats");
    setChats(data || []);
  }, [user, setChats]);

  async function createDirectChat(otherUserId: string) {
    const { data, error } = await supabase.rpc("get_or_create_direct_chat", { other_user_id: otherUserId });
    if (error) { showToast("Ошибка"); return null; }
    await loadChats();
    return data as string;
  }

  async function createGroup(name: string) {
    if (!user) return null;
    const { data: chat, error } = await supabase.from("chats").insert({ type: "group", name, created_by: user.id }).select().single();
    if (error || !chat) { showToast("Ошибка"); return null; }
    await supabase.from("chat_members").insert({ chat_id: chat.id, user_id: user.id, role: "owner" });
    await loadChats();
    return chat.id as string;
  }

  async function createInvite(chatId: string) {
    if (!user) return null;
    const { data, error } = await supabase.from("invites").insert({ chat_id: chatId, code: nanoid(10), created_by: user.id, max_uses: 0 }).select().single();
    if (error) { showToast("Ошибка"); return null; }
    return data;
  }

  async function joinByInvite(code: string) {
    const { data, error } = await supabase.rpc("join_by_invite", { invite_code: code });
    if (error) { showToast(error.message); return null; }
    await loadChats();
    return data as string;
  }

  async function searchUsers(query: string) {
    const { data } = await supabase.from("profiles").select("id, username, display_name")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`).neq("id", user?.id || "").limit(10);
    return data || [];
  }

  async function leaveChat(chatId: string) {
    if (!user) return;
    await supabase.from("chat_members").delete().eq("chat_id", chatId).eq("user_id", user.id);
    await loadChats();
  }

  async function removeMember(chatId: string, userId: string) {
    await supabase.from("chat_members").delete().eq("chat_id", chatId).eq("user_id", userId);
  }

  async function getChatMembers(chatId: string) {
    const { data } = await supabase.from("chat_members").select("*, profiles:user_id(username, display_name)").eq("chat_id", chatId);
    return (data || []).map((m: any) => ({ ...m, username: m.profiles?.username, display_name: m.profiles?.display_name }));
  }

  async function updateChatName(chatId: string, name: string) {
    await supabase.from("chats").update({ name }).eq("id", chatId);
    await loadChats();
  }

  return { loadChats, createDirectChat, createGroup, createInvite, joinByInvite, searchUsers, leaveChat, removeMember, getChatMembers, updateChatName };
}
