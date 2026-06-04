/**
 * Login Page
 * Página de login com email/senha - Mobile Optimized
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string>("/");
  
  // Get returnUrl from query parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const url = params.get("returnUrl");
      if (url) {
        setReturnUrl(decodeURIComponent(url));
      }
    }
  }, []);
  
  const utils = trpc.useUtils();
  
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      utils.auth.me.invalidate();
      window.location.href = returnUrl;
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer login");
    },
  });

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch(`/api/trpc/googleAuth.getAuthUrl?input=${encodeURIComponent(JSON.stringify({ "0": { json: { role: "user" } } }))}`);
      const data = await res.json();
      const url = data?.[0]?.result?.data?.json?.url;
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Erro ao iniciar login com Google.");
      }
    } catch {
      toast.error("Erro ao iniciar login com Google.");
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-[100svh] bg-[#0A0F1C] flex items-center justify-center p-4 sm:p-6">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md bg-[#0F1629]/90 border-white/10 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-3 sm:space-y-4 text-center px-4 sm:px-6 pt-6 sm:pt-8">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg sm:text-xl">R</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">RIDDY</span>
          </Link>
          
          <CardTitle className="text-xl sm:text-2xl font-bold text-white">Bem-vindo de volta</CardTitle>
          <CardDescription className="text-gray-400 text-sm sm:text-base">
            Entre com suas credenciais para acessar sua conta
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            {/* Email Field */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-9 sm:pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500 h-10 sm:h-11 text-sm sm:text-base"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs sm:text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300 text-sm">Senha</Label>
                <Link href="/forgot-password" className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 sm:pl-10 pr-9 sm:pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500 h-10 sm:h-11 text-sm sm:text-base"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs sm:text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 sm:space-y-4 px-4 sm:px-6 pb-6 sm:pb-8">
            <Button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold h-10 sm:h-12 text-sm sm:text-base"
              disabled={isSubmitting || loginMutation.isPending}
            >
              {(isSubmitting || loginMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0F1629] px-2 text-gray-500">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent border-white/10 text-white hover:bg-white/5 h-10 sm:h-12 text-sm sm:text-base"
              onClick={handleGoogleLogin}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar com Google
            </Button>

            <p className="text-center text-gray-400 text-sm">
              Não tem uma conta?{" "}
              <Link href={`/signup/user${returnUrl !== '/' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`} className="text-cyan-400 hover:text-cyan-300 font-medium">
                Cadastre-se
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
