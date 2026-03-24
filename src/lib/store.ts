import { create } from "zustand";
import type { Profile, Chat, Message, PinnedMessage } from "./types";

interface S {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  setUser: (u: S["user"]) => void;
  setProfile: (p: Profile | null) => void;
  chats: Chat[];
  setChats: (c: Chat[]) => void;
  updateLastMsg: (chatId: string, content: string, sender: string, at: string) => void;
  activeChatId: string | null;
  messages: Message[];
  setActiveChatId: (id: string | null) => void;
  setMessages: (m: Message[]) => void;
  addMessage: (m: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  replyTo: Message | null;
  setReplyTo: (m: Message | null) => void;
  forwardMsg: Message | null;
  setForwardMsg: (m: Message | null) => void;
  editMsg: Message | null;
  setEditMsg: (m: Message | null) => void;
  pinnedMessages: PinnedMessage[];
  setPinnedMessages: (p: PinnedMessage[]) => void;
  typingUsers: { [chatId: string]: string[] };
  setTypingUsers: (chatId: string, users: string[]) => void;
  blockedUsers: string[];
  setBlockedUsers: (ids: string[]) => void;
  onlineUsers: { [userId: string]: string };
  setOnlineUser: (userId: string, lastSeen: string) => void;
  setOnlineUsers: (u: { [userId: string]: string }) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  toast: string | null;
  showToast: (msg: string) => void;
  splashDone: boolean;
  setSplashDone: (v: boolean) => void;
}

export const useStore = create<S>((set) => ({
  user: null, profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  chats: [], setChats: (chats) => set({ chats }),
  updateLastMsg: (chatId, content, sender, at) =>
    set((s) => ({
      chats: s.chats.map((c) => c.chat_id === chatId ? { ...c, last_message_content: content, last_message_sender: sender, last_message_at: at } : c)
        .sort((a, b) => { if (a.chat_type === "announcement") return -1; if (b.chat_type === "announcement") return 1; return (b.last_message_at || "").localeCompare(a.last_message_at || ""); }),
    })),
  activeChatId: null, messages: [],
  setActiveChatId: (id) => set({ activeChatId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((s) => (s.messages.find((m) => m.id === msg.id) ? s : { messages: [...s.messages, msg] })),
  updateMessage: (id, updates) => set((s) => ({ messages: s.messages.map((m) => m.id === id ? { ...m, ...updates } : m) })),
  removeMessage: (id) => set((s) => ({ messages: s.messages.map((m) => m.id === id ? { ...m, deleted: true, content: "" } : m) })),
  replyTo: null, setReplyTo: (m) => set({ replyTo: m, editMsg: null, forwardMsg: null }),
  forwardMsg: null, setForwardMsg: (m) => set({ forwardMsg: m, replyTo: null, editMsg: null }),
  editMsg: null, setEditMsg: (m) => set({ editMsg: m, replyTo: null, forwardMsg: null }),
  pinnedMessages: [], setPinnedMessages: (p) => set({ pinnedMessages: p }),
  typingUsers: {}, setTypingUsers: (chatId, users) => set((s) => ({ typingUsers: { ...s.typingUsers, [chatId]: users } })),
  blockedUsers: [], setBlockedUsers: (ids) => set({ blockedUsers: ids }),
  onlineUsers: {}, setOnlineUser: (userId, lastSeen) => set((s) => ({ onlineUsers: { ...s.onlineUsers, [userId]: lastSeen } })),
  setOnlineUsers: (u) => set({ onlineUsers: u }),
  theme: typeof window !== "undefined" ? ((localStorage.getItem("rooms-theme") as any) || "dark") : "dark",
  setTheme: (t) => { if (typeof window !== "undefined") localStorage.setItem("rooms-theme", t); set({ theme: t }); },
  toast: null, showToast: (msg) => { set({ toast: msg }); setTimeout(() => set({ toast: null }), 3000); },
  splashDone: false, setSplashDone: (v) => set({ splashDone: v }),
}));

export function isOnline(lastSeen: string | undefined): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

export function formatLastSeen(lastSeen: string | undefined): string {
  if (!lastSeen) return "offline";
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 5 * 60 * 1000) return "online";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(lastSeen).toLocaleDateString();
}
