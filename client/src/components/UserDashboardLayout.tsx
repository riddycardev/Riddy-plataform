/**
 * UserDashboardLayout
 * Layout exclusivo para Usuário/Locatário
 * Tema: Cyan/Azul - Focado em viagens e experiências
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import NotificationDropdown from "@/components/NotificationDropdown";
import {
  Car,
  Heart,
  Star,
  Wallet,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Home,
  MessageSquare,
  Settings,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface UserDashboardLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
}

export default function UserDashboardLayout({
  children,
  activeSection = "overview",
}: UserDashboardLayoutProps) {
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
      label: "Meu Garage",
      value: "overview",
      description: "Visão geral e próximas viagens",
    },
    {
      icon: Car,
      label: "Minhas Viagens",
      value: "trips",
      description: "Histórico de todas as viagens",
    },
    {
      icon: Heart,
      label: "Favoritos",
      value: "favorites",
      description: "Veículos salvos",
    },
    {
      icon: Star,
      label: "Avaliações",
      value: "reviews",
      description: "Reviews que recebi",
    },
    {
      icon: Wallet,
      label: "Carteira",
      value: "wallet",
      description: "Saldo e pagamentos",
    },
    {
      icon: Bell,
      label: "Notificações",
      value: "notifications",
      description: "Alertas personalizados",
    },
    {
      icon: User,
      label: "Perfil",
      value: "profile",
      description: "Dados e documentos",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-cyan-500/20 bg-slate-950/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-cyan-500/10 rounded-lg transition"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-cyan-400" />
              ) : (
                <Menu className="w-5 h-5 text-cyan-400" />
              )}
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                <span className="text-xl font-black text-white">R</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">RIDDY</h1>
                <p className="text-xs text-cyan-400">Meu Garage</p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <NotificationDropdown theme="cyan" />
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-cyan-500/20">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-cyan-400">Verificado</p>
              </div>
              <img
                src={"https://api.dicebear.com/7.x/avataaars/svg?seed=" + (user?.id || "default")}
                alt={user?.name || "User"}
                className="w-8 h-8 rounded-full border border-cyan-500/30"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static top-[73px] lg:top-auto bottom-0 left-0 z-30 w-64 border-r border-cyan-500/20 bg-slate-950/50 backdrop-blur-sm transition-transform duration-300 lg:translate-x-0 ${
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
                    window.location.href = `/dashboard?section=${item.value}`;
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition group ${
                    isActive
                      ? "bg-cyan-500/20 border border-cyan-500/50"
                      : "hover:bg-cyan-500/10 border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      isActive ? "text-cyan-400" : "text-cyan-500/60 group-hover:text-cyan-400"
                    }`}
                  />
                  <div className="text-left">
                    <p
                      className={`text-sm font-medium ${
                        isActive ? "text-cyan-400" : "text-gray-300 group-hover:text-white"
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
            <div className="my-4 border-t border-cyan-500/20"></div>

            {/* Settings & Logout */}
            <button className="w-full flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-cyan-500/10 border border-transparent transition group">
              <Settings className="w-5 h-5 mt-0.5 text-cyan-500/60 group-hover:text-cyan-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-300 group-hover:text-white">
                  Configurações
                </p>
                <p className="text-xs text-gray-500">Privacidade e segurança</p>
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
            <span className="text-cyan-400 font-medium">Meu Garage</span>
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
