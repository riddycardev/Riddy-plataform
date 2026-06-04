import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  /**
   * staleTime: Infinity → auth.me NUNCA é considerado stale enquanto a sessão estiver ativa.
   * Isso significa que navegar entre abas NÃO dispara um novo fetch do usuário.
   * O dado só é re-buscado quando explicitamente invalidado (ex: logout, troca de modo).
   *
   * gcTime: 30 minutos → mantém o dado em memória por 30min após ser desmontado.
   * Se o usuário sair e voltar para uma página protegida, o dado ainda está em cache.
   *
   * refetchOnWindowFocus: false → focar a janela não re-busca o usuário.
   * refetchOnReconnect: false → reconexão de rede não re-busca o usuário.
   */
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,           // nunca stale — só invalida explicitamente
    gcTime: 30 * 60 * 1000,       // 30 minutos em memória
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      /**
       * loading: usa isFetching em vez de isLoading.
       * isLoading é true apenas quando NÃO há dados em cache E está buscando.
       * isFetching é true sempre que está buscando (mesmo com dados em cache).
       *
       * Para evitar loading bloqueante ao navegar entre páginas:
       * - Se há dados em cache (isLoading=false, isFetching=true) → não bloquear
       * - Só bloquear quando realmente não há dados (isLoading=true)
       *
       * Resultado: ao navegar entre abas, o usuário já está disponível imediatamente
       * do cache e não vê tela de loading.
       */
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
