/**
 * RiddyCareWidget — Widget flutuante da Lumi com 3 estados:
 *   closed   → botão flutuante animado (flutuação + anel de pulso teal)
 *   open     → popup com FAQ chips + botão "Falar com suporte"
 *   chatting → mini-chat inline com a Lumi (sem criar ticket)
 *
 * Fluxo:
 *   FAQ chip clicado → estado "chatting" → IA responde inline
 *   "Falar com suporte" → redireciona para /riddy-care (tickets formais)
 */
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { X, ChevronRight, Headphones, Send, ArrowLeft, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const LUMI_AVATAR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663324780556/5MKE4LDVikZTU9bHnRFBMx/lumi-avatar-i4tcSxgYc4vbLP7Ka3JLor.webp";

const FAQ_ITEMS = [
  { icon: "📅", label: "Como cancelar uma reserva?", question: "Como cancelo uma reserva na RIDDY?" },
  { icon: "🏠", label: "Como me torno um anfitrião?", question: "Como posso anunciar meu carro e me tornar um anfitrião na RIDDY?" },
  { icon: "💳", label: "Meu pagamento foi recusado, o que faço?", question: "Meu pagamento foi recusado. O que devo fazer?" },
  { icon: "🛡️", label: "Como funciona o seguro?", question: "Como funciona o seguro dos veículos na RIDDY?" },
];

type State = "closed" | "open" | "chatting";
type ChatMessage = { role: "user" | "assistant"; content: string };

export function RiddyCareWidget() {
  // ── Todos os hooks primeiro ──────────────────────────────────────────────────
  const { isAuthenticated } = useAuth();
  const [widgetState, setWidgetState] = useState<State>("closed");
  const [location, navigate] = useLocation();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [needsEscalation, setNeedsEscalation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: myTickets } = trpc.support.listMyTickets.useQuery(
    { status: "open" },
    { enabled: isAuthenticated, refetchInterval: isAuthenticated ? 60_000 : false }
  );

  const quickChat = trpc.support.quickChat.useMutation({
    onMutate: () => setIsTyping(true),
    onSettled: () => setIsTyping(false),
    onSuccess: (data) => {
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.needsEscalation) setNeedsEscalation(true);
    },
  });

  // Auto-scroll ao final das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  // ── Guards (depois de todos os hooks) ────────────────────────────────────────
  if (location.startsWith("/riddy-care") || location.startsWith("/admin")) return null;
  if (!isAuthenticated) return null;

  // Na página do veículo existe uma barra fixa de preço em bottom-16 + ~56px de altura
  // Em mobile, o widget é ocultado na página do veículo (o botão "Falar com proprietário" já existe na página)
  // Em desktop, o widget aparece normalmente
  const isVehiclePage = location.startsWith("/vehicles/");
  const buttonBottom = "5rem";
  const popupBottom = "9rem";

  const openCount = myTickets?.length || 0;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleFaqClick = (item: typeof FAQ_ITEMS[0]) => {
    const userMsg: ChatMessage = { role: "user", content: item.question };
    setChatMessages([userMsg]);
    setNeedsEscalation(false);
    setWidgetState("chatting");
    quickChat.mutate({ messages: [userMsg], faqCategory: item.label });
  };

  const handleSendMessage = () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setInputValue("");
    quickChat.mutate({ messages: newMessages });
  };

  const handleOpenTicket = () => {
    navigate("/riddy-care");
    setWidgetState("closed");
  };

  const handleClose = () => {
    setWidgetState("closed");
    setChatMessages([]);
    setNeedsEscalation(false);
  };

  const handleBack = () => {
    setWidgetState("open");
    setChatMessages([]);
    setNeedsEscalation(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={isVehiclePage ? "hidden lg:contents" : "contents"}>
      {/* Overlay suave */}
      {widgetState !== "closed" && (
        <div className="fixed inset-0 z-40" onClick={handleClose} />
      )}

      {/* ── Popup: estado "open" ── */}
      {widgetState === "open" && (
        <div
          className="fixed right-4 z-50 w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          style={{
            bottom: popupBottom,
            background: "linear-gradient(135deg, #0D1526 0%, #111827 100%)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={LUMI_AVATAR} alt="Lumi" className="w-9 h-9 rounded-full object-cover ring-2 ring-[#00D4AA]/40" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0D1526]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">Riddy Suporte</p>
                <p className="text-green-400 text-xs">Online agora</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Corpo */}
          <div className="px-4 py-4 space-y-4">
            {/* Saudação */}
            <div className="bg-white/5 rounded-xl p-3">
              <div className="flex items-start gap-3">
                <img src={LUMI_AVATAR} alt="Lumi" className="w-10 h-10 rounded-full object-cover ring-2 ring-[#00D4AA]/40 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-white text-sm font-medium">Olá! 👋</p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Como posso te ajudar hoje?<br />
                    Sou a <span className="text-[#00D4AA] font-semibold">Lumi</span>, assistente da Riddy.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ chips → abre chat inline */}
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                Perguntas frequentes
              </p>
              <div className="space-y-1">
                {FAQ_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleFaqClick(item)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group"
                  >
                    <span className="text-base shrink-0">{item.icon}</span>
                    <span className="text-gray-200 text-sm flex-1 leading-tight">{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#00D4AA] shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* CTA → cria ticket formal */}
            <button
              onClick={handleOpenTicket}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00D4AA] hover:bg-[#00B894] text-black font-semibold text-sm transition-colors"
            >
              <Headphones className="w-4 h-4" />
              Falar com suporte
            </button>

            <p className="text-center text-gray-500 text-xs">
              Normalmente respondemos em{" "}
              <span className="text-[#00D4AA]">menos de 2 minutos</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Popup: estado "chatting" (mini-chat inline) ── */}
      {widgetState === "chatting" && (
        <div
          className="fixed right-4 z-50 w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
          style={{
            bottom: popupBottom,
            maxHeight: "26rem",
            background: "linear-gradient(135deg, #0D1526 0%, #111827 100%)",
          }}
        >
          {/* Header do chat */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={handleBack} className="text-gray-500 hover:text-gray-300 transition-colors mr-1">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="relative">
                <img src={LUMI_AVATAR} alt="Lumi" className="w-8 h-8 rounded-full object-cover ring-2 ring-[#00D4AA]/40" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0D1526]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">Lumi</p>
                <p className="text-green-400 text-xs">Assistente Riddy</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Feed de mensagens */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <img src={LUMI_AVATAR} alt="Lumi" className="w-6 h-6 rounded-full object-cover ring-1 ring-[#00D4AA]/40 shrink-0" />
                )}
                <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#00D4AA]/20 border border-[#00D4AA]/30 text-white rounded-br-sm"
                    : "bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Indicador de digitação */}
            {isTyping && (
              <div className="flex items-end gap-2 justify-start">
                <img src={LUMI_AVATAR} alt="Lumi" className="w-6 h-6 rounded-full object-cover ring-1 ring-[#00D4AA]/40 shrink-0" />
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-3 py-2.5 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {/* Banner de escalação */}
            {needsEscalation && !isTyping && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-orange-300 text-xs font-medium">Assunto requer atenção humana</p>
                  <p className="text-gray-400 text-xs mt-0.5">Abra um ticket para que nossa equipe possa te ajudar.</p>
                  <button
                    onClick={handleOpenTicket}
                    className="mt-2 text-xs text-[#00D4AA] font-semibold hover:underline"
                  >
                    Abrir ticket de suporte →
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Campo de input */}
          <div className="px-3 py-3 border-t border-white/10 shrink-0">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Escreva sua dúvida..."
                disabled={isTyping}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00D4AA]/50 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="w-8 h-8 rounded-xl bg-[#00D4AA] hover:bg-[#00B894] text-black flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={handleOpenTicket}
              className="w-full mt-2 text-xs text-gray-500 hover:text-[#00D4AA] transition-colors text-center"
            >
              Precisa de mais ajuda? Abrir ticket →
            </button>
          </div>
        </div>
      )}

      {/* ── Botão flutuante animado ── */}
      <button
        onClick={() => setWidgetState(widgetState === "closed" ? "open" : "closed")}
        aria-label="Abrir suporte Riddy"
        className={`fixed right-4 z-50 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center gap-2 ${
          widgetState !== "closed"
            ? "w-10 h-10 bg-white/10 border border-white/20 text-white backdrop-blur-md"
            : "w-auto h-auto px-3 py-2 text-white border border-[#00D4AA]/40 backdrop-blur-md"
        }`}
        style={{
          bottom: buttonBottom,
          animation: widgetState === "closed" ? "lumiFloat 3s ease-in-out infinite" : "none",
          background: widgetState === "closed" ? "rgba(0, 212, 170, 0.18)" : undefined,
          boxShadow: widgetState === "closed" ? "0 0 18px rgba(0,212,170,0.25), 0 4px 24px rgba(0,0,0,0.4)" : undefined,
        }}
      >
        {widgetState !== "closed" ? (
          <X className="w-4 h-4" />
        ) : (
          <>
            {/* Anel de pulso */}
            <span
              className="absolute inset-0 rounded-full"
              style={{
                animation: "lumiPulse 2.5s ease-out infinite",
                background: openCount > 0
                  ? "rgba(239,68,68,0.4)"
                  : "rgba(0,212,170,0.35)",
              }}
            />
            <img src={LUMI_AVATAR} alt="Lumi" className="w-5 h-5 rounded-full object-cover relative z-10" />
            <span className="text-xs font-semibold relative z-10">Suporte</span>
            {openCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center z-20">
                {openCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Keyframes das animações */}
      <style>{`
        @keyframes lumiFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes lumiPulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          70%  { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
