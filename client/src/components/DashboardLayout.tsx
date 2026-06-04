import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Car, 
  Calendar, 
  MessageCircle, 
  FileText, 
  CreditCard,
  User,
  Home
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Minhas Reservas", path: "/my-bookings" },
  { icon: MessageCircle, label: "Mensagens", path: "/messages" },
  { icon: FileText, label: "Documentos", path: "/documents" },
  { icon: CreditCard, label: "Pagamentos", path: "/payments" },
  { icon: User, label: "Perfil", path: "/profile" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  /**
   * Só mostrar skeleton quando loading=true E não há user em cache.
   * Com staleTime:Infinity no auth.me, ao navegar entre páginas o user já está
   * disponível imediatamente — loading=false desde a primeira visita.
   * Isso elimina o skeleton do DashboardLayout ao trocar de aba.
   */
  if (loading && !user) {
    return <DashboardLayoutSkeleton />
  }

  // Redirect to local login page instead of OAuth
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0F1C]">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-2xl">R</span>
              </div>
              <span className="text-3xl font-bold text-white">RIDDY</span>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-center text-white">
              Faça login para continuar
            </h1>
            <p className="text-sm text-gray-400 text-center max-w-sm">
              Acesse sua conta para ver seu painel, reservas e mensagens.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={() => navigate("/login")}
              size="lg"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Entrar
            </Button>
            <Button
              onClick={() => navigate("/signup")}
              size="lg"
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              Criar conta
            </Button>
            <Button
              onClick={() => navigate("/")}
              size="lg"
              variant="ghost"
              className="w-full text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar para Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <div className="flex min-h-screen bg-[#0A0F1C]">
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-white/10 bg-[#0F1629]"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-white/10">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-gray-400" />
              </button>
              {!isCollapsed ? (
                <Link href="/" className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-black font-bold">R</span>
                  </div>
                  <span className="font-semibold tracking-tight truncate text-white">
                    RIDDY
                  </span>
                </Link>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 bg-[#0F1629]">
            <SidebarMenu className="px-2 py-4">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal ${
                        isActive 
                          ? "bg-cyan-500/20 text-cyan-400" 
                          : "text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-cyan-400" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-white/10 bg-[#0F1629]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/10 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-9 w-9 border border-white/20 shrink-0 bg-cyan-500/20">
                    <AvatarFallback className="text-xs font-medium text-cyan-400 bg-transparent">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-white">
                      {user?.name || "Usuário"}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#0F1629] border-white/10">
                <DropdownMenuItem
                  onClick={() => setLocation("/profile")}
                  className="cursor-pointer text-gray-300 hover:text-white focus:text-white focus:bg-white/10"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-500/50 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-[#0A0F1C]">
        {isMobile && (
          <div className="flex border-b border-white/10 h-14 items-center justify-between bg-[#0F1629]/95 px-4 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-white/5 text-white" />
              <div className="flex items-center gap-3">
                <span className="tracking-tight text-white font-medium">
                  {activeMenuItem?.label ?? "Menu"}
                </span>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </div>
  );
}
