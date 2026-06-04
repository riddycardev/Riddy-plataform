/**
 * RIDDY Header Component - Marketplace Style
 * Design: Sticky header with logo, navigation, and CTAs
 * Premium dark aesthetic inspired by Turo - Mobile Optimized
 *
 * ERRO 5 CORRIGIDO: Switcher de modo agora aparece no mobile:
 *   - No dropdown do avatar (mobile compact)
 *   - No drawer/menu mobile (lista de links)
 * Regras de role:
 *   - USER: não pode acessar host → abre fluxo de ativação
 *   - HOST/BOTH: pode alternar renter ↔ host
 *   - ADMIN: contexto isolado, sem switch renter/host
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  User,
  LogOut,
  Car,
  Settings,
  CreditCard,
  MessageSquare,
  FileText,
  LayoutDashboard,
  Bike,
  ArrowLeftRight,
  Home as HomeIcon,
  Loader2,
  ChevronRight,
  Zap,
  Trophy,
  Crown,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { NotificationBell } from "@/components/NotificationBell";
import { useCategory } from "@/contexts/CategoryContext";
import { useUserMode } from "@/contexts/UserModeContext";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Para Proprietários", href: "#proprietarios" },
  { label: "Segurança", href: "#seguranca" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { activeCategory } = useCategory();
  const [, setLocation] = useLocation();

  const {
    mode,
    setMode,
    activateHostMode,
    canSwitch,
    canSwitchToHost,
    isHost,
    isRenter,
    isAdmin,
    isSwitching,
  } = useUserMode();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logout realizado com sucesso!");
      setLocation("/");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const handleListCar = () => {
    if (isAuthenticated) {
      const route = activeCategory === "motorcycles" ? "/host/add-motorcycle" : "/host/add-vehicle";
      setLocation(route);
    } else {
      setLocation("/signup");
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getDashboardLink = () => {
    if (user?.role === "admin") return "/admin";
    if (mode === "host") return "/host";
    return "/dashboard";
  };

  /**
   * Lida com a troca de modo respeitando as regras de role:
   * - ADMIN: sem switch (contexto isolado)
   * - USER (role=user): não pode ir para host → ativa fluxo de ativação
   * - HOST/BOTH: alterna renter ↔ host
   */
  const handleSwitchMode = async (closeMobileMenu?: () => void) => {
    if (isAdmin) return; // Admin não usa switch renter/host

    if (!canSwitch && !canSwitchToHost) {
      // role=user: não pode acessar host diretamente
      toast.info("Para se tornar anfitrião, ative o modo host nas configurações.");
      closeMobileMenu?.();
      return;
    }

    if (!canSwitch && canSwitchToHost && isRenter) {
      // role=host mas ainda em renter: pode ir para host
      await setMode("host");
      setLocation("/host");
      toast.success("Modo Anfitrião ativado!");
      closeMobileMenu?.();
      return;
    }

    // role=both: alterna entre renter e host
    const newMode = mode === "host" ? "renter" : "host";
    await setMode(newMode);
    if (newMode === "host") {
      setLocation("/host");
    } else {
      setLocation("/dashboard");
    }
    toast.success(`Modo alternado para ${newMode === "host" ? "Anfitrião" : "Locatário"}`);
    closeMobileMenu?.();
  };

  /**
   * Ativa o modo anfitrião para usuários com role=user (fluxo premium de ativação)
   */
  const handleActivateHost = async (closeMobileMenu?: () => void) => {
    try {
      await activateHostMode();
      setLocation("/host");
      toast.success("Modo Anfitrião ativado! Bem-vindo à RIDDY Host.");
      closeMobileMenu?.();
    } catch (error) {
      toast.error("Erro ao ativar modo anfitrião. Tente novamente.");
    }
  };

  /**
   * Rótulo do switcher de modo baseado no estado atual e role
   */
  const getSwitcherLabel = () => {
    if (isAdmin) return null; // Admin não tem switcher
    if (!canSwitchToHost && !canSwitch) {
      // role=user: mostrar opção de ativar host
      return { label: "Virar Anfitrião", color: "text-emerald-400", isActivation: true };
    }
    if (isHost) {
      return { label: "Mudar para Locatário", color: "text-cyan-400", isActivation: false };
    }
    return { label: "Mudar para Anfitrião", color: "text-emerald-400", isActivation: false };
  };

  const switcherInfo = getSwitcherLabel();

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
          ? "bg-[#0A0F1C]/95 backdrop-blur-xl border-b border-white/5 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <span className="text-[#0A0F1C] font-display font-bold text-base sm:text-lg lg:text-xl">R</span>
            </div>
            <span className="font-display font-bold text-lg sm:text-xl lg:text-2xl text-white tracking-tight">
              RIDDY
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-gray-300 hover:text-white font-medium text-sm transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-4">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : isAuthenticated ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border-2 border-cyan-500/50">
                        <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || "User"} />
                        <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                          {getInitials(user?.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-[#0F1629] border-white/10" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        {/* Badge de modo ativo */}
                        {!isAdmin && (
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full w-fit mt-0.5",
                            isHost ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-cyan-400"
                          )}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {isHost ? "Anfitrião" : "Locatário"}
                          </span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    {/* Switcher de modo — para todos exceto admin */}
                    {switcherInfo && (
                      <>
                        <DropdownMenuItem
                          onClick={() => switcherInfo.isActivation ? handleActivateHost() : handleSwitchMode()}
                          disabled={isSwitching}
                          className="cursor-pointer text-sm font-medium"
                        >
                          {isSwitching ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : switcherInfo.isActivation ? (
                            <Zap className="mr-2 h-4 w-4 text-emerald-400" />
                          ) : (
                            <ArrowLeftRight className="mr-2 h-4 w-4" />
                          )}
                          <span className={switcherInfo.color}>{switcherInfo.label}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                      </>
                    )}
                    <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-white/5 cursor-pointer">
                      <Link href={getDashboardLink()}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {isHost ? "Painel do Anfitrião" : isAdmin ? "Painel Admin" : "Meu Dashboard"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-white/5 cursor-pointer">
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Meu Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-white/5 cursor-pointer">
                      {/* Reservas contextual: anfitrião vê reservas recebidas, locatário vê reservas feitas */}
                      <Link href={isHost ? "/host?section=bookings" : "/my-bookings"}>
                        <Car className="mr-2 h-4 w-4" />
                        {isHost ? "Reservas Recebidas" : "Minhas Reservas"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-white/5 cursor-pointer">
                      <Link href="/messages">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Mensagens
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-white/5 cursor-pointer">
                      <Link href="/documents">
                        <FileText className="mr-2 h-4 w-4" />
                        Documentos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-white/5 cursor-pointer">
                      <Link href="/payments">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pagamentos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild className="text-yellow-400 focus:text-yellow-300 focus:bg-yellow-500/10 cursor-pointer">
                      <Link href="/riddy-ranks">
                        <Trophy className="mr-2 h-4 w-4" />
                        RIDDY Ranks
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-amber-400 focus:text-amber-300 focus:bg-amber-500/10 cursor-pointer">
                      <Link href="/riddy-legend">
                        <Crown className="mr-2 h-4 w-4" />
                        Riddy Legend
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-cyan-400 focus:text-cyan-300 focus:bg-cyan-500/10 cursor-pointer">
                      <Link href="/riddy-story">
                        <Share2 className="mr-2 h-4 w-4" />
                        RIDDY Story
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  onClick={handleListCar}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-[#0A0F1C] font-semibold px-4 xl:px-6 text-sm"
                >
                  {activeCategory === "motorcycles" ? "Liste sua moto" : "Liste seu Carro"}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/5 text-sm"
                  >
                    Entrar
                  </Button>
                </Link>
                <Button 
                  onClick={handleListCar}
                  className={`font-semibold px-4 xl:px-6 text-sm ${
                    activeCategory === "motorcycles"
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400"
                      : "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400"
                  } text-[#0A0F1C]`}
                >
                  {activeCategory === "motorcycles" ? "Liste sua moto" : "Liste seu Carro"}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Right Side */}
          <div className="flex lg:hidden items-center gap-2">
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                    <Avatar className={cn(
                      "h-8 w-8 border",
                      isAdmin ? "border-red-500/50" : isHost ? "border-emerald-500/50" : "border-cyan-500/50"
                    )}>
                      <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || "User"} />
                      <AvatarFallback className={cn(
                        "text-xs",
                        isAdmin ? "bg-red-500/20 text-red-400" : isHost ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-cyan-400"
                      )}>
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Indicador de modo ativo no avatar mobile */}
                    {!isAdmin && (
                      <span className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A0F1C]",
                        isHost ? "bg-emerald-400" : "bg-cyan-400"
                      )} />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52 bg-[#0F1629] border-white/10" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal py-1.5">
                    <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                    {/* Badge de modo ativo no dropdown mobile */}
                    {!isAdmin && (
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full w-fit mt-1",
                        isHost ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-cyan-400"
                      )}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {isHost ? "Anfitrião" : "Locatário"}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {/* Switcher de modo no dropdown mobile */}
                  {switcherInfo && (
                    <>
                      <DropdownMenuItem
                        onClick={() => switcherInfo.isActivation ? handleActivateHost() : handleSwitchMode()}
                        disabled={isSwitching}
                        className="cursor-pointer text-xs py-1.5 font-medium"
                      >
                        {isSwitching ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : switcherInfo.isActivation ? (
                          <Zap className="mr-2 h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <ArrowLeftRight className="mr-2 h-3.5 w-3.5" />
                        )}
                        <span className={switcherInfo.color}>{switcherInfo.label}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                    </>
                  )}
                  <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-white/5 cursor-pointer text-xs py-1.5">
                    <Link href={getDashboardLink()}>
                      <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                      {isHost ? "Painel Host" : isAdmin ? "Painel Admin" : "Dashboard"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-white/5 cursor-pointer text-xs py-1.5">
                    <Link href={isHost ? "/host?section=bookings" : "/my-bookings"}>
                      <Car className="mr-2 h-3.5 w-3.5" />
                      {isHost ? "Reservas Recebidas" : "Minhas Reservas"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer text-xs py-1.5"
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 sm:p-2 text-white"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-[#0A0F1C]/98 backdrop-blur-xl border-t border-white/5 max-h-[calc(100vh-56px)] overflow-y-auto"
          >
            <nav className="container px-4 py-4 sm:py-6 flex flex-col gap-1">
              <Link href="/cars" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <Car className="mr-3 h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                  Carros
                </span>
              </Link>
              <Link href="/motorcycles" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <Bike className="mr-3 h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                  Motos
                </span>
              </Link>
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  {item.label}
                </a>
              ))}
              
              {isAuthenticated && (
                <>
                  <div className="border-t border-white/10 my-2" />

                  {/* Switcher de modo no drawer mobile — destaque visual */}
                  {switcherInfo && (
                    <button
                      onClick={() => switcherInfo.isActivation
                        ? handleActivateHost(() => setIsMobileMenuOpen(false))
                        : handleSwitchMode(() => setIsMobileMenuOpen(false))
                      }
                      disabled={isSwitching}
                      className={cn(
                        "flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-xl transition-all w-full",
                        switcherInfo.isActivation
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          : isHost
                          ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                          : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        {isSwitching ? (
                          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        ) : switcherInfo.isActivation ? (
                          <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <ArrowLeftRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                        {switcherInfo.label}
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    </button>
                  )}

                  {/* Badge de modo ativo no drawer */}
                  {!isAdmin && (
                    <div className="px-3 py-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                        isHost ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                      )}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        Modo atual: {isHost ? "Anfitrião" : "Locatário"}
                      </span>
                    </div>
                  )}

                  <Link href={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)}>
                    <span className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                      <LayoutDashboard className="mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                      {isHost ? "Painel do Anfitrião" : isAdmin ? "Painel Admin" : "Dashboard"}
                    </span>
                  </Link>
                  <Link href={isHost ? "/host?section=bookings" : "/my-bookings"} onClick={() => setIsMobileMenuOpen(false)}>
                    <span className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                      <Car className="mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                      {isHost ? "Reservas Recebidas" : "Minhas Reservas"}
                    </span>
                  </Link>
                  <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    <span className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                      <User className="mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                      Meu Perfil
                    </span>
                  </Link>
                </>
              )}
              
              <div className="pt-3 sm:pt-4 px-1 space-y-2 sm:space-y-3 border-t border-white/10 mt-2">
                {isAuthenticated ? (
                  <>
                    <Button
                      onClick={() => {
                        handleListCar();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0A0F1C] font-semibold h-10 sm:h-11 text-sm"
                    >
                      {activeCategory === "motorcycles" ? "Liste sua moto" : "Liste seu Carro"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 h-10 sm:h-11 text-sm"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full border-white/20 text-white hover:bg-white/5 h-10 sm:h-11 text-sm"
                      >
                        Entrar
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0A0F1C] font-semibold h-10 sm:h-11 text-sm">
                        Criar Conta
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
