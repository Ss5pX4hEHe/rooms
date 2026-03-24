"use client";
export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-brd">
        <div className="w-10 h-10 rounded-full bg-surface"></div>
        <div className="flex-1"><div className="h-4 w-24 bg-surface rounded"></div><div className="h-3 w-16 bg-surface rounded mt-1"></div></div>
      </div>
      <div className="flex-1 px-4 py-3 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`flex ${i % 3 === 0 ? "justify-end" : "justify-start"}`}>
            <div className={`rounded-2xl bg-surface ${i % 2 === 0 ? "w-48 h-12" : "w-36 h-10"}`}></div>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-brd"><div className="h-10 rounded-2xl bg-surface"></div></div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="animate-pulse space-y-1 p-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl">
          <div className="w-11 h-11 rounded-full bg-surface shrink-0"></div>
          <div className="flex-1"><div className="h-4 w-28 bg-surface rounded"></div><div className="h-3 w-40 bg-surface rounded mt-1.5"></div></div>
        </div>
      ))}
    </div>
  );
}
