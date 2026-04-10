"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";

let audioCtx: AudioContext | null = null;

function playNotificationSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Two-tone notification
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    osc1.frequency.setValueAtTime(587, audioCtx.currentTime); // D5
    osc2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.12);
    osc2.start(audioCtx.currentTime + 0.12);
    osc2.stop(audioCtx.currentTime + 0.4);
  } catch {}
}

function sendPushNotification(title: string, body: string) {
  try {
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      new Notification(title, { body, badge: "/manifest.json" });
    }
  } catch {}
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
            const preview = msg.content.slice(0, 60);
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
