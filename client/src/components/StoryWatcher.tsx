/**
 * StoryWatcher
 * Componente invisível montado no App.tsx que:
 * 1. Usa useStoryTrigger para exibir o toast premium quando um evento é emitido
 * 2. Faz polling do nível do usuário a cada 60s para detectar level up e marcos de km
 * 3. Emite eventos automáticos quando detecta mudanças
 *
 * Não renderiza nada visível — apenas lógica de background.
 */

import { useEffect, useRef } from "react";
import { useStoryTrigger } from "@/hooks/useStoryTrigger";
import { useStoryEvent } from "@/contexts/StoryEventContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const KM_MILESTONES = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000];

export default function StoryWatcher() {
  // Ativa o hook que exibe o toast premium
  useStoryTrigger();

  const { user, isAuthenticated } = useAuth();
  const { emitStoryEvent } = useStoryEvent();

  // Referências para detectar mudanças
  const prevLevelRef = useRef<number | null>(null);
  const prevKmRef = useRef<number | null>(null);
  const welcomeEmittedRef = useRef(false);
  const firstRentalEmittedRef = useRef(false);

  // Busca dados de nível do usuário (polling a cada 60s)
  const { data: levelData } = trpc.levels.getMyLevel.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
      refetchInterval: 60_000,
      staleTime: 30_000,
    }
  );

  useEffect(() => {
    if (!levelData || !user) return;

    const rider = levelData.rider;
    const currentLevel = rider.currentLevel;
    const currentKm = rider.totalKm ?? 0;
    const totalRentals = rider.totalRentals ?? 0;
    const userName = user.name?.split(" ")[0] ?? "Você";

    // ── Boas-vindas (primeira vez que carrega o nível) ──────────────────────
    if (!welcomeEmittedRef.current && prevLevelRef.current === null) {
      const isNewUser = totalRentals === 0;
      if (isNewUser) {
        // Verifica se o usuário é novo (criado há menos de 24h)
        const createdAt = (user as any).createdAt;
        const isRecent = createdAt
          ? Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000
          : false;

        if (isRecent) {
          welcomeEmittedRef.current = true;
          emitStoryEvent({
            type: "welcome",
            userName,
            levelName: rider.config?.name ?? "Explorer",
            isHost: false,
          });
          return;
        }
      }
    }

    // ── Primeira locação ────────────────────────────────────────────────────
    if (!firstRentalEmittedRef.current && totalRentals === 1 && prevLevelRef.current !== null) {
      firstRentalEmittedRef.current = true;
      emitStoryEvent({
        type: "first_rental",
        userName,
        levelName: rider.config?.name ?? "Explorer",
        isHost: false,
      });
    }

    // ── Level Up ────────────────────────────────────────────────────────────
    if (prevLevelRef.current !== null && currentLevel > prevLevelRef.current) {
      emitStoryEvent({
        type: "level_up",
        userName,
        levelName: rider.config?.name ?? `Nível ${currentLevel}`,
        isHost: false,
      });
    }

    // ── Marco de KM ─────────────────────────────────────────────────────────
    if (prevKmRef.current !== null && currentKm > prevKmRef.current) {
      for (const milestone of KM_MILESTONES) {
        if (prevKmRef.current < milestone && currentKm >= milestone) {
          emitStoryEvent({
            type: "km_milestone",
            userName,
            kmCount: milestone,
            levelName: rider.config?.name ?? "Explorer",
            isHost: false,
          });
          break; // Apenas um marco por vez
        }
      }
    }

    // Atualiza referências
    prevLevelRef.current = currentLevel;
    prevKmRef.current = currentKm;
  }, [levelData, user, emitStoryEvent]);

  return null;
}
