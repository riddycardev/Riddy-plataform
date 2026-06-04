/**
 * ProtectedRoute — Guard de autenticação e autorização por role.
 *
 * DESIGN PRINCIPLES:
 * 1. Verifica APENAS autenticação e role — NÃO verifica mode ativo.
 *    O mode (renter/host) é uma preferência de UI, não uma permissão de acesso.
 *    Componentes de página devem gerenciar o mode internamente se necessário.
 *
 * 2. Role hierarchy:
 *    - admin  → acesso total (todas as rotas)
 *    - both   → acesso a rotas de host E de user
 *    - host   → acesso apenas a rotas de host
 *    - user   → acesso apenas a rotas sem requiredRole ou com requiredRole="user"
 *
 * 3. Performance: spinner só aparece quando NÃO há dados em cache (user === null).
 *    Com staleTime: Infinity no auth.me, o user está em cache ao navegar entre abas.
 *
 * 4. Sem "Acesso Negado" por erro interno: se o role é insuficiente, redireciona
 *    silenciosamente para o dashboard correto, sem mostrar mensagem de erro.
 *    A mensagem de "Acesso Negado" só aparece quando o role realmente não tem permissão
 *    (ex: role=user tentando acessar /host diretamente via URL).
 */

import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type UserRole = "user" | "host" | "admin" | "both";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Se definido, exige que o usuário tenha o role especificado (ou superior). */
  requiredRole?: "user" | "host" | "admin";
  /** Rota de redirecionamento customizada em caso de acesso negado. */
  redirectTo?: string;
}

/**
 * Verifica se o role do usuário tem acesso ao requiredRole.
 *
 * Tabela de acesso:
 * | userRole | requiredRole="user" | requiredRole="host" | requiredRole="admin" |
 * |----------|---------------------|---------------------|----------------------|
 * | user     | ✅                  | ❌                  | ❌                   |
 * | host     | ❌                  | ✅                  | ❌                   |
 * | both     | ✅                  | ✅                  | ❌                   |
 * | admin    | ✅                  | ✅                  | ✅                   |
 */
function hasRoleAccess(userRole: UserRole, requiredRole: "user" | "host" | "admin"): boolean {
  if (userRole === "admin") return true;
  if (requiredRole === "admin") return false;
  if (userRole === "both") return true; // both pode acessar host e user
  return userRole === requiredRole;
}

/**
 * Retorna a rota padrão do dashboard para o role do usuário.
 * Usado para redirecionar após acesso negado.
 */
function getDefaultDashboard(userRole: UserRole): string {
  if (userRole === "admin") return "/admin";
  if (userRole === "host" || userRole === "both") return "/host";
  return "/dashboard";
}

export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const redirectedRef = useRef(false);

  // ── Redirect unauthenticated users ────────────────────────────────────────
  useEffect(() => {
    if (loading && !user) return; // Aguardar carregamento inicial
    if (isAuthenticated && user) return; // Autenticado — ok

    if (redirectedRef.current) return;
    redirectedRef.current = true;

    // Não autenticado: redirecionar para login preservando destino
    const currentPath =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/";
    const loginUrl = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
    navigate(loginUrl);
  }, [loading, isAuthenticated, user, navigate]);

  // ── Redirect unauthorized users ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (!requiredRole) return;

    const userRole = user.role as UserRole;
    if (hasRoleAccess(userRole, requiredRole)) return; // Autorizado — ok

    if (redirectedRef.current) return;
    redirectedRef.current = true;

    // Role insuficiente: redirecionar silenciosamente para dashboard correto
    navigate(redirectTo ?? getDefaultDashboard(userRole));
  }, [user, requiredRole, navigate, redirectTo]);

  // ── Render: loading (somente na primeira carga, sem cache) ────────────────
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // ── Render: not authenticated (redirect happening in useEffect) ────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          <p className="text-gray-400 text-sm">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  // ── Render: no role required → allow ──────────────────────────────────────
  if (!requiredRole) {
    return <>{children}</>;
  }

  const userRole = user.role as UserRole;
  const hasRole = hasRoleAccess(userRole, requiredRole);

  // ── Render: unauthorized (redirect happening in useEffect) ────────────────
  // Mostrar "Acesso Negado" brevemente antes do redirect automático
  if (!hasRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <Card className="max-w-md w-full bg-slate-900/50 border-red-500/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
            <p className="text-gray-400 mb-6">
              Você não tem permissão para acessar esta área. Esta página é exclusiva para{" "}
              {requiredRole === "admin" && "Administradores"}
              {requiredRole === "host" && "Proprietários"}
              {requiredRole === "user" && "Usuários"}.
            </p>
            <Button
              onClick={() => navigate(redirectTo ?? getDefaultDashboard(userRole))}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Ir para Meu Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render: authorized ────────────────────────────────────────────────────
  return <>{children}</>;
}
