/**
 * Profile Page
 * User profile management with personal info, CNH, payment methods, and settings
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  User,
  CreditCard,
  Shield,
  Bell,
  Camera,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Loader2,
  Car,
  Trophy,
} from "lucide-react";
import LevelBadge from "@/components/LevelBadge";
import { useLocation } from "wouter";
import { Zap, TrendingUp, Globe } from "lucide-react";

const CNH_CATEGORIES = [
  { value: "A", label: "A — Motocicletas e similares" },
  { value: "AB", label: "AB — Motocicletas + Automóveis" },
  { value: "B", label: "B — Automóveis" },
  { value: "C", label: "C — Veículos de carga" },
  { value: "D", label: "D — Passageiros (ônibus)" },
  { value: "E", label: "E — Combinação de veículos" },
  { value: "ACC", label: "ACC — Ciclomotores" },
];

const MOTORCYCLE_VALID_CATEGORIES = ["A", "AB"];
const CAR_VALID_CATEGORIES = ["AB", "B", "C", "D", "E"];
const BOTH_VALID_CATEGORIES = ["AB"]; // valid for both cars and motorcycles

export default function Profile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("personal");

  // Load level data
  const { data: levelData } = trpc.levels.getMyLevel.useQuery(undefined, {
    enabled: !!user,
  });

  // Load full profile from backend
  const profileQuery = trpc.user.getProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      profileQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao salvar");
    },
  });

  const profile = profileQuery.data;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    dateOfBirth: "",
    addressStreet: "",
    addressNumber: "",
    addressComplement: "",
    addressNeighborhood: "",
    addressCity: "",
    addressState: "",
    addressZipCode: "",
  });

  const [cnhData, setCnhData] = useState({
    cnhCategory: "" as string,
    cnhNumber: "",
    cnhExpiresAt: "",
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        cpf: profile.cpf || "",
        dateOfBirth: profile.dateOfBirth
          ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
          : "",
        addressStreet: profile.addressStreet || "",
        addressNumber: profile.addressNumber || "",
        addressComplement: profile.addressComplement || "",
        addressNeighborhood: profile.addressNeighborhood || "",
        addressCity: profile.addressCity || "",
        addressState: profile.addressState || "",
        addressZipCode: profile.addressZipCode || "",
      });
      setCnhData({
        cnhCategory: profile.cnhCategory || "",
        cnhNumber: profile.cnhNumber || "",
        cnhExpiresAt: profile.cnhExpiresAt
          ? new Date(profile.cnhExpiresAt).toISOString().split("T")[0]
          : "",
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSavePersonal = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleSaveCnh = () => {
    updateProfileMutation.mutate({
      cnhCategory: cnhData.cnhCategory as any || undefined,
      cnhNumber: cnhData.cnhNumber || undefined,
      cnhExpiresAt: cnhData.cnhExpiresAt || undefined,
    });
  };

  const cnhIsValidForMoto =
    cnhData.cnhCategory && MOTORCYCLE_VALID_CATEGORIES.includes(cnhData.cnhCategory);
  const cnhIsValidForCar =
    cnhData.cnhCategory && CAR_VALID_CATEGORIES.includes(cnhData.cnhCategory);
  const cnhIsValidForBoth =
    cnhData.cnhCategory && BOTH_VALID_CATEGORIES.includes(cnhData.cnhCategory);
  // Badge color logic:
  // - No CNH → red
  // - AB → green (valid for both)
  // - A → green (valid for moto only, but user chose it intentionally)
  // - B/C/D/E → yellow (valid for car only)
  // - ACC → yellow (valid for neither car nor moto on this platform)
  const cnhBadgeColor = !cnhData.cnhCategory
    ? "red"
    : cnhIsValidForBoth || cnhIsValidForMoto
    ? "green"
    : "yellow";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile?.avatarUrl || ""} />
              <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-2xl">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black hover:bg-cyan-400 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-1">
              {user?.name || "Usuário"}
            </h1>
            <p className="text-gray-400">{user?.email}</p>
            {/* RIDDY Ranks Badge + Score + Ranking */}
            {levelData && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <button
                  onClick={() => navigate("/riddy-ranks")}
                  className="group"
                >
                  <LevelBadge context="rider" clickable={false} />
                </button>
                {/* Score Riddy */}
                {(levelData.rider.score ?? 0) > 0 && (
                  <button
                    onClick={() => navigate("/riddy-ranking")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/20 transition-colors"
                    title="Score Riddy — clique para ver o ranking"
                  >
                    <Zap className="w-3 h-3" />
                    {levelData.rider.score} pts
                  </button>
                )}
                {/* Ranking nacional */}
                {levelData.rider.rankNational && (
                  <button
                    onClick={() => navigate("/riddy-ranking")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold hover:bg-purple-500/20 transition-colors"
                    title="Sua posição no ranking nacional"
                  >
                    <Globe className="w-3 h-3" />
                    #{levelData.rider.rankNational}
                  </button>
                )}
                {/* Social proof */}
                {levelData.rider.socialProof && (
                  <span className="text-xs text-white/40 italic">
                    {levelData.rider.socialProof}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Email Verificado
              </Badge>
              {cnhData.cnhCategory ? (
                cnhBadgeColor === "green" ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    CNH {cnhData.cnhCategory}
                    {cnhIsValidForBoth
                      ? " — Carros & Motos"
                      : cnhIsValidForMoto
                      ? " — Motos"
                      : ""}
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    <FileText className="w-3 h-3 mr-1" />
                    CNH {cnhData.cnhCategory}
                    {cnhIsValidForCar ? " — Carros" : " — Ciclomotores"}
                  </Badge>
                )
              ) : (
                <Badge
                  className="bg-red-500/20 text-red-400 border-red-500/30 cursor-pointer"
                  onClick={() => setActiveTab("cnh")}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  CNH não informada
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto gap-1">
            <TabsTrigger
              value="personal"
              className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
            >
              <User className="w-4 h-4 mr-2" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger
              value="cnh"
              className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black relative"
            >
              <FileText className="w-4 h-4 mr-2" />
              CNH
              {!cnhData.cnhCategory && (
                <span className="ml-2 w-2 h-2 rounded-full bg-red-500 inline-block" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="payment"
              className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pagamento
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
            >
              <Shield className="w-4 h-4 mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notificações
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="mt-6 space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Nome Completo</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      className="bg-white/5 border-white/10 text-white mt-2"
                      disabled
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Telefone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">CPF</Label>
                    <Input
                      value={formData.cpf}
                      onChange={(e) => handleInputChange("cpf", e.target.value)}
                      placeholder="000.000.000-00"
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-400">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    className="bg-white/5 border-white/10 text-white mt-2 max-w-xs"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Endereço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <Label className="text-gray-400">Rua</Label>
                    <Input
                      value={formData.addressStreet}
                      onChange={(e) => handleInputChange("addressStreet", e.target.value)}
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Número</Label>
                    <Input
                      value={formData.addressNumber}
                      onChange={(e) => handleInputChange("addressNumber", e.target.value)}
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Complemento</Label>
                    <Input
                      value={formData.addressComplement}
                      onChange={(e) => handleInputChange("addressComplement", e.target.value)}
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Bairro</Label>
                    <Input
                      value={formData.addressNeighborhood}
                      onChange={(e) => handleInputChange("addressNeighborhood", e.target.value)}
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-400">Cidade</Label>
                    <Input
                      value={formData.addressCity}
                      onChange={(e) => handleInputChange("addressCity", e.target.value)}
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Estado</Label>
                    <Input
                      value={formData.addressState}
                      onChange={(e) => handleInputChange("addressState", e.target.value)}
                      placeholder="SP"
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">CEP</Label>
                    <Input
                      value={formData.addressZipCode}
                      onChange={(e) => handleInputChange("addressZipCode", e.target.value)}
                      placeholder="00000-000"
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSavePersonal}
                disabled={updateProfileMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold"
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Salvar Alterações
              </Button>
            </div>
          </TabsContent>

          {/* CNH Tab */}
          <TabsContent value="cnh" className="mt-6 space-y-6">
            {/* Alerts for car and motorcycle renters */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <Car className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-cyan-300 font-semibold text-sm">
                    Obrigatório para alugar carros
                  </p>
                  <p className="text-cyan-400/80 text-xs mt-1">
                    Para reservar carros na RIDDY, você precisa ter CNH categoria{" "}
                    <strong>B</strong>, <strong>AB</strong>, <strong>C</strong>, <strong>D</strong> ou <strong>E</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-orange-300 font-semibold text-sm">
                    Obrigatório para alugar motos
                  </p>
                  <p className="text-orange-400/80 text-xs mt-1">
                    Para reservar motocicletas na RIDDY, você precisa ter CNH categoria{" "}
                    <strong>A</strong> ou <strong>AB</strong>.
                  </p>
                </div>
              </div>
            </div>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Dados da CNH</CardTitle>
                <CardDescription className="text-gray-400">
                  Informe a categoria e dados da sua Carteira Nacional de Habilitação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-gray-400 mb-2 block">
                    Categoria da CNH <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={cnhData.cnhCategory}
                    onValueChange={(val) =>
                      setCnhData((prev) => ({ ...prev, cnhCategory: val }))
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white max-w-sm">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E293B] border-white/10">
                      {CNH_CATEGORIES.map((cat) => (
                        <SelectItem
                          key={cat.value}
                          value={cat.value}
                          className="text-white hover:bg-white/5"
                        >
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {cnhData.cnhCategory && (
                    <div className="mt-3 space-y-2">
                      {cnhIsValidForCar ? (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Categoria válida para alugar carros
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-400 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          Esta categoria não permite alugar carros (necessário B, AB, C, D ou E)
                        </div>
                      )}
                      {cnhIsValidForMoto ? (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Categoria válida para alugar motocicletas
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-400 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          Esta categoria não permite alugar motocicletas (necessário A ou AB)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Número do Registro (opcional)</Label>
                    <Input
                      value={cnhData.cnhNumber}
                      onChange={(e) =>
                        setCnhData((prev) => ({ ...prev, cnhNumber: e.target.value }))
                      }
                      placeholder="00000000000"
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Validade da CNH (opcional)</Label>
                    <Input
                      type="date"
                      value={cnhData.cnhExpiresAt}
                      onChange={(e) =>
                        setCnhData((prev) => ({ ...prev, cnhExpiresAt: e.target.value }))
                      }
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveCnh}
                disabled={updateProfileMutation.isPending || !cnhData.cnhCategory}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold"
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Salvar CNH
              </Button>
            </div>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Métodos de Pagamento</CardTitle>
                <Button className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Cartão
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-center py-8">
                  Seus métodos de pagamento aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Segurança da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">Alterar Senha</p>
                    <p className="text-sm text-gray-400">Atualize sua senha regularmente</p>
                  </div>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Alterar
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">Autenticação em Dois Fatores</p>
                    <p className="text-sm text-gray-400">Adicione uma camada extra de segurança</p>
                  </div>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Ativar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Preferências de Notificação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-center py-8">
                  Configurações de notificação serão implementadas aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
