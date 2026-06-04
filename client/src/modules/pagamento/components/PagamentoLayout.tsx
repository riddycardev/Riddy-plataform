import { ReactNode } from "react";

interface PagamentoLayoutProps {
  children: ReactNode;
}

/**
 * PagamentoLayout - Layout para o módulo PAGAMENTO
 * Responsável por gerenciar pagamentos, faturas e métodos de pagamento
 */
export default function PagamentoLayout({ children }: PagamentoLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar com navegação de pagamentos */}
      <div className="flex">
        <aside className="w-64 border-r border-border bg-card p-6">
          <nav className="space-y-2">
            <a href="/payments" className="block px-4 py-2 rounded-lg hover:bg-accent">
              Dashboard
            </a>
            <a href="/payments/history" className="block px-4 py-2 rounded-lg hover:bg-accent">
              Histórico
            </a>
            <a href="/payments/methods" className="block px-4 py-2 rounded-lg hover:bg-accent">
              Métodos de Pagamento
            </a>
          </nav>
        </aside>
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
