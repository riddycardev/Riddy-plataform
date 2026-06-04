/**
 * Geolocation tRPC Router
 * Handles location-based vehicle search and recommendations
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as geo from "../geolocation";
import * as db from "../db";

export const geolocationRouter = router({
  /**
   * Search vehicles by user's current location
   * Automatically filters by radius and applies all filters
   */
  searchByLocation: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radiusKm: z.number().min(1).max(500).default(50),
        category: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        transmission: z.string().optional(),
        fuelType: z.string().optional(),
        minSeats: z.number().optional(),
        sortBy: z
          .enum(["distance", "price_asc", "price_desc", "rating", "recommended"])
          .default("recommended"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const vehicles = await geo.searchVehiclesByLocation({
          latitude: input.latitude,
          longitude: input.longitude,
          radiusKm: input.radiusKm,
          category: input.category,
          minPrice: input.minPrice,
          maxPrice: input.maxPrice,
          transmission: input.transmission,
          fuelType: input.fuelType,
          minSeats: input.minSeats,
          sortBy: input.sortBy as any,
          limit: input.limit,
          offset: input.offset,
        });

        return {
          success: true,
          data: vehicles,
          count: vehicles.length,
        };
      } catch (error) {
        console.error("[Geolocation Router] Search error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar veículos por localização",
        });
      }
    }),

  /**
   * Save user's current location
   * Called when user grants GPS permission or manually enters location
   */
  saveUserLocation: protectedProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        city: z.string().optional(),
        state: z.string().optional(),
        source: z.enum(["gps", "ip", "manual", "geofence"]).default("manual"),
        accuracy: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await geo.saveUserLocation(
          ctx.user.id,
          input.latitude,
          input.longitude,
          input.city,
          input.state,
          input.source,
          input.accuracy
        );

        return { success: true };
      } catch (error) {
        console.error("[Geolocation Router] Save location error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao salvar localização",
        });
      }
    }),

  /**
   * Get nearby cities with available vehicles
   * Used for "no results" suggestions
   */
  getNearbyCity: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radiusKm: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ input }) => {
      try {
        const cities = await geo.getNearbyCity(
          input.latitude,
          input.longitude,
          input.radiusKm
        );

        return {
          success: true,
          data: cities,
          count: cities.length,
        };
      } catch (error) {
        console.error("[Geolocation Router] Get nearby cities error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar cidades próximas",
        });
      }
    }),

  /**
   * Calculate distance between two points
   * Useful for frontend calculations and verification
   */
  calculateDistance: publicProcedure
    .input(
      z.object({
        lat1: z.number().min(-90).max(90),
        lon1: z.number().min(-180).max(180),
        lat2: z.number().min(-90).max(90),
        lon2: z.number().min(-180).max(180),
      })
    )
    .query(({ input }) => {
      const distance = geo.calculateDistance(
        input.lat1,
        input.lon1,
        input.lat2,
        input.lon2
      );

      return {
        distance,
        distanceKm: distance.toFixed(2),
      };
    }),

  /**
   * Get user's saved location
   */
  getUserLocation: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await db.getUserById(ctx.user.id);

      if (!user || !user.latitude || !user.longitude) {
        return {
          success: false,
          data: null,
          message: "Localização não disponível",
        };
      }

      return {
        success: true,
        data: {
          latitude: Number(user.latitude),
          longitude: Number(user.longitude),
          city: user.addressCity,
          state: user.addressState,
          lastUpdate: user.lastLocationUpdate,
        },
      };
    } catch (error) {
      console.error("[Geolocation Router] Get user location error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao obter localização do usuário",
      });
    }
  }),

  /**
   * Get location history for user
   * Limited to last 30 days
   */
  getLocationHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // This would require a query function in db.ts
        // For now, return empty array
        return {
          success: true,
          data: [],
          count: 0,
        };
      } catch (error) {
        console.error("[Geolocation Router] Get location history error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter histórico de localização",
        });
      }
    }),

  /**
   * Admin: Rebuild vehicle location index
   * Used for maintenance
   */
  rebuildLocationIndex: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem executar esta ação",
        });
      }

      await geo.rebuildVehicleLocationIndex();
      await geo.updateAllCityStats();

      return {
        success: true,
        message: "Índice de localização reconstruído com sucesso",
      };
    } catch (error) {
      console.error("[Geolocation Router] Rebuild location index error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao reconstruir índice de localização",
      });
    }
  }),

  /**
   * Admin: Update city statistics
   * Recalculates vehicle count and average price
   */
  updateCityStats: protectedProcedure
    .input(
      z.object({
        city: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem executar esta ação",
          });
        }

        await geo.updateCityStats(input.city, input.state);

        return {
          success: true,
          message: `Estatísticas de ${input.city}, ${input.state} atualizadas`,
        };
      } catch (error) {
        console.error("[Geolocation Router] Update city stats error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar estatísticas da cidade",
        });
      }
    }),
});
