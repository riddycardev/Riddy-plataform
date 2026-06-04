/**
 * StoryEventContext
 * Contexto global para emitir eventos de Story automáticos.
 * Quando um evento é emitido (level_up, km_milestone, first_rental, welcome),
 * o hook useStoryTrigger exibe um toast premium com miniatura do Story gerado.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export type StoryEventType =
  | "welcome"
  | "first_rental"
  | "level_up"
  | "km_milestone"
  | "motivational";

export interface StoryEvent {
  id: string;
  type: StoryEventType;
  userName: string;
  levelName?: string;
  kmCount?: number;
  vehicleName?: string;
  isHost?: boolean;
  timestamp: number;
}

interface StoryEventContextValue {
  pendingEvent: StoryEvent | null;
  emitStoryEvent: (event: Omit<StoryEvent, "id" | "timestamp">) => void;
  clearEvent: () => void;
}

const StoryEventContext = createContext<StoryEventContextValue | null>(null);

export function StoryEventProvider({ children }: { children: React.ReactNode }) {
  const [pendingEvent, setPendingEvent] = useState<StoryEvent | null>(null);
  const idRef = useRef(0);

  const emitStoryEvent = useCallback((event: Omit<StoryEvent, "id" | "timestamp">) => {
    idRef.current += 1;
    setPendingEvent({
      ...event,
      id: `story-${idRef.current}-${Date.now()}`,
      timestamp: Date.now(),
    });
  }, []);

  const clearEvent = useCallback(() => {
    setPendingEvent(null);
  }, []);

  return (
    <StoryEventContext.Provider value={{ pendingEvent, emitStoryEvent, clearEvent }}>
      {children}
    </StoryEventContext.Provider>
  );
}

export function useStoryEvent() {
  const ctx = useContext(StoryEventContext);
  if (!ctx) throw new Error("useStoryEvent must be used within StoryEventProvider");
  return ctx;
}
