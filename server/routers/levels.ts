/**
 * RIDDY Ranks — Router de Níveis, Score, Conquistas, Ranking e Metas
 * Versão 2.0 — Score Riddy multidimensional, ranking regional, conquistas expandidas.
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  userLevels,
  userAchievements,
  platformGoals,
  users,
  bookings,
  vehicles,
} from "../../drizzle/schema";
import { eq, and, desc, sql, gte, lte, asc, ne } from "drizzle-orm";
import {
  calculateRiderLevel,
  calculateHostLevel,
  calculateRenterScore,
  calculateHostScore,
  getRiderProgress,
  getHostProgress,
  getSocialProofMessage,
  RIDER_LEVELS,
  HOST_LEVELS,
  ACHIEVEMENTS,
  getRiderLevelConfig,
  getHostLevelConfig,
} from "../../shared/levels";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function getOrCreateUserLevel(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
  const existing = await db
    .select()
    .from(userLevels)
    .where(eq(userLevels.userId, userId))
    .limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(userLevels).values({ userId });
  const created = await db
    .select()
    .from(userLevels)
    .where(eq(userLevels.userId, userId))
    .limit(1);
  return created[0];
}

/** Recalcula e persiste o nível e score do usuário após uma locação concluída */
export async function recalculateUserLevel(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
  const ul = await getOrCreateUserLevel(userId);

  // Buscar se o usuário tem KYC aprovado
  const userRow = await db.select({ kycStatus: users.kycStatus }).from(users).where(eq(users.id, userId)).limit(1);
  const isVerified = userRow[0]?.kycStatus === "approved";

  // Calcular score do locatário
  const riderAvg = ul.renterAvgRating ? parseFloat(ul.renterAvgRating) : 0;
  const renterScore = calculateRenterScore({
    totalRentals: ul.renterTotalRentals,
    avgRating: riderAvg,
    accountAgeDays: 0, // será calculado separadamente se necessário
    isVerified,
    totalKm: ul.renterTotalKm,
    cancellations: ul.renterCancellations,
    lateReturns: ul.renterLateReturns,
    disputes: ul.renterDisputes,
    reports: ul.renterReports,
  });
  const newRiderLevel = calculateRiderLevel(ul.renterTotalRentals, riderAvg, renterScore);

  // Calcular score do anfitrião
  const hostAvg = ul.hostAvgRating ? parseFloat(ul.hostAvgRating) : 0;
  const hostResponse = ul.hostAvgResponseHours ? parseFloat(ul.hostAvgResponseHours) : null;
  const hostCancel = ul.hostCancellationRate ? parseFloat(ul.hostCancellationRate) : 0;
  const hostScore = calculateHostScore({
    totalRentals: ul.hostTotalRentals,
    avgRating: hostAvg,
    avgResponseHours: hostResponse,
    isVerified,
    cancellations: ul.hostCancellations,
    complaints: ul.hostComplaints,
    reports: ul.hostReports,
  });
  const newHostLevel = calculateHostLevel(ul.hostTotalRentals, hostAvg, hostCancel, hostResponse, hostScore);

  const leveledUpRider = newRiderLevel > ul.renterLevel;
  const leveledUpHost = newHostLevel > ul.hostLevel;

  await db
    .update(userLevels)
    .set({
      renterLevel: newRiderLevel,
      hostLevel: newHostLevel,
      renterScore,
      hostScore,
      renterScoreUpdatedAt: new Date(),
      hostScoreUpdatedAt: new Date(),
      renterLevelUpdatedAt: leveledUpRider ? new Date() : ul.renterLevelUpdatedAt,
      hostLevelUpdatedAt: leveledUpHost ? new Date() : ul.hostLevelUpdatedAt,
      updatedAt: new Date(),
    })
    .where(eq(userLevels.userId, userId));

  return { newRiderLevel, newHostLevel, leveledUpRider, leveledUpHost, renterScore, hostScore };
}

/** Incrementa stats do locatário após locação concluída */
export async function incrementRenterStats(userId: number, kmRidden: number, rating: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
  const ul = await getOrCreateUserLevel(userId);
  const currentTotal = ul.renterTotalRentals;
  const currentAvg = ul.renterAvgRating ? parseFloat(ul.renterAvgRating) : 0;
  // Média ponderada
  const newAvg = currentTotal === 0
    ? rating
    : (currentAvg * currentTotal + rating) / (currentTotal + 1);

  await db
    .update(userLevels)
    .set({
      renterTotalRentals: currentTotal + 1,
      renterTotalKm: ul.renterTotalKm + kmRidden,
      renterAvgRating: newAvg.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(userLevels.userId, userId));

  return recalculateUserLevel(userId);
}

/** Incrementa stats do anfitrião após locação concluída */
export async function incrementHostStats(
  userId: number,
  earnings: number,
  rating: number,
  responseHours: number
) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
  const ul = await getOrCreateUserLevel(userId);
  const currentTotal = ul.hostTotalRentals;
  const currentAvg = ul.hostAvgRating ? parseFloat(ul.hostAvgRating) : 0;
  const currentResponse = ul.hostAvgResponseHours ? parseFloat(ul.hostAvgResponseHours) : responseHours;
  const currentEarnings = ul.hostTotalEarnings ? parseFloat(ul.hostTotalEarnings) : 0;

  const newAvg = currentTotal === 0
    ? rating
    : (currentAvg * currentTotal + rating) / (currentTotal + 1);
  const newResponse = currentTotal === 0
    ? responseHours
    : (currentResponse * currentTotal + responseHours) / (currentTotal + 1);

  await db
    .update(userLevels)
    .set({
      hostTotalRentals: currentTotal + 1,
      hostTotalEarnings: (currentEarnings + earnings).toFixed(2),
      hostAvgRating: newAvg.toFixed(2),
      hostAvgResponseHours: newResponse.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(userLevels.userId, userId));

  return recalculateUserLevel(userId);
}

/** Verifica e desbloqueia conquistas para o usuário */
export async function checkAndUnlockAchievements(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
  const ul = await getOrCreateUserLevel(userId);
  const userRow = await db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, userId)).limit(1);
  const existing = await db
    .select({ achievementKey: userAchievements.achievementKey })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  const unlockedKeys = new Set(existing.map((a: { achievementKey: string }) => a.achievementKey));

  const toUnlock: { key: string; context: "renter" | "host" }[] = [];

  // ─── PRIMEIRAS ────────────────────────────────────────────────────────────
  if (!unlockedKeys.has("first_rental") && ul.renterTotalRentals >= 1)
    toUnlock.push({ key: "first_rental", context: "renter" });
  if (!unlockedKeys.has("first_host") && ul.hostTotalRentals >= 1)
    toUnlock.push({ key: "first_host", context: "host" });

  // ─── CRESCIMENTO (locatário) ──────────────────────────────────────────────
  if (!unlockedKeys.has("rentals_10") && ul.renterTotalRentals >= 10)
    toUnlock.push({ key: "rentals_10", context: "renter" });
  if (!unlockedKeys.has("rentals_25") && ul.renterTotalRentals >= 25)
    toUnlock.push({ key: "rentals_25", context: "renter" });
  if (!unlockedKeys.has("rentals_50") && ul.renterTotalRentals >= 50)
    toUnlock.push({ key: "rentals_50", context: "renter" });
  if (!unlockedKeys.has("rentals_100") && ul.renterTotalRentals >= 100)
    toUnlock.push({ key: "rentals_100", context: "renter" });
  if (!unlockedKeys.has("rentals_500") && ul.renterTotalRentals >= 500)
    toUnlock.push({ key: "rentals_500", context: "renter" });
  if (!unlockedKeys.has("road_warrior") && ul.renterTotalKm >= 1000)
    toUnlock.push({ key: "road_warrior", context: "renter" });

  // ─── CRESCIMENTO (anfitrião) ──────────────────────────────────────────────
  if (!unlockedKeys.has("host_rentals_10") && ul.hostTotalRentals >= 10)
    toUnlock.push({ key: "host_rentals_10", context: "host" });
  if (!unlockedKeys.has("host_rentals_50") && ul.hostTotalRentals >= 50)
    toUnlock.push({ key: "host_rentals_50", context: "host" });
  if (!unlockedKeys.has("top_earner") && parseFloat(ul.hostTotalEarnings ?? "0") >= 10000)
    toUnlock.push({ key: "top_earner", context: "host" });

  // ─── REPUTAÇÃO ────────────────────────────────────────────────────────────
  const renterAvg = ul.renterAvgRating ? parseFloat(ul.renterAvgRating) : 0;
  if (!unlockedKeys.has("perfect_score") && renterAvg >= 5.0 && ul.renterTotalRentals >= 1)
    toUnlock.push({ key: "perfect_score", context: "renter" });

  // ─── FIDELIDADE ───────────────────────────────────────────────────────────
  if (userRow[0]?.createdAt) {
    const accountAgeDays = Math.floor((Date.now() - userRow[0].createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (!unlockedKeys.has("loyalty_6months") && accountAgeDays >= 180)
      toUnlock.push({ key: "loyalty_6months", context: "renter" });
    if (!unlockedKeys.has("loyalty_1year") && accountAgeDays >= 365)
      toUnlock.push({ key: "loyalty_1year", context: "renter" });
    if (!unlockedKeys.has("loyalty_2years") && accountAgeDays >= 730)
      toUnlock.push({ key: "loyalty_2years", context: "renter" });
    // Founding member (primeiros 90 dias)
    const platformLaunchDate = new Date("2024-01-01");
    const daysSinceLaunch = Math.floor((userRow[0].createdAt.getTime() - platformLaunchDate.getTime()) / (1000 * 60 * 60 * 24));
    if (!unlockedKeys.has("founding_member") && daysSinceLaunch <= 90)
      toUnlock.push({ key: "founding_member", context: "renter" });
    if (!unlockedKeys.has("early_adopter") && daysSinceLaunch <= 180)
      toUnlock.push({ key: "early_adopter", context: "renter" });
  }

  // ─── RANKING (especiais) ──────────────────────────────────────────────────
  if (!unlockedKeys.has("top_region") && ul.renterRankCity && ul.renterRankCity <= 10)
    toUnlock.push({ key: "top_region", context: "renter" });
  if (!unlockedKeys.has("top_brazil") && ul.renterRankNational && ul.renterRankNational <= 100)
    toUnlock.push({ key: "top_brazil", context: "renter" });
  if (!unlockedKeys.has("host_top_region") && ul.hostRankCity && ul.hostRankCity <= 10)
    toUnlock.push({ key: "host_top_region", context: "host" });
  if (!unlockedKeys.has("host_top_brazil") && ul.hostRankNational && ul.hostRankNational <= 100)
    toUnlock.push({ key: "host_top_brazil", context: "host" });

  if (toUnlock.length > 0) {
    await db.insert(userAchievements).values(
      toUnlock.map((a) => ({ userId, achievementKey: a.key, context: a.context }))
    );
  }

  return toUnlock;
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────

export const levelsRouter = router({
  /** Busca o nível, score e progresso do usuário logado */
  getMyLevel: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
    const ul = await getOrCreateUserLevel(ctx.user.id);
    const riderAvg = ul.renterAvgRating ? parseFloat(ul.renterAvgRating) : 0;
    const hostAvg = ul.hostAvgRating ? parseFloat(ul.hostAvgRating) : 0;
    const hostResponse = ul.hostAvgResponseHours ? parseFloat(ul.hostAvgResponseHours) : null;
    const hostCancel = ul.hostCancellationRate ? parseFloat(ul.hostCancellationRate) : 0;

    const riderProgress = getRiderProgress(ul.renterTotalRentals, riderAvg, ul.renterScore);
    const hostProgress = getHostProgress(ul.hostTotalRentals, hostAvg, hostCancel, hostResponse, ul.hostScore);

    const riderConfig = getRiderLevelConfig(riderProgress.currentLevel);
    const hostConfig = getHostLevelConfig(hostProgress.currentLevel);
    const nextRiderConfig = riderProgress.nextLevel ? getRiderLevelConfig(riderProgress.nextLevel) : null;
    const nextHostConfig = hostProgress.nextLevel ? getHostLevelConfig(hostProgress.nextLevel) : null;

    // Social proof
    const riderSocialProof = getSocialProofMessage({
      context: "renter",
      rankCity: ul.renterRankCity,
      rankNational: ul.renterRankNational,
      currentLevel: riderProgress.currentLevel,
      nextLevel: riderProgress.nextLevel,
      scoreToNext: riderProgress.scoreToNext,
    });
    const hostSocialProof = getSocialProofMessage({
      context: "host",
      rankCity: ul.hostRankCity,
      rankNational: ul.hostRankNational,
      currentLevel: hostProgress.currentLevel,
      nextLevel: hostProgress.nextLevel,
      scoreToNext: hostProgress.scoreToNext,
    });

    return {
      rider: {
        ...riderProgress,
        config: riderConfig,
        nextConfig: nextRiderConfig,
        totalRentals: ul.renterTotalRentals,
        totalKm: ul.renterTotalKm,
        avgRating: riderAvg,
        score: ul.renterScore,
        rankCity: ul.renterRankCity,
        rankState: ul.renterRankState,
        rankNational: ul.renterRankNational,
        cancellations: ul.renterCancellations,
        lateReturns: ul.renterLateReturns,
        disputes: ul.renterDisputes,
        levelUpdatedAt: ul.renterLevelUpdatedAt,
        socialProof: riderSocialProof,
      },
      host: {
        ...hostProgress,
        config: hostConfig,
        nextConfig: nextHostConfig,
        totalRentals: ul.hostTotalRentals,
        totalEarnings: parseFloat(ul.hostTotalEarnings ?? "0"),
        avgRating: hostAvg,
        avgResponseHours: hostResponse,
        score: ul.hostScore,
        rankCity: ul.hostRankCity,
        rankState: ul.hostRankState,
        rankNational: ul.hostRankNational,
        cancellations: ul.hostCancellations,
        complaints: ul.hostComplaints,
        levelUpdatedAt: ul.hostLevelUpdatedAt,
        socialProof: hostSocialProof,
      },
    };
  }),

  /** Busca as conquistas do usuário logado */
  getMyAchievements: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
    const unlocked = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, ctx.user.id))
      .orderBy(desc(userAchievements.unlockedAt));

    const unlockedKeys = new Set(unlocked.map((a: typeof unlocked[0]) => a.achievementKey));

    return ACHIEVEMENTS.map((cfg) => ({
      ...cfg,
      unlocked: unlockedKeys.has(cfg.key),
      unlockedAt: unlocked.find((a: typeof unlocked[0]) => a.achievementKey === cfg.key)?.unlockedAt ?? null,
      sharedAt: unlocked.find((a: typeof unlocked[0]) => a.achievementKey === cfg.key)?.sharedAt ?? null,
    }));
  }),

  /** Marca uma conquista como compartilhada */
  markAchievementShared: protectedProcedure
    .input(z.object({ achievementKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      await db
        .update(userAchievements)
        .set({ sharedAt: new Date(), shareCount: sql`share_count + 1` })
        .where(
          and(
            eq(userAchievements.userId, ctx.user.id),
            eq(userAchievements.achievementKey, input.achievementKey)
          )
        );
      return { success: true };
    }),

  /** Retorna todos os níveis disponíveis (público — para página de benefícios) */
  getAllLevels: publicProcedure.query(() => ({
    rider: RIDER_LEVELS,
    host: HOST_LEVELS,
  })),

  /** Ranking regional — top locatários e anfitriões */
  getRanking: publicProcedure
    .input(z.object({
      context: z.enum(["renter", "host"]),
      scope: z.enum(["city", "state", "national"]).default("national"),
      city: z.string().optional(),
      state: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      // Busca os top usuários por score
      const scoreField = input.context === "renter" ? userLevels.renterScore : userLevels.hostScore;
      const levelField = input.context === "renter" ? userLevels.renterLevel : userLevels.hostLevel;
      const rentalsField = input.context === "renter" ? userLevels.renterTotalRentals : userLevels.hostTotalRentals;
      const ratingField = input.context === "renter" ? userLevels.renterAvgRating : userLevels.hostAvgRating;

      const rows = await db
        .select({
          userId: userLevels.userId,
          score: scoreField,
          level: levelField,
          totalRentals: rentalsField,
          avgRating: ratingField,
          userName: users.name,
          userAvatar: users.avatarUrl,
          userCity: users.addressCity,
          userState: users.addressState,
        })
        .from(userLevels)
        .innerJoin(users, eq(users.id, userLevels.userId))
        .orderBy(desc(scoreField))
        .limit(input.limit);

      return rows.map((r, idx) => ({
        rank: idx + 1,
        userId: r.userId,
        name: r.userName ?? "Usuário",
        avatar: r.userAvatar,
        city: r.userCity,
        state: r.userState,
        score: r.score,
        level: r.level,
        totalRentals: r.totalRentals,
        avgRating: r.avgRating ? parseFloat(r.avgRating) : 0,
        levelConfig: input.context === "renter"
          ? getRiderLevelConfig(r.level)
          : getHostLevelConfig(r.level),
      }));
    }),

  /** Posição do usuário logado no ranking */
  getMyRanking: protectedProcedure
    .input(z.object({ context: z.enum(["renter", "host"]) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      const ul = await getOrCreateUserLevel(ctx.user.id);
      const myScore = input.context === "renter" ? ul.renterScore : ul.hostScore;
      const scoreField = input.context === "renter" ? userLevels.renterScore : userLevels.hostScore;

      // Conta quantos usuários têm score maior
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(userLevels)
        .where(sql`${scoreField} > ${myScore}`);

      const rankNational = (result[0]?.count ?? 0) + 1;

      // Total de usuários com score > 0
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userLevels)
        .where(sql`${scoreField} > 0`);
      const totalUsers = totalResult[0]?.count ?? 1;

      const percentile = totalUsers > 0
        ? Math.round(((totalUsers - rankNational + 1) / totalUsers) * 100)
        : 0;

      return {
        rankNational,
        totalUsers,
        percentile,
        myScore,
      };
    }),

  // ─── ADMIN: Metas da Plataforma ──────────────────────────────────────────

  /** Lista todas as metas (admin) */
  adminListGoals: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
    return db.select().from(platformGoals).orderBy(desc(platformGoals.createdAt));
  }),

  /** Cria uma nova meta (admin) */
  adminCreateGoal: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(128),
        description: z.string().optional(),
        metricType: z.enum([
          "total_rentals", "total_revenue", "new_users", "new_hosts",
          "active_vehicles", "avg_rating", "cities_covered", "custom",
        ]),
        targetValue: z.number().positive(),
        unit: z.string().optional(),
        periodType: z.enum(["weekly", "monthly", "quarterly", "yearly", "custom"]),
        startsAt: z.date(),
        endsAt: z.date(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      await db.insert(platformGoals).values({
        ...input,
        targetValue: input.targetValue.toFixed(2),
        color: input.color ?? "#00D4FF",
        icon: input.icon ?? "Target",
        createdBy: ctx.user.id,
      });
      return { success: true };
    }),

  /** Atualiza o valor atual de uma meta (admin) */
  adminUpdateGoalProgress: protectedProcedure
    .input(z.object({ goalId: z.number(), currentValue: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      const goal = await db
        .select()
        .from(platformGoals)
        .where(eq(platformGoals.id, input.goalId))
        .limit(1);
      if (!goal.length) throw new TRPCError({ code: "NOT_FOUND" });
      const target = parseFloat(goal[0].targetValue);
      const newStatus =
        input.currentValue >= target ? "completed" : goal[0].status;
      await db
        .update(platformGoals)
        .set({
          currentValue: input.currentValue.toFixed(2),
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(platformGoals.id, input.goalId));
      return { success: true };
    }),

  /** Deleta uma meta (admin) */
  adminDeleteGoal: protectedProcedure
    .input(z.object({ goalId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      await db.delete(platformGoals).where(eq(platformGoals.id, input.goalId));
      return { success: true };
    }),

  /** Busca métricas reais da plataforma para atualizar metas automaticamente (admin) */
  adminSyncGoalMetrics: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
    const activeGoals = await db
      .select()
      .from(platformGoals)
      .where(eq(platformGoals.status, "active"));

    for (const goal of activeGoals) {
      let currentValue = 0;
      if (goal.metricType === "total_rentals") {
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(bookings)
          .where(eq(bookings.status, "completed"));
        currentValue = result[0]?.count ?? 0;
      } else if (goal.metricType === "new_users") {
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(gte(users.createdAt, goal.startsAt));
        currentValue = result[0]?.count ?? 0;
      } else if (goal.metricType === "new_hosts") {
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(and(
            gte(users.createdAt, goal.startsAt),
            sql`${users.role} IN ('host', 'both')`
          ));
        currentValue = result[0]?.count ?? 0;
      } else if (goal.metricType === "active_vehicles") {
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(vehicles)
          .where(eq(vehicles.status, "active"));
        currentValue = result[0]?.count ?? 0;
      }
      if (currentValue > 0) {
        const target = parseFloat(goal.targetValue);
        const newStatus = currentValue >= target ? "completed" : "active";
        await db
          .update(platformGoals)
          .set({ currentValue: currentValue.toFixed(2), status: newStatus, updatedAt: new Date() })
          .where(eq(platformGoals.id, goal.id));
      }
    }
    return { synced: activeGoals.length };
  }),

  /** Analytics de níveis para o admin */
  adminLevelAnalytics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

    // Distribuição de níveis (locatário)
    const riderDist = await db
      .select({
        level: userLevels.renterLevel,
        count: sql<number>`count(*)`,
        avgScore: sql<number>`avg(${userLevels.renterScore})`,
      })
      .from(userLevels)
      .groupBy(userLevels.renterLevel)
      .orderBy(asc(userLevels.renterLevel));

    // Distribuição de níveis (anfitrião)
    const hostDist = await db
      .select({
        level: userLevels.hostLevel,
        count: sql<number>`count(*)`,
        avgScore: sql<number>`avg(${userLevels.hostScore})`,
      })
      .from(userLevels)
      .groupBy(userLevels.hostLevel)
      .orderBy(asc(userLevels.hostLevel));

    // Top performers (locatários)
    const topRiders = await db
      .select({
        userId: userLevels.userId,
        score: userLevels.renterScore,
        level: userLevels.renterLevel,
        totalRentals: userLevels.renterTotalRentals,
        avgRating: userLevels.renterAvgRating,
        name: users.name,
        avatar: users.avatarUrl,
        city: users.addressCity,
        state: users.addressState,
      })
      .from(userLevels)
      .innerJoin(users, eq(users.id, userLevels.userId))
      .orderBy(desc(userLevels.renterScore))
      .limit(10);

    // Top performers (anfitriões)
    const topHosts = await db
      .select({
        userId: userLevels.userId,
        score: userLevels.hostScore,
        level: userLevels.hostLevel,
        totalRentals: userLevels.hostTotalRentals,
        totalEarnings: userLevels.hostTotalEarnings,
        avgRating: userLevels.hostAvgRating,
        name: users.name,
        avatar: users.avatarUrl,
        city: users.addressCity,
        state: users.addressState,
      })
      .from(userLevels)
      .innerJoin(users, eq(users.id, userLevels.userId))
      .orderBy(desc(userLevels.hostScore))
      .limit(10);

    // Total de conquistas desbloqueadas
    const achievementsTotal = await db
      .select({ count: sql<number>`count(*)` })
      .from(userAchievements);

    // Conquistas mais desbloqueadas
    const topAchievements = await db
      .select({
        key: userAchievements.achievementKey,
        count: sql<number>`count(*)`,
      })
      .from(userAchievements)
      .groupBy(userAchievements.achievementKey)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return {
      riderDistribution: riderDist,
      hostDistribution: hostDist,
      topRiders: topRiders.map((r, i) => ({
        ...r,
        rank: i + 1,
        avgRating: r.avgRating ? parseFloat(r.avgRating) : 0,
        levelConfig: getRiderLevelConfig(r.level),
      })),
      topHosts: topHosts.map((h, i) => ({
        ...h,
        rank: i + 1,
        avgRating: h.avgRating ? parseFloat(h.avgRating) : 0,
        totalEarnings: h.totalEarnings ? parseFloat(h.totalEarnings) : 0,
        levelConfig: getHostLevelConfig(h.level),
      })),
      achievementsTotal: achievementsTotal[0]?.count ?? 0,
      topAchievements,
    };
  }),
});
