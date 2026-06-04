/**
 * useStoryTrigger
 * Hook que observa o StoryEventContext e exibe um toast premium
 * com miniatura do Story gerado quando um evento é emitido.
 *
 * Uso: montar este hook uma vez no App.tsx (ou layout raiz).
 */

import { useEffect, useRef } from "react";
import { useStoryEvent } from "@/contexts/StoryEventContext";
import { generateRiddyStory } from "@/lib/generateRiddyStory";
import { toast } from "sonner";
import { useLocation } from "wouter";

export function useStoryTrigger() {
  const { pendingEvent, clearEvent } = useStoryEvent();
  const processedIds = useRef<Set<string>>(new Set());
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!pendingEvent) return;
    if (processedIds.current.has(pendingEvent.id)) return;
    processedIds.current.add(pendingEvent.id);

    const event = pendingEvent;
    clearEvent();

    // Gera o Story em background
    const storyData = {
      type: event.type,
      userName: event.userName,
      levelName: event.levelName,
      newLevelName: event.levelName,
      km: event.kmCount,
      nextGoal: undefined as string | undefined,
    };

    generateRiddyStory(storyData)
      .then((dataUrl) => {
        // Armazena o dataUrl temporariamente no sessionStorage para a tela /riddy-story acessar
        try {
          sessionStorage.setItem("riddy_story_preview", dataUrl);
          sessionStorage.setItem("riddy_story_type", event.type);
        } catch (_) {
          // sessionStorage pode falhar em modo privado
        }

        // Exibe toast premium com miniatura
        const title = getEventTitle(event.type, event.levelName, event.kmCount);
        const description = getEventDescription(event.type);

        toast.custom(
          (t) => (
            <StoryToastContent
              title={title}
              description={description}
              dataUrl={dataUrl}
              onView={() => { navigate("/riddy-story"); toast.dismiss(t); }}
              onDownload={() => downloadStory(dataUrl, event.type)}
            />
          ),
          { duration: 8000, position: "top-right" }
        );
      })
      .catch(() => {
        // Falha silenciosa — não interrompe o fluxo do usuário
      });
  }, [pendingEvent, clearEvent, navigate]);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getEventTitle(type: string, levelName?: string, km?: number): string {
  switch (type) {
    case "welcome":
      return "Bem-vindo à RIDDY! 🚀";
    case "first_rental":
      return "Primeira locação concluída! 🏆";
    case "level_up":
      return `Novo nível: ${levelName ?? "desbloqueado"}! ⭐`;
    case "km_milestone":
      return `${km?.toLocaleString("pt-BR") ?? "0"} km rodados! 🛣️`;
    case "motivational":
      return "Seu Story RIDDY está pronto! ✨";
    default:
      return "Seu Story está pronto!";
  }
}

function getEventDescription(type: string): string {
  switch (type) {
    case "welcome":
      return "Sua jornada começou. Compartilhe nos Stories!";
    case "first_rental":
      return "Você deu o primeiro passo. Compartilhe essa conquista!";
    case "level_up":
      return "Você subiu de nível! Mostre para todo mundo.";
    case "km_milestone":
      return "Marco histórico na sua jornada RIDDY!";
    default:
      return "Baixe e compartilhe nos Stories do Instagram.";
  }
}

function downloadStory(dataUrl: string, type: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `riddy-story-${type}-${Date.now()}.png`;
  a.click();
}

// ─── COMPONENTE DO TOAST ──────────────────────────────────────────────────────

interface StoryToastContentProps {
  title: string;
  description: string;
  dataUrl: string;
  onView: () => void;
  onDownload: () => void;
}

function StoryToastContent({ title, description, dataUrl, onView, onDownload }: StoryToastContentProps) {
  return (
    <div className="flex items-start gap-3 w-full">
      {/* Miniatura do Story */}
      <div className="relative flex-shrink-0">
        <img
          src={dataUrl}
          alt="Story RIDDY"
          className="w-14 h-24 object-cover rounded-lg border border-white/20 shadow-lg"
          style={{ aspectRatio: "9/16" }}
        />
        {/* Glow */}
        <div className="absolute inset-0 rounded-lg ring-1 ring-cyan-400/40 shadow-[0_0_12px_rgba(0,212,255,0.3)]" />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-white leading-tight mb-0.5">{title}</p>
        <p className="text-xs text-white/60 leading-tight mb-3">{description}</p>

        {/* Botões */}
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex-1 text-xs font-semibold py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black transition-colors"
          >
            Ver Story
          </button>
          <button
            onClick={onDownload}
            className="flex-1 text-xs font-semibold py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
          >
            Baixar
          </button>
        </div>
      </div>
    </div>
  );
}
