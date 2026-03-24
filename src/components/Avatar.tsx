"use client";

export function Avatar({ src, name, size = 40, className = "" }: { src?: string | null; name: string; size?: number; className?: string }) {
  const letter = (name || "?").charAt(0).toUpperCase();
  const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-cyan-500", "bg-rose-500", "bg-indigo-500"];
  const color = colors[name.charCodeAt(0) % colors.length];

  if (src) {
    return (
      <img src={src} alt={name} style={{ width: size, height: size }}
        className={`rounded-full object-cover shrink-0 ${className}`} />
    );
  }

  return (
    <div style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={`rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${color} ${className}`}>
      {letter}
    </div>
  );
}
