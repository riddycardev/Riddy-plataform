/**
 * Geolocation utilities for RIDDY marketplace
 * Handles location-based vehicle search with performance optimizations
 */

import { sql, and, eq, lte, gte, desc, asc, or } from "drizzle-orm";
import { vehicles, cities, userLocationHistory, vehicleLocationIndex } from "../drizzle/schema";
import { getDb } from "./db";

// ============================================
// CONSTANTS
// ============================================

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

// Grid cell size for coarse filtering (0.1 degree ≈ 11km at equator)
const GRID_CELL_SIZE = 0.1;

// Default search radius in km
const DEFAULT_SEARCH_RADIUS = 50;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate Haversine distance between two coordinates
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Convert degrees to radians
 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate geohash for spatial indexing
 * Using simplified 8-character geohash (≈38m precision)
 */
export function calculateGeohash(lat: number, lon: number): string {
  // Simplified geohash calculation
  const latBits = ((lat + 90) / 180 * Math.pow(2, 20)).toString(2).padStart(20, '0');
  const lonBits = ((lon + 180) / 360 * Math.pow(2, 20)).toString(2).padStart(20, '0');
  
  let geohash = '';
  for (let i = 0; i < 20; i++) {
    geohash += lonBits[i] + latBits[i];
  }
  
  // Convert to base32 (simplified)
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 8; i++) {
    const idx = parseInt(geohash.substring(i * 5, i * 5 + 5), 2);
    result += base32[idx];
  }
  
  return result;
}

/**
 * Calculate grid cell coordinates for coarse filtering
 */
export function calculateGridCell(lat: number, lon: number): { gridX: number; gridY: number } {
  return {
    gridX: Math.floor(lon / GRID_CELL_SIZE),
    gridY: Math.floor(lat / GRID_CELL_SIZE),
  };
}

/**
 * Get neighboring grid cells (for radius search)
 */
function getNeighboringGridCells(gridX: number, gridY: number, radiusKm: number): Array<{ gridX: number; gridY: number }> {
  const cellsInRadius = Math.ceil(radiusKm / 11); // ~11km per cell
  const cells = [];
  
  for (let x = gridX - cellsInRadius; x <= gridX + cellsInRadius; x++) {
    for (let y = gridY - cellsInRadius; y <= gridY + cellsInRadius; y++) {
      cells.push({ gridX: x, gridY: y });
    }
  }
  
  return cells;
}

// ============================================
// LOCATION TRACKING
// ============================================

/**
 * Save user location to history
 * Called when user grants GPS permission or manually enters location
 */
export async function saveUserLocation(
  userId: number,
  latitude: number,
  longitude: number,
  city?: string,
  state?: string,
  source: "gps" | "ip" | "manual" | "geofence" = "manual",
  accuracy?: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Save to location history
    await db.insert(userLocationHistory).values({
      userId,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      city,
      state,
      accuracy,
      source,
    } as any);

    // Update user's current location
    const users = (await import("../drizzle/schema")).users;
    await db
      .update(users)
      .set({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        lastLocationUpdate: new Date(),
      } as any)
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("[Geolocation] Error saving user location:", error);
  }
}

// ============================================
// VEHICLE LOCATION INDEXING
// ============================================

/**
 * Update vehicle location index for fast spatial queries
 * Called when vehicle location is created or updated
 */
export async function updateVehicleLocationIndex(
  vehicleId: number,
  latitude: number,
  longitude: number,
  city: string,
  state: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const geohash = calculateGeohash(latitude, longitude);
    const { gridX, gridY } = calculateGridCell(latitude, longitude);

    // Upsert location index
    const existing = await db
      .select()
      .from(vehicleLocationIndex)
      .where(eq(vehicleLocationIndex.vehicleId, vehicleId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(vehicleLocationIndex)
        .set({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          geohash,
          gridX,
          gridY,
          city,
          state,
          updatedAt: new Date(),
        } as any)
        .where(eq(vehicleLocationIndex.vehicleId, vehicleId));
    } else {
      await db.insert(vehicleLocationIndex).values({
        vehicleId,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        geohash,
        gridX,
        gridY,
        city,
        state,
      } as any);
    }
  } catch (error) {
    console.error("[Geolocation] Error updating vehicle location index:", error);
  }
}

// ============================================
// VEHICLE SEARCH BY LOCATION
// ============================================

export interface GeoSearchFilters {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
  fuelType?: string;
  minSeats?: number;
  sortBy?: "distance" | "price_asc" | "price_desc" | "rating" | "recommended";
  limit?: number;
  offset?: number;
}

export interface VehicleWithDistance {
  id: number;
  brand: string;
  model: string;
  year: number;
  category: string;
  dailyPrice: any;
  pickupCity: string;
  pickupState: string;
  pickupLatitude: any;
  pickupLongitude: any;
  mainImageUrl: string | null;
  averageRating: any;
  totalTrips: number;
  instantBooking: boolean;
  distance?: number;
}

/**
 * Search vehicles by user location with radius filter
 * Optimized for performance using grid-based coarse filtering
 */
export async function searchVehiclesByLocation(
  filters: GeoSearchFilters
): Promise<VehicleWithDistance[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const {
      latitude,
      longitude,
      radiusKm = DEFAULT_SEARCH_RADIUS,
      category,
      minPrice,
      maxPrice,
      transmission,
      fuelType,
      minSeats,
      sortBy = "recommended",
      limit = 50,
      offset = 0,
    } = filters;

    // Step 1: Coarse filtering using grid cells
    const { gridX, gridY } = calculateGridCell(latitude, longitude);
    const neighboringCells = getNeighboringGridCells(gridX, gridY, radiusKm);

    const gridConditions = neighboringCells.map((cell) =>
      and(
        eq(vehicleLocationIndex.gridX, cell.gridX),
        eq(vehicleLocationIndex.gridY, cell.gridY)
      )
    );

    // Step 2: Build conditions for fine filtering
    const conditions: any[] = [
      eq(vehicles.status, "active"),
      ...(gridConditions.length > 0 ? [or(...gridConditions)] : []),
    ];

    if (category) {
      conditions.push(eq(vehicles.category, category as any));
    }
    if (minPrice !== undefined && minPrice > 0) {
      conditions.push(sql`CAST(${vehicles.dailyPrice} AS DECIMAL) >= ${minPrice}`);
    }
    if (maxPrice !== undefined && maxPrice < 10000) {
      conditions.push(sql`CAST(${vehicles.dailyPrice} AS DECIMAL) <= ${maxPrice}`);
    }
    if (transmission) {
      conditions.push(eq(vehicles.transmission, transmission as any));
    }
    if (fuelType) {
      conditions.push(eq(vehicles.fuelType, fuelType as any));
    }
    if (minSeats) {
      conditions.push(gte(vehicles.seats, minSeats));
    }

    // Step 3: Query with joins to get location data
    let query = db
      .select({
        id: vehicles.id,
        brand: vehicles.brand,
        model: vehicles.model,
        year: vehicles.year,
        category: vehicles.category,
        dailyPrice: vehicles.dailyPrice,
        pickupCity: vehicles.pickupCity,
        pickupState: vehicles.pickupState,
        pickupLatitude: vehicles.pickupLatitude,
        pickupLongitude: vehicles.pickupLongitude,
        mainImageUrl: vehicles.mainImageUrl,
        averageRating: vehicles.averageRating,
        totalTrips: vehicles.totalTrips,
        instantBooking: vehicles.instantBooking,
      })
      .from(vehicles)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Step 4: Apply sorting and fetch
    let results;
    if (sortBy === "price_asc") {
      results = await query.orderBy(asc(vehicles.dailyPrice)).limit(limit * 2).offset(offset);
    } else if (sortBy === "price_desc") {
      results = await query.orderBy(desc(vehicles.dailyPrice)).limit(limit * 2).offset(offset);
    } else if (sortBy === "rating") {
      results = await query.orderBy(desc(vehicles.averageRating)).limit(limit * 2).offset(offset);
    } else {
      // Default: recommended (by total trips and rating)
      results = await query.orderBy(desc(vehicles.totalTrips), desc(vehicles.averageRating)).limit(limit * 2).offset(offset);
    }

    // Step 5: Fine filtering by distance (in JavaScript for accuracy)
    const vehiclesWithDistance = results
      .filter((v) => {
        if (!v.pickupLatitude || !v.pickupLongitude) return false;

        const lat = typeof v.pickupLatitude === 'string' ? parseFloat(v.pickupLatitude) : Number(v.pickupLatitude);
        const lon = typeof v.pickupLongitude === 'string' ? parseFloat(v.pickupLongitude) : Number(v.pickupLongitude);

        const distance = calculateDistance(
          latitude,
          longitude,
          lat,
          lon
        );

        return distance <= radiusKm;
      })
      .map((v) => {
        const lat = typeof v.pickupLatitude === 'string' ? parseFloat(v.pickupLatitude) : Number(v.pickupLatitude);
        const lon = typeof v.pickupLongitude === 'string' ? parseFloat(v.pickupLongitude) : Number(v.pickupLongitude);
        return {
          ...v,
          distance: calculateDistance(
            latitude,
            longitude,
            lat,
            lon
          ),
        };
      });

    // Step 6: Final sorting by distance if requested
    if (sortBy === "distance") {
      vehiclesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return vehiclesWithDistance.slice(0, limit);
  } catch (error) {
    console.error("[Geolocation] Error searching vehicles by location:", error);
    return [];
  }
}

// ============================================
// NEARBY CITIES SUGGESTIONS
// ============================================

export interface CityWithDistance {
  id: number;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  vehicleCount: number;
  averagePrice: string | null;
  distance: number;
}

/**
 * Get nearby cities with available vehicles
 * Used for "no results" suggestions
 */
export async function getNearbyCity(
  latitude: number,
  longitude: number,
  radiusKm: number = 100
): Promise<CityWithDistance[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Get all cities
    const allCities = await db
      .select()
      .from(cities)
      .where(gte(cities.vehicleCount, 1))
      .orderBy(desc(cities.vehicleCount));

    // Calculate distance and filter
    const nearbyCities: CityWithDistance[] = allCities
      .map((city) => ({
        id: city.id,
        name: city.name,
        state: city.state,
        latitude: Number(city.latitude),
        longitude: Number(city.longitude),
        vehicleCount: city.vehicleCount,
        averagePrice: city.averagePrice,
        distance: calculateDistance(
          latitude,
          longitude,
          Number(city.latitude),
          Number(city.longitude)
        ),
      }))
      .filter((city) => city.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5); // Return top 5 nearest cities

    return nearbyCities;
  } catch (error) {
    console.error("[Geolocation] Error getting nearby cities:", error);
    return [];
  }
}

// ============================================
// CITY REFERENCE DATA MANAGEMENT
// ============================================

/**
 * Update city statistics (vehicle count, average price)
 * Called periodically or when vehicles are added/removed
 */
export async function updateCityStats(cityName: string, state: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Count active vehicles in city
    const vehicleCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(vehicles)
      .where(
        and(
          eq(vehicles.status, "active"),
          eq(vehicles.pickupCity, cityName),
          eq(vehicles.pickupState, state)
        )
      );

    // Calculate average price
    const avgPrice = await db
      .select({ avg: sql<number>`AVG(CAST(${vehicles.dailyPrice} AS DECIMAL))` })
      .from(vehicles)
      .where(
        and(
          eq(vehicles.status, "active"),
          eq(vehicles.pickupCity, cityName),
          eq(vehicles.pickupState, state)
        )
      );

    const count = vehicleCount[0]?.count || 0;
    const average = avgPrice[0]?.avg || null;

    // Update or create city record
    const existing = await db
      .select()
      .from(cities)
      .where(and(eq(cities.name, cityName), eq(cities.state, state)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(cities)
        .set({
          vehicleCount: count,
          averagePrice: average ? average.toString() : null,
          updatedAt: new Date(),
        })
        .where(and(eq(cities.name, cityName), eq(cities.state, state)));
    } else {
      // Need latitude/longitude - would need geocoding service
      // For now, skip creation if city doesn't exist
    }
  } catch (error) {
    console.error("[Geolocation] Error updating city stats:", error);
  }
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Rebuild vehicle location index for all vehicles
 * Used for maintenance or after schema changes
 */
export async function rebuildVehicleLocationIndex(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    console.log("[Geolocation] Starting vehicle location index rebuild...");

    // Get all active vehicles with location data
    const allVehicles = await db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.status, "active"),
          sql`${vehicles.pickupLatitude} IS NOT NULL`,
          sql`${vehicles.pickupLongitude} IS NOT NULL`
        )
      );

    let updated = 0;
    for (const vehicle of allVehicles) {
      const lat = vehicle.pickupLatitude;
      const lon = vehicle.pickupLongitude;
      if (lat && lon) {
        await updateVehicleLocationIndex(
          vehicle.id,
          typeof lat === 'string' ? parseFloat(lat) : Number(lat),
          typeof lon === 'string' ? parseFloat(lon) : Number(lon),
          vehicle.pickupCity,
          vehicle.pickupState
        );
        updated++;
      }
    }

    console.log(`[Geolocation] Rebuilt location index for ${updated} vehicles`);
  } catch (error) {
    console.error("[Geolocation] Error rebuilding vehicle location index:", error);
  }
}

/**
 * Update all city statistics
 * Used for maintenance or after bulk vehicle changes
 */
export async function updateAllCityStats(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    console.log("[Geolocation] Starting city statistics update...");

    // Get all unique cities with active vehicles
    const citiesWithVehicles = await db
      .selectDistinct({
        city: vehicles.pickupCity,
        state: vehicles.pickupState,
      })
      .from(vehicles)
      .where(eq(vehicles.status, "active"));

    let updated = 0;
    for (const { city, state } of citiesWithVehicles) {
      if (city && state) {
        await updateCityStats(city, state);
        updated++;
      }
    }

    console.log(`[Geolocation] Updated statistics for ${updated} cities`);
  } catch (error) {
    console.error("[Geolocation] Error updating city statistics:", error);
  }
}
