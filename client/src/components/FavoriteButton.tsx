import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

interface FavoriteButtonProps {
  vehicleId: number;
  className?: string;
  size?: "sm" | "md";
}

/**
 * FavoriteButton — Heart icon that toggles favorite state with optimistic update.
 * Shows filled red heart when favorited, outline when not.
 * Redirects to login if user is not authenticated.
 */
export function FavoriteButton({ vehicleId, className = "", size = "sm" }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const favorited = isFavorite(vehicleId);

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const btnSize = size === "sm" ? "w-7 h-7" : "w-9 h-9";

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info("Faça login para salvar favoritos", {
        description: "Entre na sua conta para salvar seus veículos favoritos.",
        action: {
          label: "Entrar",
          onClick: () => { window.location.href = getLoginUrl(); },
        },
      });
      return;
    }

    toggle(vehicleId);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={`${btnSize} rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={favorited ? "filled" : "empty"}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Heart
            className={`${iconSize} transition-colors ${
              favorited ? "fill-red-500 text-red-500" : "text-white"
            }`}
          />
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
