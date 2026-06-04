# Guia de Contribuição — RIDDY Platform

Bem-vindo ao projeto RIDDY! Este guia contém tudo que você precisa para configurar o ambiente, entender as convenções do código e contribuir de forma eficiente.

---

## Índice

- [Setup do Ambiente](#setup-do-ambiente)
- [Estrutura de Arquivos Chave](#estrutura-de-arquivos-chave)
- [Convenções de Código](#convenções-de-código)
- [Fluxo de Trabalho com Git](#fluxo-de-trabalho-com-git)
- [Como Adicionar uma Nova Feature](#como-adicionar-uma-nova-feature)
- [Banco de Dados](#banco-de-dados)
- [Testes](#testes)
- [Performance — Áreas Prioritárias](#performance--áreas-prioritárias)
- [Dúvidas Frequentes](#dúvidas-frequentes)

---

## Setup do Ambiente

### 1. Requisitos

| Ferramenta | Versão mínima |
|-----------|--------------|
| Node.js | 22.x |
| pnpm | 9.x |
| MySQL | 8.x |
| Git | 2.x |

### 2. Instalar dependências

```bash
git clone https://github.com/riddycardev/Riddy-plataform.git
cd Riddy-plataform
pnpm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com as credenciais fornecidas pelo time RIDDY. As variáveis obrigatórias para desenvolvimento são:

```
DATABASE_URL          — String de conexão MySQL
JWT_SECRET            — Qualquer string longa e aleatória
MP_ACCESS_TOKEN       — Token Mercado Pago (modo teste)
CLOUDINARY_*          — Credenciais Cloudinary
RESEND_API_KEY        — Chave Resend para e-mails
```

### 4. Banco de dados

```bash
# Criar tabelas e aplicar schema
pnpm db:push
```

### 5. Rodar o projeto

```bash
pnpm dev
# Acesse: http://localhost:3000
```

O servidor Express e o Vite (HMR) rodam juntos na porta 3000.

---

## Estrutura de Arquivos Chave

Antes de começar, familiarize-se com estes arquivos:

| Arquivo | O que é |
|---------|---------|
| `drizzle/schema.ts` | **Fonte da verdade** do banco — todas as tabelas e tipos |
| `server/routers.ts` | Router principal tRPC — ponto de entrada de todas as procedures |
| `server/db.ts` | Query helpers do banco — funções reutilizáveis de consulta |
| `server/storage.ts` | Helpers AWS S3 para upload/download de arquivos |
| `client/src/App.tsx` | Roteamento frontend — todas as rotas da aplicação |
| `client/src/lib/trpc.ts` | Cliente tRPC — configuração da conexão frontend→backend |
| `shared/levels.ts` | Configuração dos níveis RIDDY Ranks (locatário + anfitrião) |
| `shared/types.ts` | Tipos TypeScript compartilhados entre frontend e backend |

### Routers por feature (em `server/routers/`)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `levels.ts` | Sistema de níveis, conquistas, pontuação |
| `motorcycle.ts` | CRUD completo de motos |
| `chat.ts` | Mensagens entre usuários |
| `geolocation.ts` | Geocodificação de endereços |
| `ownAuth.ts` | Autenticação própria (e-mail/senha) |
| `googleAuth.ts` | Login com Google |
| `riddyCare.ts` | Suporte ao cliente |

---

## Convenções de Código

### TypeScript

- **Nunca use `any`** — use tipos explícitos ou `unknown`
- Prefira `interface` para objetos e `type` para unions/intersections
- Todos os retornos de procedures tRPC devem ser tipados

### tRPC (Backend)

O padrão para adicionar uma procedure é:

```typescript
// server/routers.ts (ou server/routers/feature.ts)
featureName: publicProcedure  // ou protectedProcedure
  .input(z.object({
    id: z.number(),
  }))
  .query(async ({ input, ctx }) => {
    // ctx.user disponível em protectedProcedure
    return await getFeatureById(input.id);
  }),
```

Regras:
- Use `publicProcedure` para rotas sem autenticação
- Use `protectedProcedure` para rotas que exigem login
- Adicione helpers de banco em `server/db.ts`, não inline nas procedures
- Mantenha procedures com menos de 50 linhas — extraia lógica para `server/services/`

### React (Frontend)

```typescript
// ✅ Correto — buscar dados
const { data, isLoading } = trpc.feature.getById.useQuery({ id });

// ✅ Correto — mutação com invalidação
const mutation = trpc.feature.create.useMutation({
  onSuccess: () => trpc.useUtils().feature.list.invalidate(),
});

// ❌ Nunca use fetch/axios diretamente para chamar o backend
```

Regras:
- Sempre use `trpc.*` para chamadas ao backend — nunca `fetch` direto
- Use `useAuth()` para estado de autenticação — nunca leia cookies manualmente
- Componentes de UI devem vir de `@/components/ui/*` (shadcn/ui)
- Evite criar CSS customizado — use Tailwind utilities

### Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes React | PascalCase | `BookingCard.tsx` |
| Hooks | camelCase com `use` | `useBookingStatus.ts` |
| Procedures tRPC | camelCase | `getVehicleById` |
| Tabelas do banco | snake_case | `booking_items` |
| Variáveis | camelCase | `totalAmount` |
| Constantes | UPPER_SNAKE | `MAX_FILE_SIZE` |

---

## Fluxo de Trabalho com Git

### Branches

```
main          — Produção (protegida)
develop       — Integração de features
feature/*     — Nova funcionalidade
fix/*         — Correção de bug
perf/*        — Melhorias de performance
```

### Commits

Siga o padrão **Conventional Commits**:

```
feat: adiciona filtro por cilindrada em motos
fix: corrige cálculo de km excedente no checkout
perf: adiciona índice na tabela bookings para consultas por data
refactor: extrai lógica de pagamento para PaymentService
test: adiciona testes para calculateRiddyScore
docs: atualiza README com variáveis de ambiente
```

### Pull Requests

1. Crie uma branch a partir de `develop`
2. Implemente a mudança com testes
3. Rode `pnpm test` — todos devem passar
4. Rode `npx tsc --noEmit` — zero erros TypeScript
5. Abra PR para `develop` com descrição clara do que foi feito

---

## Como Adicionar uma Nova Feature

Siga este checklist em ordem:

```
[ ] 1. Atualizar schema em drizzle/schema.ts (se precisar de nova tabela/coluna)
[ ] 2. Rodar pnpm db:push para aplicar ao banco
[ ] 3. Adicionar query helpers em server/db.ts
[ ] 4. Criar procedure em server/routers.ts (ou server/routers/feature.ts)
[ ] 5. Criar página em client/src/pages/FeatureName.tsx
[ ] 6. Registrar rota em client/src/App.tsx
[ ] 7. Escrever testes em server/feature.test.ts
[ ] 8. Rodar pnpm test — todos passando
[ ] 9. Rodar npx tsc --noEmit — zero erros
```

---

## Banco de Dados

### Adicionar nova tabela

```typescript
// drizzle/schema.ts
export const myTable = mysqlTable("my_table", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
```

Depois rode: `pnpm db:push`

### Timestamps

Sempre use **Unix timestamp em milissegundos** para datas:

```typescript
// ✅ Correto
createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),

// ❌ Evite strings de data
createdAt: varchar("created_at", { length: 50 })
```

### Índices importantes

Tabelas com muitas consultas devem ter índices. Veja exemplos em `drizzle/schema.ts` nas tabelas `bookings` e `vehicles`.

---

## Testes

O projeto usa **Vitest**. Os testes ficam em `server/*.test.ts`.

### Rodar testes

```bash
pnpm test                    # Todos os testes
pnpm vitest run --reporter=verbose  # Com detalhes
pnpm vitest watch            # Modo watch
```

### Escrever um teste

```typescript
// server/myFeature.test.ts
import { describe, it, expect } from "vitest";
import { myFunction } from "./db";

describe("myFunction", () => {
  it("deve retornar o valor correto", () => {
    const result = myFunction({ input: "test" });
    expect(result).toBe("expected");
  });
});
```

Veja `server/auth.logout.test.ts` como referência de teste com mock de contexto tRPC.

---

## Performance — Áreas Prioritárias

Estas são as principais áreas identificadas para otimização:

### Backend

| Área | Problema | Sugestão |
|------|---------|---------|
| `server/routers.ts` | Arquivo monolítico (+2000 linhas) | Dividir em `server/routers/feature.ts` |
| Queries N+1 | Busca de veículos sem joins | Usar `with` do Drizzle para eager loading |
| Falta de índices | Consultas lentas em `bookings` por data | Adicionar índices compostos |
| Upload de imagens | Processamento síncrono | Mover para fila assíncrona |

### Frontend

| Área | Problema | Sugestão |
|------|---------|---------|
| `BookingFlow.tsx` | +800 linhas, re-renders desnecessários | Dividir em steps separados + `React.memo` |
| `Cars.tsx` | +800 linhas | Extrair `CarCard`, `CarFilters`, `CarMap` |
| Canvas Stories | Geração bloqueante na thread principal | Mover para Web Worker |
| Bundle size | Sem code splitting nas rotas | Usar `React.lazy` + `Suspense` |

### Banco de Dados

```sql
-- Índices recomendados para adicionar:
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date, status);
CREATE INDEX idx_vehicles_city_type ON vehicles(city, vehicle_type, status);
CREATE INDEX idx_user_levels_user ON user_levels(user_id, context);
```

---

## Dúvidas Frequentes

**Como promover um usuário a admin?**
```sql
UPDATE users SET role = 'admin' WHERE email = 'dev@exemplo.com';
```

**Como testar pagamentos?**
Use as credenciais de teste do Mercado Pago. Cartão de teste: `5031 7557 3453 0604`, CVV: `123`, vencimento: qualquer data futura.

**Como ver os logs do servidor?**
```bash
pnpm dev
# Os logs aparecem no terminal com timestamp
```

**O TypeScript está reclamando de algo no `_core/`?**
Não edite arquivos em `server/_core/` — são infraestrutura do framework. Se precisar de algo diferente, crie um wrapper.

**Como adicionar uma variável de ambiente?**
1. Adicione em `.env.example` (sem o valor real)
2. Adicione em `server/_core/env.ts` para uso no backend
3. Se for para o frontend, prefixe com `VITE_`

---

## Contato

Para dúvidas sobre o projeto, entre em contato com o time RIDDY.

- **Website:** [riddycar.com](https://riddycar.com)
- **Email:** riddy@riddycar.com
