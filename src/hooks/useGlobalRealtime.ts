"use client";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";

// Simple notification sound using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

function sendPushNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
    new Notification(title, { body, icon: "/manifest.json" });
  }
}

export function useGlobalRealtime() {
  const { user, chats, updateLastMsg, showToast } = useStore();

  useEffect(() => {
    if (!user || chats.length === 0) return;
    const channels = chats.map((chat) =>
      supabase.channel(`g:${chat.chat_id}`)
        .on("broadcast", { event: "message:new" }, ({ payload }) => {
          const msg = payload as any;
          updateLastMsg(chat.chat_id, msg.content, msg.sender_id, msg.created_at);
          const s = useStore.getState();
          if (msg.sender_id !== user.id && s.activeChatId !== chat.chat_id) {
            const senderName = msg.sender_display_name || msg.sender_username || "New message";
            const preview = msg.content.slice(0, 50);
            showToast(`${senderName}: ${preview}`);
            playNotificationSound();
            sendPushNotification(senderName, preview);
          }
        })
        .subscribe()
    );
    return () => { channels.forEach((c) => c.unsubscribe()); };
  }, [user?.id, chats.map((c) => c.chat_id).join(",")]);
}
