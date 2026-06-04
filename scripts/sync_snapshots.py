"""
Syncs the Drizzle meta snapshots with the actual DB state.
Creates snapshot 0017 (schema after 0017 migration) and 0018 (schema + indexes).
Also creates the SQL file for migration 0018 (the indexes migration).
"""
import json, copy, os

# Load the latest snapshot (0016) as base
snap16 = json.load(open('drizzle/meta/0016_snapshot.json'))

# ─────────────────────────────────────────────────────────────────
# Build snapshot 0017: apply 0017_step9_schema_sync changes
# (rename adminNotes -> reviewNotes, add new columns, add motorcycle_specs)
# ─────────────────────────────────────────────────────────────────
snap17 = copy.deepcopy(snap16)
snap17['version'] = '7'

# 1. Fix user_verifications
uv = snap17['tables']['user_verifications']

# Rename adminNotes -> reviewNotes
old_col = uv['columns'].pop('adminNotes')
uv['columns']['reviewNotes'] = {**old_col, 'name': 'reviewNotes'}

# Add new columns
uv['columns']['cpfSubmitted'] = {'name': 'cpfSubmitted', 'type': 'boolean', 'primaryKey': False, 'notNull': True, 'autoincrement': False, 'default': False}
uv['columns']['cnhSubmitted'] = {'name': 'cnhSubmitted', 'type': 'boolean', 'primaryKey': False, 'notNull': True, 'autoincrement': False, 'default': False}
uv['columns']['incomeProofSubmitted'] = {'name': 'incomeProofSubmitted', 'type': 'boolean', 'primaryKey': False, 'notNull': True, 'autoincrement': False, 'default': False}
uv['columns']['lastAttemptAt'] = {'name': 'lastAttemptAt', 'type': 'timestamp', 'primaryKey': False, 'notNull': False, 'autoincrement': False}
uv['columns']['submittedAt'] = {'name': 'submittedAt', 'type': 'timestamp', 'primaryKey': False, 'notNull': False, 'autoincrement': False}
uv['columns']['approvedAt'] = {'name': 'approvedAt', 'type': 'timestamp', 'primaryKey': False, 'notNull': False, 'autoincrement': False}
uv['columns']['rejectedAt'] = {'name': 'rejectedAt', 'type': 'timestamp', 'primaryKey': False, 'notNull': False, 'autoincrement': False}
uv['columns']['blockedAt'] = {'name': 'blockedAt', 'type': 'timestamp', 'primaryKey': False, 'notNull': False, 'autoincrement': False}

# Fix status enum (snapshot has old values, schema has new ones)
uv['columns']['status']['type'] = "enum('pending','submitted','approved','rejected','blocked')"

# 2. Add motorcycle_specs table
snap17['tables']['motorcycle_specs'] = {
    'name': 'motorcycle_specs',
    'schema': '',
    'columns': {
        'id': {'name': 'id', 'type': 'int', 'primaryKey': False, 'notNull': True, 'autoincrement': True},
        'vehicleId': {'name': 'vehicleId', 'type': 'int', 'primaryKey': False, 'notNull': True, 'autoincrement': False},
        'cilindrada': {'name': 'cilindrada', 'type': "enum('125cc','150cc','160cc','180cc','200cc','250cc','300cc','350cc','400cc','500cc','600cc','750cc','800cc','900cc','1000cc','1100cc','1200cc','1200cc+')", 'primaryKey': False, 'notNull': True, 'autoincrement': False},
        'tipoMoto': {'name': 'tipoMoto', 'type': "enum('street','sport','naked','cruiser','adventure','scooter')", 'primaryKey': False, 'notNull': True, 'autoincrement': False},
        'combustivel': {'name': 'combustivel', 'type': "enum('gasolina','eletrica')", 'primaryKey': False, 'notNull': True, 'autoincrement': False, 'default': "'gasolina'"},
        'cambio': {'name': 'cambio', 'type': "enum('manual','automatico','cvt')", 'primaryKey': False, 'notNull': True, 'autoincrement': False, 'default': "'manual'"},
        'capaceteDisponivel': {'name': 'capaceteDisponivel', 'type': 'boolean', 'primaryKey': False, 'notNull': True, 'autoincrement': False, 'default': False},
        'taxaCapacete': {'name': 'taxaCapacete', 'type': 'decimal(10,2)', 'primaryKey': False, 'notNull': True, 'autoincrement': False, 'default': "'0.00'"},
        'limitKmDiario': {'name': 'limitKmDiario', 'type': 'int', 'primaryKey': False, 'notNull': True, 'autoincrement': False, 'default': 100},
        'createdAt': {'name': 'createdAt', 'type': 'timestamp', 'primaryKey': False, 'notNull': True, 'autoincrement': False, 'default': '(now())'},
        'updatedAt': {'name': 'updatedAt', 'type': 'timestamp', 'primaryKey': False, 'notNull': True, 'autoincrement': False, 'default': '(now())'},
    },
    'indexes': {},
    'foreignKeys': {},
    'compositePrimaryKeys': {},
    'uniqueConstraints': {'motorcycle_specs_vehicleId_unique': {'name': 'motorcycle_specs_vehicleId_unique', 'columns': ['vehicleId']}},
    'checkConstraints': {},
}

# Save snapshot 0017
with open('drizzle/meta/0017_snapshot.json', 'w') as f:
    json.dump(snap17, f, indent=2)
print('✓ Created drizzle/meta/0017_snapshot.json')

# ─────────────────────────────────────────────────────────────────
# Build snapshot 0018: add indexes to snapshot 0017
# ─────────────────────────────────────────────────────────────────
snap18 = copy.deepcopy(snap17)

def add_idx(snap, table, idx_name, cols):
    t = snap['tables'][table]
    if 'indexes' not in t:
        t['indexes'] = {}
    t['indexes'][idx_name] = {
        'name': idx_name,
        'columns': cols,
        'isUnique': False,
        'concurrently': False,
        'method': 'btree',
        'where': None,
    }

add_idx(snap18, 'user_documents', 'user_documents_userId_idx', ['userId'])
add_idx(snap18, 'vehicles', 'vehicles_hostId_idx', ['hostId'])
add_idx(snap18, 'vehicles', 'vehicles_status_city_idx', ['status', 'pickupCity'])
add_idx(snap18, 'vehicles', 'vehicles_vehicleType_idx', ['vehicleType'])
add_idx(snap18, 'bookings', 'bookings_renterId_idx', ['renterId'])
add_idx(snap18, 'bookings', 'bookings_hostId_idx', ['hostId'])
add_idx(snap18, 'bookings', 'bookings_vehicleId_dates_idx', ['vehicleId', 'startDate', 'endDate'])
add_idx(snap18, 'bookings', 'bookings_status_idx', ['status'])
add_idx(snap18, 'payments', 'payments_userId_idx', ['userId'])
add_idx(snap18, 'payments', 'payments_bookingId_idx', ['bookingId'])
add_idx(snap18, 'payments', 'payments_stripeSessionId_idx', ['stripeSessionId'])
add_idx(snap18, 'conversations', 'conversations_participant1Id_idx', ['participant1Id'])
add_idx(snap18, 'conversations', 'conversations_participant2Id_idx', ['participant2Id'])
add_idx(snap18, 'messages', 'messages_conversationId_idx', ['conversationId'])
add_idx(snap18, 'messages', 'messages_conversationId_isRead_idx', ['conversationId', 'isRead'])
add_idx(snap18, 'reviews', 'reviews_vehicleId_idx', ['vehicleId'])
add_idx(snap18, 'reviews', 'reviews_isPublic_idx', ['isPublic'])

with open('drizzle/meta/0018_snapshot.json', 'w') as f:
    json.dump(snap18, f, indent=2)
print('✓ Created drizzle/meta/0018_snapshot.json')

# ─────────────────────────────────────────────────────────────────
# Create SQL file for migration 0018
# ─────────────────────────────────────────────────────────────────
sql_0018 = """-- Migration: 0018_etapa6_indexes
-- ETAPA 6: Adiciona índices secundários para performance
-- Tabelas: user_documents, vehicles, bookings, payments, conversations, messages, reviews
--> statement-breakpoint
CREATE INDEX `user_documents_userId_idx` ON `user_documents` (`userId`);
--> statement-breakpoint
CREATE INDEX `vehicles_hostId_idx` ON `vehicles` (`hostId`);
--> statement-breakpoint
CREATE INDEX `vehicles_status_city_idx` ON `vehicles` (`status`,`pickupCity`);
--> statement-breakpoint
CREATE INDEX `vehicles_vehicleType_idx` ON `vehicles` (`vehicleType`);
--> statement-breakpoint
CREATE INDEX `bookings_renterId_idx` ON `bookings` (`renterId`);
--> statement-breakpoint
CREATE INDEX `bookings_hostId_idx` ON `bookings` (`hostId`);
--> statement-breakpoint
CREATE INDEX `bookings_vehicleId_dates_idx` ON `bookings` (`vehicleId`,`startDate`,`endDate`);
--> statement-breakpoint
CREATE INDEX `bookings_status_idx` ON `bookings` (`status`);
--> statement-breakpoint
CREATE INDEX `payments_userId_idx` ON `payments` (`userId`);
--> statement-breakpoint
CREATE INDEX `payments_bookingId_idx` ON `payments` (`bookingId`);
--> statement-breakpoint
CREATE INDEX `payments_stripeSessionId_idx` ON `payments` (`stripeSessionId`);
--> statement-breakpoint
CREATE INDEX `conversations_participant1Id_idx` ON `conversations` (`participant1Id`);
--> statement-breakpoint
CREATE INDEX `conversations_participant2Id_idx` ON `conversations` (`participant2Id`);
--> statement-breakpoint
CREATE INDEX `messages_conversationId_idx` ON `messages` (`conversationId`);
--> statement-breakpoint
CREATE INDEX `messages_conversationId_isRead_idx` ON `messages` (`conversationId`,`isRead`);
--> statement-breakpoint
CREATE INDEX `reviews_vehicleId_idx` ON `reviews` (`vehicleId`);
--> statement-breakpoint
CREATE INDEX `reviews_isPublic_idx` ON `reviews` (`isPublic`);
"""

with open('drizzle/0018_etapa6_indexes.sql', 'w') as f:
    f.write(sql_0018)
print('✓ Created drizzle/0018_etapa6_indexes.sql')

# ─────────────────────────────────────────────────────────────────
# Update journal to include entries 17 and 18
# ─────────────────────────────────────────────────────────────────
import time
journal = json.load(open('drizzle/meta/_journal.json'))

# Check if 0017 and 0018 already in journal
existing_tags = {e['tag'] for e in journal['entries']}
now_ms = int(time.time() * 1000)

if '0017_step9_schema_sync' not in existing_tags:
    journal['entries'].append({
        'idx': 17,
        'version': '5',
        'when': now_ms,
        'tag': '0017_step9_schema_sync',
        'breakpoints': True
    })
    print('✓ Added 0017 to journal')

if '0018_etapa6_indexes' not in existing_tags:
    journal['entries'].append({
        'idx': 18,
        'version': '5',
        'when': now_ms + 1000,
        'tag': '0018_etapa6_indexes',
        'breakpoints': True
    })
    print('✓ Added 0018 to journal')

with open('drizzle/meta/_journal.json', 'w') as f:
    json.dump(journal, f, indent=2)
print('✓ Updated journal')

print('\n✅ Snapshot sync complete!')
print('   0017_snapshot.json: schema after step9 migration')
print('   0018_snapshot.json: schema + 17 indexes')
print('   0018_etapa6_indexes.sql: index migration SQL')
