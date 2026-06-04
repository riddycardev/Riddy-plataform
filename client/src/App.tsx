import { Toaster } from "@/components/ui/sonner";
import { RiddyCareWidget } from "@/components/RiddyCareWidget";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { Suspense, useState, useCallback, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import ChunkErrorBoundary from "./components/ChunkErrorBoundary";
import { PageLoader } from "./components/PageLoader";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CategoryProvider } from "./contexts/CategoryContext";
import { UserModeProvider } from "./contexts/UserModeContext";
import { ModeSelectionModal } from "./components/ModeSelectionModal";
import { ScrollToTop } from "./components/ScrollToTop";
import { MobileBottomNav } from "./components/MobileBottomNav";
import ProtectedRoute from "./components/ProtectedRoute";
import StoryWatcher from "./components/StoryWatcher";

// ─── Eager-loaded (tiny, always needed) ───────────────────────────────────────
import NotFound from "@/pages/NotFound";

// ─── Lazy-loaded pages (with automatic retry on chunk errors) ─────────────────
// MÓDULO 1: HOME
const Home = lazyWithRetry(() => import("./pages/Home"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const SignupChoice = lazyWithRetry(() => import("./pages/SignupChoice"));
const SignupUser = lazyWithRetry(() => import("./pages/SignupUser"));
const SignupHost = lazyWithRetry(() => import("./pages/SignupHost"));
const OAuthError = lazyWithRetry(() => import("./pages/OAuthError"));
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const VerifyEmail = lazyWithRetry(() => import("./pages/VerifyEmail"));

// MÓDULO 2: ALUGUEL
const Cars = lazyWithRetry(() => import("./pages/Cars"));
const VehicleDetails = lazyWithRetry(() => import("./pages/VehicleDetails"));
const HostProfile = lazyWithRetry(() => import("./pages/HostProfile"));
const Motorcycles = lazyWithRetry(() => import("./pages/Motorcycles"));
const MotorcycleDetails = lazyWithRetry(() => import("./pages/MotorcycleDetails"));
const BookingFlow = lazyWithRetry(() => import("./pages/BookingFlow"));
const BookingSuccess = lazyWithRetry(() => import("./pages/BookingSuccess"));
const BookingCancel = lazyWithRetry(() => import("./pages/BookingCancel"));
const MyBookings = lazyWithRetry(() => import("./pages/MyBookings"));
const BookingDetails = lazyWithRetry(() => import("./pages/BookingDetails"));
const ReviewPage = lazyWithRetry(() => import("./pages/ReviewPage"));

// MÓDULO 3: PAGAMENTO
const Payments = lazyWithRetry(() => import("./pages/Payments"));
const Receipts = lazyWithRetry(() => import("./pages/Receipts"));

// MÓDULO 4: USUÁRIO
const UserDashboard = lazyWithRetry(() => import("./pages/UserDashboard"));
const Favorites = lazyWithRetry(() => import("./pages/Favorites"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const MenuPage = lazyWithRetry(() => import("./pages/MenuPage"));
const Documents = lazyWithRetry(() => import("./pages/Documents"));
const Messages = lazyWithRetry(() => import("./pages/Messages"));
const IdentityVerification = lazyWithRetry(() => import("./pages/IdentityVerification"));
const Privacy = lazyWithRetry(() => import("./pages/Privacy"));

// MÓDULO 5: HOST
const HostDashboardNew = lazyWithRetry(() => import("./pages/HostDashboardNew"));
const AddVehicle = lazyWithRetry(() => import("./pages/AddVehicle"));
const EditVehicle = lazyWithRetry(() => import("./pages/EditVehicle"));
const AddMotorcycle = lazyWithRetry(() => import("./pages/AddMotorcycle"));

// MÓDULO 6: ADMIN
const AdminDashboardNew = lazyWithRetry(() => import("./pages/AdminDashboardNew"));
const AdminVerificationPanel = lazyWithRetry(() => import("./pages/AdminVerificationPanel"));
const RiddyCare = lazyWithRetry(() => import("./pages/RiddyCare"));
const RiddyRanks = lazyWithRetry(() => import("./pages/RiddyRanks"));
const RiddyRanking = lazyWithRetry(() => import("./pages/RiddyRanking"));
const RiddyLegend = lazyWithRetry(() => import("./pages/RiddyLegend"));
const RiddyStory = lazyWithRetry(() => import("./pages/RiddyStory"));

/**
 * Verifica se o splash já foi exibido nesta sessão do browser.
 * sessionStorage é limpo quando o usuário fecha a aba/janela,
 * mas persiste durante a navegação interna (troca de páginas).
 *
 * Isso garante que o splash apareça apenas:
 * - Na primeira abertura do app (nova aba/janela)
 * - Após fechar e reabrir o browser
 *
 * E NÃO apareça ao:
 * - Navegar entre páginas internas
 * - Trocar de aba e voltar
 * - Fazer refresh de uma página interna (usa sessionStorage)
 */
function shouldShowSplash(): boolean {
  try {
    const shown = sessionStorage.getItem("riddy_splash_shown");
    if (shown) return false;
    sessionStorage.setItem("riddy_splash_shown", "1");
    return true;
  } catch {
    // sessionStorage indisponível (ex: modo privado restrito) — não mostrar splash
    return false;
  }
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <MobileBottomNav />
      {/* ChunkErrorBoundary wraps all lazy routes — catches chunk load failures */}
      <ChunkErrorBoundary>
        {/*
          fallback={null}: ao trocar de aba, o React mantém a UI anterior visível
          em vez de mostrar o PageLoader. O PageLoader só é necessário no
          carregamento inicial do app (antes de qualquer chunk ser baixado).
          Chunks já carregados nunca disparam o fallback novamente.
        */}
        <Suspense fallback={null}>
          <Switch>
            {/* ============================================
                MÓDULO 1: HOME (Landing Page)
                ============================================ */}
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/signup" component={SignupChoice} />
            <Route path="/signup/user" component={SignupUser} />
            <Route path="/signup/host" component={SignupHost} />
            <Route path="/oauth-error" component={OAuthError} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/verify-email" component={VerifyEmail} />

            {/* ============================================
                MÓDULO 2: ALUGUEL (Booking & Search)
                ============================================ */}
            {/* Categorias separadas — carros nunca misturam com motos */}
            <Route path="/cars" component={Cars} />
            <Route path="/search" component={Cars} />{/* /search redireciona para /cars */}
            <Route path="/vehicle/:id" component={VehicleDetails} />
            <Route path="/vehicles/:id" component={VehicleDetails} />
            <Route path="/hosts/:id" component={HostProfile} />
            <Route path="/motorcycles" component={Motorcycles} />
            <Route path="/motorcycles/:id" component={MotorcycleDetails} />
            <Route path="/booking/success" component={BookingSuccess} />
            <Route path="/booking/pending" component={BookingSuccess} />{/* MP pending return — same component handles analysis state */}
            <Route path="/booking/cancel" component={BookingCancel} />
            <Route path="/pay/:bookingId">
              <ProtectedRoute>
                <BookingFlow />
              </ProtectedRoute>
            </Route>
            <Route path="/booking/:vehicleId">
              <ProtectedRoute>
                <BookingFlow />
              </ProtectedRoute>
            </Route>
            <Route path="/favorites">
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            </Route>
            <Route path="/my-bookings">
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            </Route>
            <Route path="/bookings/:id">
              <ProtectedRoute>
                <BookingDetails />
              </ProtectedRoute>
            </Route>
            <Route path="/bookings/:id/review">
              <ProtectedRoute>
                <ReviewPage />
              </ProtectedRoute>
            </Route>

            {/* ============================================
                MÓDULO 3: PAGAMENTO (Payments)
                ============================================ */}
            <Route path="/payments">
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            </Route>
            <Route path="/receipts">
              <ProtectedRoute>
                <Receipts />
              </ProtectedRoute>
            </Route>

            {/* ============================================
                MÓDULO 4: ESTRUTURA (Infrastructure & Admin)
                ============================================ */}
            
            {/* User Dashboard - Accessible to all authenticated users (user, host, both, admin) */}
            <Route path="/dashboard">
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/profile">
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </Route>
            <Route path="/menu">
              <ProtectedRoute>
                <MenuPage />
              </ProtectedRoute>
            </Route>
            <Route path="/documents">
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            </Route>
            <Route path="/messages">
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            </Route>
            <Route path="/verify-identity" component={IdentityVerification} />
            <Route path="/verify/:bookingId" component={IdentityVerification} />
            <Route path="/privacy" component={Privacy} />

            {/* Host Dashboard - Protected for 'host' role */}
            <Route path="/host">
              <ProtectedRoute requiredRole="host">
                <HostDashboardNew />
              </ProtectedRoute>
            </Route>
            <Route path="/host/vehicles/new">
              <ProtectedRoute requiredRole="host">
                <AddVehicle />
              </ProtectedRoute>
            </Route>
            <Route path="/host/add-vehicle">
              <ProtectedRoute requiredRole="host">
                <AddVehicle />
              </ProtectedRoute>
            </Route>
            <Route path="/host/add-motorcycle">
              <ProtectedRoute requiredRole="host">
                <AddMotorcycle />
              </ProtectedRoute>
            </Route>
            <Route path="/host/vehicles/:id/edit">
              <ProtectedRoute requiredRole="host">
                <EditVehicle />
              </ProtectedRoute>
            </Route>
            <Route path="/host/:section">
              <ProtectedRoute requiredRole="host">
                <HostDashboardNew />
              </ProtectedRoute>
            </Route>

            {/* Admin Dashboard - Protected for 'admin' role */}
            <Route path="/admin">
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardNew />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/verification">
              <ProtectedRoute requiredRole="admin">
                <AdminVerificationPanel />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/:section">
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardNew />
              </ProtectedRoute>
            </Route>

            {/* RIDDY Ranks — Níveis e Conquistas */}
            <Route path="/riddy-ranks">
              <ProtectedRoute>
                <RiddyRanks />
              </ProtectedRoute>
            </Route>
            {/* RIDDY Ranking — Leaderboard Regional */}
            <Route path="/riddy-ranking" component={RiddyRanking} />
            {/* RIDDY Legend — Status Premium */}
            <Route path="/riddy-legend" component={RiddyLegend} />
            {/* RIDDY Story — Stories Premium para Instagram */}
            <Route path="/riddy-story">
              <ProtectedRoute>
                <RiddyStory />
              </ProtectedRoute>
            </Route>
            {/* Riddy Care — Suporte 24/7 */}
            <Route path="/riddy-care">
              <RiddyCare />
            </Route>

            {/* 404 - Not Found */}
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </ChunkErrorBoundary>
    </>
  );
}

function App() {
  /**
   * splashDone: inicia como true se o splash já foi exibido nesta sessão.
   * Isso evita que o splash reapareça ao navegar entre páginas.
   */
  const [splashDone, setSplashDone] = useState(() => !shouldShowSplash());
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);

  /**
   * Pré-carregamento de chunks das abas principais do MobileBottomNav.
   * Executado uma única vez após o boot do app (idle callback ou setTimeout).
   * Garante que ao tocar em qualquer aba, o chunk já está em memória
   * e o Suspense nunca precisa mostrar o fallback.
   */
  useEffect(() => {
    const preload = () => {
      // Abas do MobileBottomNav (renter + host)
      import("./pages/Home");
      import("./pages/MyBookings");
      import("./pages/Messages");
      import("./pages/MenuPage");
      import("./pages/Favorites");
      import("./pages/HostDashboardNew");
    };

    // Usar requestIdleCallback se disponível (não bloqueia o render inicial)
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(preload, { timeout: 3000 });
      return () => cancelIdleCallback(id);
    } else {
      // Fallback: aguardar 1.5s após o boot
      const t = setTimeout(preload, 1500);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    // Outer ChunkErrorBoundary catches errors outside the Router (providers, etc.)
    <ChunkErrorBoundary>
      <CategoryProvider>
        <ThemeProvider defaultTheme="dark">
          <UserModeProvider>
            <TooltipProvider>
              <Toaster />
              {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
              <ModeSelectionModal />
              <StoryWatcher />
              <Router />
              <RiddyCareWidget />
            </TooltipProvider>
          </UserModeProvider>
        </ThemeProvider>
      </CategoryProvider>
    </ChunkErrorBoundary>
  );
}

export default App;
