"use client";

export default function OfflinePage() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-surface border border-border flex items-center justify-center mb-2">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <p className="text-white font-bold text-xl">You&apos;re offline</p>
      <p className="text-pale text-sm max-w-xs">
        No internet connection. Your data is safe — reconnect to sync the latest transactions.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 bg-brand text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-brand/30 text-sm"
      >
        Try again
      </button>
    </div>
  );
}
