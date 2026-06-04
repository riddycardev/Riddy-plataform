/**
 * HostDashboardLayout
 * Layout exclusivo para Proprietário/Host
 * Tema: Verde/Esmeralda - Focado em ganhos e gestão de frota
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import NotificationDropdown from "@/components/NotificationDropdown";
import {
  Car,
  TrendingUp,
  Calendar,
  FileText,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

interface HostDashboardLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
}

export default function HostDashboardLayout({
  children,
  activeSection = "overview",
}: HostDashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const menuItems = [
    {
      icon: Home,
      label: "Minha Frota",
      value: "overview",
      description: "Visão geral e ganhos",
    },
    {
      icon: Car,
      label: "Meus Veículos",
      value: "vehicles",
      description: "Gestão da frota",
    },
    {
      icon: Calendar,
      label: "Reservas Pendentes",
      value: "bookings",
      description: "Aprovação de reservas",
    },
    {
      icon: BarChart3,
      label: "Calendário",
      value: "calendar",
      description: "Bloqueios e disponibilidade",
    },
    {
      icon: Users,
      label: "Avaliações",
      value: "reviews",
      description: "Reviews dos locatários",
    },
    {
      icon: FileText,
      label: "Documentos",
      value: "documents",
      description: "CRLV, seguro, etc",
    },
    {
      icon: TrendingUp,
      label: "Relatórios",
      value: "reports",
      description: "Ganhos e ocupação",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-emerald-500/20 bg-slate-950/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-emerald-500/10 rounded-lg transition"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-emerald-400" />
              ) : (
                <Menu className="w-5 h-5 text-emerald-400" />
              )}
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-xl font-black text-white">R</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">RIDDY</h1>
                <p className="text-xs text-emerald-400">Minha Frota</p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <NotificationDropdown theme="emerald" />
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-emerald-500/20">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-emerald-400">Proprietário</p>
              </div>
              <img
                src={"https://api.dicebear.com/7.x/avataaars/svg?seed=" + (user?.id || "default")}
                alt={user?.name || "User"}
                className="w-8 h-8 rounded-full border border-emerald-500/30"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static top-[73px] lg:top-auto bottom-0 left-0 z-30 w-64 border-r border-emerald-500/20 bg-slate-950/50 backdrop-blur-sm transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="p-4 space-y-2 h-[calc(100vh-80px)] overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => {
                    window.location.href = `/host?section=${item.value}`;
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition group ${
                    isActive
                      ? "bg-emerald-500/20 border border-emerald-500/50"
                      : "hover:bg-emerald-500/10 border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      isActive ? "text-emerald-400" : "text-emerald-500/60 group-hover:text-emerald-400"
                    }`}
                  />
                  <div className="text-left">
                    <p
                      className={`text-sm font-medium ${
                        isActive ? "text-emerald-400" : "text-gray-300 group-hover:text-white"
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </button>
              );
            })}

            {/* Divider */}
            <div className="my-4 border-t border-emerald-500/20"></div>

            {/* Settings & Logout */}
            <button className="w-full flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-emerald-500/10 border border-transparent transition group">
              <Settings className="w-5 h-5 mt-0.5 text-emerald-500/60 group-hover:text-emerald-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-300 group-hover:text-white">
                  Configurações
                </p>
                <p className="text-xs text-gray-500">Dados e preferências</p>
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
            <span className="text-emerald-400 font-medium">Minha Frota</span>
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
