/**
 * Messages Page — RIDDY Chat (Airbnb-inspired layout + RIDDY premium dark aesthetic)
 *
 * Layout features inspired by Airbnb:
 *  - Conversation list: square vehicle thumbnail + user avatar overlaid bottom-right
 *  - 3-line conversation item: name | preview | dates + city
 *  - Filter pills: Todas / Sou locatário / Sou anfitrião
 *  - Chat header: both avatars overlaid + name + booking dates + "Detalhes" button
 *  - Message bubbles: avatar shown only on FIRST message of a group, label "Name · Role HH:MM" above group
 *  - Inline booking card (vehicle photo + title + "Ver detalhes" CTA)
 *  - Host timezone notice ("São HH:MM para seu anfitrião")
 *  - Scroll-to-bottom floating chevron button
 *  - Review CTA card after completed booking
 *
 * RIDDY premium dark aesthetic:
 *  - Background: #080e1a (deep navy)
 *  - Sent bubbles: dark charcoal (#1e2535) — clean, not gradient
 *  - Received bubbles: slightly lighter (#111827) with border
 *  - Accent: blue-500 / indigo-600 for interactive elements
 *  - Typography: clean, high-contrast
 */
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Search,
  MessageCircle,
  ArrowLeft,
  Loader2,
  Check,
  CheckCheck,
  Image as ImageIcon,
  ShieldCheck,
  Car,
  CalendarDays,
  MapPin,
  Clock,
  Zap,
  ExternalLink,
  X,
  List,
  CheckCircle2,
  AlertCircle,
  Info,
  Smile,
  Phone,
  ChevronDown,
  Star,
  Bike,
  ChevronsDown,
} from "lucide-react";
import { format, isToday, isYesterday, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string | null | undefined) => {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

const formatMessageTime = (date: Date | string) => {
  const d = new Date(date);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3_600_000;
  if (diffH < 24) return format(d, "HH:mm");
  if (diffH < 48) return "Ontem " + format(d, "HH:mm");
  return format(d, "dd/MM HH:mm");
};

const formatConvTime = (date: Date | null | undefined) => {
  if (!date) return "";
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd/MM/yy");
};

const formatBookingDateRange = (start: Date | string | null | undefined, end: Date | string | null | undefined) => {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    return `${format(s, "dd")} – ${format(e, "dd 'de' MMM. 'de' yyyy", { locale: ptBR })}`;
  }
  return `${format(s, "dd 'de' MMM", { locale: ptBR })} – ${format(e, "dd 'de' MMM. 'de' yyyy", { locale: ptBR })}`;
};

const getBookingStatusLabel = (status: string) => {
  const map: Record<string, { label: string; dot: string; text: string; bg: string }> = {
    pending:         { label: "Aguardando",    dot: "bg-amber-400",   text: "text-amber-300",  bg: "bg-amber-500/10 border-amber-500/25" },
    approved:        { label: "Aprovada",      dot: "bg-blue-400",    text: "text-blue-300",   bg: "bg-blue-500/10 border-blue-500/25" },
    payment_pending: { label: "Aguard. Pgto",  dot: "bg-amber-400",   text: "text-amber-300",  bg: "bg-amber-500/10 border-amber-500/25" },
    active:          { label: "Em andamento",  dot: "bg-emerald-400", text: "text-emerald-300",bg: "bg-emerald-500/10 border-emerald-500/25" },
    completed:       { label: "Concluída",     dot: "bg-slate-400",   text: "text-slate-300",  bg: "bg-slate-500/10 border-slate-500/25" },
    cancelled:       { label: "Cancelada",     dot: "bg-red-400",     text: "text-red-300",    bg: "bg-red-500/10 border-red-500/25" },
    rejected:        { label: "Recusada",      dot: "bg-red-400",     text: "text-red-300",    bg: "bg-red-500/10 border-red-500/25" },
  };
  return map[status] || { label: status, dot: "bg-slate-400", text: "text-slate-300", bg: "bg-slate-500/10 border-slate-500/25" };
};

// ─── System message detector ──────────────────────────────────────────────────

const SYSTEM_PATTERNS = [
  { regex: /pagamento.*confirmado|pix.*confirmado|pix.*aprovado|payment.*confirmed/i,  icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20" },
  { regex: /pagamento.*falhou|payment.*failed|pagamento.*recusado/i,                   icon: AlertCircle,  color: "text-red-400",     bg: "bg-red-500/8 border-red-500/20" },
  { regex: /reserva.*aprovada|booking.*approved|aprovada pelo anfitr/i,                icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20" },
  { regex: /reserva.*cancelada|booking.*cancelled|cancelada pelo/i,                    icon: AlertCircle,  color: "text-red-400",     bg: "bg-red-500/8 border-red-500/20" },
  { regex: /solicitação.*reserva|reserva.*solicitada|booking.*request|interesse no/i,  icon: Clock,        color: "text-amber-400",   bg: "bg-amber-500/8 border-amber-500/20" },
  { regex: /viagem.*iniciada|trip.*started|entrega.*realizada/i,                       icon: Car,          color: "text-cyan-400",    bg: "bg-cyan-500/8 border-cyan-500/20" },
  { regex: /viagem.*concluída|trip.*completed|devolução.*realizada/i,                  icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20" },
  { regex: /envie.*documentos|send.*documents|documentos.*necessários/i,               icon: Info,         color: "text-blue-400",    bg: "bg-blue-500/8 border-blue-500/20" },
  { regex: /documento.*aprovado|document.*approved/i,                                  icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20" },
  { regex: /documento.*rejeitado|document.*rejected/i,                                 icon: AlertCircle,  color: "text-red-400",     bg: "bg-red-500/8 border-red-500/20" },
  { regex: /^(✅|❌|⚠|🔔|💳|🚗)/,                                                    icon: Info,         color: "text-blue-400",    bg: "bg-blue-500/8 border-blue-500/20" },
];

const getSystemStyle = (content: string) =>
  SYSTEM_PATTERNS.find((p) => p.regex.test(content)) ||
  { icon: Info, color: "text-slate-400", bg: "bg-slate-500/8 border-slate-500/20" };

const isSystemMessage = (senderId: number | null | undefined, content: string) =>
  senderId === 0 || senderId === null || senderId === undefined ||
  SYSTEM_PATTERNS.some((p) => p.regex.test(content));

// ─── Quick Replies ────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  { label: "✅ Confirmar retirada",     text: "Olá! Confirmo a retirada do veículo conforme combinado. Qualquer dúvida, estou à disposição! 🚗" },
  { label: "📍 Instruções de retirada", text: "Para retirar o veículo, compareça no endereço combinado com CNH original e o código da reserva. Estarei aguardando!" },
  { label: "📄 Solicitar documentos",   text: "Por favor, envie uma foto da sua CNH pelo app para finalizarmos a reserva. Obrigado!" },
  { label: "🔑 Confirmar devolução",    text: "Confirmo o recebimento do veículo em boas condições. Obrigado pela preferência! ⭐" },
  { label: "💳 Aguardando pagamento",   text: "Sua reserva foi aprovada! Aguardando a confirmação do pagamento para ativar a viagem." },
];

const QUICK_EMOJIS = ["👋", "👍", "🚗", "✅", "⭐", "😊", "🙏", "🔑"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface VehicleInfo {
  id: number;
  brand: string | null;
  model: string | null;
  year: number | null;
  mainImageUrl: string | null;
  vehicleType: string | null;
  pickupCity: string | null;
  pickupState: string | null;
}

interface ConvItem {
  id: number;
  lastMessageAt: Date | null;
  bookingId: number | null;
  otherUser: { id: number; name: string | null; avatarUrl: string | null } | null;
  lastMessage: { content: string; senderId: number; messageType?: string } | null;
  vehicle?: VehicleInfo | null;
}

interface MsgItem {
  id: number;
  senderId: number;
  content: string;
  createdAt: Date;
  isRead: boolean;
  messageType?: string;
  _optimistic?: boolean;
}

type FilterType = "all" | "renter" | "host";

// ─── ConversationItem (Airbnb-style) ─────────────────────────────────────────

function ConversationItem({
  conv,
  isActive,
  unreadCount,
  currentUserId,
  onClick,
}: {
  conv: ConvItem;
  isActive: boolean;
  unreadCount: number;
  currentUserId?: number;
  onClick: () => void;
}) {
  const lastContent = conv.lastMessage?.content || "Nenhuma mensagem ainda";
  const isImage = conv.lastMessage?.messageType === "image";
  const isMe = conv.lastMessage?.senderId === currentUserId;
  const preview = isImage ? "📷 Imagem" : lastContent;
  const hasUnread = unreadCount > 0 && !isActive;
  const vehicleName = conv.vehicle ? `${conv.vehicle.brand ?? ""} ${conv.vehicle.model ?? ""}`.trim() : null;
  const location = conv.vehicle?.pickupCity ? `${conv.vehicle.pickupCity}${conv.vehicle.pickupState ? `, ${conv.vehicle.pickupState}` : ""}` : null;

  return (
    <button
      onClick={onClick}
      className={`
        w-full px-4 py-4 flex items-start gap-3.5 transition-all duration-150 text-left relative
        border-b border-slate-800/40 last:border-b-0
        ${isActive ? "bg-slate-800/50" : "hover:bg-slate-800/30"}
      `}
    >
      {/* Thumbnail: square vehicle image + user avatar overlaid */}
      <div className="relative shrink-0 w-[60px] h-[60px]">
        {/* Square vehicle thumbnail */}
        <div className="w-[60px] h-[60px] rounded-xl overflow-hidden bg-slate-800 border border-slate-700/40">
          {conv.vehicle?.mainImageUrl ? (
            <img
              src={conv.vehicle.mainImageUrl}
              alt={vehicleName || "Veículo"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {conv.vehicle?.vehicleType === "motorcycle"
                ? <Bike className="w-6 h-6 text-slate-600" />
                : <Car className="w-6 h-6 text-slate-600" />
              }
            </div>
          )}
        </div>
        {/* User avatar overlaid bottom-right */}
        <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full border-2 border-[#0d1424] overflow-hidden bg-slate-700">
          {conv.otherUser?.avatarUrl ? (
            <img src={conv.otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-[9px] font-bold ${isActive ? "bg-blue-600 text-white" : "bg-slate-600 text-slate-300"}`}>
              {getInitials(conv.otherUser?.name)}
            </div>
          )}
        </div>
        {/* Unread dot */}
        {hasUnread && (
          <span className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-[#0d1424]">
            <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
          </span>
        )}
      </div>

      {/* Content: 3 lines */}
      <div className="flex-1 min-w-0">
        {/* Line 1: name + time */}
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <span className={`text-sm font-semibold truncate leading-tight ${hasUnread ? "text-white" : isActive ? "text-white" : "text-slate-200"}`}>
            {conv.otherUser?.name || "Usuário"}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[11px] ${hasUnread ? "text-blue-400 font-medium" : "text-slate-600"}`}>
              {formatConvTime(conv.lastMessageAt)}
            </span>
            {hasUnread && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
        </div>
        {/* Line 2: message preview */}
        <p className={`text-[13px] truncate leading-snug ${hasUnread ? "text-slate-200 font-medium" : "text-slate-500"}`}>
          {isMe && !isImage && <span className="text-slate-600">Você: </span>}
          {preview}
        </p>
        {/* Line 3: vehicle name + city */}
        {(vehicleName || location) && (
          <p className="text-[11px] text-slate-600 truncate mt-0.5">
            {[vehicleName, location].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── DateSeparator ────────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: Date }) {
  const label = isToday(date)
    ? "Hoje"
    : isYesterday(date)
    ? "Ontem"
    : format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="flex items-center justify-center my-5">
      <span className="text-[11px] font-semibold text-slate-500 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/30 capitalize">
        {label}
      </span>
    </div>
  );
}

// ─── MessageGroup (Airbnb-style: avatar on first, label above) ────────────────

function MessageGroup({
  messages,
  isMe,
  senderName,
  senderAvatar,
  senderRole,
  currentUserId,
}: {
  messages: MsgItem[];
  isMe: boolean;
  senderName: string;
  senderAvatar?: string | null;
  senderRole?: string;
  currentUserId?: number;
}) {
  const firstMsg = messages[0];
  const lastMsg = messages[messages.length - 1];
  const timeLabel = formatMessageTime(firstMsg.createdAt);
  const sys = isSystemMessage(firstMsg.senderId, firstMsg.content);

  if (sys) {
    return (
      <div className="flex flex-col items-center gap-1 my-4 px-2">
        {messages.map((msg) => {
          const style = getSystemStyle(msg.content);
          const Icon = style.icon;
          return (
            <div key={msg.id} className={`flex items-start gap-2.5 px-4 py-3 rounded-2xl border ${style.bg} max-w-[88%] w-full`}>
              <Icon className={`w-4 h-4 ${style.color} shrink-0 mt-0.5`} />
              <p className="text-[13px] text-slate-200 leading-relaxed">{msg.content}</p>
            </div>
          );
        })}
        <span className="text-[10px] text-slate-600 mt-0.5">{timeLabel}</span>
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 mb-4 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar column — only shown for received messages */}
      {!isMe && (
        <div className="shrink-0 w-8 flex flex-col justify-end pb-0.5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 border border-slate-600/40">
            {senderAvatar ? (
              <img src={senderAvatar} alt={senderName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-300 bg-slate-700">
                {getInitials(senderName)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bubbles column */}
      <div className={`flex flex-col gap-1 max-w-[72%] ${isMe ? "items-end" : "items-start"}`}>
        {/* Sender label (Airbnb-style: "Name · Role HH:MM") */}
        {!isMe && (
          <div className="flex items-center gap-1.5 px-1 mb-0.5">
            <span className="text-[11px] font-semibold text-slate-400">{senderName}</span>
            {senderRole && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-[11px] text-slate-600">{senderRole}</span>
              </>
            )}
            <span className="text-slate-700">·</span>
            <span className="text-[11px] text-slate-600">{timeLabel}</span>
          </div>
        )}

        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const isImage = msg.messageType === "image";

          if (isImage) {
            return (
              <div
                key={msg.id}
                className={`rounded-2xl overflow-hidden cursor-pointer max-w-[240px] ${msg._optimistic ? "opacity-60" : ""}`}
                onClick={() => !msg._optimistic && window.open(msg.content, "_blank")}
              >
                <img src={msg.content} alt="Imagem enviada" className="w-full h-auto object-cover hover:opacity-90 transition-opacity" />
              </div>
            );
          }

          // Border radius: Airbnb-style grouping
          const radius = isMe
            ? `rounded-2xl ${i === 0 && messages.length > 1 ? "rounded-br-md" : ""} ${i > 0 && i < messages.length - 1 ? "rounded-r-md" : ""} ${i > 0 && isLast ? "rounded-br-sm" : ""}`
            : `rounded-2xl ${i === 0 && messages.length > 1 ? "rounded-bl-md" : ""} ${i > 0 && i < messages.length - 1 ? "rounded-l-md" : ""} ${i > 0 && isLast ? "rounded-bl-sm" : ""}`;

          return (
            <div
              key={msg.id}
              className={`
                px-4 py-2.5 text-[14px] leading-relaxed select-text
                ${msg._optimistic ? "opacity-60" : ""}
                ${isMe
                  ? `bg-[#1e2a3a] text-white border border-slate-700/30 ${radius}`
                  : `bg-[#111827] text-slate-100 border border-slate-700/40 ${radius}`
                }
              `}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          );
        })}

        {/* Time + read receipt — shown below last bubble for sent messages */}
        {isMe && (
          <div className="flex items-center gap-1 px-1 mt-0.5">
            <span className="text-[10px] text-slate-600">{timeLabel}</span>
            {lastMsg._optimistic
              ? <Loader2 className="w-2.5 h-2.5 text-slate-600 animate-spin" />
              : lastMsg.isRead
              ? <CheckCheck className="w-3 h-3 text-blue-400/60" />
              : <Check className="w-3 h-3 text-slate-600" />
            }
          </div>
        )}
      </div>

      {/* Spacer for sent messages (mirror of avatar column) */}
      {isMe && <div className="w-8 shrink-0" />}
    </div>
  );
}

// ─── InlineBookingCard ────────────────────────────────────────────────────────

function InlineBookingCard({
  ctx,
  onNavigate,
}: {
  ctx: {
    bookingId: number;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    totalAmount: string | null;
    vehicle: VehicleInfo | null;
  };
  onNavigate: (path: string) => void;
}) {
  const statusInfo = getBookingStatusLabel(ctx.status);
  const dateRange = formatBookingDateRange(ctx.startDate, ctx.endDate);
  const vehicleName = ctx.vehicle ? `${ctx.vehicle.brand ?? ""} ${ctx.vehicle.model ?? ""}`.trim() : "Veículo";

  return (
    <div className="my-3 flex justify-start pl-10">
      <div
        className="w-full max-w-[320px] rounded-2xl border border-slate-700/50 bg-[#111827] overflow-hidden cursor-pointer hover:border-slate-600/70 transition-all duration-150 shadow-lg shadow-black/20"
        onClick={() => onNavigate(`/bookings/${ctx.bookingId}`)}
      >
        {/* Vehicle image */}
        {ctx.vehicle?.mainImageUrl && (
          <div className="w-full h-[160px] overflow-hidden relative">
            <img
              src={ctx.vehicle.mainImageUrl}
              alt={vehicleName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}
        {/* Card body */}
        <div className="p-4">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold mb-3 ${statusInfo.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
            <span className={statusInfo.text}>{statusInfo.label}</span>
          </div>
          <p className="text-sm font-bold text-white leading-tight mb-1">{vehicleName}</p>
          {dateRange && <p className="text-[12px] text-slate-400">{dateRange}</p>}
          {ctx.vehicle?.pickupCity && (
            <p className="text-[11px] text-slate-600 mt-0.5">{ctx.vehicle.pickupCity}{ctx.vehicle.pickupState ? `, ${ctx.vehicle.pickupState}` : ""}</p>
          )}
          <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-center justify-between">
            <span className="text-[12px] text-blue-400 font-semibold">Ver detalhes</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ReviewCTACard ────────────────────────────────────────────────────────────

function ReviewCTACard({ bookingId, onNavigate }: { bookingId: number; onNavigate: (path: string) => void }) {
  return (
    <div className="my-3 flex justify-center">
      <div className="px-5 py-4 rounded-2xl border border-amber-500/20 bg-amber-500/8 max-w-[320px] w-full text-center">
        <p className="text-[13px] text-slate-300 leading-relaxed mb-1">Conte-nos o que você achou da viagem.</p>
        <button
          onClick={() => onNavigate(`/bookings/${bookingId}`)}
          className="text-[13px] font-semibold text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors"
        >
          Deixe uma avaliação
        </button>
      </div>
    </div>
  );
}

// ─── HostTimezoneNotice ───────────────────────────────────────────────────────

function HostTimezoneNotice({ hostName }: { hostName: string | null }) {
  const now = new Date();
  const time = format(now, "HH:mm");
  return (
    <div className="flex items-center justify-center gap-1.5 py-2 my-1">
      <span className="text-[11px] text-slate-600">🌙 São {time} para {hostName || "seu anfitrião"}.</span>
    </div>
  );
}

// ─── BookingContextPanel (right panel, xl screens) ───────────────────────────

function BookingContextPanel({
  conversationId,
  onNavigate,
}: {
  conversationId: number;
  onNavigate: (path: string) => void;
}) {
  const { data: ctx, isLoading } = trpc.message.getConversationContext.useQuery(
    { conversationId },
    { staleTime: 60_000 }
  );

  if (isLoading) {
    return (
      <div className="hidden xl:flex w-72 border-l border-slate-800/50 flex-col shrink-0 animate-pulse p-5 gap-4">
        <div className="h-3 bg-slate-800 rounded w-1/2" />
        <div className="aspect-video bg-slate-800 rounded-2xl" />
        <div className="h-3 bg-slate-800 rounded w-full" />
        <div className="h-3 bg-slate-800 rounded w-3/4" />
      </div>
    );
  }

  if (!ctx) {
    return (
      <div className="hidden xl:flex w-72 border-l border-slate-800/50 flex-col shrink-0">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto mb-3">
              <Car className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-xs text-slate-600">Nenhuma reserva vinculada</p>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getBookingStatusLabel(ctx.status);
  const dateRange = formatBookingDateRange(ctx.startDate, ctx.endDate);
  const vehicleName = ctx.vehicle ? `${ctx.vehicle.brand ?? ""} ${ctx.vehicle.model ?? ""}`.trim() : null;

  return (
    <div className="hidden xl:flex w-72 border-l border-slate-800/50 flex-col shrink-0">
      <div className="px-5 pt-5 pb-4 border-b border-slate-800/50">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Detalhes da Viagem</p>
      </div>
      <div className="p-5 space-y-5 flex-1 overflow-y-auto">
        {/* Vehicle image */}
        <div className="w-full aspect-video rounded-2xl bg-slate-800 border border-slate-700/40 overflow-hidden relative group">
          {ctx.vehicle?.mainImageUrl ? (
            <>
              <img src={ctx.vehicle.mainImageUrl} alt={vehicleName || "Veículo"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-sm font-bold text-white drop-shadow-lg">{vehicleName}</p>
                <p className="text-xs text-white/60">{ctx.vehicle.year}</p>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-10 h-10 text-slate-600" />
            </div>
          )}
        </div>

        {/* Status */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${statusInfo.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
          <span className={statusInfo.text}>{statusInfo.label}</span>
        </div>

        {/* Details */}
        <div className="space-y-3.5">
          {dateRange && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/40 flex items-center justify-center shrink-0 mt-0.5">
                <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Período</p>
                <p className="text-xs text-slate-200 mt-0.5 font-medium">{dateRange}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{ctx.totalDays} dia{ctx.totalDays !== 1 ? "s" : ""}</p>
              </div>
            </div>
          )}
          {ctx.pickupLocation && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/40 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Retirada</p>
                <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{ctx.pickupLocation}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/40 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Código</p>
              <p className="text-xs text-slate-200 mt-0.5 font-mono tracking-wider">{ctx.bookingCode}</p>
            </div>
          </div>
          {ctx.totalAmount && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/40 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total</p>
                <p className="text-sm text-white mt-0.5 font-bold">
                  R$ {Number(ctx.totalAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Protected badge */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-300">Pagamento Protegido</p>
            <p className="text-[11px] text-emerald-500/70">Seguro e reembolsável</p>
          </div>
        </div>

        <Button
          onClick={() => onNavigate(`/bookings/${ctx.bookingId}`)}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-900/30 flex items-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver Detalhes da Reserva
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Messages() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const conversationIdParam = params.get("conversation");

  const { user } = useAuth();
  const [selectedConvId, setSelectedConvId] = useState<number | null>(
    conversationIdParam ? parseInt(conversationIdParam) : null
  );
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<MsgItem[]>([]);
  const [showConvPanel, setShowConvPanel] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const utils = trpc.useUtils();

  // ── Visibility API ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => setIsTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // ── Scroll button visibility ───────────────────────────────────────────────
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 200);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [selectedConvId]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: conversations, isLoading: loadingConversations } =
    trpc.message.getConversations.useQuery(undefined, {
      enabled: !!user,
      refetchInterval: isTabVisible ? 10_000 : false,
      staleTime: 5_000,
    });

  const { data: unreadMap } = trpc.message.getUnreadPerConversation.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: isTabVisible ? 10_000 : false,
    staleTime: 5_000,
  });

  const { data: serverMessages, isLoading: loadingMessages } =
    trpc.message.getMessages.useQuery(
      { conversationId: selectedConvId! },
      {
        enabled: !!selectedConvId && !!user,
        refetchInterval: isTabVisible && !!selectedConvId ? 3_000 : false,
        staleTime: 2_000,
      }
    );

  // Merge server + optimistic messages
  const messages = useMemo<MsgItem[]>(() => {
    const base = serverMessages ? [...(serverMessages as MsgItem[])].reverse() : [];
    if (!optimisticMessages.length) return base;
    const serverIds = new Set(serverMessages?.map((m) => m.id) ?? []);
    const pending = optimisticMessages.filter((m) => m._optimistic && !serverIds.has(m.id));
    return [...base, ...pending];
  }, [serverMessages, optimisticMessages]);

  // Clear confirmed optimistic messages
  useEffect(() => {
    if (!serverMessages || !optimisticMessages.length) return;
    const serverIds = new Set(serverMessages.map((m) => m.id));
    setOptimisticMessages((prev) => {
      const filtered = prev.filter((m) => !serverIds.has(m.id));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [serverMessages]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const sendMessageMutation = trpc.message.send.useMutation({
    onMutate: ({ content }) => {
      if (!user) return;
      const tempId = -(Date.now());
      const optimistic: MsgItem = { id: tempId, senderId: user.id, content, createdAt: new Date(), isRead: false, _optimistic: true };
      setOptimisticMessages((prev) => [...prev, optimistic]);
      setNewMessage("");
      return { optimistic };
    },
    onSuccess: () => {
      utils.message.getMessages.invalidate({ conversationId: selectedConvId! });
      utils.message.getConversations.invalidate();
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.optimistic) setOptimisticMessages((prev) => prev.filter((m) => m.id !== ctx.optimistic.id));
      toast.error("Mensagem bloqueada", { description: error.message });
    },
  });

  const uploadImageMutation = trpc.message.uploadChatImage.useMutation({
    onMutate: () => {
      if (!user || !selectedConvId) return;
      const optimistic: MsgItem = { id: -(Date.now()), senderId: user.id, content: imagePreview || "", createdAt: new Date(), isRead: false, messageType: "image", _optimistic: true };
      setOptimisticMessages((prev) => [...prev, optimistic]);
      setImagePreview(null);
      return { optimistic };
    },
    onSuccess: () => {
      utils.message.getMessages.invalidate({ conversationId: selectedConvId! });
      utils.message.getConversations.invalidate();
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.optimistic) setOptimisticMessages((prev) => prev.filter((m) => m.id !== (ctx as any).optimistic.id));
      toast.error("Falha ao enviar imagem", { description: error.message });
    },
  });

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!messagesEndRef.current) return;
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages.length, selectedConvId]);

  // ── URL sync ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedConvId) navigate(`/messages?conversation=${selectedConvId}`, { replace: true });
  }, [selectedConvId, navigate]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(() => {
    const text = newMessage.trim();
    if (!text || !selectedConvId) return;
    sendMessageMutation.mutate({ conversationId: selectedConvId, content: text });
  }, [newMessage, selectedConvId, sendMessageMutation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("Imagem muito grande", { description: "Máximo 8MB" }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleEmojiInsert = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiBar(false);
    textareaRef.current?.focus();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  // ── Group messages by sender for Airbnb-style display ─────────────────────
  const messageGroups = useMemo(() => {
    const groups: Array<{ messages: MsgItem[]; senderId: number }> = [];
    for (const msg of messages) {
      const last = groups[groups.length - 1];
      const sys = isSystemMessage(msg.senderId, msg.content);
      const prevSys = last && isSystemMessage(last.senderId, last.messages[0].content);
      if (last && last.senderId === msg.senderId && !sys && !prevSys) {
        last.messages.push(msg);
      } else {
        groups.push({ messages: [msg], senderId: msg.senderId });
      }
    }
    return groups;
  }, [messages]);

  // ── Group messages by date ─────────────────────────────────────────────────
  const groupsWithDates = useMemo(() => {
    const result: Array<{ type: "date"; date: Date } | { type: "group"; senderId: number; messages: MsgItem[] }> = [];
    let lastDate = "";
    for (const g of messageGroups) {
      const dateKey = format(new Date(g.messages[0].createdAt), "yyyy-MM-dd");
      if (dateKey !== lastDate) {
        result.push({ type: "date", date: new Date(g.messages[0].createdAt) });
        lastDate = dateKey;
      }
      result.push({ type: "group", ...g });
    }
    return result;
  }, [messageGroups]);

  // ── Filtered conversations ─────────────────────────────────────────────────
  const filteredConversations = useMemo(() => {
    type ConvWithRole = (typeof conversations extends (infer T)[] | undefined ? T : never) & { isRenter?: boolean; isHost?: boolean };
    let list = (conversations ?? []) as ConvWithRole[];
    
    // Text search filter
    if (searchQuery) {
      list = list.filter((conv) =>
        conv.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Role filter pills — uses isRenter/isHost from backend
    if (filter === "renter") {
      list = list.filter((conv) => (conv as any).isRenter === true);
    } else if (filter === "host") {
      list = list.filter((conv) => (conv as any).isHost === true);
    }
    
    return list;
  }, [conversations, searchQuery, filter]);

  const selectedConversation = conversations?.find((c) => c.id === selectedConvId);
  const totalUnread = unreadMap ? Object.values(unreadMap).reduce((a, b) => a + b, 0) : 0;

  // ── Conversation list (reusable) ───────────────────────────────────────────
  const ConvList = ({ onSelect }: { onSelect: (id: number) => void }) => (
    <div>
      {loadingConversations ? (
        <div className="space-y-0 divide-y divide-slate-800/40">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3.5 px-4 py-4 animate-pulse">
              <div className="w-[60px] h-[60px] rounded-xl bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 bg-slate-800 rounded w-2/3" />
                <div className="h-3 bg-slate-800 rounded w-full" />
                <div className="h-2.5 bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : !filteredConversations.length ? (
        <div className="text-center py-16 px-5">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-sm text-slate-400 font-semibold">Nenhuma conversa</p>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">Suas conversas aparecerão aqui quando você fizer uma reserva.</p>
        </div>
      ) : (
        <div>
          {filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conv={conv as ConvItem}
              isActive={selectedConvId === conv.id}
              unreadCount={unreadMap?.[conv.id] ?? 0}
              currentUserId={user?.id}
              onClick={() => onSelect(conv.id)}
            />
          ))}
        </div>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-80px)] flex flex-col pb-16 lg:pb-0">
        <div className="flex-1 flex overflow-hidden rounded-2xl border border-slate-800/50 bg-[#0d1424] shadow-2xl shadow-black/60">

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className={`w-full md:w-80 lg:w-[340px] border-r border-slate-800/50 flex flex-col shrink-0 ${selectedConvId ? "hidden md:flex" : "flex"}`}>
            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-slate-800/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-white tracking-tight">Mensagens</h2>
                  {totalUnread > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                      {totalUnread}
                    </span>
                  )}
                </div>
                {/* No settings button — not yet implemented */}
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2">
                {(["all", "renter", "host"] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 border ${
                      filter === f
                        ? "bg-white text-[#0d1424] border-white font-semibold"
                        : "bg-transparent text-slate-400 border-slate-700/50 hover:border-slate-600 hover:text-slate-300"
                    }`}
                  >
                    {f === "all" ? "Todas" : f === "renter" ? "Sou locatário" : "Sou anfitrião"}
                  </button>
                ))}
              </div>
            </div>

            {/* Search input (always visible) */}
            <div className="px-4 py-3 border-b border-slate-800/40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar em todas as mensagens"
                  className="w-full pl-9 pr-3 py-2.5 text-[13px] rounded-xl bg-slate-800/40 border border-slate-700/30 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-600/60 focus:bg-slate-800/60 transition-all" style={{ fontSize: "16px" }}
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
              <ConvList onSelect={(id) => setSelectedConvId(id)} />
            </div>
          </div>

          {/* ── Chat Area ──────────────────────────────────────────────── */}
          <div className={`flex-1 flex flex-col min-w-0 overflow-hidden relative ${!selectedConvId ? "hidden md:flex" : "flex"}`}>

            {/* Mobile overlay panel */}
            {showConvPanel && (
              <div className="absolute inset-0 z-50 bg-[#0d1424] flex flex-col md:hidden">
                <div className="px-5 pt-5 pb-3 border-b border-slate-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowConvPanel(false)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center -ml-1">
                        <X className="w-4 h-4" />
                      </button>
                      <h2 className="text-xl font-bold text-white">Mensagens</h2>
                    </div>
                    {totalUnread > 0 && <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">{totalUnread}</span>}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {(["all", "renter", "host"] as FilterType[]).map((f) => (
                      <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border ${filter === f ? "bg-white text-[#0d1424] border-white font-semibold" : "bg-transparent text-slate-400 border-slate-700/50"}`}>
                        {f === "all" ? "Todas" : f === "renter" ? "Locatário" : "Anfitrião"}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2.5 text-[13px] rounded-xl bg-slate-800/40 border border-slate-700/30 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-600/60 transition-all" style={{ fontSize: "16px" }} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ConvList onSelect={(id) => { setSelectedConvId(id); setShowConvPanel(false); }} />
                </div>
              </div>
            )}

            {selectedConvId && selectedConversation ? (
              <>
                {/* ── Chat Header (Airbnb-style) ──────────────────────── */}
                <div className="px-4 py-3.5 border-b border-slate-800/50 flex items-center justify-between shrink-0 bg-[#0d1424]/90 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    {/* Mobile nav buttons */}
                    <button onClick={() => setSelectedConvId(null)} className="md:hidden w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center -ml-1">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowConvPanel(true)} className="md:hidden w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center">
                      <List className="w-4 h-4" />
                    </button>

                    {/* Airbnb-style: both avatars overlaid */}
                    <div className="relative w-12 h-10 shrink-0">
                      {/* Vehicle thumbnail (background) */}
                      <div className="absolute left-0 top-0 w-10 h-10 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/40">
                        {(selectedConversation as ConvItem).vehicle?.mainImageUrl ? (
                          <img src={(selectedConversation as ConvItem).vehicle!.mainImageUrl!} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-4 h-4 text-slate-600" />
                          </div>
                        )}
                      </div>
                      {/* User avatar (foreground, overlaid bottom-right) */}
                      <div className="absolute right-0 bottom-0 w-7 h-7 rounded-full border-2 border-[#0d1424] overflow-hidden bg-slate-700">
                        {selectedConversation.otherUser?.avatarUrl ? (
                          <img src={selectedConversation.otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] font-bold bg-blue-700 text-white">
                            {getInitials(selectedConversation.otherUser?.name)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Name + booking info */}
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {selectedConversation.otherUser?.name || "Usuário"}
                      </h3>
                      {selectedConversation.bookingId ? (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {(selectedConversation as ConvItem).vehicle
                            ? `${(selectedConversation as ConvItem).vehicle!.brand} ${(selectedConversation as ConvItem).vehicle!.model}`
                            : `Reserva #${selectedConversation.bookingId}`
                          }
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-0.5">Mensagem direta</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Detalhes button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toast("Em breve", { description: "Chamadas de voz disponíveis em breve." })}
                      className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 flex items-center justify-center transition-all"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    {selectedConversation.bookingId && (
                      <button
                        onClick={() => navigate(`/bookings/${selectedConversation.bookingId}`)}
                        className="px-4 py-1.5 rounded-full border border-slate-600/60 text-[13px] font-semibold text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all"
                      >
                        Detalhes
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Messages Area ─────────────────────────────────────── */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto px-4 py-4 relative"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <div className="max-w-2xl mx-auto">
                    {loadingMessages && !messages.length ? (
                      <div className="space-y-6 py-6">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`flex gap-2.5 ${i % 2 === 0 ? "flex-row-reverse" : ""} animate-pulse`}>
                            {i % 2 !== 0 && <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0" />}
                            <div className={`space-y-1.5 max-w-[60%] ${i % 2 === 0 ? "items-end" : "items-start"} flex flex-col`}>
                              <div className="h-3 bg-slate-800 rounded w-24" />
                              <div className={`h-10 rounded-2xl ${i % 2 === 0 ? "bg-slate-800/80 w-40" : "bg-slate-800/60 w-48"}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : !messages.length ? (
                      <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-3xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-7 h-7 text-slate-600" />
                        </div>
                        <p className="text-sm text-slate-400 font-semibold">Nenhuma mensagem ainda</p>
                        <p className="text-xs text-slate-600 mt-1.5">Envie uma mensagem para iniciar a conversa.</p>
                      </div>
                    ) : (
                      <>
                        {groupsWithDates.map((item, i) => {
                          if (item.type === "date") {
                            return <DateSeparator key={`date-${i}`} date={item.date} />;
                          }
                          const isMe = item.senderId === user?.id;
                          return (
                            <MessageGroup
                              key={`group-${i}`}
                              messages={item.messages}
                              isMe={isMe}
                              senderName={isMe ? (user?.name || "Você") : (selectedConversation.otherUser?.name || "Usuário")}
                              senderAvatar={isMe ? undefined : selectedConversation.otherUser?.avatarUrl}
                              senderRole={!isMe ? "Anfitrião(a)" : undefined}
                              currentUserId={user?.id}
                            />
                          );
                        })}

                        {/* Inline booking card — shown once after first system message */}
                        {selectedConversation.bookingId && messages.length > 0 && (() => {
                          const convCtx = trpc.message.getConversationContext;
                          return null; // Will be rendered via separate query below
                        })()}

                        {/* Host timezone notice */}
                        <HostTimezoneNotice hostName={selectedConversation.otherUser?.name ?? null} />
                      </>
                    )}
                    <div ref={messagesEndRef} className="h-1" />
                  </div>
                </div>

                {/* Scroll to bottom button */}
                {showScrollBtn && (
                  <button
                    onClick={scrollToBottom}
                    className="absolute bottom-[80px] right-5 w-10 h-10 rounded-full bg-[#1e2a3a] border border-slate-700/50 shadow-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-10"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                )}

                {/* ── Image Preview ─────────────────────────────────────── */}
                {imagePreview && (
                  <div className="px-4 py-3 border-t border-slate-800/50 bg-slate-900/60 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-700/50">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button onClick={() => setImagePreview(null)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-300 font-semibold">Imagem pronta para enviar</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Clique em enviar para compartilhar</p>
                      </div>
                      <Button
                        onClick={() => uploadImageMutation.mutate({ conversationId: selectedConvId!, base64Image: imagePreview })}
                        disabled={uploadImageMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl gap-1.5"
                      >
                        {uploadImageMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Enviar
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Quick Replies ─────────────────────────────────────── */}
                {showQuickReplies && (
                  <div className="px-4 py-3 border-t border-slate-800/50 bg-[#0d1424]/80 shrink-0">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Respostas Rápidas</span>
                      <button onClick={() => setShowQuickReplies(false)} className="ml-auto text-slate-600 hover:text-slate-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_REPLIES.map((qr) => (
                        <button key={qr.label} onClick={() => { setNewMessage(qr.text); setShowQuickReplies(false); textareaRef.current?.focus(); }} className="px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-xs text-slate-300 hover:border-slate-600 hover:text-white transition-all">
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Emoji Bar ─────────────────────────────────────────── */}
                {showEmojiBar && (
                  <div className="px-4 py-2.5 border-t border-slate-800/50 bg-[#0d1424]/80 shrink-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button key={emoji} onClick={() => handleEmojiInsert(emoji)} className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/40 text-lg hover:bg-slate-700/60 hover:scale-110 transition-all flex items-center justify-center">
                          {emoji}
                        </button>
                      ))}
                      <button onClick={() => setShowEmojiBar(false)} className="ml-auto text-slate-600 hover:text-slate-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}

                {/* ── Composer (Airbnb-style: + left, arrow right) ──────── */}
                <div className="px-4 py-3 border-t border-slate-800/50 shrink-0 bg-[#0d1424]/90 backdrop-blur-sm">
                  <div className="flex items-end gap-2">
                    {/* + button (Airbnb-style) */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 rounded-full border border-slate-700/50 bg-transparent flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all shrink-0 mb-0.5"
                    >
                      <span className="text-xl font-light leading-none">+</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />

                    {/* Input area */}
                    <div className="flex-1 flex items-end gap-2 bg-slate-800/40 border border-slate-700/40 rounded-2xl px-4 py-2.5 focus-within:border-slate-600/60 focus-within:bg-slate-800/60 transition-all">
                      <div className="flex items-center gap-1 shrink-0 mb-0.5">
                        <button
                          type="button"
                          onClick={() => { setShowEmojiBar((v) => !v); setShowQuickReplies(false); }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${showEmojiBar ? "text-amber-400" : "text-slate-600 hover:text-slate-400"}`}
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowQuickReplies((v) => !v); setShowEmojiBar(false); }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${showQuickReplies ? "text-amber-400" : "text-slate-600 hover:text-slate-400"}`}
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          e.target.style.height = "auto";
                          e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Escreva uma mensagem..."
                        disabled={sendMessageMutation.isPending}
                        rows={1}
                        className="flex-1 bg-transparent text-[14px] text-slate-200 placeholder:text-slate-600 focus:outline-none disabled:opacity-50 resize-none overflow-hidden leading-relaxed py-0.5"
                        style={{ minHeight: "24px", maxHeight: "120px", fontSize: "16px" }}
                      />
                    </div>

                    {/* Send arrow button (Airbnb-style) */}
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      className="w-10 h-10 rounded-full bg-white disabled:bg-slate-700 disabled:opacity-40 flex items-center justify-center transition-all hover:bg-slate-200 active:scale-95 shrink-0 mb-0.5 shadow-md"
                    >
                      {sendMessageMutation.isPending
                        ? <Loader2 className="w-4 h-4 text-[#0d1424] animate-spin" />
                        : <Send className="w-4 h-4 text-[#0d1424]" />
                      }
                    </button>
                  </div>

                  {/* Security notice */}
                  <div className="flex items-center gap-1.5 mt-2 px-1">
                    <ShieldCheck className="w-3 h-3 text-slate-700" />
                    <span className="text-[10px] text-slate-700">Telefones, e-mails e links externos são bloqueados por segurança.</span>
                  </div>
                </div>
              </>
            ) : (
              /* ── Empty State ──────────────────────────────────────────── */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center px-8">
                  <div className="w-20 h-20 rounded-3xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto mb-5">
                    <MessageCircle className="w-9 h-9 text-slate-600" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">Suas mensagens</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Selecione uma conversa ao lado para visualizar as mensagens.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-5">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-slate-400 font-medium">Pagamentos protegidos</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs text-slate-400 font-medium">Suporte 24h</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Booking Context Panel (xl) ──────────────────────────────── */}
          {selectedConvId && selectedConversation?.bookingId && (
            <BookingContextPanel conversationId={selectedConvId} onNavigate={navigate} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
