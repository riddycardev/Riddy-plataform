# Arquitetura Modular RIDDY

## Visão Geral

A plataforma RIDDY foi reorganizada em **4 módulos principais** para melhorar manutenibilidade, escalabilidade e experiência do usuário.

```
client/src/
├── modules/
│   ├── home/              # Landing page e autenticação
│   ├── aluguel/           # Busca, visualização e reserva de veículos
│   ├── pagamento/         # Gerenciamento de pagamentos
│   └── estrutura/         # Dashboards de usuário, host e admin
├── components/            # Componentes compartilhados
├── contexts/              # Contextos globais
├── hooks/                 # Hooks customizados
└── pages/                 # Páginas (mantidas para compatibilidade)
```

---

## Módulo 1: HOME

**Objetivo:** Apresentar a plataforma e permitir autenticação

### Estrutura
```
modules/home/
├── pages/
│   └── Home.tsx
├── components/
│   ├── HomeLayout.tsx
│   ├── HeroSection.tsx
│   ├── FeaturedCars.tsx
│   └── HowItWorks.tsx
├── hooks/
└── contexts/
```

### Rotas
- `/` - Landing page
- `/login` - Login
- `/signup` - Escolher tipo de usuário
- `/signup/user` - Signup para locatário
- `/signup/host` - Signup para proprietário

### Responsabilidades
- Apresentar a plataforma
- Permitir busca rápida
- Autenticar usuários
- Direcionar para módulos apropriados

---

## Módulo 2: ALUGUEL

**Objetivo:** Gerenciar busca, visualização e reserva de veículos

### Estrutura
```
modules/aluguel/
├── pages/
│   ├── SearchResults.tsx
│   ├── VehicleDetails.tsx
│   ├── BookingFlow.tsx
│   └── MyBookings.tsx
├── components/
│   ├── AluguelLayout.tsx
│   ├── SearchBar.tsx
│   ├── FilterPanel.tsx
│   ├── VehicleCard.tsx
│   └── BookingForm.tsx
├── hooks/
│   └── useSearch.ts
└── contexts/
    └── SearchContext.tsx
```

### Rotas
- `/search` - Resultados de busca
- `/vehicle/:id` - Detalhes do veículo
- `/booking/:vehicleId` - Fluxo de reserva
- `/my-bookings` - Minhas reservas
- `/booking/success` - Confirmação
- `/booking/cancel` - Cancelamento

### Responsabilidades
- Buscar veículos por localização, categoria, preço
- Exibir detalhes do veículo
- Gerenciar reservas
- Mostrar histórico de aluguel

---

## Módulo 3: PAGAMENTO

**Objetivo:** Gerenciar pagamentos, faturas e métodos

### Estrutura
```
modules/pagamento/
├── pages/
│   ├── Payments.tsx
│   ├── PaymentHistory.tsx
│   └── PaymentMethods.tsx
├── components/
│   ├── PagamentoLayout.tsx
│   ├── PaymentCard.tsx
│   ├── InvoiceList.tsx
│   └── MethodForm.tsx
├── hooks/
│   └── usePayments.ts
└── contexts/
    └── PaymentContext.tsx
```

### Rotas
- `/payments` - Dashboard de pagamentos
- `/payments/history` - Histórico de transações
- `/payments/methods` - Métodos de pagamento
- `/payments/invoice/:id` - Detalhes da fatura

### Responsabilidades
- Exibir histórico de pagamentos
- Gerenciar métodos de pagamento
- Gerar faturas e recibos
- Integrar com Stripe

---

## Módulo 4: ESTRUTURA

**Objetivo:** Gerenciar dashboards de usuário, host e admin

### Estrutura
```
modules/estrutura/
├── pages/
│   ├── user/
│   │   ├── UserDashboard.tsx
│   │   ├── Profile.tsx
│   │   ├── Documents.tsx
│   │   └── Messages.tsx
│   ├── host/
│   │   ├── HostDashboard.tsx
│   │   ├── MyVehicles.tsx
│   │   ├── AddVehicle.tsx
│   │   └── Earnings.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── VehicleApproval.tsx
│       ├── UserManagement.tsx
│       └── Reports.tsx
├── components/
│   ├── EstrutuuraLayout.tsx
│   ├── Sidebar.tsx
│   └── ProfileCard.tsx
├── hooks/
└── contexts/
```

### Rotas

**Usuário (Locatário)**
- `/dashboard` - Dashboard
- `/profile` - Perfil
- `/documents` - Documentos
- `/messages` - Mensagens
- `/my-bookings` - Minhas reservas

**Host (Proprietário)**
- `/host` - Dashboard
- `/host/vehicles` - Meus veículos
- `/host/add-vehicle` - Adicionar veículo
- `/host/bookings` - Reservas recebidas
- `/host/earnings` - Ganhos

**Admin**
- `/admin` - Dashboard
- `/admin/vehicles` - Aprovação de veículos
- `/admin/users` - Gerenciamento de usuários
- `/admin/verification` - Verificações
- `/admin/reports` - Relatórios

### Responsabilidades
- Gerenciar perfil do usuário
- Exibir documentos e verificações
- Gerenciar veículos (para hosts)
- Aprovar/rejeitar veículos (para admin)
- Exibir relatórios e analytics

---

## Componentes Compartilhados

Componentes reutilizáveis entre módulos:

```
components/
├── ui/                    # shadcn/ui components
├── Header.tsx
├── Footer.tsx
├── Navigation.tsx
├── Map.tsx
├── ProtectedRoute.tsx
├── ErrorBoundary.tsx
└── Loading.tsx
```

---

## Contextos Globais

```
contexts/
├── ThemeContext.tsx       # Tema (dark/light)
├── AuthContext.tsx        # Autenticação e usuário
└── NotificationContext.tsx # Notificações
```

---

## Fluxos Principais

### 1. Fluxo de Busca e Aluguel
```
Home → Busca → SearchResults → VehicleDetails → BookingFlow → BookingSuccess
```

### 2. Fluxo de Cadastro (Host)
```
Home → SignupHost → Documents → AddVehicle → AdminApproval → MyVehicles
```

### 3. Fluxo de Pagamento
```
BookingFlow → Stripe → PaymentSuccess → Payments → Invoice
```

### 4. Fluxo de Admin
```
AdminDashboard → VehicleApproval → AdminVerificationPanel → UserManagement
```

---

## Melhorias Implementadas

### UX
- [ ] Loading states em todas as páginas
- [ ] Error boundaries para tratamento de erros
- [ ] Feedback visual em ações
- [ ] Tooltips e help text
- [ ] Responsividade mobile-first

### Performance
- [ ] Lazy loading de rotas
- [ ] Code splitting por módulo
- [ ] Otimização de imagens
- [ ] Caching de dados

### Funcionalidades
- [ ] Sistema de notificações
- [ ] Chat em tempo real
- [ ] Avaliações 5 estrelas
- [ ] Wishlist/Favoritos
- [ ] Recomendações personalizadas

---

## Próximos Passos

1. **Migrar componentes** para os módulos apropriados
2. **Implementar lazy loading** de rotas
3. **Criar testes** para cada módulo
4. **Documentar** APIs e componentes
5. **Otimizar** performance e SEO

---

## Convenções

### Nomenclatura
- Componentes: PascalCase (`HomeLayout.tsx`)
- Hooks: camelCase com prefixo `use` (`useSearch.ts`)
- Contextos: PascalCase com sufixo `Context` (`SearchContext.tsx`)
- Tipos: PascalCase com sufixo `Props` (`HomeLayoutProps`)

### Estrutura de Arquivo
```
module/
├── pages/           # Páginas principais
├── components/      # Componentes do módulo
├── hooks/           # Hooks customizados
├── contexts/        # Contextos locais
└── types.ts         # Tipos TypeScript
```

### Imports
```typescript
// Absoluto para módulos
import { SearchResults } from "@/modules/aluguel/pages";

// Relativo para arquivos locais
import { SearchBar } from "../components";
```

---

## Documentação Adicional

- [REORGANIZACAO.md](./REORGANIZACAO.md) - Plano de reorganização
- [README.md](./README.md) - Documentação geral do projeto
