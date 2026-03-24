"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { useChats } from "@/hooks/useChats";
import { Avatar } from "@/components/Avatar";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, setProfile, setUser, theme, setTheme, showToast } = useStore();
  const { uploadAvatar } = useChats();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => { if (!session) router.replace("/auth"); }); }, []);
  useEffect(() => {
    if (profile) { setUsername(profile.username || ""); setDisplayName(profile.display_name || ""); setBio(profile.bio || ""); }
  }, [profile]);

  async function save() {
    if (!user || !username.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      username: username.toLowerCase().trim(),
      display_name: displayName.trim() || username.trim(),
      bio: bio.trim(),
    }).eq("id", user.id);
    setSaving(false);
    if (error) showToast(error.message.includes("unique") ? "Username taken" : error.message);
    else {
      setProfile({ ...profile!, username: username.toLowerCase().trim(), display_name: displayName.trim() || username.trim(), bio: bio.trim() });
      showToast("Saved");
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Max 2MB"); return; }
    setUploading(true);
    const url = await uploadAvatar(file);
    setUploading(false);
    if (url) setProfile({ ...profile!, avatar_url: url });
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
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Avatar src={profile?.avatar_url} name={profile?.display_name || profile?.username || "?"} size={80} />
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            {uploading && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div></div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <p className="text-xs text-tx2">Tap to change avatar</p>
        </div>

        {/* Theme */}
        <div>
          <h3 className="text-sm font-medium text-tx2 mb-3">Theme</h3>
          <div className="flex gap-2">
            {(["light", "dark"] as const).map(t => (
              <button key={t} onClick={() => setTheme(t)} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${theme === t ? "bg-pri text-white" : "bg-surface text-tx hover:bg-surface-h"}`}>
                {t === "light" ? "☀️ Light" : "🌙 Dark"}
              </button>
            ))}
          </div>
        </div>

        {/* Profile */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-tx2">Profile</h3>
          <div><label className="block text-xs text-tx2 mb-1">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))} maxLength={20}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-brd text-sm text-tx focus:border-pri transition-colors" /></div>
          <div><label className="block text-xs text-tx2 mb-1">Display name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={30}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-brd text-sm text-tx focus:border-pri transition-colors" /></div>
          <div><label className="block text-xs text-tx2 mb-1">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={200} rows={3} placeholder="Tell about yourself..."
              className="w-full px-4 py-3 rounded-xl bg-surface border border-brd text-sm text-tx focus:border-pri transition-colors resize-none" /></div>
          <button onClick={save} disabled={saving || !username.trim()} className="w-full py-3 rounded-xl bg-pri text-white font-medium text-sm hover:bg-pri-h transition-colors disabled:opacity-50">{saving ? "..." : "Save"}</button>
        </div>

        <div className="px-4 py-3 rounded-xl bg-surface"><p className="text-xs text-tx2">Email</p><p className="text-sm">{user?.email || "—"}</p></div>
        <button onClick={signOut} className="w-full py-3 rounded-xl border border-red-500 text-red-500 text-sm hover:bg-red-500/10 transition-colors">Sign out</button>
      </div>
    </div>
  );
}
