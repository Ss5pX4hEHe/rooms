"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SplashScreen } from "@/components/SplashScreen";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(true);
      setTimeout(() => router.replace(session ? "/chat" : "/auth"), 1400);
    });
  }, [router]);

  return (
    <SplashScreen>
      <div className="h-full flex items-center justify-center bg-bg" />
    </SplashScreen>
  );
}
