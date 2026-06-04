/**
 * VehicleCardSkeleton — animated shimmer placeholder for vehicle cards.
 * Matches the exact dimensions of the real VehicleCard to prevent layout shift.
 */

/** Shimmer base class for reuse */
const shimmer =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/8 before:to-transparent";

interface VehicleCardSkeletonProps {
  /** Number of skeleton cards to render */
  count?: number;
  /** Layout variant matching the real card */
  variant?: "carousel" | "grid";
}

function SingleCardSkeleton({ variant = "carousel" }: { variant?: "carousel" | "grid" }) {
  const widthClass =
    variant === "carousel"
      ? "w-[calc(50vw-24px)] sm:w-[220px] md:w-[240px] lg:w-[260px] max-w-[260px] flex-shrink-0"
      : "w-full";

  return (
    <div className={`${widthClass} rounded-xl overflow-hidden bg-[#1A2235] border border-white/8`}>
      {/* Image placeholder — 4:3 */}
      <div className={`aspect-[4/3] bg-[#0F1929] ${shimmer}`} />

      {/* Content placeholder */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <div className={`h-4 w-3/4 rounded-md bg-[#0F1929] ${shimmer}`} />

        {/* Year + rating row */}
        <div className="flex items-center gap-2">
          <div className={`h-3 w-10 rounded-md bg-[#0F1929] ${shimmer}`} />
          <div className={`h-3 w-14 rounded-md bg-[#0F1929] ${shimmer}`} />
        </div>

        {/* Price row */}
        <div className="pt-2 border-t border-white/8 flex items-baseline gap-1">
          <div className={`h-5 w-16 rounded-md bg-[#0F1929] ${shimmer}`} />
          <div className={`h-3 w-8 rounded-md bg-[#0F1929] ${shimmer}`} />
        </div>
      </div>
    </div>
  );
}

export function VehicleCardSkeleton({ count = 4, variant = "carousel" }: VehicleCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SingleCardSkeleton key={i} variant={variant} />
      ))}
    </>
  );
}

/** Grid skeleton for the /cars search page — 2-column mobile grid */
export function VehicleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SingleCardSkeleton key={i} variant="grid" />
      ))}
    </div>
  );
}
