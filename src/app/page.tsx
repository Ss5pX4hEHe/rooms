"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      router.replace(session ? "/chat" : "/auth");
    });
  }, [router]);
  return <div className="h-full flex items-center justify-center bg-bg"><div className="animate-pulse text-tx2 text-lg">Rooms</div></div>;
}
