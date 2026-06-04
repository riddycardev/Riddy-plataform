# Arquitetura de Dashboard Dual — Modo Anfitrião vs Modo Locatário

## 🎯 Objetivo
Criar uma experiência inteligente onde usuários que são **ambos** (anfitrião + locatário) possam alternar entre dois modos completamente distintos, com temática, funcionalidades e fluxos separados, sem confusão.

---

## 📋 Proposta de Arquitetura

### 1️⃣ CONTEXTO GLOBAL: `UserModeContext`

**Conceito:** Um contexto React que gerencia qual "modo" o usuário está usando naquele momento.

```typescript
// contexts/UserModeContext.tsx
export type UserMode = "host" | "renter";

interface UserModeContextType {
  currentMode: UserMode;
  switchMode: (mode: UserMode) => void;
  isUserBoth: boolean; // true se user.role === "both"
  primaryMode: UserMode; // Modo padrão de acordo com criação da conta
}

// Armazenado em localStorage para persistir entre sessões
// localStorage.setItem('riddy_user_mode', 'host' | 'renter')
```

**Vantagem:** Qualquer componente pode saber em qual modo está, sem passar props.

---

### 2️⃣ FLUXO DE LOGIN E DETERMINAÇÃO DO MODO PADRÃO

#### Cenário A: Usuário criado como LOCATÁRIO (renter)
```
Login → useAuth() retorna user.role = "user"
→ primaryMode = "renter"
→ Redireciona para /dashboard (dashboard de locatário)
→ Switcher mostra "Modo Locatário" (sem opção de alternar, pois é único)
```

#### Cenário B: Usuário criado como ANFITRIÃO (host)
```
Login → useAuth() retorna user.role = "host"
→ primaryMode = "host"
→ Redireciona para /host (dashboard de anfitrião)
→ Switcher mostra "Modo Anfitrião" (sem opção de alternar, pois é único)
```

#### Cenário C: Usuário criado como AMBOS (dual)
```
Login → useAuth() retorna user.role = "both"
→ primaryMode = "host" (padrão: anfitrião é geralmente o principal)
   OU primaryMode = "renter" (configurável por usuário)
→ Redireciona para /host ou /dashboard conforme primaryMode
→ Switcher mostra "Modo Anfitrião | Modo Locatário" (ambos clicáveis)
```

---

### 3️⃣ SWITCHER DE MODO (UI Component)

#### Localização: Header (sempre visível)

**Opção A: Dropdown no Avatar**
```
┌─────────────────────────────────┐
│ [Avatar] NS ▼                   │
├─────────────────────────────────┤
│ 👤 Perfil                       │
│ 🏠 Modo Anfitrião (atual)       │
│ 🚗 Modo Locatário               │
│ ⚙️  Configurações               │
│ 🚪 Sair                         │
└─────────────────────────────────┘
```
**Vantagem:** Não ocupa espaço no header, segue padrão do Instagram.

**Opção B: Toggle Explícito no Header**
```
Header: [Logo] [Busca] [🏠 Anfitrião | 🚗 Locatário] [Avatar]
```
**Vantagem:** Mais visível, deixa claro o modo atual.

**Opção C: Abas Sticky (como Instagram Stories)**
```
┌─────────────────────────────────┐
│ [🏠 Anfitrião] [🚗 Locatário]   │  ← Sticky no topo, abaixo do header
├─────────────────────────────────┤
│ Conteúdo do dashboard atual     │
└─────────────────────────────────┘
```
**Vantagem:** Muito claro, sempre visível, fácil de alternar.

---

### 4️⃣ TEMÁTICA E CORES POR MODO

#### Modo Anfitrião 🏠
- **Cor primária:** Orange/Amber (#FF8C42 ou similar)
- **Tema:** Gerenciamento, controle, propriedade
- **Ícone:** 🏠 Casa
- **Exemplos de seções:**
  - Minha Frota (carros + motos)
  - Reservas Recebidas
  - Ganhos
  - Avaliações
  - Documentos do Veículo

#### Modo Locatário 🚗
- **Cor primária:** Cyan/Turquoise (#00D9FF ou atual)
- **Tema:** Exploração, busca, viagens
- **Ícone:** 🚗 Carro
- **Exemplos de seções:**
  - Minhas Reservas
  - Favoritos
  - Histórico de Viagens
  - Avaliações Recebidas
  - Documentos Pessoais

---

### 5️⃣ ESTRUTURA DE ROTAS INTELIGENTE

#### Hoje (Problema):
```
/dashboard           → UserDashboard (locatário)
/host                → HostDashboardNew (anfitrião)
/admin               → AdminDashboardNew (admin)
```
**Problema:** Usuário "ambos" não sabe qual acessar, ou acessa a errada.

#### Proposta (Solução):
```
/dashboard           → Redireciona para /dashboard/renter ou /dashboard/host
                        conforme UserModeContext.currentMode

/dashboard/renter    → UserDashboard (sempre locatário)
/dashboard/host      → HostDashboardNew (sempre anfitrião)

/admin               → AdminDashboardNew (admin)
```

**Ou (mais elegante):**
```
/dashboard           → Dashboard Inteligente (renderiza conforme modo)
                        Se modo = "renter" → mostra conteúdo de locatário
                        Se modo = "host" → mostra conteúdo de anfitrião
                        Switcher no topo alterna entre os dois

/dashboard/renter    → Alias para /dashboard?mode=renter
/dashboard/host      → Alias para /dashboard?mode=host
```

---

### 6️⃣ FLUXO DE ALTERNÂNCIA DE MODO

#### Quando usuário clica em "Modo Anfitrião" (estando em Modo Locatário):

```
1. Clica no switcher
2. UserModeContext.switchMode("host") é chamado
3. localStorage.setItem('riddy_user_mode', 'host')
4. Componentes se re-renderizam com cores/ícones/dados do modo anfitrião
5. Navegação muda de /dashboard/renter para /dashboard/host
6. Temática muda (cyan → orange)
7. Sidebar/Menu muda (Minhas Reservas → Reservas Recebidas, etc)
8. Notificações mudam (mostra apenas notificações de anfitrião)
```

**Tudo em ~500ms, sem recarregar página.**

---

### 7️⃣ NOTIFICAÇÕES SEPARADAS POR MODO

#### Banco de Dados:
```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY,
  userId INT,
  mode ENUM('host', 'renter'),  -- ← NOVO: separa notificações por modo
  title VARCHAR(255),
  message TEXT,
  type ENUM('booking', 'payment', 'message', 'review'),
  isRead BOOLEAN,
  createdAt TIMESTAMP
);
```

#### Backend (tRPC):
```typescript
// Retorna notificações apenas do modo atual
trpc.notification.getNotifications.useQuery({
  mode: currentMode  // "host" ou "renter"
})
```

#### UI:
```
Modo Anfitrião:
  - "Nova reserva recebida de João"
  - "Pagamento confirmado: R$ 500"
  - "Avaliação 5⭐ de Maria"

Modo Locatário:
  - "Seu carro está pronto para retirada"
  - "Reembolso processado: R$ 100"
  - "Proprietário respondeu sua mensagem"
```

---

### 8️⃣ PROTEÇÃO: Evitar Acesso Cruzado

#### Problema Atual:
```
Usuário "ambos" acessa /dashboard (renter)
Depois clica em "Reservas" → abre /bookings
Depois clica em "Minha Frota" → deveria ir para /host/fleet
MAS se não estiver protegido, pode ir para /dashboard/fleet (errado!)
```

#### Solução:
```typescript
// Criar hook: useRequireMode()
export function useRequireMode(requiredMode: UserMode) {
  const { currentMode } = useUserMode();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (currentMode !== requiredMode) {
      // Redireciona para o modo correto
      navigate(`/dashboard/${requiredMode}`);
    }
  }, [currentMode, requiredMode, navigate]);
}

// Usar em páginas:
export function HostFleet() {
  useRequireMode("host");  // Se não está em modo host, redireciona
  // ... resto do componente
}

export function MyBookings() {
  useRequireMode("renter");  // Se não está em modo renter, redireciona
  // ... resto do componente
}
```

---

### 9️⃣ EXEMPLO DE FLUXO COMPLETO

#### Usuário "Ambos" (João):

```
1. João faz login
   → user.role = "both"
   → primaryMode = "host" (padrão)
   → Redireciona para /dashboard/host

2. Dashboard Anfitrião carrega
   - Header: [Logo] [Busca] [🏠 Anfitrião | 🚗 Locatário] [Avatar]
   - Sidebar: Minha Frota, Reservas Recebidas, Ganhos, etc
   - Cores: Orange/Amber
   - Notificações: "Nova reserva de Maria", "Pagamento recebido"

3. João clica em "🚗 Locatário"
   - UserModeContext muda para "renter"
   - localStorage atualiza
   - Página re-renderiza em ~300ms
   - Header: [Logo] [Busca] [🏠 Anfitrião | 🚗 Locatário] [Avatar]
   - Sidebar: Minhas Reservas, Favoritos, Histórico, etc
   - Cores: Cyan/Turquoise
   - Notificações: "Seu carro está pronto", "Reembolso processado"

4. João clica em "Minhas Reservas"
   - useRequireMode("renter") valida
   - Mostra reservas que João fez (como locatário)

5. João clica em "🏠 Anfitrião" novamente
   - Volta para modo anfitrião
   - Tudo muda de volta (cores, sidebar, notificações)
   - Se estava em /dashboard/renter/bookings, redireciona para /dashboard/host/fleet
```

---

## 🎨 COMPARAÇÃO COM INSTAGRAM

| Aspecto | Instagram | RIDDY (Proposto) |
|---------|-----------|------------------|
| **Modo Pessoal** | Perfil pessoal | Modo Locatário |
| **Modo Comercial** | Conta de Negócios | Modo Anfitrião |
| **Switcher** | Dropdown no perfil | Dropdown no avatar OU Toggle no header |
| **Mudança de Temática** | Sim (algumas opções) | Sim (cores, sidebar, notificações) |
| **Persistência** | localStorage | localStorage |
| **Notificações** | Separadas por tipo | Separadas por modo |
| **Fluxo Contínuo** | Sem recarregar página | Sem recarregar página |

---

## 🚀 IMPLEMENTAÇÃO: Fases

### Fase 1: Contexto e Lógica
- [ ] Criar `UserModeContext`
- [ ] Implementar `useUserMode()` hook
- [ ] Adicionar lógica de persistência (localStorage)
- [ ] Atualizar `useAuth()` para determinar `primaryMode`

### Fase 2: UI do Switcher
- [ ] Criar componente `ModeSwitcher`
- [ ] Integrar no Header
- [ ] Estilizar conforme modo (cores dinâmicas)

### Fase 3: Proteção de Rotas
- [ ] Criar hook `useRequireMode()`
- [ ] Aplicar em todas as páginas de dashboard
- [ ] Testar redirecionamentos

### Fase 4: Temática Dinâmica
- [ ] Criar sistema de temas por modo
- [ ] Atualizar CSS variables conforme modo
- [ ] Mudar ícones/cores do sidebar

### Fase 5: Notificações
- [ ] Adicionar coluna `mode` na tabela `notifications`
- [ ] Filtrar notificações por modo no backend
- [ ] Atualizar UI de notificações

### Fase 6: Testes
- [ ] Testar alternância sem recarregar
- [ ] Testar proteção de rotas
- [ ] Testar persistência (fechar/abrir navegador)
- [ ] Testar com usuários "ambos"

---

## ❓ DECISÕES PENDENTES

1. **Switcher no Header:** Dropdown vs Toggle vs Abas?
2. **Modo Padrão para "Ambos":** Host ou Renter?
3. **Temática:** Apenas cores, ou também layout/componentes?
4. **URL:** Manter `/dashboard` inteligente ou separar em `/dashboard/host` e `/dashboard/renter`?
5. **Animação:** Transição suave entre modos ou instantânea?

---

## 📊 Benefícios

✅ **Clareza:** Usuário sempre sabe em qual modo está  
✅ **Segurança:** Acesso cruzado bloqueado automaticamente  
✅ **UX:** Sem recarregar página, transição suave  
✅ **Escalabilidade:** Fácil adicionar novos modos no futuro  
✅ **Inspiração Instagram:** Familiar para usuários  
✅ **Notificações Inteligentes:** Não mistura contextos  
