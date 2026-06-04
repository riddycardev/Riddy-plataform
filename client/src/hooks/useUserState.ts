/**
 * useUserState Hook
 * Detecta o estado brasileiro do usuário via IP geolocation
 * Permite troca manual de estado com persistência em localStorage
 */

import { useState, useEffect, useCallback } from "react";

export const BRAZIL_STATES: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

const STORAGE_KEY = "riddy_user_state";

export interface UserStateInfo {
  code: string;       // Sigla: "RO"
  name: string;       // Nome: "Rondônia"
  source: "ip" | "manual" | "stored";
}

export interface UseUserStateReturn {
  userState: UserStateInfo | null;
  loading: boolean;
  setManualState: (code: string) => void;
  clearState: () => void;
}

// Detecta estado via IP usando ipapi.co (gratuito, sem API key)
async function detectStateFromIP(): Promise<string | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    // ipapi.co retorna region_code = "RO" para Rondônia
    const regionCode = data.region_code as string | undefined;
    if (regionCode && BRAZIL_STATES[regionCode]) {
      return regionCode;
    }
    return null;
  } catch {
    return null;
  }
}

export function useUserState(): UseUserStateReturn {
  const [userState, setUserState] = useState<UserStateInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 1. Verificar localStorage primeiro
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && BRAZIL_STATES[stored]) {
        if (!cancelled) {
          setUserState({ code: stored, name: BRAZIL_STATES[stored], source: "stored" });
          setLoading(false);
        }
        return;
      }

      // 2. Detectar via IP
      const ipCode = await detectStateFromIP();
      if (!cancelled) {
        if (ipCode && BRAZIL_STATES[ipCode]) {
          setUserState({ code: ipCode, name: BRAZIL_STATES[ipCode], source: "ip" });
        }
        setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const setManualState = useCallback((code: string) => {
    const upper = code.toUpperCase();
    if (!BRAZIL_STATES[upper]) return;
    localStorage.setItem(STORAGE_KEY, upper);
    setUserState({ code: upper, name: BRAZIL_STATES[upper], source: "manual" });
  }, []);

  const clearState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUserState(null);
  }, []);

  return { userState, loading, setManualState, clearState };
}
