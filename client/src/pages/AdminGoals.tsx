/**
 * AdminGoals — Painel de Metas da Plataforma (Mission Control)
 * Design: DIFERENTE dos níveis de usuário — tema âmbar/dourado, anéis circulares, OKR dashboard
 * Visual: Mission control, não badges/gamificação
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Target,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
  Car,
  DollarSign,
  Star,
  MapPin,
  Zap,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronDown,
  BarChart3,
} from "lucide-react";

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type MetricType =
  | "total_rentals"
  | "total_revenue"
  | "new_users"
  | "new_hosts"
  | "active_vehicles"
  | "avg_rating"
  | "cities_covered"
  | "custom";

type PeriodType = "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

type GoalStatus = "active" | "completed" | "paused" | "cancelled";

interface Goal {
  id: number;
  title: string;
  description?: string | null;
  metricType: MetricType;
  targetValue: string;
  currentValue: string;
  unit?: string | null;
  periodType: PeriodType;
  startsAt: Date;
  endsAt: Date;
  status: GoalStatus;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const METRIC_LABELS: Record<MetricType, string> = {
  total_rentals: "Total de Locações",
  total_revenue: "Receita Total",
  new_users: "Novos Usuários",
  new_hosts: "Novos Anfitriões",
  active_vehicles: "Veículos Ativos",
  avg_rating: "Nota Média",
  cities_covered: "Cidades Cobertas",
  custom: "Métrica Customizada",
};

const METRIC_ICONS: Record<MetricType, React.ReactNode> = {
  total_rentals: <Car className="w-4 h-4" />,
  total_revenue: <DollarSign className="w-4 h-4" />,
  new_users: <Users className="w-4 h-4" />,
  new_hosts: <Star className="w-4 h-4" />,
  active_vehicles: <Car className="w-4 h-4" />,
  avg_rating: <Star className="w-4 h-4" />,
  cities_covered: <MapPin className="w-4 h-4" />,
  custom: <Target className="w-4 h-4" />,
};

const PERIOD_LABELS: Record<PeriodType, string> = {
  weekly: "Semanal",
  monthly: "Mensal",
  quarterly: "Trimestral",
  yearly: "Anual",
  custom: "Customizado",
};

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: "Ativa", color: "#F59E0B", icon: <Zap className="w-3 h-3" /> },
  completed: { label: "Concluída", color: "#10B981", icon: <CheckCircle2 className="w-3 h-3" /> },
  paused: { label: "Pausada", color: "#6B7280", icon: <Clock className="w-3 h-3" /> },
  cancelled: { label: "Cancelada", color: "#EF4444", icon: <AlertCircle className="w-3 h-3" /> },
};

const PRESET_COLORS = [
  "#F59E0B", // âmbar
  "#EF4444", // vermelho
  "#10B981", // verde
  "#3B82F6", // azul
  "#8B5CF6", // roxo
  "#F97316", // laranja
  "#EC4899", // rosa
  "#14B8A6", // teal
];

// ─── CIRCULAR PROGRESS ───────────────────────────────────────────────────────
function CircularProgress({
  percent,
  color,
  size = 80,
  strokeWidth = 7,
}: {
  percent: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.min(100, percent) / 100 * circ;
  const center = size / 2;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={center} cy={center} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={center} cy={center} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
    </svg>
  );
}

// ─── GOAL CARD ────────────────────────────────────────────────────────────────
function GoalCard({
  goal,
  onDelete,
  onUpdateProgress,
}: {
  goal: Goal;
  onDelete: (id: number) => void;
  onUpdateProgress: (id: number, value: number) => void;
}) {
  const [editingProgress, setEditingProgress] = useState(false);
  const [progressInput, setProgressInput] = useState("");

  const target = parseFloat(goal.targetValue);
  const current = parseFloat(goal.currentValue);
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const statusCfg = STATUS_CONFIG[goal.status];
  const isCompleted = goal.status === "completed" || percent >= 100;
  const daysLeft = Math.ceil((new Date(goal.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const formatValue = (val: number) => {
    if (goal.metricType === "total_revenue") {
      return `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
    }
    if (goal.metricType === "avg_rating") return val.toFixed(2);
    return val.toLocaleString("pt-BR");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${goal.color}12, rgba(15,20,35,0.95))`,
        border: `1px solid ${goal.color}33`,
      }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 90% 10%, ${goal.color}20, transparent 50%)`,
        }}
      />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {/* Status badge */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-2"
              style={{
                background: `${statusCfg.color}18`,
                border: `1px solid ${statusCfg.color}33`,
                color: statusCfg.color,
              }}
            >
              {statusCfg.icon}
              {statusCfg.label}
              {!isCompleted && daysLeft > 0 && (
                <span className="opacity-70">· {daysLeft}d restantes</span>
              )}
            </div>
            <h3 className="text-white font-bold text-base leading-tight">{goal.title}</h3>
            {goal.description && (
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">{goal.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-3 flex-shrink-0">
            <button
              onClick={() => {
                setProgressInput(current.toString());
                setEditingProgress(true);
              }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
              style={{ color: "#666" }}
              title="Atualizar progresso"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/20"
              style={{ color: "#666" }}
              title="Deletar meta"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress section */}
        <div className="flex items-center gap-5">
          {/* Circular progress */}
          <div className="relative flex-shrink-0">
            <CircularProgress percent={percent} color={isCompleted ? "#10B981" : goal.color} size={80} />
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ color: isCompleted ? "#10B981" : goal.color }}
            >
              <span className="text-base font-black leading-none">{percent}%</span>
              {isCompleted && <CheckCircle2 className="w-3 h-3 mt-0.5" />}
            </div>
          </div>

          {/* Values */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span
                className="text-2xl font-black"
                style={{ color: isCompleted ? "#10B981" : goal.color }}
              >
                {formatValue(current)}
              </span>
              <span className="text-gray-600 text-sm font-medium">
                / {formatValue(target)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-white/06 overflow-hidden mb-2">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                style={{
                  background: isCompleted
                    ? "linear-gradient(90deg, #10B981, #059669)"
                    : `linear-gradient(90deg, ${goal.color}, ${goal.color}88)`,
                  boxShadow: `0 0 8px ${isCompleted ? "#10B98188" : goal.color + "88"}`,
                }}
              />
            </div>

            {/* Metric type + period */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "#888",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {METRIC_ICONS[goal.metricType]}
                {METRIC_LABELS[goal.metricType]}
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: `${goal.color}12`,
                  color: `${goal.color}aa`,
                  border: `1px solid ${goal.color}22`,
                }}
              >
                {PERIOD_LABELS[goal.periodType]}
              </span>
            </div>
          </div>
        </div>

        {/* Edit progress inline */}
        <AnimatePresence>
          {editingProgress && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-white/06 flex items-center gap-2">
                <input
                  type="number"
                  value={progressInput}
                  onChange={(e) => setProgressInput(e.target.value)}
                  placeholder="Novo valor atual"
                  className="flex-1 bg-white/05 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/50"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const val = parseFloat(progressInput);
                    if (!isNaN(val) && val >= 0) {
                      onUpdateProgress(goal.id, val);
                      setEditingProgress(false);
                    }
                  }}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
                >
                  Salvar
                </Button>
                <button
                  onClick={() => setEditingProgress(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── CREATE GOAL MODAL ────────────────────────────────────────────────────────
function CreateGoalModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    metricType: "total_rentals" as MetricType,
    targetValue: "",
    unit: "",
    periodType: "monthly" as PeriodType,
    startsAt: new Date().toISOString().split("T")[0],
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    color: "#F59E0B",
    icon: "Target",
  });

  const createGoal = trpc.levels.adminCreateGoal.useMutation({
    onSuccess: () => {
      toast.success("Meta criada com sucesso! 🎯");
      onCreated();
      onClose();
      setForm({
        title: "",
        description: "",
        metricType: "total_rentals",
        targetValue: "",
        unit: "",
        periodType: "monthly",
        startsAt: new Date().toISOString().split("T")[0],
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        color: "#F59E0B",
        icon: "Target",
      });
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0A0F1C, #0d1526)",
            border: "1px solid rgba(245,158,11,0.3)",
            boxShadow: "0 0 60px rgba(245,158,11,0.15)",
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-5 flex items-center justify-between"
            style={{
              borderBottom: "1px solid rgba(245,158,11,0.15)",
              background: "rgba(245,158,11,0.05)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.3)" }}
              >
                <Target className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Nova Meta</h3>
                <p className="text-gray-500 text-xs">Defina um objetivo para a plataforma</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Título da Meta *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: 1.000 locações em janeiro"
                className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Contexto e estratégia para atingir esta meta..."
                rows={2}
                className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/50 transition-colors resize-none"
              />
            </div>

            {/* Metric type */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Tipo de Métrica *
              </label>
              <div className="relative">
                <select
                  value={form.metricType}
                  onChange={(e) => setForm({ ...form, metricType: e.target.value as MetricType })}
                  className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                >
                  {(Object.entries(METRIC_LABELS) as [MetricType, string][]).map(([k, v]) => (
                    <option key={k} value={k} className="bg-slate-900">{v}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Target + Period */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Meta (valor) *
                </label>
                <input
                  type="number"
                  value={form.targetValue}
                  onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                  placeholder="1000"
                  className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Período
                </label>
                <div className="relative">
                  <select
                    value={form.periodType}
                    onChange={(e) => setForm({ ...form, periodType: e.target.value as PeriodType })}
                    className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                  >
                    {(Object.entries(PERIOD_LABELS) as [PeriodType, string][]).map(([k, v]) => (
                      <option key={k} value={k} className="bg-slate-900">{v}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Início *
                </label>
                <input
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Término *
                </label>
                <input
                  type="date"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="w-full bg-white/05 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Cor da Meta
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className="w-7 h-7 rounded-full transition-all"
                    style={{
                      background: c,
                      border: form.color === c ? `3px solid white` : "3px solid transparent",
                      boxShadow: form.color === c ? `0 0 10px ${c}88` : "none",
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent"
                  title="Cor customizada"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 flex gap-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/10 text-gray-400 hover:bg-white/05"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!form.title || !form.targetValue) {
                  toast.error("Preencha título e valor da meta");
                  return;
                }
                createGoal.mutate({
                  title: form.title,
                  description: form.description || undefined,
                  metricType: form.metricType,
                  targetValue: parseFloat(form.targetValue),
                  unit: form.unit || undefined,
                  periodType: form.periodType,
                  startsAt: new Date(form.startsAt),
                  endsAt: new Date(form.endsAt),
                  color: form.color,
                  icon: form.icon,
                });
              }}
              disabled={createGoal.isPending}
              className="flex-1 font-bold"
              style={{
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#000",
                boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
              }}
            >
              {createGoal.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Target className="w-4 h-4 mr-2" />
              )}
              Criar Meta
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon,
  color,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4"
      style={{
        background: `linear-gradient(135deg, ${color}12, rgba(15,20,35,0.9))`,
        border: `1px solid ${color}25`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
        {subtitle && (
          <span className="text-[10px] font-semibold" style={{ color: `${color}88` }}>
            {subtitle}
          </span>
        )}
      </div>
      <div className="text-2xl font-black text-white mb-0.5">{value}</div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminGoals() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<GoalStatus | "all">("all");

  const { data: goals, refetch, isLoading } = trpc.levels.adminListGoals.useQuery();
  const syncMetrics = trpc.levels.adminSyncGoalMetrics.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.synced} meta(s) sincronizada(s) com dados reais ✅`);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteGoal = trpc.levels.adminDeleteGoal.useMutation({
    onSuccess: () => { toast.success("Meta removida"); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const updateProgress = trpc.levels.adminUpdateGoalProgress.useMutation({
    onSuccess: () => { toast.success("Progresso atualizado ✅"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const allGoals = (goals ?? []) as Goal[];
  const filteredGoals = filterStatus === "all"
    ? allGoals
    : allGoals.filter((g) => g.status === filterStatus);

  // KPIs
  const activeGoals = allGoals.filter((g) => g.status === "active");
  const completedGoals = allGoals.filter((g) => g.status === "completed");
  const avgProgress = activeGoals.length > 0
    ? Math.round(
        activeGoals.reduce((sum, g) => {
          const t = parseFloat(g.targetValue);
          const c = parseFloat(g.currentValue);
          return sum + (t > 0 ? Math.min(100, (c / t) * 100) : 0);
        }, 0) / activeGoals.length
      )
    : 0;
  const criticalGoals = activeGoals.filter((g) => {
    const t = parseFloat(g.targetValue);
    const c = parseFloat(g.currentValue);
    const pct = t > 0 ? (c / t) * 100 : 0;
    const daysLeft = Math.ceil((new Date(g.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return pct < 50 && daysLeft < 7;
  });

  return (
    <AdminDashboardLayout activeSection="goals">
      <div className="space-y-6">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {/* Mission control icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(245,158,11,0.3), rgba(245,158,11,0.1))",
                  border: "1px solid rgba(245,158,11,0.4)",
                  boxShadow: "0 0 20px rgba(245,158,11,0.2)",
                }}
              >
                <Target className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-white font-black text-xl leading-tight">
                  Metas da Plataforma
                </h1>
                <p className="text-gray-500 text-xs">Mission Control · OKRs & KPIs</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => syncMetrics.mutate()}
              disabled={syncMetrics.isPending}
              variant="outline"
              size="sm"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncMetrics.isPending ? "animate-spin" : ""}`} />
              Sincronizar
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              className="font-bold"
              style={{
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#000",
                boxShadow: "0 4px 15px rgba(245,158,11,0.3)",
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Nova Meta
            </Button>
          </div>
        </div>

        {/* ── KPI GRID ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Metas Ativas"
            value={activeGoals.length}
            icon={<Zap className="w-4 h-4" />}
            color="#F59E0B"
            subtitle="em andamento"
          />
          <KpiCard
            label="Concluídas"
            value={completedGoals.length}
            icon={<CheckCircle2 className="w-4 h-4" />}
            color="#10B981"
            subtitle="este ciclo"
          />
          <KpiCard
            label="Progresso Médio"
            value={`${avgProgress}%`}
            icon={<BarChart3 className="w-4 h-4" />}
            color="#3B82F6"
            subtitle="metas ativas"
          />
          <KpiCard
            label="Em Risco"
            value={criticalGoals.length}
            icon={<AlertCircle className="w-4 h-4" />}
            color="#EF4444"
            subtitle="< 50% em 7d"
          />
        </div>

        {/* ── FILTER TABS ── */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "active", "completed", "paused", "cancelled"] as const).map((s) => {
            const count = s === "all" ? allGoals.length : allGoals.filter((g) => g.status === s).length;
            const cfg = s === "all"
              ? { label: "Todas", color: "#888" }
              : { ...STATUS_CONFIG[s as GoalStatus] };
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: filterStatus === s ? `${cfg.color}20` : "rgba(255,255,255,0.04)",
                  color: filterStatus === s ? cfg.color : "#666",
                  border: filterStatus === s ? `1px solid ${cfg.color}44` : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {cfg.label}
                <span
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={{
                    background: filterStatus === s ? `${cfg.color}30` : "rgba(255,255,255,0.06)",
                    color: filterStatus === s ? cfg.color : "#555",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── GOALS GRID ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/03 animate-pulse" />
            ))}
          </div>
        ) : filteredGoals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <Target className="w-8 h-8 text-amber-500/50" />
            </div>
            <p className="text-gray-500 font-medium mb-1">
              {filterStatus === "all" ? "Nenhuma meta criada ainda" : `Nenhuma meta ${STATUS_CONFIG[filterStatus as GoalStatus]?.label.toLowerCase()}`}
            </p>
            <p className="text-gray-700 text-sm mb-6">
              Defina objetivos para guiar o crescimento da plataforma
            </p>
            {filterStatus === "all" && (
              <Button
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  color: "#000",
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira meta
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <AnimatePresence>
              {filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onDelete={(id) => deleteGoal.mutate({ goalId: id })}
                  onUpdateProgress={(id, val) => updateProgress.mutate({ goalId: id, currentValue: val })}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── TIMELINE HINT ── */}
        {activeGoals.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-4"
            style={{
              background: "rgba(245,158,11,0.05)",
              border: "1px solid rgba(245,158,11,0.15)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span className="text-amber-400 font-bold text-sm">Linha do Tempo</span>
            </div>
            <div className="space-y-2">
              {activeGoals
                .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())
                .slice(0, 3)
                .map((goal) => {
                  const daysLeft = Math.ceil((new Date(goal.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const t = parseFloat(goal.targetValue);
                  const c = parseFloat(goal.currentValue);
                  const pct = t > 0 ? Math.min(100, Math.round((c / t) * 100)) : 0;
                  return (
                    <div key={goal.id} className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: goal.color, boxShadow: `0 0 6px ${goal.color}` }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-300 font-medium truncate">{goal.title}</span>
                          <span
                            className="text-[10px] font-bold ml-2 flex-shrink-0"
                            style={{ color: daysLeft <= 3 ? "#EF4444" : daysLeft <= 7 ? "#F59E0B" : "#10B981" }}
                          >
                            {daysLeft > 0 ? `${daysLeft}d` : "Vencida"}
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-white/06 mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: goal.color,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-600 flex-shrink-0">{pct}%</span>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── CREATE MODAL ── */}
      <CreateGoalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => refetch()}
      />
    </AdminDashboardLayout>
  );
}
