/**
 * ChunkErrorBoundary — Specialized ErrorBoundary for React.lazy chunk failures.
 *
 * Distinguishes between:
 * - Chunk load errors (network/cache): shows "Atualizar aplicação" UI
 * - Regular runtime errors: shows generic error UI with stack trace
 *
 * The "Atualizar aplicação" button forces a hard reload (bypassing cache)
 * so the browser fetches the latest HTML and chunk references.
 */

import { Component, ReactNode } from "react";
import { isChunkLoadError } from "@/lib/lazyWithRetry";

interface Props {
  children: ReactNode;
  /** Optional custom fallback for non-chunk errors */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  error: Error | null;
  reloadCount: number;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isChunkError: false,
      error: null,
      reloadCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      isChunkError: isChunkLoadError(error),
      error,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ChunkErrorBoundary] Caught error:", error, info);

    // Auto-reload once for chunk errors (without user interaction)
    if (isChunkLoadError(error)) {
      const autoReloadKey = "riddy_auto_reload_count";
      const count = parseInt(sessionStorage.getItem(autoReloadKey) || "0");

      if (count < 1) {
        sessionStorage.setItem(autoReloadKey, String(count + 1));
        // Delay slightly so the user sees the loading state briefly
        setTimeout(() => window.location.reload(), 1500);
        this.setState({ reloadCount: count + 1 });
      }
    }
  }

  handleManualReload = () => {
    // Clear all chunk-related session flags
    sessionStorage.removeItem("riddy_chunk_reload_attempted");
    sessionStorage.removeItem("riddy_auto_reload_count");
    // Hard reload — bypasses browser cache
    window.location.reload();
  };

  handleGoHome = () => {
    sessionStorage.removeItem("riddy_chunk_reload_attempted");
    sessionStorage.removeItem("riddy_auto_reload_count");
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.state.isChunkError) {
      // Auto-reloading state (first attempt)
      if (this.state.reloadCount > 0) {
        return (
          <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center px-4">
            <div className="text-center max-w-sm">
              {/* Animated RIDDY logo */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center animate-pulse">
                <span className="text-black font-black text-2xl">R</span>
              </div>
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-semibold text-lg mb-2">Atualizando aplicação...</p>
              <p className="text-gray-400 text-sm">
                Uma nova versão está disponível. Recarregando automaticamente.
              </p>
            </div>
          </div>
        );
      }

      // Manual reload required (auto-reload already tried)
      return (
        <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            {/* RIDDY logo */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
              <span className="text-black font-black text-2xl">R</span>
            </div>

            {/* Update icon */}
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>

            <h2 className="text-white font-bold text-xl mb-2">Nova versão disponível</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              A RIDDY foi atualizada. Clique no botão abaixo para carregar a versão mais recente.
            </p>

            <button
              onClick={this.handleManualReload}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-black font-bold py-3 px-6 rounded-xl transition-all duration-200 active:scale-95 mb-3"
            >
              Atualizar aplicação
            </button>

            <button
              onClick={this.handleGoHome}
              className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
            >
              Voltar para o início
            </button>
          </div>
        </div>
      );
    }

    // Generic runtime error (non-chunk) — show technical details
    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="text-white font-bold text-xl mb-2">Algo deu errado</h2>
          <p className="text-gray-400 text-sm mb-4">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4 text-left overflow-auto max-h-32">
              <pre className="text-red-400 text-xs whitespace-pre-wrap break-all">
                {this.state.error.message}
              </pre>
            </div>
          )}

          <button
            onClick={this.handleManualReload}
            className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 active:scale-95 mb-3"
          >
            Recarregar página
          </button>
          <button
            onClick={this.handleGoHome}
            className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }
}

export default ChunkErrorBoundary;
