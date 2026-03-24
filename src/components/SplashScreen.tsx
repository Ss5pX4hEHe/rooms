"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const { splashDone, setSplashDone } = useStore();
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const t1 = setTimeout(() => setOpacity(0), 1200);
    const t2 = setTimeout(() => setSplashDone(true), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (splashDone) return <>{children}</>;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-bg flex items-center justify-center transition-opacity duration-400" style={{ opacity }}>
        <div className="text-center splash-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 mb-4 shadow-lg shadow-blue-500/25">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-tx">Rooms</h1>
          <p className="text-tx2 text-sm mt-1">Secure messenger</p>
        </div>
      </div>
      {children}
    </>
  );
}
