import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * ScrollToTop Component
 * 
 * Observa mudanças de rota e executa scroll para o topo da página.
 * Também reseta o scroll de containers internos com overflow.
 * 
 * Deve ser colocado no topo do App.tsx, dentro do Router.
 */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll global para o topo
    window.scrollTo(0, 0);

    // Reseta scroll de containers internos com overflow
    // Cars.tsx e Motorcycles.tsx têm containers com overflow-y-auto
    const scrollableContainers = document.querySelectorAll(
      "[class*='overflow-y-auto'], [class*='overflow-auto']"
    );
    
    scrollableContainers.forEach((container) => {
      if (container instanceof HTMLElement) {
        container.scrollTop = 0;
      }
    });
  }, [location]);

  return null;
}
