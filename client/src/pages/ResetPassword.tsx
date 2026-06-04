/**
 * RIDDY Reset Password Page
 * Allows user to set a new password using the reset token from email
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
    else setError("Link inválido ou expirado. Solicite um novo link de redefinição.");
  }, []);

  const resetMutation = trpc.ownAuth.resetPassword.useMutation({
    onSuccess: () => {
      setDone(true);
      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => navigate("/login"), 3000);
    },
    onError: (err) => {
      setError(err.message || "Erro ao redefinir senha. O link pode ter expirado.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    resetMutation.mutate({ token, password });
  };

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

          {done ? (
            <>
              <div className="flex justify-center">
                <CheckCircle2 className="w-12 h-12 text-cyan-400" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-white">Senha redefinida!</CardTitle>
              <CardDescription className="text-gray-400">
                Sua senha foi alterada com sucesso. Redirecionando para o login...
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-xl sm:text-2xl font-bold text-white">Nova senha</CardTitle>
              <CardDescription className="text-gray-400">
                Escolha uma nova senha para sua conta RIDDY.
              </CardDescription>
            </>
          )}
        </CardHeader>

        {!done && (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 px-4 sm:px-6">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!token && !error && (
                <div className="text-center text-gray-400 text-sm py-4">
                  Carregando...
                </div>
              )}

              {token && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300 text-sm">Nova senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500 h-10 sm:h-11"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm" className="text-gray-300 text-sm">Confirmar senha</Label>
                    <div className="relative">
                      <Input
                        id="confirm"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Repita a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500 h-10 sm:h-11"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>

            {token && (
              <CardFooter className="flex flex-col space-y-3 px-4 sm:px-6 pb-6 sm:pb-8">
                <Button
                  type="submit"
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold h-10 sm:h-12"
                  disabled={resetMutation.isPending || !token}
                >
                  {resetMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                  ) : (
                    "Redefinir senha"
                  )}
                </Button>
              </CardFooter>
            )}
          </form>
        )}

        {(done || error) && (
          <CardFooter className="px-4 sm:px-6 pb-6 sm:pb-8">
            <Link href={error ? "/forgot-password" : "/login"} className="w-full">
              <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
                {error ? "Solicitar novo link" : "Ir para o login"}
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
