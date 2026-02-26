import { create } from "zustand";
import type { Profile, Chat, Message } from "./types";

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
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

export const useStore = create<S>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  chats: [],
  setChats: (chats) => set({ chats }),
  updateLastMsg: (chatId, content, sender, at) =>
    set((s) => ({
      chats: s.chats
        .map((c) =>
          c.chat_id === chatId
            ? { ...c, last_message_content: content, last_message_sender: sender, last_message_at: at }
            : c
        )
        .sort((a, b) => {
          if (a.chat_type === "announcement") return -1;
          if (b.chat_type === "announcement") return 1;
          return (b.last_message_at || "").localeCompare(a.last_message_at || "");
        }),
    })),

  activeChatId: null,
  messages: [],
  setActiveChatId: (id) => set({ activeChatId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) =>
    set((s) => (s.messages.find((m) => m.id === msg.id) ? s : { messages: [...s.messages, msg] })),

  theme: typeof window !== "undefined" ? ((localStorage.getItem("rooms-theme") as any) || "dark") : "dark",
  setTheme: (t) => {
    if (typeof window !== "undefined") localStorage.setItem("rooms-theme", t);
    set({ theme: t });
  },

  toast: null,
  showToast: (msg) => {
    set({ toast: msg });
    setTimeout(() => set({ toast: null }), 3000);
  },
}));
