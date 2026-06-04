/**
 * OAuth Error Page
 * Handles OAuth callback errors and provides recovery options
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAllRegisteredRedirectUris,
  getEnvironmentRedirectUri,
  getEnvironmentName,
} from "@/lib/oauth-config";

export default function OAuthError() {
  const [, setLocation] = useLocation();
  const [showDetails, setShowDetails] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const currentUri = getEnvironmentRedirectUri();
  const registeredUris = getAllRegisteredRedirectUris();
  const environment = getEnvironmentName();

  // Get error message from URL params
  const errorMessage =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("error") ||
        "Erro desconhecido na autenticação"
      : "Erro desconhecido na autenticação";

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    // Retry the login flow
    const loginUrl = new URL(window.location.href);
    loginUrl.searchParams.set("retry", (retryCount + 1).toString());
    window.location.href = loginUrl.toString();
  };

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-[100svh] bg-[#0A0F1C] flex items-center justify-center p-4 sm:p-6">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-[#0F1629]/90 border border-red-500/20 rounded-lg backdrop-blur-xl relative z-10 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Erro de Autenticação</h1>
          <p className="text-gray-400 text-sm">
            Houve um problema ao conectar com o servidor de autenticação
          </p>
        </div>

        {/* Error Message */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm break-words">{errorMessage}</p>
        </div>

        {/* Technical Details */}
        <div className="space-y-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-left text-sm text-gray-400 hover:text-gray-300 flex items-center gap-2 transition-colors"
          >
            <span className="text-xs">
              {showDetails ? "▼" : "▶"}
            </span>
            Detalhes Técnicos
          </button>

          {showDetails && (
            <div className="bg-black/30 rounded-lg p-4 text-xs font-mono space-y-3 text-gray-300">
              <div>
                <p className="text-gray-500 mb-1">Ambiente:</p>
                <p className="text-cyan-400">{environment}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">URI Atual:</p>
                <p className="text-cyan-400 break-all">{currentUri}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">URIs Registradas:</p>
                <ul className="space-y-1 text-cyan-400">
                  {registeredUris.map((uri, idx) => (
                    <li key={idx} className="break-all">
                      {idx + 1}. {uri}
                    </li>
                  ))}
                </ul>
              </div>
              {retryCount > 0 && (
                <div>
                  <p className="text-gray-500 mb-1">Tentativas:</p>
                  <p className="text-orange-400">{retryCount}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleRetry}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold h-11"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full border-gray-600 hover:bg-gray-900 h-11"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
        </div>

        {/* Help Text */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-xs text-blue-300 space-y-2">
          <p className="font-semibold">Dicas para resolver:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Verifique sua conexão com a internet</li>
            <li>Limpe os cookies do navegador</li>
            <li>Tente novamente em alguns minutos</li>
            <li>Se o problema persistir, entre em contato com o suporte</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
