/**
 * Signup User Page
 * Página de cadastro para locatários - Mobile Optimized
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Check, Key, ArrowLeft } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, "Você deve aceitar os termos"),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupUser() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string>("/dashboard");
  
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

  const handleGoogleSignup = async () => {
    try {
      const res = await fetch(`/api/google/auth-url?role=user`);
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error("Erro ao conectar com Google. Tente novamente.");
    }
  };
  
  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      toast.success("Conta criada com sucesso! Bem-vindo à RIDDY!");
      utils.auth.me.invalidate();
      // Redirect to return URL or user dashboard after signup
      setLocation(returnUrl);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao criar conta");
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const password = watch("password", "");
  
  const passwordRequirements = [
    { met: password.length >= 6, text: "Pelo menos 6 caracteres" },
    { met: /[A-Z]/.test(password), text: "Uma letra maiúscula" },
    { met: /[0-9]/.test(password), text: "Um número" },
  ];

  const onSubmit = (data: SignupForm) => {
    signupMutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password,
    });
  };

  return (
    <div className="min-h-[100svh] bg-[#0A0F1C] flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md bg-[#0F1629]/90 border-white/10 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-3 sm:space-y-4 text-center px-4 sm:px-6 pt-5 sm:pt-6">
          {/* Back Button */}
          <Link href="/signup" className="absolute left-4 top-4 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg sm:text-xl">R</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">RIDDY</span>
          </Link>
          
          {/* User Badge */}
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 mx-auto">
            <Key className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">Conta de Locatário</span>
          </div>
          
          <CardTitle className="text-xl sm:text-2xl font-bold text-white">Crie sua conta</CardTitle>
          <CardDescription className="text-gray-400 text-sm sm:text-base">
            Comece a alugar carros incríveis hoje mesmo
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            {/* Name Field */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-gray-300 text-sm">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  className="pl-9 sm:pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500 h-10 sm:h-11 text-sm sm:text-base"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-xs sm:text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

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
              <Label htmlFor="password" className="text-gray-300 text-sm">Senha</Label>
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
              
              {/* Password Requirements */}
              {password.length > 0 && (
                <div className="space-y-0.5 sm:space-y-1 mt-1.5 sm:mt-2">
                  {passwordRequirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                      <Check className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${req.met ? "text-green-400" : "text-gray-500"}`} />
                      <span className={req.met ? "text-green-400" : "text-gray-500"}>{req.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300 text-sm">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 sm:pl-10 pr-9 sm:pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500 h-10 sm:h-11 text-sm sm:text-base"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs sm:text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start space-x-2 sm:space-x-3">
              <Checkbox
                id="acceptTerms"
                checked={watch("acceptTerms")}
                onCheckedChange={(checked) => setValue("acceptTerms", checked as boolean)}
                className="mt-0.5 sm:mt-1 border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 h-4 w-4 sm:h-5 sm:w-5"
              />
              <Label htmlFor="acceptTerms" className="text-xs sm:text-sm text-gray-400 leading-relaxed cursor-pointer">
                Eu concordo com os{" "}
                <Link href="/terms" className="text-cyan-400 hover:text-cyan-300">
                  Termos de Uso
                </Link>{" "}
                e{" "}
                <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300">
                  Política de Privacidade
                </Link>
              </Label>
            </div>
            {errors.acceptTerms && (
              <p className="text-xs sm:text-sm text-red-400">{errors.acceptTerms.message}</p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 sm:space-y-4 px-4 sm:px-6 pb-5 sm:pb-6">
            <Button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold h-10 sm:h-12 text-sm sm:text-base"
              disabled={isSubmitting || signupMutation.isPending}
            >
              {(isSubmitting || signupMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar conta"
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
              onClick={handleGoogleSignup}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Cadastrar com Google
            </Button>

            <p className="text-center text-gray-400 text-sm">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                Faça login
              </Link>
            </p>
            
            <p className="text-center text-gray-500 text-xs">
              Quer anunciar seu carro?{" "}
              <Link href="/signup/host" className="text-teal-400 hover:text-teal-300">
                Cadastre-se como anfitrião
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
