# Sistema de Geolocalização RIDDY

## Visão Geral

O RIDDY implementa um sistema de geolocalização inteligente que detecta automaticamente a localização do usuário e exibe apenas veículos relevantes dentro de um raio configurável. O sistema é otimizado para escala de milhões de usuários com performance de sub-segundo.

---

## Arquitetura

### 1. Camadas do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  - useGeolocation Hook (GPS/IP/Manual)                   │
│  - LocationDetector Component                            │
│  - Sugestões de cidades próximas                         │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                   tRPC API Layer                         │
│  - geolocation.searchByLocation                          │
│  - geolocation.saveUserLocation                          │
│  - geolocation.getNearbyCity                             │
│  - geolocation.calculateDistance                         │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│              Backend (Node.js/Express)                   │
│  - server/geolocation.ts (lógica de busca)              │
│  - Cálculo de distância Haversine                        │
│  - Grid-based coarse filtering                          │
│  - Geohash spatial indexing                             │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                MySQL Database                            │
│  - vehicles (com lat/lon)                               │
│  - vehicle_location_index (grid + geohash)              │
│  - user_location_history (rastreamento)                 │
│  - cities (referência com estatísticas)                 │
└─────────────────────────────────────────────────────────┘
```

### 2. Fluxo de Dados

#### Detecção de Localização (Prioridade)

1. **GPS (Geolocalização Nativa)**
   - Precisão: ±5-50m (dependendo do dispositivo)
   - Tempo: 5-10 segundos
   - Requer permissão do usuário

2. **IP Geolocation (Fallback)**
   - Precisão: ±50-500km (depende do ISP)
   - Tempo: <1 segundo
   - Sem permissão necessária
   - Serviço: ipapi.co (gratuito)

3. **Manual (Último Recurso)**
   - Usuário digita cidade ou coordenadas
   - Precisão: Exata (conforme entrada)
   - Tempo: Instantâneo

#### Busca de Veículos

```
Entrada do Usuário (lat, lon, raio)
         ↓
Calcular Grid Cell (0.1° = ~11km)
         ↓
Obter Células Vizinhas (coarse filter)
         ↓
Query SQL com Condições (status, preço, categoria)
         ↓
Resultado: ~500 veículos (limite para JS filtering)
         ↓
Fine Filtering em JavaScript (Haversine distance)
         ↓
Ordenar por Distância/Preço/Rating
         ↓
Retornar Top 50 (ou limit)
```

---

## Implementação

### Backend

#### 1. Banco de Dados

**Tabelas Principais:**

```sql
-- Índice de localização de veículos (otimizado para busca)
CREATE TABLE vehicle_location_index (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicleId INT UNIQUE NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  geohash VARCHAR(8) NOT NULL,      -- Para busca por proximidade
  gridX INT NOT NULL,                -- Para grid-based filtering
  gridY INT NOT NULL,                -- Para grid-based filtering
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_grid (gridX, gridY),       -- Índice para grid cells
  KEY idx_geohash (geohash),         -- Índice para geohash
  KEY idx_city (city, state)         -- Índice para busca por cidade
);

-- Histórico de localização do usuário
CREATE TABLE user_location_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  accuracy INT,                      -- Precisão em metros
  source ENUM('gps', 'ip', 'manual', 'geofence') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user_date (userId, createdAt)
);

-- Referência de cidades
CREATE TABLE cities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  population INT,
  region VARCHAR(50),                -- Norte, Nordeste, Centro-Oeste, Sudeste, Sul
  vehicleCount INT DEFAULT 0,        -- Cache para performance
  averagePrice DECIMAL(10,2),        -- Cache para performance
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_city (name, state),
  KEY idx_vehicle_count (vehicleCount DESC)
);
```

#### 2. Funções de Geolocalização

**Arquivo: `server/geolocation.ts`**

```typescript
// Calcular distância Haversine (em km)
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calcular célula de grid (0.1° = ~11km na linha do equador)
export function calculateGridCell(lat: number, lon: number) {
  return {
    gridX: Math.floor(lon / 0.1),
    gridY: Math.floor(lat / 0.1),
  };
}

// Buscar veículos por localização
export async function searchVehiclesByLocation(filters: GeoSearchFilters) {
  // 1. Coarse filtering: usar grid cells
  // 2. SQL query: status, preço, categoria, transmissão, combustível, assentos
  // 3. Fine filtering: distância Haversine em JavaScript
  // 4. Ordenar e retornar
}
```

#### 3. API tRPC

**Arquivo: `server/routers/geolocation.ts`**

```typescript
export const geolocationRouter = router({
  // Buscar veículos por localização
  searchByLocation: publicProcedure
    .input(z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      radiusKm: z.number().min(1).max(500).default(50),
      category: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      sortBy: z.enum(['distance', 'price_asc', 'price_desc', 'rating']).default('recommended'),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      return await geo.searchVehiclesByLocation(input);
    }),

  // Salvar localização do usuário
  saveUserLocation: protectedProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      city: z.string().optional(),
      state: z.string().optional(),
      source: z.enum(['gps', 'ip', 'manual', 'geofence']).default('manual'),
      accuracy: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await geo.saveUserLocation(ctx.user.id, input.latitude, input.longitude, ...);
    }),

  // Obter cidades próximas com veículos
  getNearbyCity: publicProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      radiusKm: z.number().default(100),
    }))
    .query(async ({ input }) => {
      return await geo.getNearbyCity(input.latitude, input.longitude, input.radiusKm);
    }),
});
```

### Frontend

#### 1. Hook de Geolocalização

**Arquivo: `client/src/hooks/useGeolocation.ts`**

```typescript
export function useGeolocation(): UseGeolocationReturn {
  // Detectar localização com fallback chain:
  // 1. GPS (Geolocation API)
  // 2. IP Geolocation (ipapi.co)
  // 3. Manual (usuário digita)

  const requestLocation = async () => {
    // Tentar GPS
    const gpsLocation = await requestGPSLocation();
    if (gpsLocation) return gpsLocation;

    // Fallback para IP
    const ipLocation = await requestIPLocation();
    if (ipLocation) return ipLocation;

    // Fallback para manual
    throw new Error('Localização não disponível');
  };

  return {
    location,
    loading,
    error,
    requestLocation,
    setManualLocation,
    clearLocation,
    isSupported,
  };
}

// Hooks para busca de veículos
export function useVehiclesByLocation(location: UserLocation | null, radiusKm: number = 50) {
  return trpc.geolocation.searchByLocation.useQuery(...);
}

export function useNearbyCities(location: UserLocation | null, radiusKm: number = 100) {
  return trpc.geolocation.getNearbyCity.useQuery(...);
}
```

#### 2. Componente de Detector de Localização

**Arquivo: `client/src/components/LocationDetector.tsx`**

```typescript
export function LocationDetector({
  onLocationDetected,
  onVehiclesFound,
  radiusKm = 50,
  autoDetect = false,
}: LocationDetectorProps) {
  const { location, loading, error, requestLocation } = useGeolocation();
  const vehiclesQuery = useVehiclesByLocation(location, radiusKm);
  const citiesQuery = useNearbyCities(location, radiusKm * 2);

  // Detectar localização automaticamente (opcional)
  useEffect(() => {
    if (autoDetect && !location) {
      requestLocation();
    }
  }, [autoDetect, location]);

  // Notificar parent quando localização é detectada
  useEffect(() => {
    if (location && onLocationDetected) {
      onLocationDetected(location.latitude, location.longitude, location.city, location.state);
    }
  }, [location]);

  // Mostrar sugestões de cidades se nenhum carro encontrado
  return (
    <div className="space-y-4">
      {/* Status de localização */}
      {/* Carros encontrados */}
      {/* Sugestões de cidades próximas */}
    </div>
  );
}
```

---

## Estratégia de Escalabilidade

### 1. Para 1 Milhão de Usuários

**Otimizações:**

- ✅ Grid-based coarse filtering (reduz SQL query de 100k para 500 registros)
- ✅ Geohash indexing (busca por proximidade em O(log n))
- ✅ Índices de banco de dados (gridX, gridY, geohash, city)
- ✅ Caching de estatísticas de cidades (vehicleCount, averagePrice)
- ✅ JavaScript fine filtering (Haversine distance)
- ✅ Lazy loading de resultados (pagination)

**Métricas Esperadas:**

- Query time: <100ms
- API response time: <200ms
- Database load: Baixo (grid filtering reduz I/O)

### 2. Para 10 Milhões de Usuários

**Otimizações Adicionais:**

```typescript
// 1. Caching em Redis
const cachedResults = await redis.get(`geo:${gridX}:${gridY}`);
if (cachedResults) return JSON.parse(cachedResults);

// 2. Batch updates de índices
await rebuildVehicleLocationIndexBatch(vehicleIds, batchSize: 1000);

// 3. Sharding de banco de dados
// Particionar por gridX/gridY para distribuir carga
// Exemplo: database_shard_0 = gridX 0-99, database_shard_1 = gridX 100-199

// 4. CDN para dados estáticos
// Cidades, regiões, estatísticas em cache global
```

### 3. Para 100 Milhões de Usuários

**Arquitetura Distribuída:**

```
┌─────────────────────────────────────────────────────────┐
│                  API Gateway (Load Balancer)             │
│                  - Geo-routing (usuário → servidor mais próximo)
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┼──────────┬──────────┐
        │          │          │          │
┌───────▼──┐ ┌────▼────┐ ┌──▼────┐ ┌──▼────┐
│ Region 1 │ │Region 2 │ │Region3│ │Region4│
│ (Brazil) │ │(Brazil) │ │(Brazil│ │(Brazil│
│ Servers  │ │ Servers │ │Servers│ │Servers│
└───────┬──┘ └────┬────┘ └──┬────┘ └──┬────┘
        │         │         │         │
    ┌───▼─────────▼─────────▼─────────▼────┐
    │   Distributed Cache (Redis Cluster)   │
    │   - Grid cell cache                   │
    │   - City statistics cache             │
    │   - User location cache               │
    └───┬─────────────────────────────────┬─┘
        │                                 │
    ┌───▼──────────────────────────────┬─▼──┐
    │   Database Shards (MySQL)         │    │
    │   - Shard by gridX/gridY          │    │
    │   - Replication for HA            │    │
    │   - Read replicas for analytics   │    │
    └───────────────────────────────────┴────┘
```

### 4. Índices de Banco de Dados

```sql
-- Índices críticos para performance
CREATE INDEX idx_vehicle_status_grid ON vehicles(status, pickupLatitude, pickupLongitude);
CREATE INDEX idx_location_grid ON vehicle_location_index(gridX, gridY);
CREATE INDEX idx_location_geohash ON vehicle_location_index(geohash);
CREATE INDEX idx_location_city ON vehicle_location_index(city, state);
CREATE INDEX idx_vehicle_price ON vehicles(dailyPrice);
CREATE INDEX idx_vehicle_category ON vehicles(category);
CREATE INDEX idx_vehicle_rating ON vehicles(averageRating DESC);
```

---

## Testes

### 1. Testes Unitários

**Arquivo: `server/geolocation.test.ts`**

```typescript
describe('Geolocation', () => {
  describe('calculateDistance', () => {
    it('deve calcular distância corretamente', () => {
      // São Paulo para Rio de Janeiro: ~430km
      const distance = calculateDistance(-23.5505, -46.6333, -22.9068, -43.1729);
      expect(distance).toBeCloseTo(430, -1);
    });

    it('deve retornar 0 para mesma localização', () => {
      const distance = calculateDistance(0, 0, 0, 0);
      expect(distance).toBe(0);
    });
  });

  describe('calculateGridCell', () => {
    it('deve calcular grid cell corretamente', () => {
      const cell = calculateGridCell(-23.5505, -46.6333);
      expect(cell).toEqual({ gridX: -467, gridY: -236 });
    });
  });

  describe('searchVehiclesByLocation', () => {
    it('deve retornar veículos dentro do raio', async () => {
      const vehicles = await searchVehiclesByLocation({
        latitude: -23.5505,
        longitude: -46.6333,
        radiusKm: 50,
      });
      expect(vehicles.length).toBeGreaterThan(0);
      expect(vehicles[0].distance).toBeLessThanOrEqual(50);
    });

    it('deve ordenar por distância', async () => {
      const vehicles = await searchVehiclesByLocation({
        latitude: -23.5505,
        longitude: -46.6333,
        radiusKm: 50,
        sortBy: 'distance',
      });
      for (let i = 1; i < vehicles.length; i++) {
        expect(vehicles[i].distance).toBeGreaterThanOrEqual(vehicles[i - 1].distance);
      }
    });

    it('deve aplicar filtros de preço', async () => {
      const vehicles = await searchVehiclesByLocation({
        latitude: -23.5505,
        longitude: -46.6333,
        radiusKm: 50,
        minPrice: 100,
        maxPrice: 300,
      });
      vehicles.forEach((v) => {
        expect(Number(v.dailyPrice)).toBeGreaterThanOrEqual(100);
        expect(Number(v.dailyPrice)).toBeLessThanOrEqual(300);
      });
    });
  });
});
```

### 2. Testes de Performance

```typescript
describe('Performance', () => {
  it('deve buscar veículos em menos de 100ms', async () => {
    const start = Date.now();
    await searchVehiclesByLocation({
      latitude: -23.5505,
      longitude: -46.6333,
      radiusKm: 50,
    });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it('deve suportar 1000 requisições simultâneas', async () => {
    const promises = Array(1000).fill(null).map(() =>
      searchVehiclesByLocation({
        latitude: -23.5505,
        longitude: -46.6333,
        radiusKm: 50,
      })
    );
    const start = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - start;
    console.log(`1000 requisições em ${duration}ms`);
    expect(duration).toBeLessThan(10000); // 10 segundos
  });
});
```

### 3. Testes de Integração

```typescript
describe('Geolocation Integration', () => {
  it('deve detectar localização e buscar veículos', async () => {
    const { location } = useGeolocation();
    await requestLocation();

    expect(location).toBeDefined();
    expect(location.latitude).toBeGreaterThanOrEqual(-90);
    expect(location.latitude).toBeLessThanOrEqual(90);

    const { data } = await trpc.geolocation.searchByLocation.query({
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm: 50,
    });

    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

---

## Monitoramento

### 1. Métricas Críticas

```typescript
// Monitorar em tempo real
metrics.gauge('geo.search.response_time', duration);
metrics.counter('geo.search.requests', 1);
metrics.gauge('geo.search.result_count', results.length);
metrics.gauge('geo.grid_cells.accessed', cellsAccessed);
metrics.gauge('geo.database.query_time', queryDuration);
```

### 2. Alertas

```typescript
// Alertar se performance degradar
if (duration > 500) {
  alert('Geolocation search slow: ' + duration + 'ms');
}

if (results.length === 0 && radiusKm > 50) {
  alert('No vehicles found in large radius');
}

if (gridCellsAccessed > 100) {
  alert('Too many grid cells accessed - possible issue with grid size');
}
```

---

## Roadmap Futuro

### Curto Prazo (1-3 meses)
- [ ] Implementar Redis caching para grid cells
- [ ] Adicionar suporte a geofencing (notificações quando entrar em área)
- [ ] Criar dashboard de analytics de localização

### Médio Prazo (3-6 meses)
- [ ] Implementar database sharding por região
- [ ] Adicionar suporte a múltiplas moedas por região
- [ ] Criar recomendações personalizadas por localização

### Longo Prazo (6+ meses)
- [ ] Implementar arquitetura geo-distribuída (servidores por região)
- [ ] Adicionar suporte a rotas otimizadas (Traveling Salesman Problem)
- [ ] Criar marketplace local com integração de pagamentos regionais

---

## Referências

- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
- [Geohash](https://en.wikipedia.org/wiki/Geohash)
- [PostGIS Documentation](https://postgis.net/)
- [Google Maps API](https://developers.google.com/maps)
- [OpenStreetMap Nominatim](https://nominatim.org/)
