"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useChats } from "@/hooks/useChats";

export default function JoinPage() {
  const { code } = useParams();
  const router = useRouter();
  const { joinByInvite } = useChats();
  const [status, setStatus] = useState<"loading"|"preview"|"joining"|"error">("loading");
  const [chatName, setChatName] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { sessionStorage.setItem("pending_invite", code as string); router.replace("/auth"); return; }
      supabase.from("invites").select("*, chats(name)").eq("code", code).single().then(({ data }) => {
        if (!data) { setStatus("error"); setErr("Ссылка недействительна"); return; }
        setChatName((data as any).chats?.name || "Группа");
        setStatus("preview");
      });
    });
  }, []);

  async function join() {
    setStatus("joining");
    const id = await joinByInvite(code as string);
    if (id) router.replace(`/chat/${id}`); else { setStatus("error"); setErr("Не удалось"); }
  }

  return (
    <div className="h-full flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm text-center a-su">
        {status === "loading" && <p className="text-tx2">Загрузка...</p>}
        {status === "preview" && (
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500 text-white text-2xl font-bold">{chatName.charAt(0).toUpperCase()}</div>
            <div><h2 className="text-xl font-bold">{chatName}</h2><p className="text-sm text-tx2 mt-1">Тебя приглашают в группу</p></div>
            <button onClick={join} className="w-full py-3 rounded-xl bg-pri text-white font-medium text-sm hover:bg-pri-h transition-colors">Присоединиться</button>
          </div>
        )}
        {status === "joining" && <p className="text-tx2">Подключение...</p>}
        {status === "error" && <div className="space-y-4"><p className="text-red-500">{err}</p><button onClick={() => router.push("/chat")} className="text-sm text-pri hover:underline">В чаты</button></div>}
      </div>
    </div>
  );
}
