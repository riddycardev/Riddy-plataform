/**
 * Riddy Suporte — Central de Ajuda e Suporte 24/7
 * Design: Premium dark, limpo, minimalista e confiável
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  HeadphonesIcon,
  ChevronRightIcon,
  TicketIcon,
  MessageCircleIcon,
  AlertTriangleIcon,
  CreditCardIcon,
  FileTextIcon,
  ShieldIcon,
  CarIcon,
  XCircleIcon,
  RefreshCwIcon,
  PhoneIcon,
  ArrowLeftIcon,
  SendIcon,
  Loader2Icon,
  CheckCircleIcon,
  ClockIcon,
} from "lucide-react";

// ─── Categorias de suporte ────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "reserva", label: "Reserva", icon: CarIcon, color: "text-blue-400", desc: "Dúvidas sobre sua reserva atual ou futura" },
  { id: "pagamento", label: "Pagamento", icon: CreditCardIcon, color: "text-green-400", desc: "Cobrança, reembolso ou problema com pagamento" },
  { id: "documentos", label: "Documentos", icon: FileTextIcon, color: "text-yellow-400", desc: "CNH, documentos do veículo ou verificação" },
  { id: "caucao", label: "Caução", icon: ShieldIcon, color: "text-purple-400", desc: "Garantia reembolsável e liberação de valores" },
  { id: "checkin", label: "Check-in", icon: CarIcon, color: "text-cyan-400", desc: "Retirada do veículo e inspeção inicial" },
  { id: "checkout", label: "Checkout", icon: CarIcon, color: "text-orange-400", desc: "Devolução do veículo e inspeção final" },
  { id: "problema_veiculo", label: "Problema com veículo", icon: AlertTriangleIcon, color: "text-red-400", desc: "Pane, acidente ou dano no veículo" },
  { id: "cancelamento", label: "Cancelamento", icon: XCircleIcon, color: "text-pink-400", desc: "Cancelar ou alterar uma reserva" },
  { id: "reembolso", label: "Reembolso", icon: RefreshCwIcon, color: "text-emerald-400", desc: "Solicitar estorno ou reembolso" },
  { id: "emergencia", label: "Emergência", icon: PhoneIcon, color: "text-red-500", desc: "Acidente, roubo ou situação de risco" },
  { id: "outro", label: "Outro", icon: MessageCircleIcon, color: "text-gray-400", desc: "Dúvidas gerais sobre a plataforma" },
] as const;

type CategoryId = typeof CATEGORIES[number]["id"];

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    open: { label: "Aberto", variant: "default" },
    in_progress: { label: "Em andamento", variant: "secondary" },
    waiting_user: { label: "Aguardando você", variant: "outline" },
    resolved: { label: "Resolvido", variant: "secondary" },
    closed: { label: "Encerrado", variant: "outline" },
  };
  const s = map[status] || { label: status, variant: "outline" };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

// ─── Priority badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    P0: "bg-red-500/20 text-red-400 border-red-500/30",
    P1: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    P2: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    P3: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    P4: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  const labels: Record<string, string> = {
    P0: "Emergência", P1: "Alta", P2: "Média", P3: "Normal", P4: "Baixa",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[priority] || colors.P4}`}>
      {labels[priority] || priority}
    </span>
  );
}

// ─── Tela de criação de ticket ────────────────────────────────────────────────
function NewTicketForm({
  category,
  vehicleId,
  bookingId,
  onSuccess,
  onBack,
}: {
  category: CategoryId;
  vehicleId?: number;
  bookingId?: number;
  onSuccess: (ticketId: number, ticketNumber: number) => void;
  onBack: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const cat = CATEGORIES.find((c) => c.id === category)!;
  const isEmergency = category === "emergencia";

  const createTicket = trpc.support.createTicket.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.escalatedToHuman
          ? "Ticket criado — Suporte humano acionado"
          : "Ticket criado — IA respondeu",
        { description: `Ticket #${data.ticketNumber} aberto com sucesso.` }
      );
      onSuccess(data.ticketId, data.ticketNumber);
    },
    onError: (err) => {
      toast.error("Erro ao criar ticket", { description: err.message });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeftIcon className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex items-center gap-2">
          <cat.icon className={`w-5 h-5 ${cat.color}`} />
          <h2 className="text-lg font-semibold text-white">{cat.label}</h2>
        </div>
        {isEmergency && (
          <Badge variant="destructive" className="ml-auto">Prioridade máxima</Badge>
        )}
      </div>

      {isEmergency && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-300 font-medium text-sm">Situação de emergência</p>
              <p className="text-red-400/80 text-xs mt-1">
                Seu ticket será escalado imediatamente para nossa equipe de operações. Em caso de acidente com vítimas, ligue 192 (SAMU) ou 193 (Bombeiros).
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label className="text-gray-300 text-sm">Título do problema</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Ex: ${cat.desc}`}
            className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>
        <div>
          <Label className="text-gray-300 text-sm">Descreva o problema em detalhes</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explique o que aconteceu, quando ocorreu e o que você precisa..."
            rows={5}
            className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{description.length}/2000 caracteres</p>
        </div>
      </div>

      <Button
        onClick={() => createTicket.mutate({ category, title, description, vehicleId, bookingId })}
        disabled={!title.trim() || description.length < 10 || createTicket.isPending}
        className="w-full bg-[#00D4AA] hover:bg-[#00B894] text-black font-semibold"
      >
        {createTicket.isPending ? (
          <><Loader2Icon className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
        ) : (
          <><SendIcon className="w-4 h-4 mr-2" />Enviar para suporte</>
        )}
      </Button>
    </div>
  );
}

// ─── Tela de ticket aberto ────────────────────────────────────────────────────
function TicketView({ ticketId, onBack }: { ticketId: number; onBack: () => void }) {
  const { user } = useAuth();
  const [reply, setReply] = useState("");

  const { data, refetch, isLoading } = trpc.support.getTicket.useQuery({ ticketId });

  const sendMessage = trpc.support.sendTicketMessage.useMutation({
    onSuccess: () => {
      setReply("");
      refetch();
    },
    onError: (err) => toast.error("Erro", { description: err.message }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2Icon className="w-6 h-6 animate-spin text-[#00D4AA]" />
      </div>
    );
  }

  if (!data) return null;
  const { ticket, messages } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeftIcon className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold truncate">#{ticket.ticketNumber} — {ticket.title}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          {ticket.escalatedToHuman && (
            <p className="text-xs text-orange-400 mt-0.5">Encaminhado para suporte humano</p>
          )}
        </div>
      </div>

      {/* Feed de mensagens */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {messages.map((msg) => {
          const isUser = msg.senderType === "user";
          const isAI = msg.senderType === "ai";
          const isAgent = msg.senderType === "agent";

          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
              {/* Avatar da Lumi (mensagens de IA) */}
              {isAI && (
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663324780556/5MKE4LDVikZTU9bHnRFBMx/lumi-avatar-i4tcSxgYc4vbLP7Ka3JLor.webp"
                  alt="Lumi"
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-[#00D4AA]/40 shrink-0"
                />
              )}
              {/* Avatar do agente humano */}
              {isAgent && (
                <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                  <span className="text-xs">👤</span>
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                isUser
                  ? "bg-[#00D4AA]/20 border border-[#00D4AA]/30 text-white"
                  : isAI
                  ? "bg-white/5 border border-white/10 text-gray-200"
                  : "bg-blue-500/10 border border-blue-500/30 text-white"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-400">
                    {isUser ? "Você" : isAI ? "Lumi" : "Suporte Riddy"}
                  </span>
                  <span className="text-xs text-gray-600">
                    {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Campo de resposta */}
      {ticket.status !== "closed" && ticket.status !== "resolved" && (
        <div className="flex gap-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Escreva sua mensagem..."
            rows={2}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
          />
          <Button
            onClick={() => sendMessage.mutate({ ticketId, content: reply })}
            disabled={!reply.trim() || sendMessage.isPending}
            className="bg-[#00D4AA] hover:bg-[#00B894] text-black self-end"
          >
            {sendMessage.isPending ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Lista de tickets do usuário ──────────────────────────────────────────────
function MyTickets({ onOpen }: { onOpen: (id: number) => void }) {
  const { data: tickets, isLoading } = trpc.support.listMyTickets.useQuery({ status: "all" });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2Icon className="w-5 h-5 animate-spin text-[#00D4AA]" /></div>;
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <TicketIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Nenhum ticket aberto</p>
        <p className="text-gray-600 text-sm mt-1">Seus tickets de suporte aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((t) => (
        <button
          key={t.id}
          onClick={() => onOpen(t.id)}
          className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 transition-all"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white text-sm font-medium">#{t.ticketNumber}</span>
                <StatusBadge status={t.status} />
                <PriorityBadge priority={t.priority} />
              </div>
              <p className="text-gray-300 text-sm mt-1 truncate">{t.title}</p>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-xs shrink-0">
              <ClockIcon className="w-3 h-3" />
              {new Date(t.updatedAt).toLocaleDateString("pt-BR")}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function RiddyCare({
  vehicleId,
  bookingId,
  initialCategory,
}: {
  vehicleId?: number;
  bookingId?: number;
  initialCategory?: CategoryId;
}) {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<"home" | "categories" | "new-ticket" | "ticket" | "my-tickets">("home");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(initialCategory || null);
  const [openTicketId, setOpenTicketId] = useState<number | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-4">
        <Card className="bg-[#0D1526] border-white/10 max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <HeadphonesIcon className="w-12 h-12 text-[#00D4AA] mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Riddy Suporte</h2>
            <p className="text-gray-400 mb-6">Faça login para acessar o suporte personalizado</p>
            <Link href="/login">
              <Button className="bg-[#00D4AA] hover:bg-[#00B894] text-black font-semibold">
                Fazer login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      {/* Header */}
      <div className="bg-[#0D1526] border-b border-white/10 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {view !== "home" && (
            <button
              onClick={() => setView("home")}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <HeadphonesIcon className="w-5 h-5 text-[#00D4AA]" />
            <span className="text-white font-bold">Riddy Suporte</span>
            <Badge variant="secondary" className="text-xs">24/7</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── HOME ── */}
        {view === "home" && (
          <>
            <div className="text-center py-4">
              <h1 className="text-2xl font-bold text-white mb-2">Como podemos ajudar?</h1>
              <p className="text-gray-400 text-sm">A Lumi responde na hora. Casos complexos são encaminhados para nossa equipe.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setView("categories")}
                className="flex items-center gap-4 p-4 rounded-xl bg-[#00D4AA]/10 border border-[#00D4AA]/30 hover:bg-[#00D4AA]/15 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#00D4AA]/20 flex items-center justify-center shrink-0">
                  <MessageCircleIcon className="w-5 h-5 text-[#00D4AA]" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">Abrir novo ticket</p>
                  <p className="text-gray-400 text-sm">Descreva seu problema e receba ajuda imediata</p>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-gray-500 shrink-0" />
              </button>

              <button
                onClick={() => setView("my-tickets")}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <TicketIcon className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">Meus tickets</p>
                  <p className="text-gray-400 text-sm">Acompanhe o status dos seus atendimentos</p>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-gray-500 shrink-0" />
              </button>
            </div>

            {/* Categorias rápidas */}
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Categorias</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setView("new-ticket");
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all text-left"
                  >
                    <cat.icon className={`w-4 h-4 ${cat.color} shrink-0`} />
                    <span className="text-gray-300 text-sm">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── CATEGORIAS ── */}
        {view === "categories" && (
          <>
            <div>
              <h2 className="text-white font-semibold mb-1">Selecione a categoria</h2>
              <p className="text-gray-400 text-sm">Escolha o assunto mais próximo do seu problema</p>
            </div>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setView("new-ticket");
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all text-left"
                >
                  <div className={`w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0`}>
                    <cat.icon className={`w-4 h-4 ${cat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{cat.label}</p>
                    <p className="text-gray-500 text-xs">{cat.desc}</p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-600 shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── NOVO TICKET ── */}
        {view === "new-ticket" && selectedCategory && (
          <NewTicketForm
            category={selectedCategory}
            vehicleId={vehicleId}
            bookingId={bookingId}
            onBack={() => setView("categories")}
            onSuccess={(ticketId) => {
              setOpenTicketId(ticketId);
              setView("ticket");
            }}
          />
        )}

        {/* ── TICKET ABERTO ── */}
        {view === "ticket" && openTicketId && (
          <TicketView
            ticketId={openTicketId}
            onBack={() => setView("my-tickets")}
          />
        )}

        {/* ── MEUS TICKETS ── */}
        {view === "my-tickets" && (
          <>
            <div>
              <h2 className="text-white font-semibold mb-1">Meus tickets</h2>
              <p className="text-gray-400 text-sm">Acompanhe todos os seus atendimentos</p>
            </div>
            <MyTickets
              onOpen={(id) => {
                setOpenTicketId(id);
                setView("ticket");
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
