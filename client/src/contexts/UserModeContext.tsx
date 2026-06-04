/**
 * UserModeContext — Contexto operacional do usuário
 *
 * Gerencia o modo ativo do usuário (renter | host | admin) com:
 * - Persistência em localStorage (imediata) + banco de dados (assíncrona)
 * - Onboarding de primeiro acesso: exibe modal de escolha de modo
 * - Separação completa de contexto: cada modo tem seu próprio fluxo
 * - Proteção: modo host só disponível para role host | both | admin
 *
 * Uso:
 *   const { mode, setMode, isHost, isRenter, isAdmin, canSwitchToHost } = useUserMode();
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type UserMode = "renter" | "host" | "admin";

interface UserModeContextType {
  /** Modo operacional atual */
  mode: UserMode;
  /** Alterna para um novo modo (persiste no banco) */
  setMode: (mode: UserMode) => Promise<void>;
  /** Ativa o modo anfitrião (converte role para 'both' se necessário) */
  activateHostMode: () => Promise<void>;
  /** Atalhos de verificação */
  isRenter: boolean;
  isHost: boolean;
  isAdmin: boolean;
  /** Usuário pode alternar para modo host (tem role host | both | admin) */
  canSwitchToHost: boolean;
  /** Usuário pode alternar entre modos (tem role both | admin) */
  canSwitch: boolean;
  /** Onboarding: true se é primeiro acesso e ainda não escolheu modo */
  needsModeSelection: boolean;
  /** Marca o onboarding como concluído */
  completeModeSelection: () => void;
  /** Estado de carregamento durante a troca de modo */
  isSwitching: boolean;
}

const UserModeContext = createContext<UserModeContextType | undefined>(
  undefined
);

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "riddy_active_mode";
const ONBOARDING_KEY = "riddy_mode_selected";

// Roles que permitem modo host
const HOST_ROLES = ["host", "both", "admin"];
// Roles que permitem alternância entre modos
const SWITCHABLE_ROLES = ["both", "admin"];

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserModeProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const updateActiveModeM = trpc.user.updateActiveMode.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
  });

  const activateHostModeM = trpc.user.activateHostMode.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
  });

  // ── Determinar modo inicial ────────────────────────────────────────────────
  const [mode, setModeState] = useState<UserMode>(() => {
    // Admin sempre começa em admin
    if (user?.role === "admin") return "admin";

    // Tentar recuperar do localStorage primeiro (resposta imediata)
    const stored = localStorage.getItem(STORAGE_KEY) as UserMode | null;
    if (stored && ["renter", "host", "admin"].includes(stored)) {
      // Validar: se stored é host mas user não tem permissão, usar renter
      if (stored === "host" && user && !HOST_ROLES.includes(user.role)) {
        return "renter";
      }
      return stored;
    }

    // Fallback: usar activeMode do banco
    if (user?.activeMode) {
      return user.activeMode as UserMode;
    }

    // Fallback final: baseado no role
    if (user?.role === "host") return "host";
    return "renter";
  });

  const [isSwitching, setIsSwitching] = useState(false);

  // ── Onboarding: primeiro acesso ───────────────────────────────────────────
  const [needsModeSelection, setNeedsModeSelection] = useState(() => {
    if (!isAuthenticated) return false;
    // Se já escolheu antes, não mostrar novamente
    const selected = localStorage.getItem(ONBOARDING_KEY);
    if (selected) return false;
    // Se o banco já tem activeMode definido, não mostrar
    if (user?.activeMode) return false;
    // Mostrar apenas para usuários autenticados sem modo definido
    return true;
  });

  // ── Sincronizar modo com o usuário autenticado ────────────────────────────
  useEffect(() => {
    if (!user) return;

    // Admin sempre fica em admin
    if (user.role === "admin") {
      setModeState("admin");
      localStorage.setItem(STORAGE_KEY, "admin");
      return;
    }

    // Se o banco tem activeMode e é diferente do local, sincronizar
    if (user.activeMode) {
      const bankMode = user.activeMode as UserMode;
      const localMode = localStorage.getItem(STORAGE_KEY) as UserMode | null;

      // Banco tem prioridade sobre localStorage (sessão anterior pode ter mudado)
      if (bankMode !== localMode) {
        setModeState(bankMode);
        localStorage.setItem(STORAGE_KEY, bankMode);
      }
    }

    // Verificar se precisa de onboarding
    const selected = localStorage.getItem(ONBOARDING_KEY);
    if (!selected && !user.activeMode) {
      setNeedsModeSelection(true);
    }
  }, [user]);

  // ── Função de troca de modo ───────────────────────────────────────────────
  const setMode = useCallback(
    async (newMode: UserMode) => {
      if (!user) return;
      if (newMode === mode) return;

      // Admin não pode sair do modo admin via UI normal
      if (user.role === "admin" && newMode !== "admin") return;

      // Validação: modo host requer role adequado
      if (newMode === "host" && !HOST_ROLES.includes(user.role)) {
        console.warn("[UserMode] Tentativa de ativar modo host sem permissão");
        return;
      }

      setIsSwitching(true);

      // Atualizar localStorage imediatamente (UX responsiva)
      setModeState(newMode);
      localStorage.setItem(STORAGE_KEY, newMode);

      // Persistir no banco de forma assíncrona
      try {
        if (newMode !== "admin") {
          await updateActiveModeM.mutateAsync({ mode: newMode as "renter" | "host" });
        }
      } catch (error) {
        console.error("[UserMode] Erro ao persistir modo:", error);
        // Não reverter: localStorage já foi atualizado, banco tentará na próxima sessão
      } finally {
        setIsSwitching(false);
      }
    },
    [user, mode, updateActiveModeM]
  );

  // ── Ativar modo anfitrião (converte role se necessário) ───────────────────
  const activateHostMode = useCallback(async () => {
    if (!user) return;

    setIsSwitching(true);
    try {
      await activateHostModeM.mutateAsync();
      setModeState("host");
      localStorage.setItem(STORAGE_KEY, "host");
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch (error) {
      console.error("[UserMode] Erro ao ativar modo anfitrião:", error);
      throw error;
    } finally {
      setIsSwitching(false);
    }
  }, [user, activateHostModeM]);

  // ── Concluir onboarding ───────────────────────────────────────────────────
  const completeModeSelection = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setNeedsModeSelection(false);
  }, []);

  // ── Valores derivados ─────────────────────────────────────────────────────
  const value = useMemo<UserModeContextType>(
    () => ({
      mode,
      setMode,
      activateHostMode,
      isRenter: mode === "renter",
      isHost: mode === "host",
      isAdmin: mode === "admin",
      canSwitchToHost: !!user && HOST_ROLES.includes(user.role),
      canSwitch: !!user && SWITCHABLE_ROLES.includes(user.role),
      needsModeSelection,
      completeModeSelection,
      isSwitching,
    }),
    [mode, setMode, activateHostMode, user, needsModeSelection, completeModeSelection, isSwitching]
  );

  return (
    <UserModeContext.Provider value={value}>
      {children}
    </UserModeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUserMode() {
  const context = useContext(UserModeContext);
  if (!context) {
    throw new Error("useUserMode must be used within UserModeProvider");
  }
  return context;
}
