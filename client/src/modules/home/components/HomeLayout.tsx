import { ReactNode } from "react";

interface HomeLayoutProps {
  children: ReactNode;
}

/**
 * HomeLayout - Layout para o módulo HOME
 * Responsável por apresentar a landing page e permitir busca inicial
 */
export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header será renderizado pelo componente pai */}
      <main className="flex-1">
        {children}
      </main>
      {/* Footer será renderizado pelo componente pai */}
    </div>
  );
}
