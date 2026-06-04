import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar, 
  decimal, 
  boolean, 
  json,
  index
} from "drizzle-orm/mysql-core";

// ============================================
// USERS & AUTHENTICATION
// ============================================

/**
 * Core user table backing auth flow.
 * Extended with KYC and verification fields for RIDDY platform.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "host", "admin", "both"]).default("user").notNull(),
  
  // Modo ativo atual do usuário (contexto operacional)
  // Persiste o último modo usado — determina o contexto ao fazer login
  // null = primeiro acesso, exibir onboarding de escolha de modo
  activeMode: mysqlEnum("activeMode", ["renter", "host"]).default("renter"),
  
  // KYC & Verification
  kycStatus: mysqlEnum("kycStatus", ["pending", "submitted", "approved", "rejected"]).default("pending").notNull(),
  verificationLevel: mysqlEnum("verificationLevel", ["basic", "verified", "premium"]).default("basic").notNull(),
  facialVerified: boolean("facialVerified").default(false).notNull(),
  cnhVerified: boolean("cnhVerified").default(false).notNull(),
  cnhCategory: mysqlEnum("cnhCategory", ["A", "AB", "B", "C", "D", "E", "ACC"]),
  cnhNumber: varchar("cnhNumber", { length: 20 }),
  cnhExpiresAt: timestamp("cnhExpiresAt"),
  addressVerified: boolean("addressVerified").default(false).notNull(),
  
  // Profile
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  dateOfBirth: timestamp("dateOfBirth"),
  
  // Address
  addressStreet: text("addressStreet"),
  addressNumber: varchar("addressNumber", { length: 20 }),
  addressComplement: text("addressComplement"),
  addressNeighborhood: text("addressNeighborhood"),
  addressCity: text("addressCity"),
  addressState: varchar("addressState", { length: 2 }),
  addressZipCode: varchar("addressZipCode", { length: 10 }),
  
  // Geolocation (for user location)
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  lastLocationUpdate: timestamp("lastLocationUpdate"),
  
  // Email verification & password reset
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerifyToken: varchar("emailVerifyToken", { length: 128 }),
  emailVerifyTokenExpiresAt: timestamp("emailVerifyTokenExpiresAt"),
  passwordResetToken: varchar("passwordResetToken", { length: 128 }),
  passwordResetTokenExpiresAt: timestamp("passwordResetTokenExpiresAt"),
  googleId: varchar("googleId", { length: 128 }),

  // Stats
  totalTripsAsRenter: int("totalTripsAsRenter").default(0).notNull(),
  totalTripsAsHost: int("totalTripsAsHost").default(0).notNull(),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// USER DOCUMENTS
// ============================================

export const userDocuments = mysqlTable("user_documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  documentType: mysqlEnum("documentType", [
    "cnh_front", 
    "cnh_back", 
    "rg_front", 
    "rg_back", 
    "cpf", 
    "selfie", 
    "proof_of_address",
    "facial_recognition"
  ]).notNull(),
  
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  
  // OCR extracted data
  extractedData: json("extractedData"),
  
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Busca de documentos por usuário (getDocumentsByUserId)
  userIdIdx: index("user_documents_userId_idx").on(table.userId),
}));

export type UserDocument = typeof userDocuments.$inferSelect;
export type InsertUserDocument = typeof userDocuments.$inferInsert;

// ============================================
// VEHICLES
// ============================================

// ============================================
// USER LOCATION HISTORY (for analytics & recommendations)
// ============================================

export const userLocationHistory = mysqlTable("user_location_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  
  accuracy: int("accuracy"), // meters
  source: mysqlEnum("source", ["gps", "ip", "manual", "geofence"]).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserLocationHistory = typeof userLocationHistory.$inferSelect;
export type InsertUserLocationHistory = typeof userLocationHistory.$inferInsert;

// ============================================
// CITY REFERENCE DATA (for suggestions & search optimization)
// ============================================

export const cities = mysqlTable("cities", {
  id: int("id").autoincrement().primaryKey(),
  
  name: varchar("name", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  
  // Geographic center
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  
  // For radius-based search
  population: int("population"),
  region: varchar("region", { length: 50 }), // North, Northeast, Center-West, Southeast, South
  
  // For search optimization
  vehicleCount: int("vehicleCount").default(0).notNull(),
  averagePrice: decimal("averagePrice", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type City = typeof cities.$inferSelect;
export type InsertCity = typeof cities.$inferInsert;

// ============================================
// VEHICLES
// ============================================

export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  hostId: int("hostId").notNull(),
  
  // Basic Info
  brand: varchar("brand", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: int("year").notNull(),
  color: varchar("color", { length: 50 }),
  licensePlate: varchar("licensePlate", { length: 10 }).notNull(),
  renavam: varchar("renavam", { length: 20 }),
  chassi: varchar("chassi", { length: 30 }),
  
  // Vehicle Type
  vehicleType: mysqlEnum("vehicleType", ["car", "motorcycle"]).default("car").notNull(),
  
  // Category
  category: mysqlEnum("category", ["hatch", "popular", "sedan", "suv", "luxury", "electric", "sport", "pickup"]).notNull(),
  transmission: mysqlEnum("transmission", ["manual", "automatic"]).default("automatic").notNull(),
  fuelType: mysqlEnum("fuelType", ["gasoline", "ethanol", "flex", "diesel", "electric", "hybrid"]).default("flex").notNull(),
  
  // Specs
  seats: int("seats").default(5).notNull(),
  doors: int("doors").default(4).notNull(),
  trunkCapacity: int("trunkCapacity"), // liters
  engineSize: varchar("engineSize", { length: 10 }), // e.g., "2.0"
  
  // Features (JSON array)
  features: json("features"), // ["air_conditioning", "bluetooth", "gps", "camera", etc.]
  
  // Pricing
  dailyPrice: decimal("dailyPrice", { precision: 10, scale: 2 }).notNull(),
  weeklyDiscount: int("weeklyDiscount").default(0), // percentage
  monthlyDiscount: int("monthlyDiscount").default(0), // percentage
  
  // Mileage Policy
  dailyKmLimit: int("dailyKmLimit").default(100).notNull(),
  extraKmPrice: decimal("extraKmPrice", { precision: 10, scale: 2 }).default("0.50").notNull(),

  // Garantia Reembolsável — valor ajustado pelo host (null = usar cálculo automático)
  guaranteeAdjusted: decimal("guaranteeAdjusted", { precision: 10, scale: 2 }),
  
  // Location
  pickupAddress: text("pickupAddress").notNull(),
  pickupCity: varchar("pickupCity", { length: 100 }).notNull(),
  pickupState: varchar("pickupState", { length: 2 }).notNull(),
  deliveryAvailable: boolean("deliveryAvailable").default(false).notNull(),
  deliveryRadius: int("deliveryRadius"), // km
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }),
  
  // Geolocation (indexed for performance)
  pickupLatitude: decimal("pickupLatitude", { precision: 10, scale: 8 }),
  pickupLongitude: decimal("pickupLongitude", { precision: 11, scale: 8 }),
  
  // Rules
  minRentalDays: int("minRentalDays").default(1).notNull(),
  maxRentalDays: int("maxRentalDays").default(30).notNull(),
  instantBooking: boolean("instantBooking").default(false).notNull(),
  smokingAllowed: boolean("smokingAllowed").default(false).notNull(),
  petsAllowed: boolean("petsAllowed").default(false).notNull(),
  
  // Status
  status: mysqlEnum("status", ["draft", "pending_approval", "active", "inactive", "suspended", "rejected"]).default("draft").notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  
  // Stats
  totalTrips: int("totalTrips").default(0).notNull(),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }),
  totalEarnings: decimal("totalEarnings", { precision: 12, scale: 2 }).default("0.00").notNull(),
  
  // Images (main image URL)
  mainImageUrl: text("mainImageUrl"),
  
  // Host Document (CPF or CNPJ for contract)
  hostCpfCnpj: varchar("hostCpfCnpj", { length: 20 }),

  // Documents
  crlvUrl: text("crlvUrl"),
  crlvFileKey: varchar("crlvFileKey", { length: 255 }),
  crlvValidated: boolean("crlvValidated").default(false).notNull(),
  crlvOwnerName: text("crlvOwnerName"), // Extracted from OCR
  insuranceUrl: text("insuranceUrl"),
  insuranceFileKey: varchar("insuranceFileKey", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Busca de veículos por proprietário (getVehiclesByHostId)
  hostIdIdx: index("vehicles_hostId_idx").on(table.hostId),
  // Busca de veículos ativos por cidade (searchVehicles, getVehiclesGroupedByCity)
  statusCityIdx: index("vehicles_status_city_idx").on(table.status, table.pickupCity),
  // Filtro por tipo de veículo (car/motorcycle)
  vehicleTypeIdx: index("vehicles_vehicleType_idx").on(table.vehicleType),
}));

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

// ============================================
// MOTORCYCLE SPECIFICATIONS
// ============================================

export const motorcycleSpecs = mysqlTable("motorcycle_specs", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull().unique(),
  
  // Specs
  cilindrada: mysqlEnum("cilindrada", [
    "125cc", "150cc", "160cc", "180cc", "200cc",
    "250cc", "300cc", "350cc", "400cc", "500cc",
    "600cc", "750cc", "800cc", "900cc", "1000cc",
    "1100cc", "1200cc", "1200cc+"
  ]).notNull(),
  tipoMoto: mysqlEnum("tipoMoto", ["street", "sport", "naked", "cruiser", "adventure", "scooter"]).notNull(),
  combustivel: mysqlEnum("combustivel", ["gasolina", "eletrica"]).default("gasolina").notNull(),
  cambio: mysqlEnum("cambio", ["manual", "automatico", "cvt"]).default("manual").notNull(),
  
  // Capacete
  capaceteDisponivel: boolean("capaceteDisponivel").default(false).notNull(),
  taxaCapacete: decimal("taxaCapacete", { precision: 10, scale: 2 }).default("0.00").notNull(),
  
  // Limite de km
  limitKmDiario: int("limitKmDiario").default(100).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MotorcycleSpecs = typeof motorcycleSpecs.$inferSelect;
export type InsertMotorcycleSpecs = typeof motorcycleSpecs.$inferInsert;

// ============================================
// VEHICLE LOCATION INDEX (for fast spatial queries)
// ============================================

export const vehicleLocationIndex = mysqlTable("vehicle_location_index", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull().unique(),
  
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  
  // Geohash for efficient spatial queries (8-character geohash = ~38m precision)
  geohash: varchar("geohash", { length: 8 }).notNull(),
  
  // Grid cell for coarse filtering (e.g., 0.1 degree = ~11km at equator)
  gridX: int("gridX").notNull(),
  gridY: int("gridY").notNull(),
  
  // City for quick filtering
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VehicleLocationIndex = typeof vehicleLocationIndex.$inferSelect;
export type InsertVehicleLocationIndex = typeof vehicleLocationIndex.$inferInsert;

// ============================================
// VEHICLE IMAGES
// ============================================

export const vehicleImages = mysqlTable("vehicle_images", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  
  imageUrl: text("imageUrl").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  imageType: mysqlEnum("imageType", [
    "front", "back", "left", "right", 
    "interior_front", "interior_back", 
    "dashboard", "trunk", "other"
  ]).default("other").notNull(),
  
  sortOrder: int("sortOrder").default(0).notNull(),
  isMain: boolean("isMain").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VehicleImage = typeof vehicleImages.$inferSelect;
export type InsertVehicleImage = typeof vehicleImages.$inferInsert;

// ============================================
// VEHICLE DOCUMENTS
// ============================================

export const vehicleDocuments = mysqlTable("vehicle_documents", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  
  documentType: mysqlEnum("documentType", [
    "crlv", 
    "insurance", 
    "inspection_report", 
    "ownership_proof",
    "maintenance_history"
  ]).notNull(),
  
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VehicleDocument = typeof vehicleDocuments.$inferSelect;
export type InsertVehicleDocument = typeof vehicleDocuments.$inferInsert;

// ============================================
// BOOKINGS / RESERVATIONS
// ============================================

export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  
  vehicleId: int("vehicleId").notNull(),
  renterId: int("renterId").notNull(),
  hostId: int("hostId").notNull(),
  
  // Dates
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  
  // Pickup/Return
  pickupLocation: text("pickupLocation").notNull(),
  returnLocation: text("returnLocation"),
  actualPickupTime: timestamp("actualPickupTime"),
  actualReturnTime: timestamp("actualReturnTime"),
  
  // Mileage
  startMileage: int("startMileage"),
  endMileage: int("endMileage"),
  dailyKmLimit: int("dailyKmLimit").notNull(),
  extraKmPrice: decimal("extraKmPrice", { precision: 10, scale: 2 }).notNull(),
  
  // Pricing
  dailyRate: decimal("dailyRate", { precision: 10, scale: 2 }).notNull(),
  totalDays: int("totalDays").notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).default("0.00").notNull(),
  serviceFee: decimal("serviceFee", { precision: 10, scale: 2 }).notNull(), // Platform fee
  insuranceFee: decimal("insuranceFee", { precision: 10, scale: 2 }).notNull(),
  securityDeposit: decimal("securityDeposit", { precision: 10, scale: 2 }).notNull(),
  // Garantia Reembolsável — campos detalhados
  guaranteeMultiplier: decimal("guaranteeMultiplier", { precision: 4, scale: 2 }).default("2.00").notNull(),
  guaranteeCalculated: decimal("guaranteeCalculated", { precision: 10, scale: 2 }).default("0.00").notNull(),
  guaranteeAdjusted: decimal("guaranteeAdjusted", { precision: 10, scale: 2 }).default("0.00").notNull(),
  guaranteeRetainedAt: timestamp("guaranteeRetainedAt"),
  guaranteeReleaseStatus: mysqlEnum("guaranteeReleaseStatus", ["held", "pending_release", "released", "forfeited"]).default("held").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  
  // Extras charged after trip
  extraKmCharge: decimal("extraKmCharge", { precision: 10, scale: 2 }).default("0.00").notNull(),
  lateReturnCharge: decimal("lateReturnCharge", { precision: 10, scale: 2 }).default("0.00").notNull(),
  cleaningCharge: decimal("cleaningCharge", { precision: 10, scale: 2 }).default("0.00").notNull(),
  damageCharge: decimal("damageCharge", { precision: 10, scale: 2 }).default("0.00").notNull(),
  fuelCharge: decimal("fuelCharge", { precision: 10, scale: 2 }).default("0.00").notNull(),
  
  // Renter personal data (collected at booking time)
  renterFullName: varchar("renterFullName", { length: 200 }),
  renterCpf: varchar("renterCpf", { length: 14 }),
  renterEmail: varchar("renterEmail", { length: 200 }),
  renterPhone: varchar("renterPhone", { length: 20 }),

  // Renter address (collected at booking time)
  renterAddressZipCode: varchar("renterAddressZipCode", { length: 10 }),
  renterAddressStreet: text("renterAddressStreet"),
  renterAddressNumber: varchar("renterAddressNumber", { length: 20 }),
  renterAddressComplement: text("renterAddressComplement"),
  renterAddressNeighborhood: text("renterAddressNeighborhood"),
  renterAddressCity: varchar("renterAddressCity", { length: 100 }),
  renterAddressState: varchar("renterAddressState", { length: 2 }),

  // Contract OTP verification
  contractOtpCode: varchar("contractOtpCode", { length: 20 }),
  contractOtpExpiresAt: timestamp("contractOtpExpiresAt"),
  contractOtpChannel: mysqlEnum("contractOtpChannel", ["sms", "email"]),
  contractOtpVerifiedAt: timestamp("contractOtpVerifiedAt"),
  contractOtpAttempts: int("contractOtpAttempts").default(0).notNull(),

  // Status
  status: mysqlEnum("status", [
    "pending_payment",
    "payment_failed",
    "pending",
    "awaiting_verification",
    "pending_host_approval",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled_by_renter",
    "cancelled_by_host",
    "disputed",
    "rejected_verification"
  ]).default("pending_payment").notNull(),

  // Verification status (separate from booking status)
  verificationStatus: mysqlEnum("verificationStatus", [
    "not_required",
    "pending_submission",
    "pending_review",
    "approved",
    "rejected"
  ]).default("pending_submission").notNull(),
  
  // Cancellation
  cancelledAt: timestamp("cancelledAt"),
  cancellationReason: text("cancellationReason"),
  refundAmount: decimal("refundAmount", { precision: 10, scale: 2 }),
  
  // Notes
  renterNotes: text("renterNotes"),
  hostNotes: text("hostNotes"),
  
  // Contract Signature — Locatário
  contractAccepted: boolean("contractAccepted").default(false).notNull(),
  contractAcceptedAt: timestamp("contractAcceptedAt"),
  contractAcceptedIp: varchar("contractAcceptedIp", { length: 45 }),
  contractAcceptedUserAgent: text("contractAcceptedUserAgent"), // Browser/device info
  contractVersion: varchar("contractVersion", { length: 20 }).default("1.0").notNull(),
  contractPdfUrl: text("contractPdfUrl"), // S3 URL to generated PDF contract

  // Contract Signature — Anfitrião
  hostContractAccepted: boolean("hostContractAccepted").default(false).notNull(),
  hostContractAcceptedAt: timestamp("hostContractAcceptedAt"),
  hostContractAcceptedIp: varchar("hostContractAcceptedIp", { length: 45 }),
  hostContractAcceptedUserAgent: text("hostContractAcceptedUserAgent"), // Browser/device info
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Busca de reservas pelo locatário (getBookingsByRenterId)
  renterIdIdx: index("bookings_renterId_idx").on(table.renterId),
  // Busca de reservas pelo anfitrião (getBookingsByHostId)
  hostIdIdx: index("bookings_hostId_idx").on(table.hostId),
  // Verificação de conflito de datas (checkBookingConflict)
  vehicleDatesIdx: index("bookings_vehicleId_dates_idx").on(table.vehicleId, table.startDate, table.endDate),
  // Filtro por status (getBookingsByStatus)
  statusIdx: index("bookings_status_idx").on(table.status),
}));

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ============================================
// BOOKING PHOTOS (Check-in/Check-out)
// ============================================

export const bookingPhotos = mysqlTable("booking_photos", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  
  photoType: mysqlEnum("photoType", [
    "checkin_exterior",
    "checkin_interior",
    "checkin_odometer",
    "checkin_fuel",
    "checkin_damage",
    "checkout_exterior",
    "checkout_interior",
    "checkout_odometer",
    "checkout_fuel",
    "checkout_damage"
  ]).notNull(),
  
  imageUrl: text("imageUrl").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  notes: text("notes"),
  
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BookingPhoto = typeof bookingPhotos.$inferSelect;
export type InsertBookingPhoto = typeof bookingPhotos.$inferInsert;

// ============================================
// PAYMENTS
// ============================================

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(),
  
  paymentType: mysqlEnum("paymentType", [
    "booking_payment",
    "security_deposit",
    "extra_charges",
    "fine",
    "refund",
    "host_payout"
  ]).notNull(),
  
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  
  // Payment Method
  paymentMethod: mysqlEnum("paymentMethod", ["credit_card", "debit_card", "pix", "bank_transfer"]).notNull(),
  
  // Gateway Info
  pixTransactionId: varchar("pixTransactionId", { length: 255 }),
  // Mercado Pago
  mpPaymentId: varchar("mpPaymentId", { length: 255 }),
  mpExternalReference: varchar("mpExternalReference", { length: 255 }),
  mpPixQrCode: text("mpPixQrCode"),
  mpPixQrCodeBase64: text("mpPixQrCodeBase64"),
  
  status: mysqlEnum("status", [
    "pending",
    "processing",
    "completed",
    "failed",
    "refunded",
    "partially_refunded"
  ]).default("pending").notNull(),
  
  failureReason: text("failureReason"),
  
  // For payouts to hosts
  hostPayoutAmount: decimal("hostPayoutAmount", { precision: 12, scale: 2 }),
  platformFeeAmount: decimal("platformFeeAmount", { precision: 10, scale: 2 }),
  
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Busca de pagamentos por usuário (getPaymentsByUserId)
  userIdIdx: index("payments_userId_idx").on(table.userId),
  // Busca de pagamentos por reserva (getPaymentsByBookingId)
  bookingIdIdx: index("payments_bookingId_idx").on(table.bookingId),
}));

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ============================================
// PAYMENT METHODS (Saved Cards)
// ============================================

export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  methodType: mysqlEnum("methodType", ["credit_card", "debit_card", "pix"]).notNull(),
  
  // Card Info (masked)
  cardBrand: varchar("cardBrand", { length: 20 }),
  cardLast4: varchar("cardLast4", { length: 4 }),
  cardExpMonth: int("cardExpMonth"),
  cardExpYear: int("cardExpYear"),
  cardHolderName: varchar("cardHolderName", { length: 255 }),
  
  isDefault: boolean("isDefault").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

// ============================================
// FINES / PENALTIES
// ============================================

export const fines = mysqlTable("fines", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(), // Who is being fined
  issuedBy: int("issuedBy"), // Admin or system
  
  fineType: mysqlEnum("fineType", [
    "late_return",
    "extra_km",
    "damage",
    "cleaning",
    "traffic_violation",
    "fuel_not_refilled",
    "smoking",
    "pet_damage",
    "other"
  ]).notNull(),
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  
  // Evidence
  evidenceUrls: json("evidenceUrls"), // Array of image URLs
  
  status: mysqlEnum("status", [
    "pending",
    "accepted",
    "disputed",
    "paid",
    "waived",
    "sent_to_collection"
  ]).default("pending").notNull(),
  
  // Dispute
  disputeReason: text("disputeReason"),
  disputeResolvedAt: timestamp("disputeResolvedAt"),
  disputeResolution: text("disputeResolution"),
  
  // Payment
  paymentId: int("paymentId"),
  paidAt: timestamp("paidAt"),
  
  dueDate: timestamp("dueDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Fine = typeof fines.$inferSelect;
export type InsertFine = typeof fines.$inferInsert;

// ============================================
// REVIEWS
// ============================================

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  
  reviewerId: int("reviewerId").notNull(),
  revieweeId: int("revieweeId"), // For user reviews
  vehicleId: int("vehicleId"), // For vehicle reviews
  
  reviewType: mysqlEnum("reviewType", ["renter_to_host", "host_to_renter", "renter_to_vehicle"]).notNull(),
  
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  
  // Specific ratings
  cleanlinessRating: int("cleanlinessRating"),
  communicationRating: int("communicationRating"),
  accuracyRating: int("accuracyRating"),
  valueRating: int("valueRating"),
  
  isPublic: boolean("isPublic").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Busca de avaliações por veículo (getReviewsByVehicleId)
  vehicleIdIdx: index("reviews_vehicleId_idx").on(table.vehicleId),
  // Busca de avaliações públicas (getPublicReviews)
  isPublicIdx: index("reviews_isPublic_idx").on(table.isPublic),
}));

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ============================================
// MESSAGES / CHAT
// ============================================

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId"),
  
  participant1Id: int("participant1Id").notNull(),
  participant2Id: int("participant2Id").notNull(),
  
  lastMessageAt: timestamp("lastMessageAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Busca de conversas por participante (getConversationsByUserId, getUnreadMessageCount)
  participant1Idx: index("conversations_participant1Id_idx").on(table.participant1Id),
  participant2Idx: index("conversations_participant2Id_idx").on(table.participant2Id),
}));

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  
  content: text("content").notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "system"]).default("text").notNull(),
  
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  // Busca de mensagens por conversa (getMessages, getUnreadMessageCount)
  conversationIdIdx: index("messages_conversationId_idx").on(table.conversationId),
  // Filtro de mensagens não lidas por conversa (markMessagesAsRead)
  conversationReadIdx: index("messages_conversationId_isRead_idx").on(table.conversationId, table.isRead),
}));

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ============================================
// FAVORITES
// ============================================

export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  vehicleId: int("vehicleId").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  
  // Contexto operacional da notificação — separa notificações por modo
  // renter: notificações de locatário | host: notificações de anfitrião | system: ambos
  contextMode: mysqlEnum("contextMode", ["renter", "host", "system"]).default("system").notNull(),

  notificationType: mysqlEnum("notificationType", [
    "booking_request",
    "booking_confirmed",
    "booking_cancelled",
    "payment_received",
    "payment_failed",
    "review_received",
    "message_received",
    "document_approved",
    "document_rejected",
    "fine_issued",
    "system"
  ]).notNull(),
  
  relatedId: int("relatedId"), // bookingId, paymentId, etc.
  relatedType: varchar("relatedType", { length: 50 }),
  
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============================================
// VEHICLE AVAILABILITY
// ============================================

export const vehicleAvailability = mysqlTable("vehicle_availability", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  
  date: timestamp("date").notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  
  // Custom pricing for specific dates
  customDailyPrice: decimal("customDailyPrice", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VehicleAvailability = typeof vehicleAvailability.$inferSelect;
export type InsertVehicleAvailability = typeof vehicleAvailability.$inferInsert;

// ============================================
// PROMO CODES
// ============================================

export const promoCodes = mysqlTable("promo_codes", {
  id: int("id").autoincrement().primaryKey(),
  
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  maxDiscount: decimal("maxDiscount", { precision: 10, scale: 2 }),
  
  minBookingAmount: decimal("minBookingAmount", { precision: 10, scale: 2 }),
  
  usageLimit: int("usageLimit"),
  usageCount: int("usageCount").default(0).notNull(),
  
  validFrom: timestamp("validFrom").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  
  isActive: boolean("isActive").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

// ============================================
// USER VERIFICATION (FASE 1A: Turo Brasileiro)
// ============================================

/**
 * Tracks user identity verification status.
 * Verification is mandatory only at booking time (just-in-time).
 * Manual admin review with max 3 attempts before permanent block.
 */
export const userVerifications = mysqlTable("user_verifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // Status: pending = waiting for admin review, submitted = docs uploaded, approved = verified, rejected = denied, blocked = max attempts exceeded
  status: mysqlEnum("status", ["pending", "submitted", "approved", "rejected", "blocked"]).default("pending").notNull(),
  
  // Document submission flags
  cpfSubmitted: boolean("cpfSubmitted").default(false).notNull(),
  cnhSubmitted: boolean("cnhSubmitted").default(false).notNull(),
  incomeProofSubmitted: boolean("incomeProofSubmitted").default(false).notNull(),
  
  // Attempt tracking (max 3 before block)
  attemptCount: int("attemptCount").default(0).notNull(),
  lastAttemptAt: timestamp("lastAttemptAt"),
  
  // Admin review
  reviewedBy: int("reviewedBy"), // Admin user ID
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  
  // Lifecycle timestamps
  submittedAt: timestamp("submittedAt"),
  approvedAt: timestamp("approvedAt"),
  rejectedAt: timestamp("rejectedAt"),
  blockedAt: timestamp("blockedAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserVerification = typeof userVerifications.$inferSelect;
export type InsertUserVerification = typeof userVerifications.$inferInsert;

/**
 * Stores encrypted URLs for verification documents.
 * Documents: CPF, CNH, income proof (comprovante de renda)
 * URLs are encrypted at rest using AES-256.
 */
export const verificationDocuments = mysqlTable("verification_documents", {
  id: int("id").autoincrement().primaryKey(),
  verificationId: int("verificationId").notNull(),
  
  // Document type
  documentType: mysqlEnum("documentType", ["cpf", "cnh", "income_proof"]).notNull(),
  
  // Encrypted URL (AES-256 encrypted)
  encryptedUrl: text("encryptedUrl").notNull(),
  
  // Original filename for reference
  filename: varchar("filename", { length: 255 }),
  
  // MIME type (image/jpeg, application/pdf, etc)
  mimeType: varchar("mimeType", { length: 100 }),
  
  // File size in bytes
  fileSize: int("fileSize"),
  
  // Cloudinary public ID for easy deletion/management
  cloudinaryPublicId: varchar("cloudinaryPublicId", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VerificationDocument = typeof verificationDocuments.$inferSelect;
export type InsertVerificationDocument = typeof verificationDocuments.$inferInsert;

// ============================================
// VEHICLE VERIFICATION
// ============================================

/**
 * Vehicle document verification and approval workflow.
 * Tracks CRLV, insurance, and ownership validation.
 */
export const vehicleVerifications = mysqlTable("vehicle_verifications", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull().unique(),
  
  // Overall status
  status: mysqlEnum("status", ["pending", "approved", "rejected", "blocked"]).default("pending").notNull(),
  
  // Document validation
  crlvStatus: mysqlEnum("crlvStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  insuranceStatus: mysqlEnum("insuranceStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  ownershipMatchStatus: mysqlEnum("ownershipMatchStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  
  // Admin review
  reviewedBy: int("reviewedBy"), // Admin user ID
  reviewedAt: timestamp("reviewedAt"),
  adminNotes: text("adminNotes"),
  rejectionReason: text("rejectionReason"),
  
  // Extracted data for comparison
  crlvOwnerName: text("crlvOwnerName"),
  crlvPlate: varchar("crlvPlate", { length: 10 }),
  insuranceProvider: varchar("insuranceProvider", { length: 100 }),
  insuranceExpiryDate: timestamp("insuranceExpiryDate"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VehicleVerification = typeof vehicleVerifications.$inferSelect;
export type InsertVehicleVerification = typeof vehicleVerifications.$inferInsert;

// ============================================
// BOOKING IDENTITY VERIFICATIONS
// Post-payment identity check: CNH + selfie
// ============================================
export const bookingVerifications = mysqlTable("booking_verifications", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(),
  renterId: int("renterId").notNull(),

  // Document images stored in S3
  cnhImageUrl: text("cnhImageUrl"),
  selfieImageUrl: text("selfieImageUrl"),

  // Review
  status: mysqlEnum("status", [
    "pending_review",
    "approved",
    "rejected"
  ]).default("pending_review").notNull(),

  rejectionReason: text("rejectionReason"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),

  // Resubmission tracking
  submissionCount: int("submissionCount").default(1).notNull(),
  lastSubmittedAt: timestamp("lastSubmittedAt").defaultNow().notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BookingVerification = typeof bookingVerifications.$inferSelect;
export type InsertBookingVerification = typeof bookingVerifications.$inferInsert;


// ============================================
// RECEIPTS (for payments and cancellations)
// ============================================
/**
 * Receipts for payments and cancellations.
 * Stores receipt data for display and PDF generation.
 */
export const receipts = mysqlTable("receipts", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(), // Recipient (renter or host)
  
  // Receipt type
  type: mysqlEnum("type", ["payment", "cancellation"]).notNull(),
  
  // Financial details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  
  // For cancellations: refund info
  refundAmount: decimal("refundAmount", { precision: 10, scale: 2 }),
  refundReason: text("refundReason"),
  
  // Receipt content
  receiptNumber: varchar("receiptNumber", { length: 50 }).unique().notNull(),
  description: text("description").notNull(),
  
  // Additional data (JSON for flexibility: items, taxes, etc)
  data: json("data"),
  
  // PDF receipt
  pdfUrl: varchar("pdfUrl", { length: 2048 }),
  
  // Email tracking
  emailSentAt: timestamp("emailSentAt"),
  emailRetries: int("emailRetries").default(0).notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = typeof receipts.$inferInsert;

// ============================================
// EMAIL LOGS (for tracking sent emails)
// ============================================
/**
 * Email log for tracking sent emails.
 * Useful for debugging and resend functionality.
 */
export const emailLogs = mysqlTable("email_logs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Recipient
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  
  // Email content
  subject: varchar("subject", { length: 255 }).notNull(),
  template: varchar("template", { length: 100 }).notNull(), // "receipt", "notification", "verification"
  
  // Related entity
  relatedEntityType: varchar("relatedEntityType", { length: 50 }), // "booking", "receipt", "notification"
  relatedEntityId: int("relatedEntityId"),
  
  // Status
  status: mysqlEnum("status", ["sent", "failed", "bounced"]).default("sent").notNull(),
  errorMessage: text("errorMessage"),
  
  // Retry tracking
  retryCount: int("retryCount").default(0).notNull(),
  lastRetryAt: timestamp("lastRetryAt"),
  
  // Timestamps
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});
export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

// ============================================
// SECURITY AUDIT LOGS (ETAPA 10)
// ============================================
/**
 * Security audit log for tracking all security-relevant events.
 *
 * Event types:
 * - UNAUTHORIZED    : Request to a protected endpoint without a valid session
 * - FORBIDDEN       : Authenticated user attempted to access another user's resource (IDOR attempt)
 * - UPLOAD_REJECTED : File upload rejected by magic bytes / MIME / size validation
 * - RATE_LIMITED    : Request blocked by a rate limiter
 * - INVALID_INPUT   : Zod validation failure on a sensitive procedure (e.g., payment, booking)
 * - ADMIN_ACTION    : Admin performed a privileged action (approve/reject/delete)
 * - AUTH_FAILURE    : Login attempt with wrong credentials
 *
 * Retention: logs are kept indefinitely by default.
 * For LGPD compliance, implement a scheduled cleanup job for logs older than 90 days.
 */
export const securityAuditLogs = mysqlTable(
  "security_audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),

    // Event classification
    eventType: mysqlEnum("eventType", [
      "UNAUTHORIZED",
      "FORBIDDEN",
      "UPLOAD_REJECTED",
      "RATE_LIMITED",
      "INVALID_INPUT",
      "ADMIN_ACTION",
      "AUTH_FAILURE",
    ]).notNull(),

    // Severity level
    severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),

    // Who triggered the event (null for unauthenticated requests)
    userId: int("userId"),

    // Where the event occurred
    endpoint: varchar("endpoint", { length: 255 }).notNull(),
    method: varchar("method", { length: 10 }),

    // Network info
    ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
    userAgent: varchar("userAgent", { length: 512 }),

    // Event details (structured JSON for flexibility)
    details: json("details"),

    // HTTP response code that was returned
    statusCode: int("statusCode"),

    // Timestamp
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_sal_eventType").on(table.eventType),
    index("idx_sal_userId").on(table.userId),
    index("idx_sal_ipAddress").on(table.ipAddress),
    index("idx_sal_createdAt").on(table.createdAt),
    index("idx_sal_severity").on(table.severity),
  ]
);

export type SecurityAuditLog = typeof securityAuditLogs.$inferSelect;
export type InsertSecurityAuditLog = typeof securityAuditLogs.$inferInsert;

// ============================================
// OTP LOGS — Histórico de envios e verificações
// ============================================

/**
 * Registra cada evento de OTP (envio e verificação) para SMS e e-mail.
 * Mantém histórico completo para auditoria e suporte.
 */
export const otpLogs = mysqlTable(
  "otp_logs",
  {
    id: int("id").autoincrement().primaryKey(),

    // Referência à reserva relacionada
    bookingId: int("bookingId").notNull(),

    // Canal usado: 'sms' ou 'email'
    channel: mysqlEnum("channel", ["sms", "email"]).notNull(),

    // Tipo de evento: 'sent' (código enviado) ou 'verified' (código verificado com sucesso) ou 'failed' (verificação falhou)
    event: mysqlEnum("event", ["sent", "verified", "failed"]).notNull(),

    // Destinatário (número de telefone ou endereço de e-mail, mascarado para privacidade)
    recipient: varchar("recipient", { length: 320 }),

    // Código OTP enviado (armazenado apenas para canal 'email'; para SMS via Twilio Verify, fica null)
    otpCode: varchar("otpCode", { length: 20 }),

    // Status retornado pelo provedor (ex: 'pending', 'approved', 'canceled', 'failed')
    providerStatus: varchar("providerStatus", { length: 50 }),

    // ID da verificação no provedor (Twilio Verify SID ou Resend message ID)
    providerRef: varchar("providerRef", { length: 128 }),

    // IP do cliente no momento do evento
    ipAddress: varchar("ipAddress", { length: 45 }),

    // User-Agent do cliente
    userAgent: varchar("userAgent", { length: 512 }),

    // Mensagem de erro, se houver
    errorMessage: text("errorMessage"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_otp_logs_bookingId").on(table.bookingId),
    index("idx_otp_logs_channel").on(table.channel),
    index("idx_otp_logs_event").on(table.event),
    index("idx_otp_logs_createdAt").on(table.createdAt),
  ]
);

export type OtpLog = typeof otpLogs.$inferSelect;
export type InsertOtpLog = typeof otpLogs.$inferInsert;

// ============================================
// CHAT HÍBRIDO IA + ANFITRIÃO
// ============================================

/**
 * Sessões de chat entre locatário e veículo/anfitrião.
 * mode="vehicle": chat pré-locação sobre um veículo específico.
 * mode="support": suporte geral da plataforma RIDDY.
 */
export const vehicleChats = mysqlTable("vehicle_chats", {
  id: int("id").autoincrement().primaryKey(),
  // Para mode="vehicle": ID do veículo em questão
  vehicleId: int("vehicleId"),
  // Usuário que iniciou o chat (locatário ou visitante autenticado)
  renterId: int("renterId").notNull(),
  // Anfitrião do veículo (null para suporte geral)
  hostId: int("hostId"),
  // Tipo do chat
  mode: mysqlEnum("mode", ["vehicle", "support"]).default("vehicle").notNull(),
  // Status do chat
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  // Quantas mensagens aguardam resposta do anfitrião
  pendingHostReply: int("pendingHostReply").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_vehicle_chats_vehicleId").on(table.vehicleId),
  index("idx_vehicle_chats_renterId").on(table.renterId),
  index("idx_vehicle_chats_hostId").on(table.hostId),
  index("idx_vehicle_chats_mode").on(table.mode),
]);
export type VehicleChat = typeof vehicleChats.$inferSelect;
export type InsertVehicleChat = typeof vehicleChats.$inferInsert;

/**
 * Mensagens individuais de um chat.
 * senderType="user": enviada pelo locatário.
 * senderType="ai": resposta automática da IA (GPT-4o).
 * senderType="host": resposta manual do anfitrião.
 * senderType="system": mensagem de sistema (ex: "Chat encerrado").
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  chatId: int("chatId").notNull(),
  // ID do usuário que enviou (null para IA e sistema)
  senderId: int("senderId"),
  // Tipo do remetente
  senderType: mysqlEnum("senderType", ["user", "ai", "host", "system"]).notNull(),
  // Conteúdo da mensagem
  content: text("content").notNull(),
  // Se true, a IA não teve certeza e escalou para o anfitrião
  needsHostReview: boolean("needsHostReview").default(false).notNull(),
  // Se true, o anfitrião já leu esta mensagem
  readByHost: boolean("readByHost").default(false).notNull(),
  // Se true, o locatário já leu esta mensagem
  readByRenter: boolean("readByRenter").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_chat_messages_chatId").on(table.chatId),
  index("idx_chat_messages_senderId").on(table.senderId),
  index("idx_chat_messages_createdAt").on(table.createdAt),
]);
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// ─── Riddy Care — Sistema de Suporte ─────────────────────────────────────────

/**
 * Tickets de suporte criados por locatários ou anfitriões.
 * Cada ticket tem categoria, prioridade, status e pode estar vinculado
 * a um veículo e/ou reserva específica.
 */
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  ticketNumber: int("ticketNumber").notNull(),
  userId: int("userId").notNull(),
  vehicleId: int("vehicleId"),
  bookingId: int("bookingId"),
  hostId: int("hostId"),
  category: mysqlEnum("category", [
    "reserva",
    "pagamento",
    "documentos",
    "caucao",
    "checkin",
    "checkout",
    "problema_veiculo",
    "cancelamento",
    "reembolso",
    "emergencia",
    "outro",
  ]).notNull(),
  priority: mysqlEnum("priority", ["P0", "P1", "P2", "P3", "P4"]).default("P4").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "waiting_user", "resolved", "closed"]).default("open").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  escalatedToHuman: boolean("escalatedToHuman").default(false).notNull(),
  assignedTo: int("assignedTo"),
  source: mysqlEnum("source", ["ai_chat", "user_manual", "system_auto"]).default("user_manual").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, (table) => [
  index("idx_support_tickets_userId").on(table.userId),
  index("idx_support_tickets_vehicleId").on(table.vehicleId),
  index("idx_support_tickets_bookingId").on(table.bookingId),
  index("idx_support_tickets_hostId").on(table.hostId),
  index("idx_support_tickets_status").on(table.status),
  index("idx_support_tickets_priority").on(table.priority),
  index("idx_support_tickets_category").on(table.category),
  index("idx_support_tickets_createdAt").on(table.createdAt),
]);
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * Mensagens dentro de um ticket de suporte.
 */
export const ticketMessages = mysqlTable("ticket_messages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  senderId: int("senderId"),
  senderType: mysqlEnum("senderType", ["user", "ai", "agent", "system"]).notNull(),
  content: text("content").notNull(),
  isInternal: boolean("isInternal").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readByUser: boolean("readByUser").default(false).notNull(),
  readByAgent: boolean("readByAgent").default(false).notNull(),
}, (table) => [
  index("idx_ticket_messages_ticketId").on(table.ticketId),
  index("idx_ticket_messages_senderId").on(table.senderId),
  index("idx_ticket_messages_createdAt").on(table.createdAt),
]);
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = typeof ticketMessages.$inferInsert;

/**
 * Anexos de tickets (fotos, documentos, prints).
 */
export const ticketAttachments = mysqlTable("ticket_attachments", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  messageId: int("messageId"),
  uploadedBy: int("uploadedBy").notNull(),
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSizeBytes: int("fileSizeBytes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_ticket_attachments_ticketId").on(table.ticketId),
  index("idx_ticket_attachments_messageId").on(table.messageId),
]);
export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type InsertTicketAttachment = typeof ticketAttachments.$inferInsert;

/**
 * Sequência de números de ticket (para gerar #1001, #1002, etc.)
 */
export const ticketSequence = mysqlTable("ticket_sequence", {
  id: int("id").autoincrement().primaryKey(),
  lastNumber: int("lastNumber").default(1000).notNull(),
});


// ============================================
// SISTEMA DE NÍVEIS, CONQUISTAS E METAS
// ============================================

/**
 * Nível atual do usuário (locatário ou anfitrião).
 * Recalculado automaticamente após cada locação concluída.
 */
export const userLevels = mysqlTable("user_levels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),

  // Nível como locatário (1=Explorador … 5=Lenda RIDDY)
  renterLevel: int("renterLevel").default(1).notNull(),
  renterTotalRentals: int("renterTotalRentals").default(0).notNull(),
  renterTotalKm: int("renterTotalKm").default(0).notNull(),
  renterAvgRating: decimal("renterAvgRating", { precision: 3, scale: 2 }),
  renterLevelUpdatedAt: timestamp("renterLevelUpdatedAt"),
  // Score Riddy do locatário (0-1000)
  renterScore: int("renterScore").default(0).notNull(),
  renterScoreUpdatedAt: timestamp("renterScoreUpdatedAt"),
  // Métricas negativas do locatário
  renterCancellations: int("renterCancellations").default(0).notNull(),
  renterLateReturns: int("renterLateReturns").default(0).notNull(),
  renterDisputes: int("renterDisputes").default(0).notNull(),
  renterReports: int("renterReports").default(0).notNull(),
  // Ranking do locatário
  renterRankCity: int("renterRankCity"),
  renterRankState: int("renterRankState"),
  renterRankNational: int("renterRankNational"),

  // Nível como anfitrião (1=Iniciante … 5=Host Lendário)
  hostLevel: int("hostLevel").default(1).notNull(),
  hostTotalRentals: int("hostTotalRentals").default(0).notNull(),
  hostTotalEarnings: decimal("hostTotalEarnings", { precision: 12, scale: 2 }).default("0").notNull(),
  hostAvgRating: decimal("hostAvgRating", { precision: 3, scale: 2 }),
  hostAvgResponseHours: decimal("hostAvgResponseHours", { precision: 6, scale: 2 }),
  hostCancellationRate: decimal("hostCancellationRate", { precision: 5, scale: 4 }).default("0").notNull(),
  hostLevelUpdatedAt: timestamp("hostLevelUpdatedAt"),
  // Score Riddy do anfitrião (0-1000)
  hostScore: int("hostScore").default(0).notNull(),
  hostScoreUpdatedAt: timestamp("hostScoreUpdatedAt"),
  // Métricas negativas do anfitrião
  hostCancellations: int("hostCancellations").default(0).notNull(),
  hostComplaints: int("hostComplaints").default(0).notNull(),
  hostReports: int("hostReports").default(0).notNull(),
  // Ranking do anfitrião
  hostRankCity: int("hostRankCity"),
  hostRankState: int("hostRankState"),
  hostRankNational: int("hostRankNational"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("idx_user_levels_userId").on(table.userId),
  index("idx_user_levels_renter_score").on(table.renterScore),
  index("idx_user_levels_host_score").on(table.hostScore),
]);
export type UserLevel = typeof userLevels.$inferSelect;
export type InsertUserLevel = typeof userLevels.$inferInsert;

/**
 * Conquistas desbloqueadas pelo usuário.
 * Cada conquista é única por usuário (chave composta userId + achievementKey).
 */
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementKey: varchar("achievementKey", { length: 64 }).notNull(),
  // Contexto: renter | host
  context: mysqlEnum("context", ["renter", "host"]).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  // Rastreia se o cartão compartilhável foi gerado/baixado
  sharedAt: timestamp("sharedAt"),
  shareCount: int("shareCount").default(0).notNull(),
}, (table) => [
  index("idx_user_achievements_userId").on(table.userId),
  index("idx_user_achievements_key").on(table.achievementKey),
]);
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

/**
 * Metas da plataforma — visíveis apenas para o Admin.
 * Cada meta tem um tipo, valor alvo, valor atual e período.
 */
export const platformGoals = mysqlTable("platform_goals", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description"),
  // Tipo de métrica
  metricType: mysqlEnum("metricType", [
    "total_rentals",
    "total_revenue",
    "new_users",
    "new_hosts",
    "active_vehicles",
    "avg_rating",
    "cities_covered",
    "custom"
  ]).notNull(),
  targetValue: decimal("targetValue", { precision: 14, scale: 2 }).notNull(),
  currentValue: decimal("currentValue", { precision: 14, scale: 2 }).default("0").notNull(),
  unit: varchar("unit", { length: 32 }), // ex: "locações", "R$", "usuários"
  // Período da meta
  periodType: mysqlEnum("periodType", ["weekly", "monthly", "quarterly", "yearly", "custom"]).notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  // Status
  status: mysqlEnum("status", ["active", "completed", "failed", "paused"]).default("active").notNull(),
  // Cor do badge visual (hex)
  color: varchar("color", { length: 7 }).default("#00D4FF").notNull(),
  // Ícone (nome do ícone lucide)
  icon: varchar("icon", { length: 64 }).default("Target").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("idx_platform_goals_status").on(table.status),
  index("idx_platform_goals_period").on(table.startsAt, table.endsAt),
]);
export type PlatformGoal = typeof platformGoals.$inferSelect;
export type InsertPlatformGoal = typeof platformGoals.$inferInsert;
