/**
 * ETAPA 13 — Hook useCsrf
 *
 * Busca e armazena o token CSRF do endpoint /api/csrf-token.
 * O token é incluído automaticamente no header `x-csrf-token`
 * de todas as mutations sensíveis via tRPC link customizado.
 *
 * Uso:
 * ```tsx
 * const { csrfToken, isLoading } = useCsrf();
 *
 * // Passar o token para mutations sensíveis:
 * const mutation = trpc.payment.processBookingPayment.useMutation();
 * mutation.mutate(input, { meta: { csrfToken } });
 * ```
 *
 * Nota: O token é renovado automaticamente a cada 3h50min
 * (antes do TTL de 4h expirar no servidor).
 */

import { useState, useEffect, useCallback, useRef } from "react";

const CSRF_ENDPOINT = "/api/csrf-token";
const REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000 + 50 * 60 * 1000; // 3h50min

interface CsrfState {
  csrfToken: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCsrf(): CsrfState {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(CSRF_ENDPOINT, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`CSRF endpoint returned ${res.status}`);
      }
      const data = await res.json() as { csrfToken: string };
      setCsrfToken(data.csrfToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao obter token CSRF";
      setError(msg);
      console.error("[useCsrf] Failed to fetch CSRF token:", msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch on mount
    fetchToken();

    // Auto-refresh before TTL expires
    intervalRef.current = setInterval(fetchToken, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchToken]);

  return {
    csrfToken,
    isLoading,
    error,
    refresh: fetchToken,
  };
}

/**
 * Utilitário para incluir o token CSRF no header de uma requisição fetch manual.
 * Para uso fora de componentes React.
 */
export async function fetchCsrfToken(): Promise<string> {
  const res = await fetch(CSRF_ENDPOINT, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`CSRF endpoint returned ${res.status}`);
  }
  const data = await res.json() as { csrfToken: string };
  return data.csrfToken;
}

/**
 * Constante com o nome do header CSRF — deve coincidir com o servidor.
 */
export const CSRF_HEADER = "x-csrf-token";
