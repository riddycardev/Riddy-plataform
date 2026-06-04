import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { StoryEventProvider } from "./contexts/StoryEventContext";
import "./index.css";

/**
 * QueryClient com cache agressivo para evitar re-fetches desnecessários entre páginas.
 *
 * - staleTime: 5 minutos → dados permanecem "frescos" por 5min após o fetch inicial.
 *   Navegar entre abas NÃO dispara novo fetch enquanto os dados estiverem frescos.
 * - gcTime: 10 minutos → dados ficam em memória por 10min após serem desmontados.
 *   Voltar para uma página já visitada exibe os dados imediatamente (sem skeleton).
 * - refetchOnWindowFocus: false → foco na janela não dispara re-fetch (comportamento de app nativo).
 * - refetchOnReconnect: false → reconexão de rede não re-busca dados já em cache.
 * - retry: 1 → apenas 1 retry em caso de falha (evita cascata de requests).
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutos
      gcTime: 10 * 60 * 1000,          // 10 minutos
      refetchOnWindowFocus: false,      // não re-busca ao focar a janela
      refetchOnReconnect: false,        // não re-busca ao reconectar
      retry: 1,                         // apenas 1 retry
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <StoryEventProvider>
        <App />
      </StoryEventProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
