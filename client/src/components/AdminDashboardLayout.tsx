/**
 * AdminDashboardLayout
 * Layout exclusivo para Admin
 * Tema: Vermelho/Escarlate - Focado em controle e moderation
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import NotificationDropdown from "@/components/NotificationDropdown";
import {
  Shield,
  Users,
  FileText,
  AlertTriangle,
  BarChart3,
  DollarSign,
  LogOut,
  Menu,
  X,
  Home,
  Settings,
  Lock,
  Zap,
  Car,
  Bell,
  CreditCard,
  MessageSquare,
  ClipboardList,
  TrendingUp,
  Headphones as HeadphonesIcon,
  Target,
} from "lucide-react";
import { useState } from "react";

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
}

export default function AdminDashboardLayout({
  children,
  activeSection = "overview",
}: AdminDashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Menu agrupado por categoria operacional
  const menuGroups = [
    {
      group: "Central",
      items: [
        { icon: Home, label: "Dashboard", value: "overview", description: "Atenção imediata" },
        { icon: Bell, label: "Alertas", value: "alerts", description: "Pendências críticas" },
      ],
    },
    {
      group: "Aprovações",
      items: [
        { icon: FileText, label: "Documentos KYC", value: "documents", description: "Aprovação de identidade" },
        { icon: Car, label: "Veículos", value: "vehicles", description: "Aprovação de frota" },
        { icon: Shield, label: "Verificação", value: "verification", description: "Verificação de usuários" },
      ],
    },
    {
      group: "Operações",
      items: [
        { icon: ClipboardList, label: "Reservas", value: "bookings", description: "Todas as reservas" },
        { icon: AlertTriangle, label: "Multas & Disputes", value: "fines", description: "Gestão de conflitos" },
        { icon: MessageSquare, label: "Suporte", value: "support", description: "Mensagens e tickets" },
        { icon: HeadphonesIcon, label: "Riddy Suporte", value: "riddy-care", description: "Tickets de suporte IA" },
      ],
    },
    {
      group: "Plataforma",
      items: [
        { icon: Users, label: "Usuários", value: "users", description: "Moderação e suspensão" },
        { icon: CreditCard, label: "Financeiro", value: "financial", description: "Pagamentos e repasses" },
        { icon: TrendingUp, label: "Relatórios", value: "reports", description: "Analytics e métricas" },
        { icon: Target, label: "Metas", value: "goals", description: "OKRs e KPIs da plataforma" },
        { icon: BarChart3, label: "Analytics Níveis", value: "level-analytics", description: "Distribuição e top performers" },
        { icon: Lock, label: "Auditoria", value: "audit", description: "Log de ações" },
      ],
    },
  ];
  // Flat list for breadcrumb lookup
  const menuItems = menuGroups.flatMap((g) => g.items);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-red-500/20 bg-slate-950/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-red-500/10 rounded-lg transition"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-red-400" />
              ) : (
                <Menu className="w-5 h-5 text-red-400" />
              )}
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <span className="text-xl font-black text-white">R</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">RIDDY</h1>
                <p className="text-xs text-red-400">Admin</p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <NotificationDropdown theme="red" />
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-red-500/20">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-red-400">Admin</p>
              </div>
              <img
                src={"https://api.dicebear.com/7.x/avataaars/svg?seed=" + (user?.id || "default")}
                alt={user?.name || "User"}
                className="w-8 h-8 rounded-full border border-red-500/30"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static top-[73px] lg:top-auto bottom-0 left-0 z-30 w-64 border-r border-red-500/20 bg-slate-950/50 backdrop-blur-sm transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="p-4 h-[calc(100vh-80px)] overflow-y-auto space-y-5">
            {menuGroups.map((group) => (
              <div key={group.group}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500/50 px-4 mb-1">
                  {group.group}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.value;
                    return (
                      <button
                        key={item.value}
                        onClick={() => {
                          window.location.href = `/admin?section=${item.value}`;
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition group ${
                          isActive
                            ? "bg-red-500/20 border border-red-500/50"
                            : "hover:bg-red-500/10 border border-transparent"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            isActive ? "text-red-400" : "text-red-500/60 group-hover:text-red-400"
                          }`}
                        />
                        <div className="text-left">
                          <p
                            className={`text-sm font-medium ${
                              isActive ? "text-red-400" : "text-gray-300 group-hover:text-white"
                            }`}
                          >
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Divider */}
            <div className="my-4 border-t border-red-500/20"></div>

            {/* Settings & Logout */}
            <button className="w-full flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 border border-transparent transition group">
              <Settings className="w-5 h-5 mt-0.5 text-red-500/60 group-hover:text-red-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-300 group-hover:text-white">
                  Configurações
                </p>
                <p className="text-xs text-gray-500">Sistema e segurança</p>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 border border-transparent transition group"
            >
              <LogOut className="w-5 h-5 mt-0.5 text-red-500/60 group-hover:text-red-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-300 group-hover:text-white">
                  Sair
                </p>
                <p className="text-xs text-gray-500">Desconectar da conta</p>
              </div>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm">
            <span className="text-red-400 font-medium">Central de Controle</span>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400">
              {menuItems.find((m) => m.value === activeSection)?.label || "Dashboard"}
            </span>
          </div>

          {/* Content */}
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
