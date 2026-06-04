/**
 * RIDDY Testimonials Section
 * Design: User reviews and social proof - Mobile Optimized
 * STEP 7: Now uses real reviews from the database.
 * Falls back to placeholder cards if no reviews exist yet.
 */

import { motion } from "framer-motion";
import { Star, Quote, User } from "lucide-react";
import { trpc } from "@/lib/trpc";

// No placeholder reviews — only real reviews from the database are shown.

function getReviewTypeLabel(reviewType: string): string {
  switch (reviewType) {
    case "renter_to_host":
      return "Locatário";
    case "host_to_renter":
      return "Proprietário";
    case "renter_to_vehicle":
      return "Locatário";
    default:
      return "Usuário RIDDY";
  }
}

export default function TestimonialsSection() {
  const { data: publicReviews, isLoading } = trpc.review.getPublicReviews.useQuery({ limit: 6 });
  const { data: platformStats } = trpc.review.getPlatformStats.useQuery();

  // Only show real reviews from the database
  const displayReviews = (publicReviews ?? []).map(r => ({
    id: String(r.id),
    rating: r.rating,
    comment: r.comment ?? "",
    reviewerName: r.reviewerName ?? "Usuário RIDDY",
    reviewerAvatar: r.reviewerAvatar,
    reviewType: r.reviewType,
    isPlaceholder: false,
  }));
  const hasReviews = displayReviews.length > 0;

  // Build the rating display
  const totalReviews = platformStats?.totalReviews ?? 0;
  const averageRating = platformStats?.averageRating ?? 0;
  const hasRealStats = totalReviews > 0 && averageRating > 0;

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-b from-[#0A0F1C] to-[#0D1424]">
      <div className="container px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-10 md:mb-12"
        >
          <span className="text-cyan-400 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4 block">
            Depoimentos
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            O que nossos usuários dizem
          </h2>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
            {hasRealStats
              ? `${totalReviews.toLocaleString("pt-BR")} avaliações verificadas de usuários reais da RIDDY.`
              : "Pessoas que já usam a RIDDY para suas viagens e renda extra."}
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-white/5 animate-pulse">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="w-4 h-4 rounded-full bg-white/10" />
                  ))}
                </div>
                <div className="space-y-2 mb-6">
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-4/5" />
                  <div className="h-3 bg-white/10 rounded w-3/5" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10" />
                  <div className="space-y-1">
                    <div className="h-3 bg-white/10 rounded w-24" />
                    <div className="h-2 bg-white/10 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hasReviews ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {displayReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-white/5 relative"
              >
                {/* Quote Icon */}
                <div className="absolute top-4 right-4 sm:top-5 sm:right-5 md:top-6 md:right-6 text-cyan-500/20">
                  <Quote className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                </div>

                {/* Rating */}
                <div className="flex gap-0.5 sm:gap-1 mb-3 sm:mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5 md:mb-6 pr-4">
                  "{review.comment}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {review.reviewerAvatar ? (
                    <img
                      src={review.reviewerAvatar}
                      alt={review.reviewerName}
                      className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-cyan-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm sm:text-base truncate">{review.reviewerName}</p>
                    <p className="text-gray-500 text-xs sm:text-sm truncate">
                      {getReviewTypeLabel(review.reviewType)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-gray-400 text-base">
              As primeiras avaliações aparecerão aqui em breve.
            </p>
          </motion.div>
        )}

        {/* Overall Rating */}
        {(hasRealStats || !isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 sm:mt-10 md:mt-12 text-center"
          >
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-white/5 rounded-xl sm:rounded-full px-4 sm:px-6 py-3 border border-white/10">
              <div className="flex gap-0.5 sm:gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {hasRealStats ? (
                  <>
                    <span className="text-white font-semibold text-sm sm:text-base">{averageRating.toFixed(1)}</span>
                    <span className="text-gray-400 text-xs sm:text-sm">
                      baseado em {totalReviews.toLocaleString("pt-BR")} avaliações
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 text-xs sm:text-sm">Seja o primeiro a avaliar</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
