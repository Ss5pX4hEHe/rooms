"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { useChats } from "@/hooks/useChats";
import { useGlobalRealtime } from "@/hooks/useGlobalRealtime";
import { ChatList } from "@/components/ChatList";
import { NewChatDialog } from "@/components/NewChatDialog";
import { NewGroupDialog } from "@/components/NewGroupDialog";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setProfile } = useStore();
  const { loadChats } = useChats();
  const [showNew, setShowNew] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/auth"); return; }
      setUser({ id: session.user.id, email: session.user.email || "" });
      supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => {
        if (data) { if (!data.username) { router.replace("/auth"); return; } setProfile(data); setReady(true); }
      });
    });
  }, []);

  useEffect(() => { if (ready) loadChats(); }, [ready, loadChats]);
  useGlobalRealtime();

  const inChat = pathname !== "/chat";

  if (!ready) return <div className="h-full flex items-center justify-center bg-bg"><div className="animate-pulse text-tx2">Загрузка...</div></div>;

  return (
    <div className="h-full flex bg-bg">
      {/* Sidebar */}
      <div className={`${inChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-[360px] md:min-w-[360px] h-full border-r border-brd`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-brd">
          <h1 className="text-xl font-bold">Rooms</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowGroup(true)} className="p-2 rounded-lg hover:bg-surface transition-colors" title="Группа">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </button>
            <button onClick={() => setShowNew(true)} className="p-2 rounded-lg hover:bg-surface transition-colors" title="Чат">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/></svg>
            </button>
            <button onClick={() => router.push("/settings")} className="p-2 rounded-lg hover:bg-surface transition-colors" title="Настройки">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
        </div>
        <ChatList />
      </div>

      {/* Main */}
      <div className={`${inChat ? "flex" : "hidden md:flex"} flex-col flex-1 h-full`}>
        {pathname === "/chat" ? <div className="hidden md:flex flex-1 items-center justify-center text-tx2">Выбери чат</div> : children}
      </div>

      {showNew && <NewChatDialog onClose={() => setShowNew(false)} />}
      {showGroup && <NewGroupDialog onClose={() => setShowGroup(false)} />}
    </div>
  );
}
