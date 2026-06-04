import { useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * useLoginWelcome — detects ?login_success=1 in the URL after OAuth redirect
 * and shows a personalized welcome toast.
 * Cleans up the query param without adding a history entry.
 */
export function useLoginWelcome() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("login_success")) return;

    // Remove the param from the URL without a history push
    params.delete("login_success");
    const newSearch = params.toString();
    const cleanPath = window.location.pathname + (newSearch ? `?${newSearch}` : "");
    window.history.replaceState(null, "", cleanPath);

    // Show welcome toast
    const firstName = user?.name?.split(" ")[0] ?? "de volta";
    toast.success(`Bem-vindo, ${firstName}! 👋`, {
      description: "Você entrou com sucesso na sua conta Riddy.",
      duration: 4000,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
