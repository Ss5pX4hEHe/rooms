"use client";
import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { nanoid } from "nanoid";

export function useChats() {
  const { user, setChats, setBlockedUsers, setOnlineUsers, showToast } = useStore();

  const loadChats = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.rpc("get_my_chats");
    setChats(data || []);
  }, [user, setChats]);

  const loadBlockedUsers = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("blocked_users").select("blocked_id").eq("blocker_id", user.id);
    setBlockedUsers((data || []).map((b: any) => b.blocked_id));
  }, [user, setBlockedUsers]);

  const loadOnlineStatuses = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return;
    const { data } = await supabase.from("profiles").select("id, last_seen").in("id", userIds);
    const map: { [id: string]: string } = {};
    (data || []).forEach((p: any) => { if (p.last_seen) map[p.id] = p.last_seen; });
    setOnlineUsers(map);
  }, [setOnlineUsers]);

  const updateLastSeen = useCallback(async () => {
    if (!user) return;
    await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", user.id);
  }, [user]);

  async function createDirectChat(otherUserId: string) {
    const { data, error } = await supabase.rpc("get_or_create_direct_chat", { other_user_id: otherUserId });
    if (error) { showToast("Error"); return null; }
    await loadChats();
    return data as string;
  }

  async function createGroup(name: string) {
    if (!user) return null;
    const { data: chat, error } = await supabase.from("chats").insert({ type: "group", name, created_by: user.id }).select().single();
    if (error || !chat) { showToast("Error"); return null; }
    await supabase.from("chat_members").insert({ chat_id: chat.id, user_id: user.id, role: "owner" });
    await loadChats();
    return chat.id as string;
  }

  async function createInvite(chatId: string) {
    if (!user) return null;
    const { data, error } = await supabase.from("invites").insert({ chat_id: chatId, code: nanoid(10), created_by: user.id, max_uses: 0 }).select().single();
    if (error) { showToast("Error"); return null; }
    return data;
  }

  async function joinByInvite(code: string) {
    const { data, error } = await supabase.rpc("join_by_invite", { invite_code: code });
    if (error) { showToast(error.message); return null; }
    await loadChats();
    return data as string;
  }

  async function searchUserExact(username: string) {
    const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url, bio, last_seen")
      .eq("username", username).neq("id", user?.id || "").single();
    return data || null;
  }

  async function deleteChat(chatId: string) {
    if (!user) return;
    await supabase.from("chat_members").delete().eq("chat_id", chatId).eq("user_id", user.id);
    await loadChats();
    showToast("Chat deleted");
  }

  async function leaveChat(chatId: string) { if (!user) return; await supabase.from("chat_members").delete().eq("chat_id", chatId).eq("user_id", user.id); await loadChats(); }
  async function removeMember(chatId: string, userId: string) { await supabase.from("chat_members").delete().eq("chat_id", chatId).eq("user_id", userId); }

  async function getChatMembers(chatId: string) {
    const { data } = await supabase.from("chat_members").select("*, profiles:user_id(username, display_name, avatar_url, last_seen)").eq("chat_id", chatId);
    return (data || []).map((m: any) => ({ ...m, username: m.profiles?.username, display_name: m.profiles?.display_name, avatar_url: m.profiles?.avatar_url, last_seen: m.profiles?.last_seen }));
  }

  async function updateChatName(chatId: string, name: string) { await supabase.from("chats").update({ name }).eq("id", chatId); await loadChats(); }
  async function blockUser(userId: string) { if (!user) return; await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: userId }); await loadBlockedUsers(); showToast("User blocked"); }
  async function unblockUser(userId: string) { if (!user) return; await supabase.from("blocked_users").delete().eq("blocker_id", user.id).eq("blocked_id", userId); await loadBlockedUsers(); showToast("User unblocked"); }

  async function getProfile(userId: string) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    return data;
  }

  async function uploadAvatar(file: File) {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { showToast("Upload failed"); return null; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = publicUrl + "?t=" + Date.now();
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    return url;
  }

  return { loadChats, loadBlockedUsers, loadOnlineStatuses, updateLastSeen, createDirectChat, createGroup, createInvite, joinByInvite, searchUserExact, deleteChat, leaveChat, removeMember, getChatMembers, updateChatName, blockUser, unblockUser, getProfile, uploadAvatar };
}
