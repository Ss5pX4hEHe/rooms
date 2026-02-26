"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"loading" | "auth" | "username">("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth" },
    });
    if (error) setError(error.message);
  }

  async function handleAuth() {
    if (!email || !password) return;
    setLoading(true); setError("");
    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) { setError(error.message); return; }
      if (data.user) setStep("username");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { setError("Неверный email или пароль"); return; }
      if (data.user) {
        const { data: p } = await supabase.from("profiles").select("username").eq("id", data.user.id).single();
        if (!p?.username) setStep("username"); else router.replace("/chat");
      }
    }
  }

  async function handleSetUsername() {
    setLoading(true); setError("");
    const { data: ex } = await supabase.from("profiles").select("id").eq("username", username.toLowerCase()).single();
    if (ex) { setError("Username занят"); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ username: username.toLowerCase(), display_name: username }).eq("id", user.id);
    setLoading(false);
    if (error) setError(error.message); else router.replace("/chat");
  }

  if (step === "loading") return (
    <div className="h-full flex items-center justify-center bg-bg">
      <div className="animate-pulse text-tx2">Загрузка...</div>
    </div>
  );

  return (
    <div className="h-full flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm a-su">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pri mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h1 className="text-2xl font-bold">Rooms</h1>
          <p className="text-tx2 text-sm mt-1">Private messenger</p>
        </div>

        {step === "auth" && (
          <div className="space-y-4">
            <button onClick={handleGoogle}
              className="w-full py-3 rounded-xl bg-white text-gray-800 font-medium text-sm border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Войти через Google
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-brd"></div>
              <span className="text-xs text-tx2">или</span>
              <div className="flex-1 h-px bg-brd"></div>
            </div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="w-full px-4 py-3 rounded-xl bg-surface border border-brd text-tx text-sm focus:border-pri transition-colors" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()} placeholder="Пароль (минимум 6 символов)"
              className="w-full px-4 py-3 rounded-xl bg-surface border border-brd text-tx text-sm focus:border-pri transition-colors" />
            <button onClick={handleAuth} disabled={loading || !email || password.length < 6}
              className="w-full py-3 rounded-xl bg-pri text-white font-medium text-sm hover:bg-pri-h transition-colors disabled:opacity-50">
              {loading ? "..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="w-full py-2 text-sm text-tx2 hover:text-tx transition-colors">
              {mode === "login" ? "Нет аккаунта? Регистрация" : "Есть аккаунт? Войти"}
            </button>
          </div>
        )}

        {step === "username" && (
          <div className="space-y-4">
            <p className="text-sm text-tx2 text-center">Выбери username</p>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleSetUsername()} placeholder="coolname" maxLength={20}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-brd text-tx text-sm focus:border-pri transition-colors" autoFocus />
            <button onClick={handleSetUsername} disabled={loading || username.length < 2}
              className="w-full py-3 rounded-xl bg-pri text-white font-medium text-sm hover:bg-pri-h transition-colors disabled:opacity-50">
              {loading ? "..." : "Продолжить"}
            </button>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}
      </div>
    </div>
  );
}