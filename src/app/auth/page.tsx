"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<"loading" | "auth" | "username">("loading");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from("profiles").select("username").eq("id", session.user.id).single().then(({ data }) => {
          if (data?.username) router.replace("/chat");
          else setStep("username");
        });
      } else {
        setStep("auth");
      }
    });
  }, []);

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth" },
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  async function handleSetUsername() {
    setLoading(true); setError("");
    const clean = username.toLowerCase().trim();
    if (clean.length < 2) { setError("Minimum 2 characters"); setLoading(false); return; }
    const { data: ex } = await supabase.from("profiles").select("id").eq("username", clean).single();
    if (ex) { setError("Username is taken"); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ username: clean, display_name: username.trim() }).eq("id", user.id);
    setLoading(false);
    if (error) setError(error.message); else router.replace("/chat");
  }

  if (step === "loading") return (
    <div className="h-full flex items-center justify-center bg-bg">
      <div className="animate-pulse text-tx2 text-lg">Rooms</div>
    </div>
  );

  return (
    <div className="h-full flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">

        {step === "auth" && (
          <div className="a-su">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 mb-6 shadow-lg shadow-blue-500/25">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
              <p className="text-tx2 text-sm mt-2">Secure private messenger</p>
            </div>

            <button onClick={handleGoogle} disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-white text-gray-800 font-medium text-sm border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {loading ? "Connecting..." : "Continue with Google"}
            </button>

            <p className="text-[11px] text-tx2 text-center mt-6 leading-relaxed">
              By continuing you agree to our terms of service
            </p>
          </div>
        )}

        {step === "username" && (
          <div className="a-su">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <h2 className="text-xl font-bold">Choose a username</h2>
              <p className="text-tx2 text-sm mt-1">Others will find you by this name</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tx2 text-sm">@</span>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleSetUsername()} placeholder="username" maxLength={20}
                  className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-surface border border-brd text-tx text-sm focus:border-pri transition-colors" autoFocus />
              </div>
              <button onClick={handleSetUsername} disabled={loading || username.length < 2}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium text-sm hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm shadow-blue-500/25">
                {loading ? "..." : "Continue"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-500 text-center a-fi">{error}</p>}
      </div>
    </div>
  );
}
