import { eq, ne, and, desc, asc, gte, lte, like, or, sql, SQL, inArray, lt, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  vehicles, 
  bookings, 
  userDocuments,
  vehicleDocuments,
  vehicleImages,
  payments,
  paymentMethods,
  fines,
  reviews,
  conversations,
  messages,
  favorites,
  notifications,
  vehicleAvailability,
  userVerifications,
  verificationDocuments,
  vehicleVerifications,
  bookingVerifications,
  motorcycleSpecs,
  receipts,
  emailLogs,
  InsertVehicle,
  InsertBooking,
  InsertUserDocument,
  InsertPayment,
  InsertFine,
  InsertReview,
  InsertMessage,
  InsertNotification,
  InsertUserVerification,
  InsertVerificationDocument,
  InsertMotorcycleSpecs,
  InsertReceipt,
  InsertEmailLog,
  otpLogs,
  InsertOtpLog
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { storageGet } from './storage';

import { encryptAES, decryptAES } from './_core/encryption';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USER QUERIES
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: {
  openId: string;
  name: string;
  email: string;
  passwordHash: string;
  loginMethod: string;
  role: "user" | "host" | "admin";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(users).values({
    openId: data.openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: data.loginMethod,
    role: data.role,
    lastSignedIn: new Date(),
  });
  return result[0].insertId;
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set(data).where(eq(users.id, userId));
}

/**
 * Atualiza o modo ativo do usuário (renter | host).
 * Helper dedicado para garantir que apenas activeMode seja atualizado,
 * sem risco de sobrescrever outros campos do perfil.
 * Retorna true se a atualização foi bem-sucedida.
 */
export async function updateUserActiveMode(userId: number, mode: "renter" | "host"): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(users).set({ activeMode: mode }).where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error(`[DB] Erro ao atualizar activeMode para userId=${userId}:`, error);
    return false;
  }
}

/**
 * Ativa o modo anfitrião para um usuário.
 * Se o usuário tem role 'user', converte para 'both'.
 * Retorna o novo role e modo.
 */
export async function activateUserHostMode(userId: number, currentRole: string): Promise<{ success: boolean; newRole: string }> {
  const db = await getDb();
  if (!db) return { success: false, newRole: currentRole };

  try {
    const alreadyHost = ["host", "both", "admin"].includes(currentRole);
    const newRole = alreadyHost ? currentRole : "both";

    await db.update(users)
      .set({ activeMode: "host", role: newRole as "user" | "host" | "admin" | "both" })
      .where(eq(users.id, userId));

    return { success: true, newRole };
  } catch (error) {
    console.error(`[DB] Erro ao ativar modo host para userId=${userId}:`, error);
    return { success: false, newRole: currentRole };
  }
}

export async function updateUserKycStatus(userId: number, status: "pending" | "submitted" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({ kycStatus: status }).where(eq(users.id, userId));
}

// ============================================
// VEHICLE QUERIES
// ============================================

/**
 * Batch-fetch first images for vehicles that have no mainImageUrl.
 * Eliminates N+1 queries — one query for all vehicles instead of one per vehicle.
 */
async function enrichVehiclesWithImages<T extends { id: number; mainImageUrl: string | null }>(vehicleList: T[]): Promise<T[]> {
  if (vehicleList.length === 0) return vehicleList;
  const db = await getDb();
  if (!db) return vehicleList;

  // Only fetch images for vehicles that need them
  const needsImage = vehicleList.filter(v => !v.mainImageUrl);
  if (needsImage.length === 0) return vehicleList;

  const ids = needsImage.map(v => v.id);
  // Fetch all relevant images in ONE query
  const images = await db
    .select({ vehicleId: vehicleImages.vehicleId, imageUrl: vehicleImages.imageUrl, sortOrder: vehicleImages.sortOrder })
    .from(vehicleImages)
    .where(inArray(vehicleImages.vehicleId, ids))
    .orderBy(asc(vehicleImages.sortOrder));

  // Build a map: vehicleId -> first image URL
  const imageMap = new Map<number, string>();
  for (const img of images) {
    if (!imageMap.has(img.vehicleId)) {
      imageMap.set(img.vehicleId, img.imageUrl);
    }
  }

  return vehicleList.map(v => {
    if (!v.mainImageUrl && imageMap.has(v.id)) {
      return { ...v, mainImageUrl: imageMap.get(v.id)! };
    }
    return v;
  });
}

export async function getVehicles(filters?: { city?: string; category?: string; minPrice?: number; maxPrice?: number; limit?: number; offset?: number }) {
  // Delegate to searchVehicles for consistency
  return await searchVehicles(filters);
}

export async function getVehicleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  if (result.length === 0) return undefined;
  
  const vehicle = result[0];
  
  // Get owner info for contract
  const ownerResult = await db.select({ 
    name: users.name, 
    email: users.email, 
    phone: users.phone 
  }).from(users).where(eq(users.id, vehicle.hostId)).limit(1);
  const ownerName = ownerResult.length > 0 ? ownerResult[0].name : null;
  const ownerEmail = ownerResult.length > 0 ? ownerResult[0].email : null;
  const ownerPhone = ownerResult.length > 0 ? ownerResult[0].phone : null;
  
  return { ...vehicle, ownerName, ownerEmail, ownerPhone };
}

export async function getVehiclesByHostId(hostId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(vehicles).where(eq(vehicles.hostId, hostId));
}

// Get vehicles grouped by city for homepage display
export async function getVehiclesGroupedByCity(limit?: number) {
  const db = await getDb();
  if (!db) return { cities: [], vehiclesByCity: {} };

  // Get all active vehicles
  const allVehicles = await db.select().from(vehicles).where(eq(vehicles.status, "active")).orderBy(desc(vehicles.createdAt));
  
  // Enrich vehicles with first image if mainImageUrl is null — single batch query
  const enrichedVehicles = await enrichVehiclesWithImages(allVehicles);
  
  // Group vehicles by city
  const vehiclesByCity: Record<string, typeof enrichedVehicles> = {};
  const cities: string[] = [];
  
  for (const vehicle of enrichedVehicles) {
    const city = vehicle.pickupCity || "Outras cidades";
    if (!vehiclesByCity[city]) {
      vehiclesByCity[city] = [];
      cities.push(city);
    }
    if (!limit || vehiclesByCity[city].length < limit) {
      vehiclesByCity[city].push(vehicle);
    }
  }
  
  return { cities, vehiclesByCity };
}

// Get all cities that have active vehicles
export async function getCitiesWithVehicles() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.selectDistinct({ city: vehicles.pickupCity })
    .from(vehicles)
    .where(eq(vehicles.status, "active"));
  
  return result.map(r => r.city).filter(Boolean) as string[];
}

export async function createVehicle(data: InsertVehicle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vehicles).values(data);
  return result[0].insertId;
}

export async function updateVehicle(id: number, data: Partial<InsertVehicle>) {
  const db = await getDb();
  if (!db) return;

  await db.update(vehicles).set(data).where(eq(vehicles.id, id));
}

export async function getVehicleImages(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(vehicleImages).where(eq(vehicleImages.vehicleId, vehicleId)).orderBy(asc(vehicleImages.sortOrder));
}

export async function createVehicleImage(data: { vehicleId: number; imageUrl: string; fileKey: string; imageType?: string; sortOrder?: number; isMain?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vehicleImages).values({
    vehicleId: data.vehicleId,
    imageUrl: data.imageUrl,
    fileKey: data.fileKey,
    imageType: (data.imageType as any) || "other",
    sortOrder: data.sortOrder || 0,
    isMain: data.isMain || false,
  });
  return result[0].insertId;
}

export async function deleteVehicleImage(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(vehicleImages).where(eq(vehicleImages.id, id));
}

export async function updateVehicleMainImage(vehicleId: number, imageUrl: string) {
  const db = await getDb();
  if (!db) return;

  await db.update(vehicles).set({ mainImageUrl: imageUrl }).where(eq(vehicles.id, vehicleId));
}

export async function searchVehicles(filters?: {
  city?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
  fuelType?: string;
  minSeats?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
  // Vehicle type isolation: "car" | "motorcycle" — always filter by type when provided
  vehicleType?: "car" | "motorcycle";
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions: SQL[] = [
    eq(vehicles.status, "active"),
  ];

  // CRITICAL: Always filter by vehicleType when provided — ensures carros never mix with motos
  if (filters?.vehicleType) {
    conditions.push(eq(vehicles.vehicleType, filters.vehicleType as any));
  }

  // Note: City filtering is done in JavaScript after fetching to handle normalization
  // This allows flexible matching of city names with various formats
  if (filters?.category) {
    conditions.push(eq(vehicles.category, filters.category as any));
  }
  if (filters?.minPrice !== undefined && filters.minPrice > 0) {
    conditions.push(sql`CAST(${vehicles.dailyPrice} AS DECIMAL) >= ${filters.minPrice}`);
  }
  if (filters?.maxPrice !== undefined && filters.maxPrice < 10000) {
    conditions.push(sql`CAST(${vehicles.dailyPrice} AS DECIMAL) <= ${filters.maxPrice}`);
  }
  if (filters?.transmission) {
    conditions.push(eq(vehicles.transmission, filters.transmission as any));
  }
  if (filters?.fuelType) {
    conditions.push(eq(vehicles.fuelType, filters.fuelType as any));
  }
  if (filters?.minSeats) {
    conditions.push(gte(vehicles.seats, filters.minSeats));
  }

  // When filtering by city, fetch more results to account for JavaScript filtering
  const limit = (filters?.city ? 500 : filters?.limit) || 50;
  const offset = filters?.offset || 0;

  const baseQuery = db.select().from(vehicles).where(and(...conditions));

  // Apply sorting and pagination
  let results;
  if (filters?.sortBy === "price_asc") {
    results = await baseQuery.orderBy(asc(vehicles.dailyPrice)).limit(limit).offset(offset);
  } else if (filters?.sortBy === "price_desc") {
    results = await baseQuery.orderBy(desc(vehicles.dailyPrice)).limit(limit).offset(offset);
  } else if (filters?.sortBy === "rating") {
    results = await baseQuery.orderBy(desc(vehicles.averageRating)).limit(limit).offset(offset);
  } else {
    // Default: recommended (by total trips and rating)
    results = await baseQuery.orderBy(desc(vehicles.totalTrips), desc(vehicles.averageRating)).limit(limit).offset(offset);
  }
  
  // Filter by city if provided (with normalization for flexible matching)
  if (filters?.city) {
    // Normalize helper: remove accents, hyphens, extra spaces, lowercase
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .replace(/[-,]/g, " ")           // hyphens/commas → space
        .replace(/\s+/g, " ")           // collapse spaces
        .trim();

    // Strip " - UF" suffix that comes from IBGE autocomplete (e.g. "Ji-Paraná - RO" → "Ji-Paraná")
    const cityOnly = filters.city.includes(" - ")
      ? filters.city.split(" - ")[0].trim()
      : filters.city.trim();

    const normalizedInput = normalize(cityOnly);

    if (normalizedInput.length > 0) {
      results = results.filter((vehicle) => {
        const normalizedCity = normalize(vehicle.pickupCity || "");
        // Accept if the stored city starts with the searched string OR contains it
        return normalizedCity.startsWith(normalizedInput) || normalizedCity.includes(normalizedInput);
      });
    }
  }
  
  // Filter by availability if dates are provided
  if (filters?.startDate && filters?.endDate) {
    const searchStartDate = new Date(filters.startDate);
    const searchEndDate = new Date(filters.endDate);
    
    // Get all bookings for the vehicles in results
    const vehicleIds = results.map(v => v.id);
    
    if (vehicleIds.length > 0) {
      const conflictingBookings = await db.select()
        .from(bookings)
        .where(
          and(
            inArray(bookings.vehicleId, vehicleIds),
            // Booking overlaps with search dates if:
            // booking.startDate < searchEndDate AND booking.endDate > searchStartDate
            and(
              lt(bookings.startDate, searchEndDate),
              gt(bookings.endDate, searchStartDate)
            ),
            // Only consider confirmed bookings (not cancelled, pending_payment, etc)
            inArray(bookings.status, ["confirmed", "in_progress", "completed"])
          )
        );
      
      const conflictingVehicleIds = new Set(conflictingBookings.map(b => b.vehicleId));
      
      // Filter out vehicles with conflicting bookings
      results = results.filter(v => !conflictingVehicleIds.has(v.id));
    }
  }
  
  // Enrich vehicles with first image if mainImageUrl is null — single batch query
  return await enrichVehiclesWithImages(results);
}

// ============================================
// STATE-BASED VEHICLE QUERIES
// ============================================

// Mapeamento de siglas para nomes completos dos estados brasileiros
export const BRAZIL_STATES: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

// Normaliza entrada de estado (aceita sigla ou nome completo)
export function normalizeState(input: string): string | null {
  if (!input) return null;
  const upper = input.trim().toUpperCase();
  // Se for sigla válida, retorna direto
  if (BRAZIL_STATES[upper]) return upper;
  // Se for nome completo, busca a sigla correspondente
  const normalized = input.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [sigla, nome] of Object.entries(BRAZIL_STATES)) {
    const nomeNorm = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (nomeNorm === normalized) return sigla;
  }
  return null;
}

// Buscar veículos por estado (sigla, ex: "RO")
export async function getVehiclesByState(stateCode: string, filters?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { vehicles: [], total: 0, cities: [] };

  const conditions: SQL[] = [
    eq(vehicles.status, "active"),
    eq(vehicles.pickupState, stateCode),
  ];

  if (filters?.category) {
    conditions.push(eq(vehicles.category, filters.category as any));
  }
  if (filters?.minPrice !== undefined && filters.minPrice > 0) {
    conditions.push(sql`CAST(${vehicles.dailyPrice} AS DECIMAL) >= ${filters.minPrice}`);
  }
  if (filters?.maxPrice !== undefined && filters.maxPrice < 10000) {
    conditions.push(sql`CAST(${vehicles.dailyPrice} AS DECIMAL) <= ${filters.maxPrice}`);
  }
  if (filters?.transmission) {
    conditions.push(eq(vehicles.transmission, filters.transmission as any));
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  const baseQuery = db.select().from(vehicles).where(and(...conditions));

  let results;
  if (filters?.sortBy === "price_asc") {
    results = await baseQuery.orderBy(asc(vehicles.dailyPrice)).limit(limit).offset(offset);
  } else if (filters?.sortBy === "price_desc") {
    results = await baseQuery.orderBy(desc(vehicles.dailyPrice)).limit(limit).offset(offset);
  } else if (filters?.sortBy === "rating") {
    results = await baseQuery.orderBy(desc(vehicles.averageRating)).limit(limit).offset(offset);
  } else {
    results = await baseQuery.orderBy(desc(vehicles.totalTrips), desc(vehicles.averageRating)).limit(limit).offset(offset);
  }

  // Enrich with images — single batch query
  const enriched = await enrichVehiclesWithImages(results);

  // Extrair cidades únicas do resultado
  const citiesSet = new Set<string>();
  for (const v of enriched) {
    if (v.pickupCity) citiesSet.add(v.pickupCity);
  }

  return {
    vehicles: enriched,
    total: enriched.length,
    cities: Array.from(citiesSet).sort(),
  };
}

// Listar estados que têm veículos ativos, com contagem
export async function getStatesWithVehicles(vehicleType?: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      state: vehicles.pickupState,
      count: sql<number>`COUNT(*)`,
    })
    .from(vehicles)
    .where(
      vehicleType
        ? sql`${vehicles.status} = 'active' AND ${vehicles.vehicleType} = ${vehicleType}`
        : eq(vehicles.status, "active")
    )
    .groupBy(vehicles.pickupState)
    .orderBy(desc(sql`COUNT(*)`));

  return result
    .filter((r) => r.state)
    .map((r) => ({
      code: r.state as string,
      name: BRAZIL_STATES[r.state as string] || r.state,
      vehicleCount: Number(r.count),
    }));
}

// Buscar veículos agrupados por cidade dentro de um estado
export async function getVehiclesGroupedByCityInState(
  stateCode: string,
  limit?: number,
  maxCities: number = 2,
  vehicleType?: string
) {
  const db = await getDb();
  if (!db) return { cities: [], vehiclesByCity: {} };

  const allVehicles = await db
    .select()
    .from(vehicles)
    .where(
      vehicleType
        ? sql`${vehicles.status} = 'active' AND ${vehicles.pickupState} = ${stateCode} AND ${vehicles.vehicleType} = ${vehicleType}`
        : and(eq(vehicles.status, "active"), eq(vehicles.pickupState, stateCode))
    )
    .orderBy(desc(vehicles.createdAt));

  // Count vehicles per city first to determine top cities
  const cityCountMap: Record<string, number> = {};
  for (const vehicle of allVehicles) {
    const city = vehicle.pickupCity || "Outras cidades";
    cityCountMap[city] = (cityCountMap[city] || 0) + 1;
  }

  // Sort cities by vehicle count descending, keep only top maxCities
  const topCities = Object.entries(cityCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCities)
    .map(([city]) => city);

  const topCitySet = new Set(topCities);

  // Enrich only vehicles from top cities with images — single batch query
  const topVehicles = allVehicles.filter(
    (v) => topCitySet.has(v.pickupCity || "Outras cidades")
  );

  const enriched = await enrichVehiclesWithImages(topVehicles);

  const vehiclesByCity: Record<string, typeof enriched> = {};

  for (const vehicle of enriched) {
    const city = vehicle.pickupCity || "Outras cidades";
    if (!vehiclesByCity[city]) vehiclesByCity[city] = [];
    if (!limit || vehiclesByCity[city].length < limit) {
      vehiclesByCity[city].push(vehicle);
    }
  }

  return { cities: topCities, vehiclesByCity };
}

// ============================================
// BOOKING QUERIES
// ============================================

export async function getBookingsByRenterId(renterId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(bookings).where(eq(bookings.renterId, renterId)).orderBy(desc(bookings.createdAt));
}

export async function getBookingsByHostId(hostId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(bookings).where(eq(bookings.hostId, hostId)).orderBy(desc(bookings.createdAt));
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createBooking(data: InsertBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bookings).values(data);
  return result[0].insertId;
}

export async function updateBookingStatus(id: number, status: string, additionalData?: Partial<InsertBooking>) {
  const db = await getDb();
  if (!db) return;

  await db.update(bookings).set({ status: status as any, ...additionalData }).where(eq(bookings.id, id));
}

export async function updateBookingOtp(id: number, data: {
  contractOtpCode?: string;
  contractOtpExpiresAt?: Date;
  contractOtpChannel?: "sms" | "email";
  contractOtpAttempts?: number;
  contractOtpVerifiedAt?: Date;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(bookings).set(data as any).where(eq(bookings.id, id));
}

export async function updateBookingMileage(id: number, startMileage?: number, endMileage?: number) {
  const db = await getDb();
  if (!db) return;

  const data: Partial<InsertBooking> = {};
  if (startMileage !== undefined) data.startMileage = startMileage;
  if (endMileage !== undefined) data.endMileage = endMileage;

  await db.update(bookings).set(data).where(eq(bookings.id, id));
}

// Get bookings for a specific vehicle
export async function getVehicleBookings(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(bookings)
    .where(eq(bookings.vehicleId, vehicleId))
    .orderBy(desc(bookings.startDate));
}

// Get blocked dates for a vehicle
export async function getVehicleBlockedDates(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(vehicleAvailability)
    .where(and(
      eq(vehicleAvailability.vehicleId, vehicleId),
      eq(vehicleAvailability.isAvailable, false)
    ))
    .orderBy(vehicleAvailability.date);
}

// Block dates for a vehicle
export async function blockVehicleDates(vehicleId: number, startDate: Date, endDate: Date, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Normalize start and end to midnight UTC using getUTC* to avoid server timezone drift.
  // The client sends ISO strings (e.g. '2026-05-24T03:00:00.000Z' for Brazil UTC-3).
  // Using getDate() on a server running UTC-4 would return day 23 instead of 24.
  const normalizedStart = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const normalizedEnd = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

  // Generate all dates in the range (iterate by UTC day)
  const dates: Date[] = [];
  const currentDate = new Date(normalizedStart);
  while (currentDate <= normalizedEnd) {
    dates.push(new Date(currentDate));
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  // Insert blocked dates — check existence first to avoid duplicates
  const dbConn = await getDb();
  if (!dbConn) throw new Error("Database not available");

  let inserted = 0;
  for (const date of dates) {
    // date is already midnight UTC
    const existing = await dbConn.select({ id: vehicleAvailability.id })
      .from(vehicleAvailability)
      .where(and(
        eq(vehicleAvailability.vehicleId, vehicleId),
        eq(vehicleAvailability.date, date),
        eq(vehicleAvailability.isAvailable, false)
      ))
      .limit(1);
    if (existing.length === 0) {
      await dbConn.insert(vehicleAvailability).values({
        vehicleId,
        date,
        isAvailable: false,
      });
      inserted++;
    }
  }

  return { success: true, blockedDates: inserted };
}

// Unblock dates for a vehicle
export async function unblockVehicleDates(vehicleId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Normalize to midnight UTC using getUTC* to avoid server timezone drift
  const normalizedStart = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const normalizedEnd = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
  // Add 1 day to end to include the end date itself (lte comparison with timestamp)
  const endPlusOne = new Date(normalizedEnd);
  endPlusOne.setUTCDate(endPlusOne.getUTCDate() + 1);

  await db.delete(vehicleAvailability)
    .where(and(
      eq(vehicleAvailability.vehicleId, vehicleId),
      eq(vehicleAvailability.isAvailable, false),
      gte(vehicleAvailability.date, normalizedStart),
      lt(vehicleAvailability.date, endPlusOne)
    ));

  return { success: true };
}

// ============================================
// DOCUMENT QUERIES
// ============================================

export async function getUserDocuments(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(userDocuments).where(eq(userDocuments.userId, userId)).orderBy(desc(userDocuments.createdAt));
}

export async function createUserDocument(data: InsertUserDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(userDocuments).values(data);
  return result[0].insertId;
}

export async function updateDocumentStatus(id: number, status: "pending" | "approved" | "rejected", reviewedBy?: number, rejectionReason?: string) {
  const db = await getDb();
  if (!db) return;

  await db.update(userDocuments).set({
    status,
    reviewedBy,
    rejectionReason,
    reviewedAt: new Date()
  }).where(eq(userDocuments.id, id));
}

export async function getVehicleDocuments(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(vehicleDocuments).where(eq(vehicleDocuments.vehicleId, vehicleId)).orderBy(desc(vehicleDocuments.createdAt));
}

export async function getHostVehicleDocuments(hostId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all vehicles owned by this host
  const hostVehicles = await db.select().from(vehicles).where(eq(vehicles.hostId, hostId));
  const vehicleIds = hostVehicles.map(v => v.id);
  
  if (vehicleIds.length === 0) return [];
  
  // Get all documents for these vehicles
  return await db.select({
    id: vehicleDocuments.id,
    vehicleId: vehicleDocuments.vehicleId,
    documentType: vehicleDocuments.documentType,
    fileUrl: vehicleDocuments.fileUrl,
    status: vehicleDocuments.status,
    expiresAt: vehicleDocuments.expiresAt,
    createdAt: vehicleDocuments.createdAt,
    // Include vehicle info
    vehicleBrand: vehicles.brand,
    vehicleModel: vehicles.model,
    vehicleLicensePlate: vehicles.licensePlate,
  })
  .from(vehicleDocuments)
  .innerJoin(vehicles, eq(vehicleDocuments.vehicleId, vehicles.id))
  .where(inArray(vehicleDocuments.vehicleId, vehicleIds))
  .orderBy(desc(vehicleDocuments.createdAt));
}

export async function getPendingDocuments(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(userDocuments).where(eq(userDocuments.status, "pending")).orderBy(asc(userDocuments.createdAt)).limit(limit);
}

// ============================================
// PAYMENT QUERIES
// ============================================

export async function getPaymentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
}

export async function getPaymentsByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(payments).where(eq(payments.bookingId, bookingId));
}


export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(payments).values(data);
  return result[0].insertId;
}

export async function getPaymentByMpId(mpPaymentId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(payments).where(eq(payments.mpPaymentId, mpPaymentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePaymentStatus(id: number, status: string, additionalData?: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) return;

  await db.update(payments).set({ status: status as any, ...additionalData }).where(eq(payments.id, id));
}

export async function getUserPaymentMethods(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId)).orderBy(desc(paymentMethods.isDefault));
}

// ============================================
// FINE QUERIES
// ============================================

export async function getFinesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(fines).where(eq(fines.userId, userId)).orderBy(desc(fines.createdAt));
}

export async function getFinesByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(fines).where(eq(fines.bookingId, bookingId));
}

export async function createFine(data: InsertFine) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(fines).values(data);
  return result[0].insertId;
}

export async function updateFineStatus(id: number, status: string, additionalData?: Partial<InsertFine>) {
  const db = await getDb();
  if (!db) return;

  await db.update(fines).set({ status: status as any, ...additionalData }).where(eq(fines.id, id));
}

export async function getPendingFines(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(fines).where(or(eq(fines.status, "pending"), eq(fines.status, "disputed"))).orderBy(asc(fines.createdAt)).limit(limit);
}

// ============================================
// REVIEW QUERIES
// ============================================

export async function getReviewsByVehicleId(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(reviews).where(and(eq(reviews.vehicleId, vehicleId), eq(reviews.isPublic, true))).orderBy(desc(reviews.createdAt));
}

export async function getReviewsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(reviews).where(eq(reviews.revieweeId, userId)).orderBy(desc(reviews.createdAt));
}

export async function getReviewsByRevieweeId(revieweeId: number) {
  // Alias for getReviewsByUserId
  return getReviewsByUserId(revieweeId);
}

export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(reviews).values(data);
  return result[0].insertId;
}

// ============================================
// MESSAGE QUERIES
// ============================================

export async function getConversationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(conversations).where(
    or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId))
  ).orderBy(desc(conversations.lastMessageAt));
}

export async function getMessagesByConversationId(conversationId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(desc(messages.createdAt)).limit(limit);
}

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(data);
  
  // Update conversation lastMessageAt
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, data.conversationId));
  
  return result[0].insertId;
}

export async function markMessagesAsRead(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(messages).set({ isRead: true, readAt: new Date() }).where(
    and(eq(messages.conversationId, conversationId), ne(messages.senderId, userId))
  );
}

export async function getOrCreateConversation(participant1Id: number, participant2Id: number, bookingId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if conversation already exists between these two users
  const existing = await db.select().from(conversations).where(
    or(
      and(eq(conversations.participant1Id, participant1Id), eq(conversations.participant2Id, participant2Id)),
      and(eq(conversations.participant1Id, participant2Id), eq(conversations.participant2Id, participant1Id))
    )
  ).limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new conversation
  const result = await db.insert(conversations).values({
    participant1Id,
    participant2Id,
    bookingId,
  });

  const newConversation = await db.select().from(conversations).where(eq(conversations.id, result[0].insertId)).limit(1);
  return newConversation[0];
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUnreadMessageCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  // Get all conversations for this user
  const userConversations = await db.select().from(conversations).where(
    or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId))
  );

  if (userConversations.length === 0) return 0;

  // Count unread messages in those conversations where user is not the sender
  const conversationIds = userConversations.map(c => c.id);
  // Guard: inArray() requires a non-empty array; the early return above (length === 0) already handles that
  const unreadMessages = await db.select().from(messages).where(
    and(
      inArray(messages.conversationId, conversationIds),
      ne(messages.senderId, userId),
      eq(messages.isRead, false)
    )
  );

  return unreadMessages.length;
}

// Returns unread count for a specific conversation (for per-conversation badges)
export async function getUnreadCountForConversation(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const unread = await db.select().from(messages).where(
    and(
      eq(messages.conversationId, conversationId),
      ne(messages.senderId, userId),
      eq(messages.isRead, false)
    )
  );
  return unread.length;
}
// ============================================
// FAVORITE QUERIES
// ============================================
export async function getFavoritesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Join with vehicles table to get vehicle details
  const results = await db
    .select({
      id: favorites.id,
      userId: favorites.userId,
      vehicleId: favorites.vehicleId,
      createdAt: favorites.createdAt,
      vehicle: {
        id: vehicles.id,
        brand: vehicles.brand,
        model: vehicles.model,
        year: vehicles.year,
        category: vehicles.category,
        pickupCity: vehicles.pickupCity,
        pickupState: vehicles.pickupState,
        dailyPrice: vehicles.dailyPrice,
        mainImageUrl: vehicles.mainImageUrl,
      },
    })
    .from(favorites)
    .leftJoin(vehicles, eq(favorites.vehicleId, vehicles.id))
    .where(eq(favorites.userId, userId));

  return results;
}

export async function addFavorite(userId: number, vehicleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(favorites).values({ userId, vehicleId });
}

export async function removeFavorite(userId: number, vehicleId: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.vehicleId, vehicleId)));
}

// ============================================
// NOTIFICATION QUERIES
// ============================================

export async function getNotificationsByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.id, id));
}

// ETAPA 7: ownership-safe version — only marks notification as read if it belongs to userId
export async function markNotificationAsReadForUser(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(
    and(eq(notifications.userId, userId), eq(notifications.isRead, false))
  );
  
  return result[0]?.count || 0;
}

// ============================================
// ADMIN QUERIES
// ============================================

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;

  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [vehicleCount] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.status, "active"));
  const [pendingDocCount] = await db.select({ count: sql<number>`count(*)` }).from(userDocuments).where(eq(userDocuments.status, "pending"));
  const [pendingFineCount] = await db.select({ count: sql<number>`count(*)` }).from(fines).where(or(eq(fines.status, "pending"), eq(fines.status, "disputed")));

  return {
    totalUsers: userCount?.count || 0,
    activeVehicles: vehicleCount?.count || 0,
    pendingDocuments: pendingDocCount?.count || 0,
    pendingFines: pendingFineCount?.count || 0
  };
}

export async function getAllUsers(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}

export async function getPendingVehicles(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(vehicles).where(eq(vehicles.status, "pending_approval")).orderBy(asc(vehicles.createdAt)).limit(limit);
}


// ============================================
// ADMIN - DELETE OPERATIONS
// ============================================

export async function deleteVehicle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete vehicle images first (foreign key constraint)
  await db.delete(vehicleImages).where(eq(vehicleImages.vehicleId, id));
  
  // Delete vehicle documents
  await db.delete(vehicleDocuments).where(eq(vehicleDocuments.vehicleId, id));
  
  // Delete vehicle
  await db.delete(vehicles).where(eq(vehicles.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete user documents
  await db.delete(userDocuments).where(eq(userDocuments.userId, id));
  
  // Delete user
  await db.delete(users).where(eq(users.id, id));
}


// ============================================
// USER VERIFICATION (FASE 1A: Turo Brasileiro)
// ============================================

/**
 * Get user's verification status
 */
export async function getUserVerification(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const verification = await db
    .select()
    .from(userVerifications)
    .where(eq(userVerifications.userId, userId))
    .limit(1);

  return verification[0] || null;
}

/**
 * Get pending verifications for admin review
 */
export async function getPendingVerifications(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  const pending = await db
    .select({
      verification: userVerifications,
      user: users,
    })
    .from(userVerifications)
    .leftJoin(users, eq(userVerifications.userId, users.id))
    .where(eq(userVerifications.status, "pending"))
    .orderBy(asc(userVerifications.createdAt))
    .limit(limit);

  return pending;
}

/**
 * Submit verification documents
 */
export async function submitUserVerification(
  userId: number,
  documents: {
    cpfUrl?: string;
    cnhUrl?: string;
    incomeProofUrl?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get or create verification record
  let verification = await getUserVerification(userId);

  if (!verification) {
    // Create new verification
    const result = await db.insert(userVerifications).values({
      userId,
      status: "pending",
      attemptCount: 1,
    });
    verification = await getUserVerification(userId);
  } else {
    // Increment attempt count
    await db
      .update(userVerifications)
      .set({
        attemptCount: verification.attemptCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(userVerifications.userId, userId));
  }

  if (!verification) throw new Error("Failed to create verification");

  // Delete existing documents
  await db
    .delete(verificationDocuments)
    .where(eq(verificationDocuments.verificationId, verification.id));

  // Insert new documents
  const docTypes: Array<"cpf" | "cnh" | "income_proof"> = [];
  const docUrls: Array<string | undefined> = [];

  if (documents.cpfUrl) {
    docTypes.push("cpf");
    docUrls.push(documents.cpfUrl);
  }
  if (documents.cnhUrl) {
    docTypes.push("cnh");
    docUrls.push(documents.cnhUrl);
  }
  if (documents.incomeProofUrl) {
    docTypes.push("income_proof");
    docUrls.push(documents.incomeProofUrl);
  }

  for (let i = 0; i < docTypes.length; i++) {
    const docType = docTypes[i];
    const url = docUrls[i];

    if (url) {
      // Encrypt URL before storing
      const encryptedUrl = encryptAES(url);

      await db.insert(verificationDocuments).values({
        verificationId: verification.id,
        documentType: docType,
        encryptedUrl,
      });
    }
  }

  return verification.id;
}

/**
 * Approve user verification
 */
export async function approveUserVerification(
  verificationId: number,
  adminId: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(userVerifications)
    .set({
      status: "approved",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNotes: notes,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userVerifications.id, verificationId));
}

/**
 * Reject user verification
 */
export async function rejectUserVerification(
  verificationId: number,
  adminId: number,
  notes: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const verification = await db
    .select()
    .from(userVerifications)
    .where(eq(userVerifications.id, verificationId))
    .limit(1);

  if (!verification[0]) throw new Error("Verification not found");

  await db
    .update(userVerifications)
    .set({
      status: "rejected",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNotes: notes,
      updatedAt: new Date(),
    })
    .where(eq(userVerifications.id, verificationId));
}

/**
 * Block user verification (max attempts exceeded)
 */
export async function blockUserVerification(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(userVerifications)
    .set({
      status: "blocked",
      updatedAt: new Date(),
    })
    .where(eq(userVerifications.userId, userId));
}

/**
 * Get decrypted verification documents for admin review
 */
export async function getVerificationDocuments(verificationId: number) {
  const db = await getDb();
  if (!db) return [];

  const docs = await db
    .select()
    .from(verificationDocuments)
    .where(eq(verificationDocuments.verificationId, verificationId));

  // Decrypt URLs
  return docs.map((doc) => ({
    ...doc,
    decryptedUrl: decryptAES(doc.encryptedUrl),
  }));
}


// ============================================
// VEHICLE VERIFICATION
// ============================================

/**
 * Get pending vehicles awaiting document verification
 * Returns vehicles with owner info, verification record, vehicle images, and vehicle documents
 */
export async function getPendingVehiclesForVerification() {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      vehicle: vehicles,
      owner: users,
      verification: vehicleVerifications,
    })
    .from(vehicles)
    .innerJoin(users, eq(vehicles.hostId, users.id))
    .leftJoin(vehicleVerifications, eq(vehicles.id, vehicleVerifications.vehicleId))
    .where(eq(vehicles.status, "pending_approval"))
    .orderBy(desc(vehicles.createdAt));

  // Enrich each vehicle with its images
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const images = await db
        .select()
        .from(vehicleImages)
        .where(eq(vehicleImages.vehicleId, row.vehicle.id))
        .orderBy(vehicleImages.sortOrder);

      const docs = await db
        .select()
        .from(vehicleDocuments)
        .where(eq(vehicleDocuments.vehicleId, row.vehicle.id));

      const ownerDocs = await db
        .select()
        .from(userDocuments)
        .where(eq(userDocuments.userId, row.owner.id));

      return {
        ...row,
        images,
        vehicleDocuments: docs,
        ownerDocuments: ownerDocs,
      };
    })
  );

  return enriched;
}

/**
 * Get vehicle verification details with owner info, images, and all documents
 */
export async function getVehicleVerificationDetails(vehicleId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      vehicle: vehicles,
      owner: users,
      verification: vehicleVerifications,
    })
    .from(vehicles)
    .innerJoin(users, eq(vehicles.hostId, users.id))
    .leftJoin(vehicleVerifications, eq(vehicles.id, vehicleVerifications.vehicleId))
    .where(eq(vehicles.id, vehicleId))
    .limit(1);

  if (!result[0]) return null;

  const row = result[0];

  // Get vehicle images
  const images = await db
    .select()
    .from(vehicleImages)
    .where(eq(vehicleImages.vehicleId, vehicleId))
    .orderBy(vehicleImages.sortOrder);

  // Get vehicle documents from vehicle_documents table
  const vDocs = await db
    .select()
    .from(vehicleDocuments)
    .where(eq(vehicleDocuments.vehicleId, vehicleId));

  // Get owner personal documents
  const ownerDocs = await db
    .select()
    .from(userDocuments)
    .where(eq(userDocuments.userId, row.owner.id));

  return {
    ...row,
    images,
    vehicleDocuments: vDocs,
    ownerDocuments: ownerDocs,
  };
}

/**
 * Get owner documents for verification (with user info)
 */
export async function getOwnerDocuments(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(userDocuments)
    .where(eq(userDocuments.userId, userId))
    .orderBy(asc(userDocuments.documentType));
}

/**
 * Get all pending owner verifications for admin
 * Returns users who have submitted documents but haven't been approved
 */
export async function getPendingOwnerVerifications() {
  const db = await getDb();
  if (!db) return [];

  // Get users who have at least one pending document
  const usersWithPendingDocs = await db
    .selectDistinct({ userId: userDocuments.userId })
    .from(userDocuments)
    .where(eq(userDocuments.status, "pending"));

  if (usersWithPendingDocs.length === 0) return [];

  const userIds = usersWithPendingDocs.map((r) => r.userId);

  const rows = await db
    .select()
    .from(users)
    .where(inArray(users.id, userIds));

  // Enrich each user with their documents
  const enriched = await Promise.all(
    rows.map(async (user) => {
      const docs = await db
        .select()
        .from(userDocuments)
        .where(eq(userDocuments.userId, user.id))
        .orderBy(asc(userDocuments.documentType));
      return { user, documents: docs };
    })
  );

  return enriched;
}

/**
 * Approve a single user document
 */
export async function approveUserDocument(docId: number, adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userDocuments).set({
    status: "approved",
    reviewedBy: adminId,
    reviewedAt: new Date(),
    rejectionReason: null,
  }).where(eq(userDocuments.id, docId));
}

/**
 * Reject a single user document
 */
export async function rejectUserDocument(docId: number, adminId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userDocuments).set({
    status: "rejected",
    reviewedBy: adminId,
    reviewedAt: new Date(),
    rejectionReason: reason,
  }).where(eq(userDocuments.id, docId));
}

/**
 * Approve a single vehicle document
 */
export async function approveVehicleDocument(docId: number, adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(vehicleDocuments).set({
    status: "approved",
    reviewedBy: adminId,
    reviewedAt: new Date(),
    rejectionReason: null,
  }).where(eq(vehicleDocuments.id, docId));
}

/**
 * Reject a single vehicle document
 */
export async function rejectVehicleDocument(docId: number, adminId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(vehicleDocuments).set({
    status: "rejected",
    reviewedBy: adminId,
    reviewedAt: new Date(),
    rejectionReason: reason,
  }).where(eq(vehicleDocuments.id, docId));
}

/**
 * Approve vehicle verification
 */
export async function approveVehicleVerification(
  vehicleId: number,
  adminId: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update vehicle status
  await db
    .update(vehicles)
    .set({
      status: "active",
      isVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(vehicles.id, vehicleId));

  // Update verification record
  await db
    .update(vehicleVerifications)
    .set({
      status: "approved",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      adminNotes: notes,
      updatedAt: new Date(),
    })
    .where(eq(vehicleVerifications.vehicleId, vehicleId));
}

/**
 * Reject vehicle verification
 */
export async function rejectVehicleVerification(
  vehicleId: number,
  adminId: number,
  rejectionReason: string,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update vehicle status
  await db
    .update(vehicles)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(vehicles.id, vehicleId));

  // Update verification record
  await db
    .update(vehicleVerifications)
    .set({
      status: "rejected",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason: rejectionReason,
      adminNotes: notes,
      updatedAt: new Date(),
    })
    .where(eq(vehicleVerifications.vehicleId, vehicleId));
}

/**
 * Update vehicle verification document status
 */
export async function updateVehicleDocumentStatus(
  vehicleId: number,
  documentType: "crlv" | "insurance",
  status: "approved" | "rejected",
  adminId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (documentType === "crlv") {
    updateData.crlvStatus = status;
  } else if (documentType === "insurance") {
    updateData.insuranceStatus = status;
  }

  await db
    .update(vehicleVerifications)
    .set(updateData)
    .where(eq(vehicleVerifications.vehicleId, vehicleId));
}

/**
 * Create vehicle verification record
 */
export async function createVehicleVerification(vehicleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .insert(vehicleVerifications)
    .values({
      vehicleId,
      status: "pending",
      crlvStatus: "pending",
      insuranceStatus: "pending",
      ownershipMatchStatus: "pending",
    });
}

/**
 * Get all pending owner documents for verification
 */
export async function getPendingOwnerDocuments() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      document: userDocuments,
      owner: users,
    })
    .from(userDocuments)
    .innerJoin(users, eq(userDocuments.userId, users.id))
    .where(eq(userDocuments.status, "pending"));
}

/**
 * Approve owner document
 */
export async function approveOwnerDocument(
  documentId: number,
  adminId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(userDocuments)
    .set({
      status: "approved",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userDocuments.id, documentId));
}

/**
 * Reject owner document
 */
export async function rejectOwnerDocument(
  documentId: number,
  adminId: number,
  rejectionReason: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(userDocuments)
    .set({
      status: "rejected",
      rejectionReason,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userDocuments.id, documentId));
}

// ============================================================
// BOOKING VERIFICATIONS (Post-payment identity check)
// ============================================================

/**
 * Get booking verification by bookingId
 */
export async function getBookingVerification(bookingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db
    .select()
    .from(bookingVerifications)
    .where(eq(bookingVerifications.bookingId, bookingId));
  return row || null;
}

/**
 * Create or update booking verification (upsert)
 */
export async function upsertBookingVerification(data: {
  bookingId: number;
  renterId: number;
  cnhImageUrl?: string;
  selfieImageUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getBookingVerification(data.bookingId);

  if (existing) {
    await db
      .update(bookingVerifications)
      .set({
        cnhImageUrl: data.cnhImageUrl ?? existing.cnhImageUrl,
        selfieImageUrl: data.selfieImageUrl ?? existing.selfieImageUrl,
        status: "pending_review",
        rejectionReason: null,
        submissionCount: existing.submissionCount + 1,
        lastSubmittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bookingVerifications.bookingId, data.bookingId));
  } else {
    await db.insert(bookingVerifications).values({
      bookingId: data.bookingId,
      renterId: data.renterId,
      cnhImageUrl: data.cnhImageUrl,
      selfieImageUrl: data.selfieImageUrl,
      status: "pending_review",
      submissionCount: 1,
      lastSubmittedAt: new Date(),
    });
  }

  return getBookingVerification(data.bookingId);
}

/**
 * Approve booking verification (admin)
 */
export async function approveBookingVerification(
  bookingId: number,
  adminId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(bookingVerifications)
    .set({
      status: "approved",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookingVerifications.bookingId, bookingId));

  // Update booking status to confirmed
  await db
    .update(bookings)
    .set({
      status: "confirmed",
      verificationStatus: "approved",
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));
}

/**
 * Reject booking verification (admin)
 */
export async function rejectBookingVerification(
  bookingId: number,
  adminId: number,
  rejectionReason: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(bookingVerifications)
    .set({
      status: "rejected",
      rejectionReason,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookingVerifications.bookingId, bookingId));

  // Update booking status
  await db
    .update(bookings)
    .set({
      status: "rejected_verification",
      verificationStatus: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));
}

/**
 * List all pending verifications (admin)
 */
export async function listPendingVerifications() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({
      verification: bookingVerifications,
      booking: {
        id: bookings.id,
        startDate: bookings.startDate,
        endDate: bookings.endDate,
        totalAmount: bookings.totalAmount,
        renterFullName: bookings.renterFullName,
        renterCpf: bookings.renterCpf,
        renterEmail: bookings.renterEmail,
        renterPhone: bookings.renterPhone,
        status: bookings.status,
      },
    })
    .from(bookingVerifications)
    .innerJoin(bookings, eq(bookingVerifications.bookingId, bookings.id))
    .where(eq(bookingVerifications.status, "pending_review"))
    .orderBy(asc(bookingVerifications.lastSubmittedAt));

  return rows;
}

/**
 * List all verifications (admin, with filters)
 */
export async function listAllVerifications(status?: "pending_review" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({
      verification: bookingVerifications,
      booking: {
        id: bookings.id,
        startDate: bookings.startDate,
        endDate: bookings.endDate,
        totalAmount: bookings.totalAmount,
        renterFullName: bookings.renterFullName,
        renterCpf: bookings.renterCpf,
        renterEmail: bookings.renterEmail,
        renterPhone: bookings.renterPhone,
        status: bookings.status,
        verificationStatus: bookings.verificationStatus,
        vehicleId: bookings.vehicleId,
        renterId: bookings.renterId,
      },
      vehicle: {
        id: vehicles.id,
        brand: vehicles.brand,
        model: vehicles.model,
        year: vehicles.year,
        licensePlate: vehicles.licensePlate,
        mainImageUrl: vehicles.mainImageUrl,
        pickupCity: vehicles.pickupCity,
        pickupState: vehicles.pickupState,
      },
      renter: {
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        cpf: users.cpf,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(bookingVerifications)
    .innerJoin(bookings, eq(bookingVerifications.bookingId, bookings.id))
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .innerJoin(users, eq(bookingVerifications.renterId, users.id))
    .orderBy(desc(bookingVerifications.lastSubmittedAt));

  return status ? rows.filter(r => r.verification.status === status) : rows;
}


// ============================================
// MOTORCYCLE SPECS FUNCTIONS
// ============================================

/**
 * Create motorcycle specs for a vehicle
 */
export async function createMotorcycleSpecs(data: InsertMotorcycleSpecs) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(motorcycleSpecs).values(data);
  return result;
}

/**
 * Get motorcycle specs by vehicle ID
 */
export async function getMotorcycleSpecsByVehicleId(vehicleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const specs = await db
    .select()
    .from(motorcycleSpecs)
    .where(eq(motorcycleSpecs.vehicleId, vehicleId))
    .limit(1);
  return specs[0] || null;
}

/**
 * Update motorcycle specs
 */
export async function updateMotorcycleSpecs(vehicleId: number, data: Partial<InsertMotorcycleSpecs>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(motorcycleSpecs)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(motorcycleSpecs.vehicleId, vehicleId));
}

/**
 * Delete motorcycle specs
 */
export async function deleteMotorcycleSpecs(vehicleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(motorcycleSpecs)
    .where(eq(motorcycleSpecs.vehicleId, vehicleId));
}

/**
 * Search motorcycles with filters
 */
export async function searchMotorcycles(filters: {
  cilindrada?: string;
  tipoMoto?: string;
  combustivel?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions: any[] = [
    eq(vehicles.vehicleType, "motorcycle"),
    eq(vehicles.status, "active"),
  ];

  if (filters.cilindrada) {
    conditions.push(eq(motorcycleSpecs.cilindrada, filters.cilindrada as any));
  }

  if (filters.tipoMoto) {
    conditions.push(eq(motorcycleSpecs.tipoMoto, filters.tipoMoto as any));
  }

  if (filters.combustivel) {
    conditions.push(eq(motorcycleSpecs.combustivel, filters.combustivel as any));
  }

  if (filters.city) {
    conditions.push(like(vehicles.pickupCity, `%${filters.city}%`));
  }

  if (filters.minPrice) {
    conditions.push(gte(vehicles.dailyPrice, filters.minPrice.toString()));
  }

  if (filters.maxPrice) {
    conditions.push(lte(vehicles.dailyPrice, filters.maxPrice.toString()));
  }

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;

  const results = await db
    .select({
      vehicle: vehicles,
      specs: motorcycleSpecs,
    })
    .from(vehicles)
    .leftJoin(motorcycleSpecs, eq(vehicles.id, motorcycleSpecs.vehicleId))
    .where(and(...conditions))
    .limit(limit)
    .offset(offset);

  return results;
}

/**
 * Get motorcycle with specs by ID
 */
export async function getMotorcycleById(vehicleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      vehicle: vehicles,
      specs: motorcycleSpecs,
    })
    .from(vehicles)
    .leftJoin(motorcycleSpecs, eq(vehicles.id, motorcycleSpecs.vehicleId))
    .where(eq(vehicles.id, vehicleId))
    .limit(1);

  return result[0] || null;
}

/**
 * List motorcycles by host ID
 */
export async function getMotorcyclesByHostId(hostId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .select({
      vehicle: vehicles,
      specs: motorcycleSpecs,
    })
    .from(vehicles)
    .leftJoin(motorcycleSpecs, eq(vehicles.id, motorcycleSpecs.vehicleId))
    .where(eq(vehicles.hostId, hostId))
    .orderBy(desc(vehicles.createdAt));

  return results;
}

/**
 * Admin: List all bookings with full details (vehicle, renter, host, verification)
 */
export async function adminListAllBookings(filters?: {
  status?: string;
  verificationStatus?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const renters = db.$with("renters").as(
    db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      cpf: users.cpf,
      avatarUrl: users.avatarUrl,
    }).from(users)
  );

  let query = db
    .select({
      booking: bookings,
      vehicle: {
        id: vehicles.id,
        brand: vehicles.brand,
        model: vehicles.model,
        year: vehicles.year,
        licensePlate: vehicles.licensePlate,
        mainImageUrl: vehicles.mainImageUrl,
        pickupCity: vehicles.pickupCity,
        pickupState: vehicles.pickupState,
        vehicleType: vehicles.vehicleType,
      },
      renter: {
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        cpf: users.cpf,
        avatarUrl: users.avatarUrl,
      },
      verification: {
        id: bookingVerifications.id,
        status: bookingVerifications.status,
        cnhImageUrl: bookingVerifications.cnhImageUrl,
        selfieImageUrl: bookingVerifications.selfieImageUrl,
        rejectionReason: bookingVerifications.rejectionReason,
        submissionCount: bookingVerifications.submissionCount,
        lastSubmittedAt: bookingVerifications.lastSubmittedAt,
        reviewedAt: bookingVerifications.reviewedAt,
      },
    })
    .from(bookings)
    .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .innerJoin(users, eq(bookings.renterId, users.id))
    .leftJoin(bookingVerifications, eq(bookingVerifications.bookingId, bookings.id))
    .orderBy(desc(bookings.createdAt))
    .$dynamic();

  if (filters?.status) {
    query = query.where(eq(bookings.status, filters.status as any));
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  query = query.limit(limit).offset(offset);

  return await query;
}

// Helpers para Notificações e Recibos

/**
 * Criar um recibo para pagamento ou cancelamento
 */
export async function createReceipt(data: InsertReceipt) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  
  // Gerar número de recibo único
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const receiptNumber = `RCP-${timestamp}-${random}`;
  
  const result = await db.insert(receipts).values({
    ...data,
    receiptNumber,
  });
  
  return result;
}

/**
 * Obter recibos de um usuário
 */
export async function getUserReceipts(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  
  const userReceipts = await db
    .select()
    .from(receipts)
    .where(eq(receipts.userId, userId))
    .orderBy(desc(receipts.createdAt))
    .limit(limit)
    .offset(offset);
  
  return userReceipts;
}

/**
 * Registrar envio de email
 */
export async function logEmail(data: InsertEmailLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  
  const result = await db.insert(emailLogs).values(data);
  return result;
}

/**
 * Obter histórico de emails enviados
 */
export async function getEmailLogs(relatedEntityId: number, limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  
  const logs = await db
    .select()
    .from(emailLogs)
    .where(eq(emailLogs.relatedEntityId, relatedEntityId))
    .orderBy(desc(emailLogs.sentAt))
    .limit(limit);
  
  return logs;
}


/**
 * Obter um recibo por ID
 */
export async function getReceiptById(receiptId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  
  const receipt = await db
    .select()
    .from(receipts)
    .where(eq(receipts.id, receiptId))
    .limit(1);
  
  return receipt[0] || null;
}

/**
 * Send a system message to a conversation.
 * System messages have senderId = 0 and messageType = "system".
 * Used for automated events: payment confirmed, booking approved, etc.
 */
export async function sendSystemMessage(conversationId: number, content: string) {
  const db = await getDb();
  if (!db) return;

  await db.insert(messages).values({
    conversationId,
    senderId: 0, // 0 = system
    content,
    messageType: "system",
    isRead: false,
  });

  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId));
}

/**
 * Get or create a conversation for a booking.
 * If conversation already exists for this booking, return it.
 * Otherwise create a new one linking renterId <-> hostId.
 */
export async function getOrCreateConversationForBooking(renterId: number, hostId: number, bookingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if conversation already exists for this booking
  const existing = await db.select().from(conversations).where(
    eq(conversations.bookingId, bookingId)
  ).limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Check if a conversation exists between these two users (pre-booking)
  const existingBetweenUsers = await db.select().from(conversations).where(
    or(
      and(eq(conversations.participant1Id, renterId), eq(conversations.participant2Id, hostId)),
      and(eq(conversations.participant1Id, hostId), eq(conversations.participant2Id, renterId))
    )
  ).limit(1);

  if (existingBetweenUsers.length > 0) {
    // Link existing conversation to this booking
    await db.update(conversations).set({ bookingId }).where(eq(conversations.id, existingBetweenUsers[0].id));
    return { ...existingBetweenUsers[0], bookingId };
  }

  // Create new conversation linked to booking
  const result = await db.insert(conversations).values({
    participant1Id: renterId,
    participant2Id: hostId,
    bookingId,
  });

  const newConversation = await db.select().from(conversations).where(eq(conversations.id, result[0].insertId)).limit(1);
  return newConversation[0];
}

// ============================================
// PUBLIC PLATFORM STATS
// ============================================
export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, activeVehicles: 0, totalReviews: 0, averageRating: 0 };

  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [vehicleCount] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.status, "active"));
  const [reviewStats] = await db.select({
    count: sql<number>`count(*)`,
    avg: sql<number>`avg(rating)`,
  }).from(reviews).where(eq(reviews.isPublic, true));

  return {
    totalUsers: userCount?.count || 0,
    activeVehicles: vehicleCount?.count || 0,
    totalReviews: reviewStats?.count || 0,
    averageRating: reviewStats?.avg ? Math.round(Number(reviewStats.avg) * 10) / 10 : 0,
  };
}

// ============================================
// PUBLIC REVIEWS (for homepage testimonials)
// ============================================
export async function getPublicReviews(limit = 6) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      reviewType: reviews.reviewType,
      createdAt: reviews.createdAt,
      reviewerName: users.name,
      reviewerAvatar: users.avatarUrl,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.reviewerId, users.id))
    .where(and(eq(reviews.isPublic, true), sql`${reviews.comment} IS NOT NULL AND ${reviews.comment} != ''`))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);

  return rows;
}

// ============================================
// SECURITY AUDIT LOGS (ETAPA 10)
// ============================================
export async function getSecurityLogs(opts: {
  limit?: number;
  offset?: number;
  eventType?: string;
  severity?: string;
  userId?: number;
  ipAddress?: string;
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const db = await getDb();
  if (!db) return [];
  const { securityAuditLogs } = await import("../drizzle/schema");
  const { desc: descOp, and: andOp, eq: eqOp, gte: gteOp, lte: lteOp, like: likeOp } = await import("drizzle-orm");
  const conditions: any[] = [];
  if (opts.eventType) conditions.push(eqOp(securityAuditLogs.eventType, opts.eventType as any));
  if (opts.severity) conditions.push(eqOp(securityAuditLogs.severity, opts.severity as any));
  if (opts.userId) conditions.push(eqOp(securityAuditLogs.userId, opts.userId));
  if (opts.ipAddress) conditions.push(likeOp(securityAuditLogs.ipAddress, `%${opts.ipAddress}%`));
  if (opts.startDate) conditions.push(gteOp(securityAuditLogs.createdAt, opts.startDate));
  if (opts.endDate) conditions.push(lteOp(securityAuditLogs.createdAt, opts.endDate));
  const rows = await db
    .select()
    .from(securityAuditLogs)
    .where(conditions.length > 0 ? andOp(...conditions) : undefined)
    .orderBy(descOp(securityAuditLogs.createdAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
  return rows;
}

export async function getSecurityStats() {
  const db = await getDb();
  if (!db) return null;
  const { securityAuditLogs } = await import("../drizzle/schema");
  const { sql: sqlOp, gte: gteOp } = await import("drizzle-orm");
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [last24h, last7d, byType] = await Promise.all([
    db.select({ count: sqlOp<number>`count(*)` }).from(securityAuditLogs).where(gteOp(securityAuditLogs.createdAt, oneDayAgo)),
    db.select({ count: sqlOp<number>`count(*)` }).from(securityAuditLogs).where(gteOp(securityAuditLogs.createdAt, sevenDaysAgo)),
    db.select({ eventType: securityAuditLogs.eventType, count: sqlOp<number>`count(*)` })
      .from(securityAuditLogs)
      .where(gteOp(securityAuditLogs.createdAt, sevenDaysAgo))
      .groupBy(securityAuditLogs.eventType),
  ]);
  return {
    last24hCount: Number(last24h[0]?.count ?? 0),
    last7dCount: Number(last7d[0]?.count ?? 0),
    byType: byType.map(r => ({ eventType: r.eventType, count: Number(r.count) })),
  };
}

/**
 * Cancel pending_payment bookings that have been waiting for more than `expiryMinutes` minutes.
 * These are reservations where the user started the flow but never completed payment.
 * Cancelling them frees up the dates for other users.
 */
export async function cancelExpiredPendingBookings(expiryMinutes = 30): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { bookings } = await import("../drizzle/schema");
  const { and, eq, lte, inArray } = await import("drizzle-orm");

  const cutoff = new Date(Date.now() - expiryMinutes * 60 * 1000);

  // Find all pending_payment bookings older than the cutoff
  const expired = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "pending_payment" as any),
        lte(bookings.createdAt, cutoff)
      )
    );

  if (expired.length === 0) return 0;

  const ids = expired.map((b) => b.id);

  // Use "cancelled_by_renter" — the user abandoned the payment, equivalent to a self-cancellation.
  // This avoids needing a schema migration to add an "expired" enum value.
  await db
    .update(bookings)
    .set({ status: "cancelled_by_renter" as any, updatedAt: new Date() })
    .where(inArray(bookings.id, ids));

  console.log(`[Cleanup] Expired ${ids.length} abandoned pending_payment booking(s): [${ids.join(", ")}]`);
  return ids.length;
}

// ============================================
// REVIEW RATING HELPERS
// ============================================

/**
 * Recalculates and persists the average rating and review count for a vehicle.
 * Called after every new vehicle review is created.
 */
export async function updateVehicleAverageRating(vehicleId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const result = await db
    .select({
      avg: sql<string>`AVG(${reviews.rating})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.vehicleId, vehicleId),
        eq(reviews.isPublic, true)
      )
    );

  const avg = result[0]?.avg ?? null;
  const count = Number(result[0]?.count ?? 0);

  await db
    .update(vehicles)
    .set({
      averageRating: avg !== null ? String(Number(avg).toFixed(2)) : null,
      totalTrips: count > 0 ? count : undefined,
    })
    .where(eq(vehicles.id, vehicleId));
}

/**
 * Update receipt with PDF URL after generation
 */
export async function updateReceiptPdfUrl(receiptId: number, pdfUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  await db.update(receipts).set({ pdfUrl }).where(eq(receipts.id, receiptId));
}

// ============================================
// OTP LOGS
// ============================================

/**
 * Registra um evento de OTP (envio ou verificação) na tabela otp_logs.
 * Chamado pelo otpService.ts a cada envio (sent), verificação (verified) ou falha (failed).
 */
export async function logOtpEvent(data: InsertOtpLog): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[OTP Log] Database not available — event not logged");
      return;
    }
    await db.insert(otpLogs).values(data);
  } catch (err) {
    // Não deve interromper o fluxo principal se o log falhar
    console.error("[OTP Log] Failed to log OTP event:", err);
  }
}

/**
 * Retorna o histórico de eventos OTP de uma reserva específica.
 */
export async function getOtpLogsByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(otpLogs)
    .where(eq(otpLogs.bookingId, bookingId))
    .orderBy(desc(otpLogs.createdAt));
}
