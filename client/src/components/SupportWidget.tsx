/**
 * SupportWidget — Botão flutuante de suporte 24/7
 * Aparece no canto inferior direito em todas as páginas.
 */
import { useState } from "react";
import { HybridChat } from "./HybridChat";
import { Button } from "@/components/ui/button";
import { Headphones, X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  // Não exibe para usuários não autenticados (opcional: pode exibir mesmo assim)
  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {isOpen && (
        <div
          className={cn(
            "w-[340px] sm:w-[380px] shadow-2xl rounded-xl overflow-hidden",
            "animate-in slide-in-from-bottom-4 fade-in duration-200"
          )}
        >
          <HybridChat
            mode="support"
            className="h-[480px] flex flex-col"
          />
        </div>
      )}

      {/* Toggle button */}
      <Button
        size="icon"
        className={cn(
          "w-14 h-14 rounded-full shadow-lg transition-all duration-200",
          isOpen
            ? "bg-muted text-muted-foreground hover:bg-muted/80"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Fechar suporte" : "Abrir suporte 24/7"}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>

      {/* Tooltip quando fechado */}
      {!isOpen && (
        <span className="absolute bottom-16 right-0 bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          Suporte 24/7
        </span>
      )}
    </div>
  );
}
