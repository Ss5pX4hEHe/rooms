"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"auth" | "username">("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="w-full px-4 py-3 rounded-xl bg-surface border border-brd text-tx text-sm focus:border-pri transition-colors" autoFocus />
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