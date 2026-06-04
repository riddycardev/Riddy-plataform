import { ReactNode } from "react";

interface EstrutuuraLayoutProps {
  children: ReactNode;
  section?: "user" | "host" | "admin";
}

/**
 * EstrutuuraLayout - Layout para o módulo ESTRUTURA
 * Responsável por gerenciar dashboards de usuário, host e admin
 */
export default function EstrutuuraLayout({ children, section = "user" }: EstrutuuraLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar com navegação contextual */}
      <div className="flex">
        <aside className="w-64 border-r border-border bg-card p-6">
          <nav className="space-y-2">
            {section === "user" && (
              <>
                <a href="/dashboard" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Dashboard
                </a>
                <a href="/profile" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Perfil
                </a>
                <a href="/documents" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Documentos
                </a>
                <a href="/my-bookings" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Minhas Reservas
                </a>
                <a href="/messages" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Mensagens
                </a>
              </>
            )}
            
            {section === "host" && (
              <>
                <a href="/host" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Dashboard
                </a>
                <a href="/host/vehicles" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Meus Veículos
                </a>
                <a href="/host/add-vehicle" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Adicionar Veículo
                </a>
                <a href="/host/bookings" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Reservas
                </a>
                <a href="/host/earnings" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Ganhos
                </a>
              </>
            )}
            
            {section === "admin" && (
              <>
                <a href="/admin" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Dashboard
                </a>
                <a href="/admin/vehicles" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Veículos
                </a>
                <a href="/admin/users" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Usuários
                </a>
                <a href="/admin/verification" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Verificações
                </a>
                <a href="/admin/reports" className="block px-4 py-2 rounded-lg hover:bg-accent">
                  Relatórios
                </a>
              </>
            )}
          </nav>
        </aside>
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
