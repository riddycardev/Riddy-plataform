/**
 * PageLoader — Premium loading skeleton for React.lazy Suspense fallback.
 *
 * Shows a smooth, branded loading experience while chunks are being fetched.
 * Designed to match RIDDY's dark theme and feel native on mobile.
 */

export function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0A0F1C] flex flex-col">
      {/* Header skeleton */}
      <div className="h-16 bg-[#0A0F1C]/95 border-b border-white/5 flex items-center px-4 gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/10 animate-pulse" />
        <div className="w-16 h-5 rounded bg-white/10 animate-pulse" />
        <div className="flex-1" />
        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 px-4 pt-6 pb-24 max-w-lg mx-auto w-full space-y-4">
        {/* Hero block */}
        <div className="h-48 rounded-2xl bg-white/5 animate-pulse" />

        {/* Two-column cards */}
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl bg-white/5 animate-pulse overflow-hidden">
              <div className="aspect-[4/3] bg-white/8" />
              <div className="p-3 space-y-2">
                <div className="h-3 rounded bg-white/10 w-3/4" />
                <div className="h-3 rounded bg-white/8 w-1/2" />
              </div>
            </div>
          ))}
        </div>

        {/* Text lines */}
        <div className="space-y-2 pt-2">
          <div className="h-4 rounded bg-white/8 animate-pulse w-full" />
          <div className="h-4 rounded bg-white/8 animate-pulse w-5/6" />
          <div className="h-4 rounded bg-white/8 animate-pulse w-4/6" />
        </div>
      </div>

      {/* RIDDY brand mark at center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-3 opacity-20">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
            <span className="text-black font-black text-xl">R</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Minimal inline spinner — used inside pages/components (not full-page).
 */
export function InlineLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default PageLoader;
