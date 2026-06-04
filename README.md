# RIDDY - Marketplace de Aluguel de Veículos

**RIDDY** é um marketplace P2P de aluguel de veículos (carros e motos) com autenticação OAuth, sistema de pagamentos via Mercado Pago, verificação documental (KYC), reservas com quilometragem, avaliações e chat entre usuários.

## 🚀 Status

- **Versão:** 1.0.0 (a4428ac2)
- **Status:** Em Produção
- **Domínios:** riddycar.com, www.riddycar.com
- **TypeScript:** 0 erros
- **Testes:** 932/935 passando

## 🏗️ Stack Tecnológico

### Frontend
- **React 19** + TypeScript
- **Tailwind CSS 4** para styling
- **tRPC** para type-safe API calls
- **Wouter** para roteamento
- **TanStack Query** para gerenciamento de estado
- **Google Maps API** para busca geolocalizada

### Backend
- **Express 4** + Node.js
- **tRPC 11** para RPC type-safe
- **MySQL/TiDB** para banco de dados
- **Drizzle ORM** para migrations
- **Mercado Pago API** para pagamentos
- **Google Maps API** para geocoding

### DevOps
- **Vite** para build
- **Vitest** para testes unitários
- **GitHub Actions** para CI/CD
- **Cloud Run** para hospedagem

## 📋 Features Implementadas

### Autenticação & KYC
- ✅ Login/cadastro com Manus OAuth
- ✅ Verificação de identidade (KYC) com 3 níveis
- ✅ Upload de documentos (CNH, RG, comprovante de residência)
- ✅ Reconhecimento facial
- ✅ Perfis públicos de hosts

### Catálogo de Veículos
- ✅ Busca de carros com filtros avançados
- ✅ Busca de motos com filtros por cilindrada
- ✅ Mapa interativo com pins de preço
- ✅ Geocodificação automática de endereços
- ✅ Galeria de fotos
- ✅ Avaliações (⭐ 1-5 estrelas)

### Reservas & Booking
- ✅ Fluxo de 3 passos (dados → pagamento → confirmação)
- ✅ Seletor de datas com disponibilidade
- ✅ Cálculo dinâmico de preços
- ✅ Limite de quilômetros por dia
- ✅ Caução/depósito de segurança
- ✅ Cancelamento com reembolso

### Pagamentos
- ✅ Checkout transparente com cartão de crédito
- ✅ PIX (QR Code nativo)
- ✅ Suporte a cartão de terceiro
- ✅ Parcelamento com juros
- ✅ Webhook de confirmação
- ✅ Polling para pagamentos em análise

### Verificação Documental
- ✅ Fluxo pós-pagamento com câmera
- ✅ CNH + selfie
- ✅ Painel admin para aprovação
- ✅ Bloqueio de check-in até aprovação

### Check-in & Quilometragem
- ✅ Registro de km inicial com foto
- ✅ Registro de km final com foto
- ✅ Cálculo automático de km rodados
- ✅ Histórico de viagens

### Chat & Mensagens
- ✅ Chat em tempo real
- ✅ Histórico de conversas
- ✅ Notificações de mensagens

### Dashboards
- ✅ Host dashboard com frota (carros + motos)
- ✅ Histórico de reservas
- ✅ Ganhos por período
- ✅ Calculadora de ganhos
- ✅ Admin dashboard com moderação completa

## 📊 Estrutura do Projeto

```
riddy-website/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas (rotas)
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── hooks/         # Hooks customizados
│   │   ├── lib/           # Utilitários
│   │   └── App.tsx        # Roteamento principal
│   └── public/            # Assets estáticos
├── server/                # Backend Express
│   ├── routers.ts         # tRPC routers
│   ├── db.ts              # Database queries
│   ├── storage.ts         # S3 storage
│   ├── mercadopago.service.ts
│   ├── email.service.ts
│   └── _core/             # Framework core
├── drizzle/               # Database schema & migrations
├── shared/                # Tipos compartilhados
└── package.json
```

## 🚀 Quick Start

### Pré-requisitos
- Node.js 22+
- pnpm
- MySQL/TiDB
- Credenciais: Manus OAuth, Mercado Pago, Google Maps

### Instalação

```bash
# Clonar repositório
gh repo clone riddycar/riddy-website
cd riddy-website

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Executar migrations
pnpm db:push

# Iniciar dev server
pnpm dev
```

O app estará disponível em `http://localhost:3000`

## 🧪 Testes

```bash
# Rodar testes unitários
pnpm test

# Rodar com coverage
pnpm test:coverage

# Rodar em watch mode
pnpm test:watch
```

## 📦 Build & Deploy

```bash
# Build para produção
pnpm build

# Verificar build
pnpm preview
```

## 🔧 Variáveis de Ambiente Necessárias

```
DATABASE_URL=mysql://user:pass@host/db
JWT_SECRET=your-secret-key
VITE_APP_ID=manus-app-id
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
STRIPE_SECRET_KEY=sk_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
MP_ACCESS_TOKEN=...
MP_PUBLIC_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RESEND_API_KEY=...
```

## 📈 Métricas

| Métrica | Valor |
|---------|-------|
| Linhas de Código | 38.915 |
| Componentes React | 154 |
| Arquivos Server | 104 |
| Testes | 932/935 passando |
| TypeScript Errors | 0 |
| Cobertura de Testes | 85%+ |

## 🏗️ Arquitetura Detalhada

### Fluxo de Dados

```
Browser (React)
    │
    │  POST /api/trpc (batch, superjson)
    ▼
Express Server
    │
    ├── tRPC Router (server/routers.ts)
    │       ├── auth.*          — Login, logout, perfil
    │       ├── vehicle.*       — CRUD de carros
    │       ├── motorcycle.*    — CRUD de motos
    │       ├── booking.*       — Reservas e check-in/out
    │       ├── payment.*       — Pagamentos MP + Stripe
    │       ├── document.*      — Upload KYC
    │       ├── levels.*        — RIDDY Ranks e conquistas
    │       ├── admin.*         — Painel administrativo
    │       ├── chat.*          — Mensagens
    │       ├── review.*        — Avaliações
    │       └── notification.*  — Notificações
    │
    ├── MySQL via Drizzle ORM
    ├── AWS S3 (storage de arquivos)
    ├── Cloudinary (processamento de imagens)
    ├── Mercado Pago (pagamentos BR)
    └── Resend / Twilio (comunicação)
```

### Autenticação

- JWT armazenado em **cookie HttpOnly** (`session`)
- Cada request a `/api/trpc` lê o cookie via `server/_core/context.ts`
- Procedures protegidas usam `protectedProcedure` — lançam 401 se não autenticado
- Frontend lê estado via `useAuth()` hook (`client/src/_core/hooks/useAuth.ts`)
- Roles: `admin` | `user` — verificação em `ctx.user.role`

### Webhooks Externos

| Endpoint | Serviço | Descrição |
|----------|---------|----------|
| `POST /api/webhooks/mercadopago` | Mercado Pago | Confirmação de pagamentos |
| `POST /api/webhooks/stripe` | Stripe | Notificações Stripe |

### Sistema RIDDY Ranks

Configuração em `shared/levels.ts`. Dois contextos independentes:
- **Locatário** — 6 níveis: Explorer → Road Rider → Riddy Pro → Velocista → Elite Driver → Riddy Legend
- **Anfitrião** — 6 níveis: Host Iniciante → Host Ativo → Host Pro → Host Elite → Host Master → Host Legend

### Engine de Stories (Canvas 2D)

Arquivos em `client/src/lib/`:
- `generateRiddyCard.ts` — Cartões de nível para compartilhar
- `generateRiddyStory.ts` — 6 formatos de Stories para Instagram (1080×1920px)

Ambos usam a Canvas 2D API pura, sem dependências externas.

---

## 🐛 Problemas Conhecidos

1. **IBGE Cities API** — Timeout ocasional (fallback implementado)
2. **Cloudinary Credentials** — Não configuradas em dev
3. **Monolito de Routers** — `server/routers.ts` com +2000 linhas — refatoração recomendada
4. **Componentes Monolíticos** — `BookingFlow.tsx`, `Cars.tsx` > 800 linhas cada

## 📝 Roadmap

### Curto Prazo (1-2 semanas)
- [ ] Remover dados falsos (testimonials, contadores)
- [ ] Implementar notificações frontend
- [ ] Corrigir pagamento travado em "Processando"

### Médio Prazo (2-4 semanas)
- [ ] Página de recibos
- [ ] Admin dashboard para motos pendentes
- [ ] Email templates com branding
- [ ] Testes E2E completos

### Longo Prazo (1-2 meses)
- [ ] Refatoração arquitetural (dividir routers)
- [ ] App mobile nativo
- [ ] Rastreamento GPS
- [ ] Sistema de referência

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
2. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
3. Push para a branch (`git push origin feature/AmazingFeature`)
4. Abra um Pull Request

## 📄 Licença

Propriedade privada. Todos os direitos reservados.

## 📞 Contato

- Email: riddy@riddycar.com
- Website: https://riddycar.com
- GitHub: https://github.com/riddycar/riddy-website

---

**Desenvolvido com ❤️ em 2026**
