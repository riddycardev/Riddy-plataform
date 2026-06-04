"""
Script para adicionar índices secundários ao schema Drizzle (ETAPA 6 da auditoria).
Execute com: python3 scripts/add_indexes.py
"""
import sys

content = open('drizzle/schema.ts').read()
original = content

# ─────────────────────────────────────────────────────────────────
# 1. Adicionar 'index' e 'uniqueIndex' ao import do drizzle-orm/mysql-core
# ─────────────────────────────────────────────────────────────────
old_import = (
    'import { \n'
    '  int, \n'
    '  mysqlEnum, \n'
    '  mysqlTable, \n'
    '  text, \n'
    '  timestamp, \n'
    '  varchar, \n'
    '  decimal, \n'
    '  boolean, \n'
    '  json \n'
    '} from "drizzle-orm/mysql-core";'
)
new_import = (
    'import { \n'
    '  int, \n'
    '  mysqlEnum, \n'
    '  mysqlTable, \n'
    '  text, \n'
    '  timestamp, \n'
    '  varchar, \n'
    '  decimal, \n'
    '  boolean, \n'
    '  json,\n'
    '  index\n'
    '} from "drizzle-orm/mysql-core";'
)
assert old_import in content, "FAIL: import block not found"
content = content.replace(old_import, new_import, 1)
print("✓ Import updated")

# ─────────────────────────────────────────────────────────────────
# 2. userDocuments — índice em userId
# ─────────────────────────────────────────────────────────────────
old = (
    '  expiresAt: timestamp("expiresAt"),\n'
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n'
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n'
    '});\n'
    '\n'
    'export type UserDocument = typeof userDocuments.$inferSelect;'
)
new = (
    '  expiresAt: timestamp("expiresAt"),\n'
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n'
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n'
    '}, (table) => ({\n'
    '  // Busca de documentos por usuário (getDocumentsByUserId)\n'
    '  userIdIdx: index("user_documents_userId_idx").on(table.userId),\n'
    '}));\n'
    '\n'
    'export type UserDocument = typeof userDocuments.$inferSelect;'
)
assert old in content, "FAIL: userDocuments close not found"
content = content.replace(old, new, 1)
print("✓ userDocuments index added")

# ─────────────────────────────────────────────────────────────────
# 3. vehicles — índices em hostId, status+city, vehicleType
# ─────────────────────────────────────────────────────────────────
old = (
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n'
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n'
    '});\n'
    '\n'
    'export type Vehicle = typeof vehicles.$inferSelect;\n'
    'export type InsertVehicle = typeof vehicles.$inferInsert;'
)
new = (
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n'
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n'
    '}, (table) => ({\n'
    '  // Busca de veículos por proprietário (getVehiclesByHostId)\n'
    '  hostIdIdx: index("vehicles_hostId_idx").on(table.hostId),\n'
    '  // Busca de veículos ativos por cidade (searchVehicles, getVehiclesGroupedByCity)\n'
    '  statusCityIdx: index("vehicles_status_city_idx").on(table.status, table.pickupCity),\n'
    '  // Filtro por tipo de veículo (car/motorcycle)\n'
    '  vehicleTypeIdx: index("vehicles_vehicleType_idx").on(table.vehicleType),\n'
    '}));\n'
    '\n'
    'export type Vehicle = typeof vehicles.$inferSelect;\n'
    'export type InsertVehicle = typeof vehicles.$inferInsert;'
)
assert old in content, "FAIL: vehicles close not found"
content = content.replace(old, new, 1)
print("✓ vehicles indexes added")

# ─────────────────────────────────────────────────────────────────
# 4. bookings — índices em renterId, hostId, vehicleId+dates, status
# ─────────────────────────────────────────────────────────────────
old = (
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n'
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n'
    '});\n'
    '\n'
    'export type Booking = typeof bookings.$inferSelect;\n'
    'export type InsertBooking = typeof bookings.$inferInsert;'
)
new = (
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n'
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n'
    '}, (table) => ({\n'
    '  // Busca de reservas pelo locatário (getBookingsByRenterId)\n'
    '  renterIdIdx: index("bookings_renterId_idx").on(table.renterId),\n'
    '  // Busca de reservas pelo anfitrião (getBookingsByHostId)\n'
    '  hostIdIdx: index("bookings_hostId_idx").on(table.hostId),\n'
    '  // Verificação de conflito de datas (checkBookingConflict)\n'
    '  vehicleDatesIdx: index("bookings_vehicleId_dates_idx").on(table.vehicleId, table.startDate, table.endDate),\n'
    '  // Filtro por status (getBookingsByStatus)\n'
    '  statusIdx: index("bookings_status_idx").on(table.status),\n'
    '}));\n'
    '\n'
    'export type Booking = typeof bookings.$inferSelect;\n'
    'export type InsertBooking = typeof bookings.$inferInsert;'
)
assert old in content, "FAIL: bookings close not found"
content = content.replace(old, new, 1)
print("✓ bookings indexes added")

# ─────────────────────────────────────────────────────────────────
# 5. payments — índices em userId, bookingId, stripeSessionId
# ─────────────────────────────────────────────────────────────────
old = (
    '  processedAt: timestamp("processedAt"),\n'
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n'
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n'
    '});\n'
    '\n'
    'export type Payment = typeof payments.$inferSelect;\n'
    'export type InsertPayment = typeof payments.$inferInsert;'
)
new = (
    '  processedAt: timestamp("processedAt"),\n'
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n'
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n'
    '}, (table) => ({\n'
    '  // Busca de pagamentos por usuário (getPaymentsByUserId)\n'
    '  userIdIdx: index("payments_userId_idx").on(table.userId),\n'
    '  // Busca de pagamentos por reserva (getPaymentsByBookingId)\n'
    '  bookingIdIdx: index("payments_bookingId_idx").on(table.bookingId),\n'
    '  // Busca por stripeSessionId (getByStripeSession — protectedProcedure)\n'
    '  stripeSessionIdx: index("payments_stripeSessionId_idx").on(table.stripeSessionId),\n'
    '}));\n'
    '\n'
    'export type Payment = typeof payments.$inferSelect;\n'
    'export type InsertPayment = typeof payments.$inferInsert;'
)
assert old in content, "FAIL: payments close not found"
content = content.replace(old, new, 1)
print("✓ payments indexes added")

# ─────────────────────────────────────────────────────────────────
# 6. conversations — índices em participant1Id, participant2Id
# ─────────────────────────────────────────────────────────────────
old = (
    '  lastMessageAt: timestamp("lastMessageAt"),\n'
    '  \n'
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n'
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n'
    '});\n'
    '\n'
    'export type Conversation = typeof conversations.$inferSelect;\n'
    'export type InsertConversation = typeof conversations.$inferInsert;'
)
new = (
    '  lastMessageAt: timestamp("lastMessageAt"),\n'
    '  \n'
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n'
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n'
    '}, (table) => ({\n'
    '  // Busca de conversas por participante (getConversationsByUserId, getUnreadMessageCount)\n'
    '  participant1Idx: index("conversations_participant1Id_idx").on(table.participant1Id),\n'
    '  participant2Idx: index("conversations_participant2Id_idx").on(table.participant2Id),\n'
    '}));\n'
    '\n'
    'export type Conversation = typeof conversations.$inferSelect;\n'
    'export type InsertConversation = typeof conversations.$inferInsert;'
)
assert old in content, "FAIL: conversations close not found"
content = content.replace(old, new, 1)
print("✓ conversations indexes added")

# ─────────────────────────────────────────────────────────────────
# 7. messages — índices em conversationId, conversationId+isRead
# ─────────────────────────────────────────────────────────────────
old = (
    '  isRead: boolean("isRead").default(false).notNull(),\n'
    '  readAt: timestamp("readAt"),\n'
    '  \n'
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n'
    '});\n'
    '\n'
    'export type Message = typeof messages.$inferSelect;\n'
    'export type InsertMessage = typeof messages.$inferInsert;'
)
new = (
    '  isRead: boolean("isRead").default(false).notNull(),\n'
    '  readAt: timestamp("readAt"),\n'
    '  \n'
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n'
    '}, (table) => ({\n'
    '  // Busca de mensagens por conversa (getMessages, getUnreadMessageCount)\n'
    '  conversationIdIdx: index("messages_conversationId_idx").on(table.conversationId),\n'
    '  // Filtro de mensagens não lidas por conversa (markMessagesAsRead)\n'
    '  conversationReadIdx: index("messages_conversationId_isRead_idx").on(table.conversationId, table.isRead),\n'
    '}));\n'
    '\n'
    'export type Message = typeof messages.$inferSelect;\n'
    'export type InsertMessage = typeof messages.$inferInsert;'
)
assert old in content, "FAIL: messages close not found"
content = content.replace(old, new, 1)
print("✓ messages indexes added")

# ─────────────────────────────────────────────────────────────────
# 8. reviews — índice em vehicleId (getReviewsByVehicleId)
# ─────────────────────────────────────────────────────────────────
old = (
    '  isPublic: boolean("isPublic").default(true).notNull(),\n'
    '  \n'
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n'
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n'
    '});\n'
    '\n'
    'export type Review = typeof reviews.$inferSelect;\n'
    'export type InsertReview = typeof reviews.$inferInsert;'
)
new = (
    '  isPublic: boolean("isPublic").default(true).notNull(),\n'
    '  \n'
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n'
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n'
    '}, (table) => ({\n'
    '  // Busca de avaliações por veículo (getReviewsByVehicleId)\n'
    '  vehicleIdIdx: index("reviews_vehicleId_idx").on(table.vehicleId),\n'
    '  // Busca de avaliações públicas (getPublicReviews)\n'
    '  isPublicIdx: index("reviews_isPublic_idx").on(table.isPublic),\n'
    '}));\n'
    '\n'
    'export type Review = typeof reviews.$inferSelect;\n'
    'export type InsertReview = typeof reviews.$inferInsert;'
)
assert old in content, "FAIL: reviews close not found"
content = content.replace(old, new, 1)
print("✓ reviews indexes added")

# ─────────────────────────────────────────────────────────────────
# Verify no original content was lost
# ─────────────────────────────────────────────────────────────────
assert len(content) > len(original), "Content shrunk — something went wrong!"
open('drizzle/schema.ts', 'w').write(content)
print(f"\n✅ All indexes applied. Schema grew from {len(original)} to {len(content)} chars.")
print(f"   Total indexes added: 17 across 8 tables")
