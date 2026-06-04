import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const LOCAL_KEY = "riddy_guest_favorites";

function getLocalFavorites(): number[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setLocalFavorites(ids: number[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
}

function clearLocalFavorites() {
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    // ignore
  }
}

/**
 * useFavorites — manages the current user's favorites list.
 *
 * - Authenticated users: synced with the server via tRPC (optimistic updates).
 * - Guest users: stored in localStorage and synced to the server on first login.
 */
export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  // Local (guest) state
  const [localIds, setLocalIds] = useState<number[]>(() => getLocalFavorites());

  // ─── Server query (authenticated only) ───────────────────────────────────
  const { data: serverFavorites = [], isLoading } = trpc.favorite.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // ─── Sync local favorites to server after login ───────────────────────────
  const syncMutation = trpc.favorite.syncLocal.useMutation({
    onSuccess: () => {
      clearLocalFavorites();
      setLocalIds([]);
      utils.favorite.list.invalidate();
    },
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    const pending = getLocalFavorites();
    if (pending.length > 0) {
      syncMutation.mutate({ vehicleIds: pending });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ─── Build favoriteIds set ────────────────────────────────────────────────
  const serverIds = new Set(serverFavorites.map((f) => f.vehicleId));
  const favoriteIds = isAuthenticated ? serverIds : new Set(localIds);

  // ─── Server mutations ─────────────────────────────────────────────────────
  const addMutation = trpc.favorite.add.useMutation({
    onMutate: async ({ vehicleId }) => {
      await utils.favorite.list.cancel();
      const previous = utils.favorite.list.getData();
      utils.favorite.list.setData(undefined, (old = []) => [
        ...old,
        { id: -1, userId: -1, vehicleId, createdAt: new Date(), vehicle: null },
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        utils.favorite.list.setData(undefined, context.previous);
      }
    },
    onSettled: () => {
      utils.favorite.list.invalidate();
    },
  });

  const removeMutation = trpc.favorite.remove.useMutation({
    onMutate: async ({ vehicleId }) => {
      await utils.favorite.list.cancel();
      const previous = utils.favorite.list.getData();
      utils.favorite.list.setData(undefined, (old = []) =>
        old.filter((f) => f.vehicleId !== vehicleId)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        utils.favorite.list.setData(undefined, context.previous);
      }
    },
    onSettled: () => {
      utils.favorite.list.invalidate();
    },
  });

  // ─── Toggle ───────────────────────────────────────────────────────────────
  const toggle = useCallback(
    (vehicleId: number) => {
      if (isAuthenticated) {
        if (serverIds.has(vehicleId)) {
          removeMutation.mutate({ vehicleId });
        } else {
          addMutation.mutate({ vehicleId });
        }
      } else {
        // Guest: update localStorage
        setLocalIds((prev) => {
          const next = prev.includes(vehicleId)
            ? prev.filter((id) => id !== vehicleId)
            : [...prev, vehicleId];
          setLocalFavorites(next);
          return next;
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAuthenticated, serverIds]
  );

  return {
    favoriteIds,
    isLoading: isAuthenticated ? isLoading : false,
    toggle,
    isFavorite: (vehicleId: number) => favoriteIds.has(vehicleId),
    localCount: localIds.length,
  };
}
