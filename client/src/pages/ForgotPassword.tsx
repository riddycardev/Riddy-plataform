/**
 * RIDDY Forgot Password Page
 * Sends a password reset link to the user's email
 */
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const forgotMutation = trpc.ownAuth.forgotPassword.useMutation({
    onSuccess: () => {
      setSent(true);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar email. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotMutation.mutate({ email });
  };

  return (
    <div className="min-h-[100svh] bg-[#0A0F1C] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md bg-[#0F1629]/90 border-white/10 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-3 text-center px-4 sm:px-6 pt-6 sm:pt-8">
          <Link href="/" className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg sm:text-xl">R</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">RIDDY</span>
          </Link>

          {sent ? (
            <>
              <div className="flex justify-center">
                <CheckCircle2 className="w-12 h-12 text-cyan-400" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-white">Email enviado!</CardTitle>
              <CardDescription className="text-gray-400 text-sm sm:text-base">
                Verifique sua caixa de entrada em <span className="text-cyan-400">{email}</span> e clique no link para redefinir sua senha. O link expira em 1 hora.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-xl sm:text-2xl font-bold text-white">Esqueceu a senha?</CardTitle>
              <CardDescription className="text-gray-400 text-sm sm:text-base">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </CardDescription>
            </>
          )}
        </CardHeader>

        {!sent && (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500 h-10 sm:h-11"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 px-4 sm:px-6 pb-6 sm:pb-8">
              <Button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold h-10 sm:h-12"
                disabled={forgotMutation.isPending}
              >
                {forgotMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  "Enviar link de redefinição"
                )}
              </Button>

              <Link href="/login" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-cyan-400 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </Link>
            </CardFooter>
          </form>
        )}

        {sent && (
          <CardFooter className="flex flex-col space-y-3 px-4 sm:px-6 pb-6 sm:pb-8">
            <Link href="/login">
              <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o login
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
