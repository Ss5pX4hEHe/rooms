"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "username">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp() {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setLoading(false);
    if (error) setError(error.message); else setStep("otp");
  }

  async function verifyOtp() {
    setLoading(true); setError("");
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.user) {
      const { data: p } = await supabase.from("profiles").select("username").eq("id", data.user.id).single();
      if (!p?.username) setStep("username"); else router.replace("/chat");
    }
  }

  async function setUser() {
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

        {step === "email" && (
          <div className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendOtp()} placeholder="your@email.com" className="w-full px-4 py-3 rounded-xl bg-surface border border-brd text-tx text-sm focus:border-pri transition-colors" autoFocus />
            <button onClick={sendOtp} disabled={loading || !email} className="w-full py-3 rounded-xl bg-pri text-white font-medium text-sm hover:bg-pri-h transition-colors disabled:opacity-50">{loading ? "..." : "Получить код"}</button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <p className="text-sm text-tx2 text-center">Код отправлен на <span className="text-tx font-medium">{email}</span></p>
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && verifyOtp()} placeholder="000000" maxLength={6} className="w-full px-4 py-3 rounded-xl bg-surface border border-brd text-tx text-center tracking-[.3em] text-lg font-mono focus:border-pri transition-colors" autoFocus />
            <button onClick={verifyOtp} disabled={loading || otp.length < 6} className="w-full py-3 rounded-xl bg-pri text-white font-medium text-sm hover:bg-pri-h transition-colors disabled:opacity-50">{loading ? "..." : "Войти"}</button>
            <button onClick={() => { setStep("email"); setOtp(""); }} className="w-full py-2 text-sm text-tx2 hover:text-tx transition-colors">Другой email</button>
          </div>
        )}

        {step === "username" && (
          <div className="space-y-4">
            <p className="text-sm text-tx2 text-center">Выбери username — по нему тебя найдут</p>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))} onKeyDown={(e) => e.key === "Enter" && setUser()} placeholder="coolname" maxLength={20} className="w-full px-4 py-3 rounded-xl bg-surface border border-brd text-tx text-sm focus:border-pri transition-colors" autoFocus />
            <button onClick={setUser} disabled={loading || username.length < 2} className="w-full py-3 rounded-xl bg-pri text-white font-medium text-sm hover:bg-pri-h transition-colors disabled:opacity-50">{loading ? "..." : "Продолжить"}</button>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}
      </div>
    </div>
  );
}
