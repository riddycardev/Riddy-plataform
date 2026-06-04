/**
 * RIDDY Verify Email Page
 * Handles email verification from the link sent to the user's email
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [resendEmail, setResendEmail] = useState("");

  const verifyMutation = trpc.ownAuth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus("success");
      toast.success("Email verificado com sucesso!");
      setTimeout(() => navigate("/"), 3000);
    },
    onError: () => {
      setStatus("error");
    },
  });

  const resendMutation = trpc.ownAuth.resendVerification.useMutation({
    onSuccess: () => {
      toast.success("Email de verificação reenviado! Verifique sua caixa de entrada.");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao reenviar email.");
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      verifyMutation.mutate({ token: t });
    } else {
      setStatus("no-token");
    }
  }, []);

  return (
    <div className="min-h-[100svh] bg-[#0A0F1C] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md bg-[#0F1629]/90 border-white/10 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-3 text-center px-4 sm:px-6 pt-6 sm:pt-8">
          <Link href="/" className="flex items-center justify-center gap-1.5 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg sm:text-xl">R</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">RIDDY</span>
          </Link>

          {status === "loading" && (
            <>
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-white">Verificando email...</CardTitle>
              <CardDescription className="text-gray-400">Aguarde um momento.</CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex justify-center">
                <CheckCircle2 className="w-12 h-12 text-cyan-400" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-white">Email verificado!</CardTitle>
              <CardDescription className="text-gray-400">
                Sua conta foi confirmada com sucesso. Redirecionando para a home...
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex justify-center">
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-white">Link inválido</CardTitle>
              <CardDescription className="text-gray-400">
                O link de verificação expirou ou já foi utilizado. Solicite um novo link abaixo.
              </CardDescription>
            </>
          )}

          {status === "no-token" && (
            <>
              <div className="flex justify-center">
                <Mail className="w-12 h-12 text-cyan-400" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-white">Verifique seu email</CardTitle>
              <CardDescription className="text-gray-400">
                Enviamos um link de confirmação para o seu email. Clique no link para ativar sua conta.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="px-4 sm:px-6" />

        <CardFooter className="flex flex-col gap-3 px-4 sm:px-6 pb-6 sm:pb-8">
          {status === "success" && (
            <Link href="/" className="w-full">
              <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold h-10 sm:h-12">
                Ir para a home
              </Button>
            </Link>
          )}

          {(status === "error" || status === "no-token") && (
            <>
              <div className="space-y-2">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Digite seu email"
                  className="w-full bg-white/5 border border-white/20 text-white placeholder:text-gray-500 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
                <Button
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold h-10 sm:h-12"
                  onClick={() => {
                    if (resendEmail) resendMutation.mutate({ email: resendEmail });
                    else toast.error("Digite seu email para reenviar.");
                  }}
                  disabled={resendMutation.isPending}
                >
                  {resendMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reenviando...</>
                  ) : (
                    "Reenviar email de verificação"
                  )}
                </Button>
              </div>
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
                  Voltar para o login
                </Button>
              </Link>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
