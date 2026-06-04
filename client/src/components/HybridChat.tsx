/**
 * HybridChat — Chat híbrido IA + Anfitrião
 *
 * Props:
 *  mode="vehicle"  → chat pré-locação sobre um veículo específico
 *  mode="support"  → suporte geral da plataforma RIDDY
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Loader2, AlertCircle, ChevronDown, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

interface HybridChatProps {
  mode: "vehicle" | "support";
  vehicleId?: number;
  vehicleName?: string;
  className?: string;
}

interface Message {
  senderType: "user" | "ai" | "host" | "system";
  content: string;
  needsHostReview?: boolean;
  createdAt?: Date;
}

const QUICK_QUESTIONS_VEHICLE = [
  "Quais documentos preciso para alugar?",
  "Como funciona o processo de reserva?",
  "Qual é a política de combustível?",
  "O que acontece em caso de multa?",
];

const QUICK_QUESTIONS_SUPPORT = [
  "Como cancelo uma reserva?",
  "Como me torno um anfitrião?",
  "Meu pagamento foi recusado, o que faço?",
  "Como funciona o seguro?",
];

export function HybridChat({ mode, vehicleId, vehicleName, className }: HybridChatProps) {
  const { user, isAuthenticated } = useAuth();
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getOrCreate = trpc.chat.getOrCreate.useMutation();
  const sendMessage = trpc.chat.sendMessage.useMutation();
  const { data: historyData, isLoading: isLoadingHistory } = trpc.chat.getMessages.useQuery(
    { chatId: chatId! },
    { enabled: !!chatId, refetchInterval: 10000 }
  );

  // Inicializa o chat quando o usuário está autenticado
  useEffect(() => {
    if (!isAuthenticated || chatId) return;
    getOrCreate.mutate(
      { mode, vehicleId },
      {
        onSuccess: (chat) => {
          setChatId(chat.id);
        },
      }
    );
  }, [isAuthenticated]);

  // Sincroniza mensagens do histórico
  useEffect(() => {
    if (historyData?.messages) {
      setMessages(
        historyData.messages.map((m) => ({
          senderType: m.senderType,
          content: m.content,
          needsHostReview: m.needsHostReview,
          createdAt: m.createdAt,
        }))
      );
    }
  }, [historyData]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || !chatId || isSending) return;

    setInput("");
    setShowQuickQuestions(false);
    setIsSending(true);

    // Otimista: adiciona a mensagem do usuário imediatamente
    setMessages((prev) => [...prev, { senderType: "user", content, createdAt: new Date() }]);

    try {
      const result = await sendMessage.mutateAsync({ chatId, content });
      setMessages((prev) => [
        ...prev,
        {
          senderType: result.aiMessage.senderType,
          content: result.aiMessage.content,
          needsHostReview: result.aiMessage.needsHostReview,
          createdAt: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          senderType: "system",
          content: "Erro ao enviar mensagem. Tente novamente.",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 p-6 text-center rounded-xl border border-border bg-card", className)}>
        <Bot className="w-10 h-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {mode === "vehicle"
            ? "Faça login para conversar com o assistente do veículo"
            : "Faça login para acessar o suporte 24/7"}
        </p>
        <Button size="sm" onClick={() => (window.location.href = getLoginUrl())}>
          Entrar
        </Button>
      </div>
    );
  }

  const quickQuestions = mode === "vehicle" ? QUICK_QUESTIONS_VEHICLE : QUICK_QUESTIONS_SUPPORT;

  return (
    <div className={cn("flex flex-col rounded-xl border border-border bg-card overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {mode === "vehicle" ? (
              <Bot className="w-4 h-4 text-primary" />
            ) : (
              <Headphones className="w-4 h-4 text-primary" />
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-none">
            {mode === "vehicle"
              ? `Assistente${vehicleName ? ` — ${vehicleName}` : ""}`
              : "Suporte RIDDY 24/7"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mode === "vehicle" ? "IA + Proprietário" : "IA + Equipe RIDDY"}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">
          Online
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 h-72" ref={scrollRef as React.RefObject<HTMLDivElement>}>
        <div className="flex flex-col gap-3 p-4">
          {isLoadingHistory && !messages.length && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {isSending && (
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick questions */}
      {showQuickQuestions && messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Perguntas frequentes:</p>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors bg-background"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-border">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua pergunta..."
          className="resize-none min-h-[40px] max-h-[120px] text-sm"
          rows={1}
          disabled={isSending || !chatId}
        />
        <Button
          size="icon"
          onClick={() => handleSend()}
          disabled={!input.trim() || isSending || !chatId}
          className="shrink-0 h-10 w-10"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── MessageBubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.senderType === "user";
  const isSystem = message.senderType === "system";
  const isHost = message.senderType === "host";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-2", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-primary text-primary-foreground" : isHost ? "bg-amber-500/10" : "bg-primary/10"
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5" />
        ) : isHost ? (
          <span className="text-xs font-bold text-amber-600">H</span>
        ) : (
          <Bot className="w-3.5 h-3.5 text-primary" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : isHost
              ? "bg-amber-50 dark:bg-amber-950/30 text-foreground border border-amber-200 dark:border-amber-800 rounded-tl-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          )}
        >
          {message.content}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1">
          {!isUser && !isHost && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Bot className="w-2.5 h-2.5" /> IA
            </span>
          )}
          {isHost && (
            <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5">
              ✅ Proprietário
            </span>
          )}
          {message.needsHostReview && (
            <span className="text-[10px] text-orange-500 flex items-center gap-0.5">
              · aguardando proprietário
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
