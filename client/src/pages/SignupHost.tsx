/**
 * Signup Host Page
 * Página de cadastro para proprietários/anfitriões - Mobile Optimized
 */

import { useState } from "react";
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
import { Eye, EyeOff, Loader2, Mail, Lock, User, Check, Car, DollarSign, Shield, ArrowLeft } from "lucide-react";

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

const benefits = [
  { icon: DollarSign, text: "Ganhe dinheiro com seu carro parado" },
  { icon: Shield, text: "Seguro incluso em todas as viagens" },
  { icon: Car, text: "Você define preços e disponibilidade" },
];

export default function SignupHost() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const utils = trpc.useUtils();
  
  const signupMutation = trpc.auth.signupHost.useMutation({
    onSuccess: () => {
      toast.success("Conta de proprietário criada! Bem-vindo à RIDDY!");
      utils.auth.me.invalidate();
      // Redirect to host dashboard after signup
      setLocation("/host");
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
        <div className="absolute top-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md bg-[#0F1629]/90 border-white/10 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-3 sm:space-y-4 text-center px-4 sm:px-6 pt-5 sm:pt-6">
          {/* Back Button */}
          <Link href="/signup" className="absolute left-4 top-4 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg sm:text-xl">R</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">RIDDY</span>
          </Link>
          
          {/* Host Badge */}
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 mx-auto">
            <Car className="w-4 h-4 text-teal-400" />
            <span className="text-teal-400 text-sm font-medium">Área do Proprietário</span>
          </div>
          
          <CardTitle className="text-xl sm:text-2xl font-bold text-white">Torne-se um Anfitrião</CardTitle>
          <CardDescription className="text-gray-400 text-sm sm:text-base">
            Cadastre-se e comece a ganhar dinheiro com seu veículo
          </CardDescription>
          
          {/* Benefits */}
          <div className="grid grid-cols-1 gap-2 pt-2">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-left">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-3 h-3 text-teal-400" />
                </div>
                <span className="text-gray-400 text-xs">{benefit.text}</span>
              </div>
            ))}
          </div>
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
                  className="pl-9 sm:pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-teal-500 h-10 sm:h-11 text-sm sm:text-base"
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
                  className="pl-9 sm:pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-teal-500 h-10 sm:h-11 text-sm sm:text-base"
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
                  className="pl-9 sm:pl-10 pr-9 sm:pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-teal-500 h-10 sm:h-11 text-sm sm:text-base"
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
                  className="pl-9 sm:pl-10 pr-9 sm:pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-teal-500 h-10 sm:h-11 text-sm sm:text-base"
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
                className="mt-0.5 sm:mt-1 border-white/20 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500 h-4 w-4 sm:h-5 sm:w-5"
              />
              <Label htmlFor="acceptTerms" className="text-xs sm:text-sm text-gray-400 leading-relaxed cursor-pointer">
                Eu concordo com os{" "}
                <Link href="/terms" className="text-teal-400 hover:text-teal-300">
                  Termos de Uso
                </Link>{" "}
                e{" "}
                <Link href="/privacy" className="text-teal-400 hover:text-teal-300">
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
              className="w-full bg-teal-500 hover:bg-teal-600 text-black font-semibold h-10 sm:h-12 text-sm sm:text-base"
              disabled={isSubmitting || signupMutation.isPending}
            >
              {(isSubmitting || signupMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar conta de Proprietário"
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

            <p className="text-center text-gray-400 text-sm">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium">
                Faça login
              </Link>
            </p>
            
            <p className="text-center text-gray-500 text-xs">
              Quer alugar um carro?{" "}
              <Link href="/signup" className="text-cyan-400 hover:text-cyan-300">
                Cadastre-se como locatário
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
