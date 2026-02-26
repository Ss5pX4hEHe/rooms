"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, setProfile, setUser, theme, setTheme, showToast } = useStore();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => { if (!session) router.replace("/auth"); }); }, []);
  useEffect(() => { if (profile) { setUsername(profile.username || ""); setDisplayName(profile.display_name || ""); } }, [profile]);

  async function save() {
    if (!user || !username.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ username: username.toLowerCase().trim(), display_name: displayName.trim() || username.trim() }).eq("id", user.id);
    setSaving(false);
    if (error) showToast(error.message.includes("unique") ? "Username занят" : error.message);
    else { setProfile({ ...profile!, username: username.toLowerCase().trim(), display_name: displayName.trim() || username.trim() }); showToast("Сохранено"); }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
    router.replace("/auth");
  }

  return (
    <div className="h-full bg-bg overflow-y-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-brd">
        <button onClick={() => router.push("/chat")} className="p-1 rounded-lg hover:bg-surface transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="text-lg font-semibold">Настройки</h1>
      </div>
      <div className="max-w-md mx-auto p-4 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-tx2 mb-3">Тема</h3>
          <div className="flex gap-2">
            {(["light","dark"] as const).map(t => (
              <button key={t} onClick={() => setTheme(t)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${theme===t ? "bg-pri text-white" : "bg-surface text-tx hover:bg-surface-h"}`}>
                {t==="light" ? "☀️ Светлая" : "🌙 Тёмная"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-tx2">Профиль</h3>
          <div><label className="block text-xs text-tx2 mb-1">Username</label><input value={username} onChange={e=>setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g,""))} maxLength={20} className="w-full px-4 py-3 rounded-xl bg-surface border border-brd text-sm text-tx focus:border-pri transition-colors"/></div>
          <div><label className="block text-xs text-tx2 mb-1">Имя</label><input value={displayName} onChange={e=>setDisplayName(e.target.value)} maxLength={30} className="w-full px-4 py-3 rounded-xl bg-surface border border-brd text-sm text-tx focus:border-pri transition-colors"/></div>
          <button onClick={save} disabled={saving||!username.trim()} className="w-full py-3 rounded-xl bg-pri text-white font-medium text-sm hover:bg-pri-h transition-colors disabled:opacity-50">{saving ? "..." : "Сохранить"}</button>
        </div>
        <div className="px-4 py-3 rounded-xl bg-surface"><p className="text-xs text-tx2">Email</p><p className="text-sm">{user?.email || "—"}</p></div>
        <button onClick={signOut} className="w-full py-3 rounded-xl border border-red-500 text-red-500 text-sm hover:bg-red-500/10 transition-colors">Выйти</button>
      </div>
    </div>
  );
}
