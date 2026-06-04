import { ReactNode } from "react";

interface AluguelLayoutProps {
  children: ReactNode;
}

/**
 * AluguelLayout - Layout para o módulo ALUGUEL
 * Responsável por gerenciar busca, visualização e reserva de veículos
 */
export default function AluguelLayout({ children }: AluguelLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Barra de busca persistente */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        {/* Busca será renderizada aqui */}
      </div>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
