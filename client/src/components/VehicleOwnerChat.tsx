/**
 * VehicleOwnerChat — Drawer de chat rápido com a Lumi
 *
 * Abre um painel deslizante a partir do rodapé com:
 *  - Perguntas rápidas pré-definidas (chips)
 *  - Campo de texto livre para perguntas abertas
 *  - Respostas da Lumi (GPT-4o) com contexto do veículo
 *  - Indicador de digitação animado
 *  - Botão de escalação para ticket formal
 */
import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

const LUMI_AVATAR =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663324780556/5MKE4LDVikZTU9bHnRFBMx/lumi-avatar-i4tcSxgYc4vbLP7Ka3JLor.webp";

const QUICK_QUESTIONS = [
  "Qual o consumo médio do veículo?",
  "Precisa de habilitação especial?",
  "Como funciona a entrega?",
  "Qual a política de combustível?",
  "Posso viajar para outro estado?",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface VehicleOwnerChatProps {
  vehicleId: number;
  vehicleName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VehicleOwnerChat({
  vehicleId,
  vehicleName,
  isOpen,
  onClose,
}: VehicleOwnerChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const quickChatMutation = trpc.support.quickChat.useMutation({
    onSuccess: (data) => {
      const reply = data.reply.replace("[ESCALAR]", "").trim();
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (data.needsEscalation || data.reply.includes("[ESCALAR]")) {
        setShowEscalation(true);
      }
      setIsTyping(false);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Desculpe, não consegui processar sua pergunta agora. Tente novamente ou abra um ticket de suporte.",
        },
      ]);
      setIsTyping(false);
      toast.error("Erro ao enviar mensagem");
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInputValue("");
      setIsTyping(false);
      setShowEscalation(false);
    }
  }, [isOpen]);

  function sendMessage(content: string) {
    if (!content.trim() || isTyping) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsTyping(true);
    setShowEscalation(false);

    quickChatMutation.mutate({
      messages: updatedMessages,
      vehicleId,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(inputValue);
  }

  function handleQuickQuestion(question: string) {
    sendMessage(question);
  }

  function handleOpenTicket() {
    onClose();
    navigate(`/riddy-care?category=reserva&vehicleId=${vehicleId}`);
  }

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          background: "#0F1629",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px 20px 0 0",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="relative">
            <img
              src={LUMI_AVATAR}
              alt="Lumi"
              className="w-9 h-9 rounded-full object-cover"
              style={{ boxShadow: "0 0 0 2px rgba(0,212,170,0.4)" }}
            />
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: "#00D4AA", borderColor: "#0F1629" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">Lumi · Assistente RIDDY</p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
              {vehicleName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 0 }}>
          {/* Welcome message */}
          {!hasMessages && (
            <div className="flex items-start gap-2.5">
              <img
                src={LUMI_AVATAR}
                alt="Lumi"
                className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                style={{ boxShadow: "0 0 0 1.5px rgba(0,212,170,0.35)" }}
              />
              <div
                className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.9)", maxWidth: "85%" }}
              >
                Olá! Sou a Lumi 👋 Posso responder suas dúvidas sobre o{" "}
                <span style={{ color: "#00D4AA" }}>{vehicleName}</span>. O que você gostaria de saber?
              </div>
            </div>
          )}

          {/* Quick questions chips (only shown before first message) */}
          {!hasMessages && (
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuickQuestion(q)}
                  disabled={isTyping}
                  className="text-xs px-3 py-1.5 rounded-full transition-all active:scale-95"
                  style={{
                    background: "rgba(0,212,170,0.1)",
                    border: "1px solid rgba(0,212,170,0.3)",
                    color: "#00D4AA",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "assistant" && (
                <img
                  src={LUMI_AVATAR}
                  alt="Lumi"
                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                  style={{ boxShadow: "0 0 0 1.5px rgba(0,212,170,0.35)" }}
                />
              )}
              <div
                className="rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                style={{
                  maxWidth: "80%",
                  ...(msg.role === "user"
                    ? {
                        background: "rgba(0,212,170,0.15)",
                        border: "1px solid rgba(0,212,170,0.25)",
                        color: "rgba(255,255,255,0.92)",
                        borderRadius: "16px 16px 4px 16px",
                      }
                    : {
                        background: "rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.9)",
                        borderRadius: "4px 16px 16px 16px",
                      }),
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-start gap-2.5">
              <img
                src={LUMI_AVATAR}
                alt="Lumi"
                className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                style={{ boxShadow: "0 0 0 1.5px rgba(0,212,170,0.35)" }}
              />
              <div
                className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <span className="typing-dot" />
                <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
                <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>
          )}

          {/* Escalation banner */}
          {showEscalation && !isTyping && (
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.2)",
              }}
            >
              <div className="flex-1">
                <p className="text-xs font-medium" style={{ color: "#FBBF24" }}>
                  Precisa de mais ajuda?
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Abra um ticket e um agente humano irá te ajudar.
                </p>
              </div>
              <button
                onClick={handleOpenTicket}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-opacity hover:opacity-80"
                style={{ background: "rgba(251,191,36,0.15)", color: "#FBBF24" }}
              >
                Abrir ticket
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Faça uma pergunta sobre o veículo..."
              disabled={isTyping}
              className="flex-1 text-sm px-4 py-2.5 rounded-full outline-none transition-colors"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.9)",
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "#00D4AA" }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>

          {/* Escalation link (always visible at bottom) */}
          <div className="flex justify-center mt-2">
            <button
              onClick={handleOpenTicket}
              className="text-xs flex items-center gap-1 transition-opacity hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              <MessageCircle className="w-3 h-3" />
              Isso não resolveu? Abrir ticket de suporte
            </button>
          </div>
        </div>
      </div>

      {/* Typing dot animation styles */}
      <style>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          animation: typingBounce 0.8s ease-in-out infinite;
        }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
