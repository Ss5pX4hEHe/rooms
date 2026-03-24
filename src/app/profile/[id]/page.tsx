"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChats } from "@/hooks/useChats";
import { useStore, isOnline, formatLastSeen } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const userId = id as string;
  const { getProfile, createDirectChat, blockUser, unblockUser } = useChats();
  const { user, blockedUsers } = useStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const isBlocked = blockedUsers.includes(userId);
  const isSelf = user?.id === userId;

  useEffect(() => {
    getProfile(userId).then((p) => { setProfile(p); setLoading(false); });
  }, [userId]);

  async function startChat() {
    const chatId = await createDirectChat(userId);
    if (chatId) router.push(`/chat/${chatId}`);
  }

  if (loading) return <div className="h-full flex items-center justify-center bg-bg"><div className="animate-pulse text-tx2">Loading...</div></div>;
  if (!profile) return <div className="h-full flex items-center justify-center bg-bg text-tx2">User not found</div>;

  const online = isOnline(profile.last_seen);
  const lastSeen = formatLastSeen(profile.last_seen);

  return (
    <div className="h-full bg-bg overflow-y-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-brd">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-surface transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="text-lg font-semibold">Profile</h1>
      </div>

      <div className="max-w-md mx-auto p-6">
        <div className="flex flex-col items-center text-center mb-8">
          <Avatar src={profile.avatar_url} name={profile.display_name || profile.username || "?"} size={96} online={online} />
          <h2 className="text-xl font-bold mt-4">{profile.display_name || profile.username}</h2>
          <p className="text-sm text-tx2">@{profile.username}</p>
          <p className={`text-xs mt-1 ${online ? "text-emerald-500" : "text-tx2"}`}>{lastSeen}</p>
          {profile.bio && <p className="text-sm text-tx2 mt-3 max-w-xs">{profile.bio}</p>}
        </div>

        {!isSelf && (
          <div className="space-y-3">
            <button onClick={startChat} className="w-full py-3 rounded-xl bg-pri text-white font-medium text-sm hover:bg-pri-h transition-colors flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Send message
            </button>
            <button onClick={() => isBlocked ? unblockUser(userId) : blockUser(userId)}
              className={`w-full py-3 rounded-xl border text-sm font-medium transition-colors ${isBlocked ? "border-emerald-500 text-emerald-500 hover:bg-emerald-500/10" : "border-red-500 text-red-500 hover:bg-red-500/10"}`}>
              {isBlocked ? "Unblock user" : "Block user"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
