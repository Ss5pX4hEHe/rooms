"use client";
import { isToday, isYesterday, format } from "date-fns";

export function DateDivider({ date }: { date: string }) {
  const d = new Date(date);
  let label = format(d, "MMM d, yyyy");
  if (isToday(d)) label = "Today";
  else if (isYesterday(d)) label = "Yesterday";

  return (
    <div className="flex items-center justify-center my-3">
      <div className="px-3 py-1 rounded-full bg-surface/80 text-[11px] text-tx2 font-medium">{label}</div>
    </div>
  );
}
