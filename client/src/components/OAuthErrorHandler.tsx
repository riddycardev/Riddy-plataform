/**
 * OAuth Error Handler Component
 * Displays helpful error messages when OAuth redirect URI is not configured
 */

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  getAllRegisteredRedirectUris,
  getEnvironmentRedirectUri,
  getEnvironmentName,
} from "@/lib/oauth-config";

interface OAuthErrorHandlerProps {
  error?: string | null;
  onRetry?: () => void;
}

export function OAuthErrorHandler({
  error,
  onRetry,
}: OAuthErrorHandlerProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Check if error is OAuth redirect URI related
  const isRedirectUriError =
    error &&
    (error.includes("redirecionamento") ||
      error.includes("redirect") ||
      error.includes("Permissão negada") ||
      error.includes("Permission denied"));

  if (!isRedirectUriError) {
    return null;
  }

  const currentUri = getEnvironmentRedirectUri();
  const registeredUris = getAllRegisteredRedirectUris();
  const environment = getEnvironmentName();

  return (
    <Alert className="border-red-500/50 bg-red-500/10 mb-4">
      <AlertCircle className="h-4 w-4 text-red-500" />
      <AlertTitle className="text-red-500">
        Erro de Configuração OAuth
      </AlertTitle>
      <AlertDescription className="text-red-400 space-y-3">
        <p>
          A URI de redirecionamento não está configurada no servidor OAuth.
        </p>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm underline hover:no-underline text-red-300"
        >
          {showDetails ? "Ocultar detalhes" : "Mostrar detalhes técnicos"}
        </button>

        {showDetails && (
          <div className="mt-3 p-3 bg-black/30 rounded text-xs font-mono space-y-2">
            <div>
              <p className="text-gray-400">Ambiente detectado:</p>
              <p className="text-red-300">{environment}</p>
            </div>
            <div>
              <p className="text-gray-400">URI atual:</p>
              <p className="text-red-300 break-all">{currentUri}</p>
            </div>
            <div>
              <p className="text-gray-400">URIs registradas:</p>
              <ul className="text-red-300 space-y-1">
                {registeredUris.map((uri, idx) => (
                  <li key={idx} className="break-all">
                    • {uri}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="border-red-500/50 hover:bg-red-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              window.location.href = "/";
            }}
            className="border-red-500/50 hover:bg-red-500/10"
          >
            Voltar ao Início
          </Button>
        </div>

        <p className="text-xs text-gray-400 pt-2">
          Se o problema persistir, entre em contato com o suporte técnico.
        </p>
      </AlertDescription>
    </Alert>
  );
}
