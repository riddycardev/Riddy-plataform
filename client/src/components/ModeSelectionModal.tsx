/**
 * ModeSelectionModal — Modal de onboarding de primeiro acesso.
 *
 * Exibido apenas uma vez, quando o usuário faz login pela primeira vez
 * e ainda não escolheu seu modo operacional (locatário ou anfitrião).
 *
 * Após a escolha:
 * - Salva o modo no banco via UserModeContext.setMode()
 * - Marca o onboarding como concluído no localStorage
 * - Redireciona para o dashboard correto
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Car, Home, ArrowRight, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUserMode } from "@/contexts/UserModeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

export function ModeSelectionModal() {
  const { needsModeSelection, setMode, activateHostMode, completeModeSelection, isSwitching, canSwitchToHost } = useUserMode();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<"renter" | "host" | null>(null);

  const handleConfirm = async () => {
    if (!selected) return;

    if (selected === "host") {
      // SECURITY: Se o usuário ainda não tem role de host, usar activateHostMode
      // (que converte role=user para role=both no backend).
      // Se já tem role de host/both/admin, apenas alternar o modo ativo.
      if (!canSwitchToHost) {
        await activateHostMode();
      } else {
        await setMode("host");
      }
      completeModeSelection();
      navigate("/host");
    } else {
      await setMode("renter");
      completeModeSelection();
      navigate("/dashboard");
    }
  };

  return (
    <Dialog open={needsModeSelection} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md bg-[#0A0F1C] border border-white/10 p-0 overflow-hidden"
        // Impedir fechamento pelo usuário — ele deve escolher
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header do modal */}
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
            <span className="text-[#0A0F1C] font-black text-2xl">R</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Bem-vindo à RIDDY!</h2>
          <p className="text-sm text-gray-400">
            Como você quer começar? Você pode mudar isso a qualquer momento.
          </p>
        </div>

        {/* Opções */}
        <div className="px-6 pb-4 grid grid-cols-2 gap-3">
          {/* Locatário */}
          <button
            onClick={() => setSelected("renter")}
            className={cn(
              "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200",
              selected === "renter"
                ? "border-cyan-400 bg-cyan-500/10"
                : "border-white/10 bg-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/5"
            )}
          >
            {selected === "renter" && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center">
                <svg className="w-3 h-3 text-[#0A0F1C]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              selected === "renter" ? "bg-cyan-500/20" : "bg-white/10"
            )}>
              <Car className={cn("w-6 h-6", selected === "renter" ? "text-cyan-400" : "text-gray-400")} />
            </div>
            <div className="text-center">
              <p className={cn("font-semibold text-sm", selected === "renter" ? "text-cyan-400" : "text-white")}>
                Locatário
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Quero alugar carros</p>
            </div>
          </button>

          {/* Anfitrião */}
          <button
            onClick={() => setSelected("host")}
            className={cn(
              "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200",
              selected === "host"
                ? "border-emerald-400 bg-emerald-500/10"
                : "border-white/10 bg-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5"
            )}
          >
            {selected === "host" && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
                <svg className="w-3 h-3 text-[#0A0F1C]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              selected === "host" ? "bg-emerald-500/20" : "bg-white/10"
            )}>
              <Home className={cn("w-6 h-6", selected === "host" ? "text-emerald-400" : "text-gray-400")} />
            </div>
            <div className="text-center">
              <p className={cn("font-semibold text-sm", selected === "host" ? "text-emerald-400" : "text-white")}>
                Anfitrião
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Quero listar meu carro</p>
            </div>
          </button>
        </div>

        {/* Nota informativa */}
        <p className="px-6 text-center text-xs text-gray-500">
          Você pode ter os dois modos ativos e alternar quando quiser.
        </p>

        {/* Botão de confirmação */}
        <div className="px-6 py-5">
          <Button
            onClick={handleConfirm}
            disabled={!selected || isSwitching}
            className={cn(
              "w-full h-12 font-semibold text-sm transition-all",
              selected === "host"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white"
                : selected === "renter"
                ? "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-[#0A0F1C]"
                : "bg-white/10 text-gray-500 cursor-not-allowed"
            )}
          >
            {isSwitching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                Começar como {selected === "host" ? "Anfitrião" : selected === "renter" ? "Locatário" : "..."}
                {selected && <ArrowRight className="ml-2 h-4 w-4" />}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
