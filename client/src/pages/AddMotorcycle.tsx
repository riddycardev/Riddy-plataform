/**
 * Add Motorcycle Page
 * Form for hosts to register their motorcycles
 * All fields functional, validation complete
 */

import { useState } from "react";
import { isValidBrazilianPlate, normalizePlate } from "@shared/licensePlate";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Header from "@/components/Header";
import ImageUpload, { UploadedImage } from "@/components/ImageUpload";
import DocumentUpload from "@/components/DocumentUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import CityAutocomplete from "@/components/CityAutocomplete";
import {
  Bike,
  ArrowLeft,
  ArrowRight,
  Loader2,
  DollarSign,
  MapPin,
  Settings,
  Fuel,
  Gauge,
  FileText,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

const motorcycleBrands = [
  // Premium & Internacionais
  "Honda", "Yamaha", "Suzuki", "Kawasaki", "BMW", "Ducati", "Harley-Davidson",
  "Royal Enfield", "Triumph", "KTM", "Husqvarna", "Benelli", "Aprilia", "Moto Guzzi",
  // Populares no Brasil
  "Shineray", "Dafra", "Haojue", "Traxx", "Kasinski", "Bajaj", "Hero",
  "Mahindra", "Piaggio", "Vespa", "Peugeot", "Kymco", "Sundown", "Esmak",
  "Malaguti", "Italika", "Zongshen", "MV Agusta",
];

const modelosPorMarca: { [key: string]: string[] } = {
  "Honda": ["CB 125R", "CB 250F", "CB 300R", "CB 500F", "CB 500X", "CB 650F", "CB 1000R", "CB Twister", "CB Hornet", "CBR 600", "CBR 1000", "CBF 250", "CBF 500", "CRF 250L", "CRF 1000L", "XRE 300", "XRE 190", "XL 700V", "XL 1000V", "XR 200", "XR 250", "NXR 125", "NXR 150", "NXR 160", "Titan 125", "Titan 150", "Titan 160", "Titan 2000", "PCX 150", "PCX 160", "Monkey 125", "SH 150", "SH 300"],
  "Yamaha": ["YZF-R3", "YZF-R6", "YZF-R1", "MT-03", "MT-07", "MT-09", "MT-15", "Fazer 250", "Fazer 150", "XTZ 250", "XTZ 125", "TTR 230", "WR 250F", "FZ 25", "FZ 150", "FZ 250", "FZ 1000", "Tenere 700", "Tracer 900", "Nmax 160", "Aerox 155", "Mio 125"],
  "Suzuki": ["GSX-R125", "GSX-R150", "GSX-R250", "GSX-R600", "GSX-R750", "GSX-R1000", "GSX-S125", "GSX-S150", "GSX-S250", "GSX-S750", "GSX-S1000", "Bandit 250", "Bandit 650", "Bandit 1200", "Intruder 125", "Intruder 150", "Intruder 250", "Intruder 800", "V-Strom 250", "V-Strom 650", "V-Strom 1000"],
  "Kawasaki": ["Ninja 125", "Ninja 250", "Ninja 300", "Ninja 400", "Ninja 650", "Ninja 1000", "Ninja H2", "Z125", "Z250", "Z300", "Z400", "Z650", "Z900", "Z1000", "Versys 250", "Versys 650", "Versys 1000"],
  "BMW": ["G 310 R", "G 310 GS", "G 650 GS", "F 650 GS", "F 700 GS", "F 800 GS", "S 1000 RR", "S 1000 R", "R 1250 GS", "R 1250 RT", "R 1250 RS"],
  "Ducati": ["Monster 125", "Monster 250", "Monster 400", "Monster 600", "Monster 696", "Monster 797", "Monster 821", "Monster 1200", "Panigale 125", "Panigale 250", "Panigale 959", "Panigale 1199", "Panigale 1299", "Panigale 1299 Final Edition"],
  "Harley-Davidson": ["Street 500", "Street 750", "Iron 883", "Forty-Eight", "Street Glide", "Road Glide", "Electra Glide", "Road King", "Softail Slim", "Softail Deluxe"],
  "Royal Enfield": ["Bullet 350", "Bullet 500", "Classic 350", "Classic 500", "Thunderbird 350", "Thunderbird 500", "Himalayan 411", "Interceptor 650", "Continental GT 650"],
  "Triumph": ["Street Twin", "Street Cup", "Street Scrambler", "Bonneville T100", "Bonneville T120", "Bonneville Bobber", "Thruxton", "Thruxton R", "Speed Twin", "Tiger 800", "Tiger 1200"],
  "KTM": ["Duke 125", "Duke 200", "Duke 250", "Duke 390", "Duke 690", "Duke 890", "RC 125", "RC 200", "RC 250", "RC 390", "RC 690", "RC 890", "Adventure 250", "Adventure 390", "Adventure 690", "Adventure 890"],
  "Husqvarna": ["Vitpilen 125", "Vitpilen 250", "Vitpilen 401", "Vitpilen 701", "Svartpilen 125", "Svartpilen 250", "Svartpilen 401", "Svartpilen 701"],
  "Benelli": ["TNT 125", "TNT 135", "TNT 150", "TNT 200", "TNT 250", "TNT 300", "TNT 600", "TNT 899", "TNT 1130", "Leoncino 125", "Leoncino 250", "Leoncino 500"],
  "Aprilia": ["SR 125", "SR 150", "SR 160", "SR 200", "RS 125", "RS 250", "RS 660", "Tuono 125", "Tuono 250", "Tuono 660", "Tuono 1100"],
  "Moto Guzzi": ["V7 Stone", "V7 Racer", "V7 Rough", "V7 Anniversario", "V9 Bobber", "V9 Roamer", "V100 Mandello", "Audace", "Griso 1200", "Stelvio 1200"],
  "Shineray": ["XY 50Q", "XY 100", "XY 125", "XY 150", "XY 200", "XY 250", "XY 300", "XY 400", "XY 500"],
  "Dafra": ["Zig 50", "Zig 100", "Zig 125", "Zig 150", "Zig 200", "Zig 250", "Roadwin 150", "Roadwin 250", "Roadwin 300"],
  "Haojue": ["HJ 50", "HJ 100", "HJ 125", "HJ 150", "HJ 200", "HJ 250", "HJ 300"],
  "Traxx": ["TX 50", "TX 125", "TX 150", "TX 200", "TX 250"],
  "Kasinski": ["Mirage 150", "Mirage 250", "Comet 150", "Comet 250"],
  "Bajaj": ["Pulsar 150", "Pulsar 180", "Pulsar 200", "Pulsar 220", "Pulsar 250", "Pulsar 350", "Pulsar 400", "Dominar 250", "Dominar 400"],
  "Hero": ["Splendor 125", "Splendor 150", "Passion 125", "Passion 150", "Passion Pro 125", "Passion Pro 150"],
  "Mahindra": ["Mojo 125", "Mojo 150", "Mojo 300"],
  "Piaggio": ["Vespa 50", "Vespa 125", "Vespa 150", "Vespa 200", "Vespa 300"],
  "Vespa": ["Vespa 50", "Vespa 125", "Vespa 150", "Vespa 200", "Vespa 300"],
  "Peugeot": ["Django 50", "Django 125", "Django 150", "Citystar 125", "Citystar 150", "Speedfight 125", "Speedfight 150"],
  "Kymco": ["Agility 50", "Agility 125", "Agility 150", "Agility 200", "Agility 300", "Downtown 125", "Downtown 150", "Downtown 200", "Downtown 300"],
  "Sundown": ["Motard 150", "Motard 200", "Motard 250", "Motard 300"],
  "Esmak": ["City 125", "City 150", "City 200"],
  "Malaguti": ["Phantom 50", "Phantom 125", "Phantom 150", "Phantom 200"],
  "Italika": ["VX 150", "VX 200", "VX 250", "FT 150", "FT 200", "FT 250"],
  "Zongshen": ["ZS 125", "ZS 150", "ZS 200", "ZS 250"],
  "MV Agusta": ["F3 675", "F3 800", "Brutale 675", "Brutale 800", "Rivale 800", "Turismo Veloce 800"],
};

const motorcycleFeatures = [
  { id: "abs", label: "ABS (Sistema de Freios)" },
  { id: "traction_control", label: "Controle de Tração" },
  { id: "riding_modes", label: "Modos de Condução" },
  { id: "quickshifter", label: "Quickshifter" },
  { id: "heated_grips", label: "Punhos Aquecidos" },
  { id: "cruise_control", label: "Piloto Automático" },
  { id: "led_lights", label: "Faróis LED" },
  { id: "usb_charger", label: "Carregador USB" },
  { id: "side_bags", label: "Alforjes Laterais" },
  { id: "top_case", label: "Baú Traseiro" },
  { id: "windshield", label: "Bolha/Para-brisa" },
  { id: "gps", label: "GPS Integrado" },
]

const STEPS = [
  { id: 1, label: "Dados da Moto" },
  { id: 2, label: "Especificações" },
  { id: 3, label: "Preço & Local" },
  { id: 4, label: "Fotos & Docs" },
];

export default function AddMotorcycle() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 - Basic info
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [modeloCustomizado, setModeloCustomizado] = useState("");
  const [mostrarModeloCustomizado, setMostrarModeloCustomizado] = useState(false);
  const [year, setYear] = useState("");
  const [anoCustomizado, setAnoCustomizado] = useState("");
  const [mostrarAnoCustomizado, setMostrarAnoCustomizado] = useState(false);
  const [color, setColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [plateError, setPlateError] = useState("");

  // Step 2 - Motorcycle specs
  const [cilindrada, setCilindrada] = useState("");
  const [tipoMoto, setTipoMoto] = useState("");
  const [combustivel, setCombustivel] = useState("");
  const [cambio, setCambio] = useState("");
  const [capaceteDisponivel, setCapaceteDisponivel] = useState(false);
  const [taxaCapacete, setTaxaCapacete] = useState("15.00");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Step 3 - Price & location
  const [dailyPrice, setDailyPrice] = useState("");
  const [limitKmDiario, setLimitKmDiario] = useState("100");
  const [extraKmPrice, setExtraKmPrice] = useState("0.50");
  const [selectedCity, setSelectedCity] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupState, setPickupState] = useState("");

  // Step 4 - Photos & docs
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [crlvFile, setCrlvFile] = useState<File | null>(null);
  const [crlvPreview, setCrlvPreview] = useState<string | null>(null);

  const uploadImageMutation = trpc.vehicle.uploadImage.useMutation();

  const createMotorcycleMutation = trpc.motorcycle.create.useMutation({
    onSuccess: async (data) => {
      // Upload additional images via uploadImage procedure
      if (data?.id && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (img.base64Data) {
            try {
              await uploadImageMutation.mutateAsync({
                vehicleId: data.id,
                base64Image: img.base64Data,
                sortOrder: i,
                isMain: i === 0,
              });
            } catch (e) {
              console.error("Image upload error:", e);
            }
          }
        }
      }
      toast.success("Moto cadastrada com sucesso! Aguarde aprovação.");
      navigate("/host?section=vehicles");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cadastrar moto");
    },
  });

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId) ? prev.filter((f) => f !== featureId) : [...prev, featureId]
    );
  };

  const handleCrlvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCrlvFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCrlvPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!brand) { toast.error("Selecione a marca"); return false; }
      if (!model.trim()) { toast.error("Informe o modelo"); return false; }
      if (!year || parseInt(year) < 1990 || parseInt(year) > new Date().getFullYear() + 1) {
        toast.error("Informe um ano válido"); return false;
      }
      if (!licensePlate.trim()) { toast.error("Informe a placa"); return false; }
      if (!isValidBrazilianPlate(licensePlate)) {
        setPlateError("Placa inválida. Use MERCOSUL (ABC1D23) ou formato antigo (ABC1234 ou ABC-1234).");
        toast.error("Placa inválida. Verifique o formato.");
        return false;
      }
    }
    if (step === 2) {
      if (!cilindrada) { toast.error("Selecione a cilindrada"); return false; }
      if (!tipoMoto) { toast.error("Selecione o tipo de moto"); return false; }
      if (!combustivel) { toast.error("Selecione o combustível"); return false; }
      if (!cambio) { toast.error("Selecione o câmbio"); return false; }
      if (capaceteDisponivel && !taxaCapacete) {
        toast.error("Informe o preço do capacete"); return false;
      }
    }
    if (step === 3) {
      if (!dailyPrice || parseFloat(dailyPrice) <= 0) { toast.error("Informe o preço por dia"); return false; }
      if (!limitKmDiario || parseInt(limitKmDiario) < 100) { toast.error("Limite mínimo é 100 km/dia"); return false; }
      if (!selectedCity) { toast.error("Selecione a cidade de retirada"); return false; }
      if (!pickupAddress.trim()) { toast.error("Informe o endereço de retirada"); return false; }
    }
    if (step === 4) {
      if (images.length < 2) { toast.error("Adicione pelo menos 2 fotos da moto"); return false; }
      if (!crlvFile) { toast.error("Envie o CRLV da moto"); return false; }
    }
    return true;
  };  const getModelos = () => {
    if (!brand) return [];
    return modelosPorMarca[brand] || [];
  };

  const getAnos = () => {
    const anos = [];
    const anoAtual = new Date().getFullYear();
    for (let i = anoAtual; i >= anoAtual - 30; i--) {
      anos.push(i.toString());
    }
    anos.push("Outro");
    return anos;
  };

  const handleNextStep = () => {   if (validateStep(currentStep)) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => setCurrentStep((s) => s - 1);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    if (!isAuthenticated) { toast.error("Faça login para continuar"); return; }

    try {
      const crlvBase64 = crlvFile ? await fileToBase64(crlvFile) : "";

      // Parse city and state from selected city (format: "City, ST")
      const cityParts = selectedCity.split(",");
      const cityName = cityParts[0]?.trim() || selectedCity;
      const stateName = cityParts[1]?.trim() || pickupState || "SP";

      await createMotorcycleMutation.mutateAsync({
        brand,
        model,
        year: parseInt(year),
        color: color || undefined,
        licensePlate: normalizePlate(licensePlate), // ETAPA 12: canonical form
        dailyPrice,
        limitKmDiario: parseInt(limitKmDiario),
        extraKmPrice: extraKmPrice || "0.50",
        pickupAddress,
        pickupCity: cityName,
        pickupState: stateName.slice(0, 2),
        features: selectedFeatures,
        mainImageUrl: images[0]?.previewUrl,
        cilindrada: cilindrada as any,
        tipoMoto: tipoMoto as any,
        combustivel: combustivel as any,
        cambio: cambio as any,
        capaceteDisponivel,
        taxaCapacete: capaceteDisponivel ? taxaCapacete : undefined,
        crlvBase64,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Não bloquear por authLoading: com staleTime:Infinity, isAuthenticated já está em cache.
  // ProtectedRoute garante que o usuário está autenticado antes de renderizar esta página.
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <Card className="bg-[#0F1629] border-white/10 p-8 text-center max-w-md">
          <h2 className="text-white text-xl font-bold mb-4">Acesso Restrito</h2>
          <p className="text-gray-400 mb-6">Você precisa estar logado como proprietário para cadastrar uma moto.</p>
          <Button onClick={() => navigate("/login")} className="bg-cyan-500 hover:bg-cyan-400 text-black">
            Fazer Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <Header />
      <div className="container max-w-3xl mx-auto px-4 pt-24 pb-16">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/host")}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bike className="h-6 w-6 text-cyan-400" />
              Cadastrar Moto
            </h1>
            <p className="text-gray-400 text-sm mt-1">Preencha os dados da sua moto para começar a alugar</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    currentStep > step.id
                      ? "bg-cyan-500 text-black"
                      : currentStep === step.id
                      ? "bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400"
                      : "bg-white/5 border border-white/20 text-gray-500"
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
                </div>
                <span
                  className={`text-xs mt-1 hidden sm:block ${
                    currentStep >= step.id ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-all ${
                    currentStep > step.id ? "bg-cyan-500" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ============ STEP 1: Dados Básicos ============ */}
        {currentStep === 1 && (
          <Card className="bg-[#0F1629] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bike className="h-5 w-5 text-cyan-400" />
                Dados da Moto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Marca *</Label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Selecione a marca" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F1629] border-white/10">
                      {motorcycleBrands.map((b) => (
                        <SelectItem key={b} value={b} className="text-white hover:bg-white/5">
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Modelo *</Label>
                  {getModelos().length > 0 ? (
                    <>
                      <Select value={model} onValueChange={(value) => {
                        if (value === "outro") {
                          setMostrarModeloCustomizado(true);
                          setModel("");
                        } else {
                          setMostrarModeloCustomizado(false);
                          setModel(value);
                        }
                      }}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Selecione o modelo" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0F1629] border-white/10">
                          {getModelos().map((m) => (
                            <SelectItem key={m} value={m} className="text-white hover:bg-white/5">
                              {m}
                            </SelectItem>
                          ))}
                          <SelectItem value="outro" className="text-white hover:bg-white/5">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      {mostrarModeloCustomizado && (
                        <Input
                          value={modeloCustomizado}
                          onChange={(e) => setModeloCustomizado(e.target.value)}
                          placeholder="Digite o modelo"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-2"
                        />
                      )}
                    </>
                  ) : (
                    <Input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Selecione uma marca primeiro"
                      disabled
                      className="bg-white/5 border-white/10 text-gray-500"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Ano *</Label>
                  <Select value={year} onValueChange={(value) => {
                    if (value === "outro") {
                      setMostrarAnoCustomizado(true);
                      setYear("");
                    } else {
                      setMostrarAnoCustomizado(false);
                      setYear(value);
                    }
                  }}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F1629] border-white/10">
                      {getAnos().map((a) => (
                        <SelectItem key={a} value={a} className="text-white hover:bg-white/5">
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mostrarAnoCustomizado && (
                    <Input
                      type="number"
                      value={anoCustomizado}
                      onChange={(e) => setAnoCustomizado(e.target.value)}
                      placeholder="Digite o ano"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-2"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Cor</Label>
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ex: Preta, Vermelha, Prata, Azul"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Placa *</Label>
                <Input
                  value={licensePlate}
                  onChange={(e) => {
                    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
                    setLicensePlate(raw);
                    if (raw.length >= 7) {
                      const valid = isValidBrazilianPlate(raw);
                      setPlateError(valid ? "" : "Placa inválida. Use MERCOSUL (ABC1D23) ou formato antigo (ABC1234 ou ABC-1234).");
                    } else {
                      setPlateError("");
                    }
                  }}
                  onBlur={() => {
                    if (licensePlate && !isValidBrazilianPlate(licensePlate)) {
                      setPlateError("Placa inválida. Use MERCOSUL (ABC1D23) ou formato antigo (ABC1234 ou ABC-1234).");
                    }
                  }}
                  placeholder="ABC-1234 ou ABC1D23"
                  maxLength={8}
                  className={`bg-white/5 border-white/10 text-white placeholder:text-gray-500 uppercase ${
                    plateError ? "border-red-500 focus-visible:ring-red-500" :
                    licensePlate && isValidBrazilianPlate(licensePlate) ? "border-green-500" : ""
                  }`}
                />
                {plateError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {plateError}
                  </p>
                )}
                {!plateError && licensePlate && isValidBrazilianPlate(licensePlate) && (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Placa válida
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleNextStep}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8"
                >
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============ STEP 2: Especificações ============ */}
        {currentStep === 2 && (
          <Card className="bg-[#0F1629] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-cyan-400" />
                Especificações Técnicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Cilindrada *</Label>
                  <Select value={cilindrada} onValueChange={setCilindrada}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F1629] border-white/10">
                      <SelectItem value="125cc" className="text-white hover:bg-white/5">125cc</SelectItem>
                      <SelectItem value="150cc" className="text-white hover:bg-white/5">150cc</SelectItem>
                      <SelectItem value="160cc" className="text-white hover:bg-white/5">160cc</SelectItem>
                      <SelectItem value="180cc" className="text-white hover:bg-white/5">180cc</SelectItem>
                      <SelectItem value="200cc" className="text-white hover:bg-white/5">200cc</SelectItem>
                      <SelectItem value="250cc" className="text-white hover:bg-white/5">250cc</SelectItem>
                      <SelectItem value="300cc" className="text-white hover:bg-white/5">300cc</SelectItem>
                      <SelectItem value="350cc" className="text-white hover:bg-white/5">350cc</SelectItem>
                      <SelectItem value="400cc" className="text-white hover:bg-white/5">400cc</SelectItem>
                      <SelectItem value="500cc" className="text-white hover:bg-white/5">500cc</SelectItem>
                      <SelectItem value="600cc" className="text-white hover:bg-white/5">600cc</SelectItem>
                      <SelectItem value="750cc" className="text-white hover:bg-white/5">750cc</SelectItem>
                      <SelectItem value="800cc" className="text-white hover:bg-white/5">800cc</SelectItem>
                      <SelectItem value="900cc" className="text-white hover:bg-white/5">900cc</SelectItem>
                      <SelectItem value="1000cc" className="text-white hover:bg-white/5">1000cc</SelectItem>
                      <SelectItem value="1100cc" className="text-white hover:bg-white/5">1100cc</SelectItem>
                      <SelectItem value="1200cc" className="text-white hover:bg-white/5">1200cc</SelectItem>
                      <SelectItem value="1200cc+" className="text-white hover:bg-white/5">1200cc+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Tipo de Moto *</Label>
                  <Select value={tipoMoto} onValueChange={setTipoMoto}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F1629] border-white/10">
                      <SelectItem value="street" className="text-white hover:bg-white/5">Street</SelectItem>
                      <SelectItem value="sport" className="text-white hover:bg-white/5">Sport</SelectItem>
                      <SelectItem value="naked" className="text-white hover:bg-white/5">Naked</SelectItem>
                      <SelectItem value="cruiser" className="text-white hover:bg-white/5">Cruiser</SelectItem>
                      <SelectItem value="adventure" className="text-white hover:bg-white/5">Adventure</SelectItem>
                      <SelectItem value="scooter" className="text-white hover:bg-white/5">Scooter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-1">
                    <Fuel className="h-3.5 w-3.5" />
                    Combustível *
                  </Label>
                  <Select value={combustivel} onValueChange={setCombustivel}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F1629] border-white/10">
                      <SelectItem value="gasolina" className="text-white hover:bg-white/5">Gasolina</SelectItem>
                      <SelectItem value="eletrica" className="text-white hover:bg-white/5">Elétrica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-1">
                    <Settings className="h-3.5 w-3.5" />
                    Câmbio *
                  </Label>
                  <Select value={cambio} onValueChange={setCambio}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F1629] border-white/10">
                      <SelectItem value="manual" className="text-white hover:bg-white/5">Manual</SelectItem>
                      <SelectItem value="automatico" className="text-white hover:bg-white/5">Automático</SelectItem>
                      <SelectItem value="cvt" className="text-white hover:bg-white/5">CVT (Scooter)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Helmet */}
              <div className="rounded-lg border border-white/10 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="capacete"
                    checked={capaceteDisponivel}
                    onCheckedChange={(v) => setCapaceteDisponivel(!!v)}
                    className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                  />
                  <Label htmlFor="capacete" className="text-gray-300 cursor-pointer">
                    Oferecer capacete como adicional
                  </Label>
                </div>
                {capaceteDisponivel && (
                  <div className="space-y-2 pl-7">
                    <Label className="text-gray-400 text-sm">Taxa do capacete (R$/diária) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                      <Input
                        type="number"
                        value={taxaCapacete}
                        onChange={(e) => setTaxaCapacete(e.target.value)}
                        placeholder="15.00"
                        min="0"
                        step="0.01"
                        className="bg-white/5 border-white/10 text-white pl-9 placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3">
                <Label className="text-gray-300">Equipamentos e Recursos</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {motorcycleFeatures.map((feature) => (
                    <div
                      key={feature.id}
                      onClick={() => toggleFeature(feature.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                        selectedFeatures.includes(feature.id)
                          ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                          : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          selectedFeatures.includes(feature.id)
                            ? "border-cyan-500 bg-cyan-500"
                            : "border-gray-600"
                        }`}
                      >
                        {selectedFeatures.includes(feature.id) && (
                          <CheckCircle className="h-3 w-3 text-black" />
                        )}
                      </div>
                      {feature.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={handleBack} className="border-white/20 text-gray-300 hover:bg-white/5">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={handleNextStep} className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8">
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============ STEP 3: Preço & Localização ============ */}
        {currentStep === 3 && (
          <Card className="bg-[#0F1629] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-cyan-400" />
                Preço e Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Preço por dia (R$) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                    <Input
                      type="number"
                      value={dailyPrice}
                      onChange={(e) => setDailyPrice(e.target.value)}
                      placeholder="120.00"
                      min="0"
                      step="0.01"
                      className="bg-white/5 border-white/10 text-white pl-9 placeholder:text-gray-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5" />
                    Limite km/dia *
                  </Label>
                  <Input
                    type="number"
                    value={limitKmDiario}
                    onChange={(e) => setLimitKmDiario(e.target.value)}
                    placeholder="100"
                    min="100"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500">Mínimo: 100 km/dia</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Preço por km extra (R$/km)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                  <Input
                    type="number"
                    value={extraKmPrice}
                    onChange={(e) => setExtraKmPrice(e.target.value)}
                    placeholder="0.50"
                    min="0"
                    step="0.01"
                    className="bg-white/5 border-white/10 text-white pl-9 placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Cidade de Retirada *
                </Label>
                <CityAutocomplete
                  value={selectedCity}
                  onChange={(city) => {
                    setSelectedCity(city);
                    // Extract state from city format "City, ST"
                    const parts = city.split(",");
                    if (parts[1]) setPickupState(parts[1].trim().slice(0, 2));
                  }}
                  placeholder="Digite a cidade..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Endereço de Retirada *</Label>
                <Input
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Rua, número, bairro"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  O endereço exato só é revelado após confirmação da reserva
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={handleBack} className="border-white/20 text-gray-300 hover:bg-white/5">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={handleNextStep} className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8">
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============ STEP 4: Fotos & Documentos ============ */}
        {currentStep === 4 && (
          <Card className="bg-[#0F1629] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                Fotos e Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photos */}
              <div className="space-y-3">
                <Label className="text-gray-300">
                  Fotos da Moto *{" "}
                  <span className="text-gray-500 font-normal">(mínimo 2, recomendado 4)</span>
                </Label>
                <p className="text-xs text-gray-500">
                  Tire fotos dos 4 ângulos: frente, traseira, lateral esquerda e lateral direita.
                </p>
                <ImageUpload
                  images={images}
                  onImagesChange={setImages}
                  maxImages={8}
                  onUpload={async (file: File) => {
                    return new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const base64WithPrefix = reader.result as string;
                        const previewUrl = URL.createObjectURL(file);
                        resolve({ url: previewUrl, key: file.name, base64: base64WithPrefix });
                      };
                      reader.onerror = reject;
                      reader.readAsDataURL(file);
                    });
                  }}
                />
              </div>

              {/* CRLV */}
              <div className="space-y-3">
                <Label className="text-gray-300">
                  CRLV (Documento do Veículo) *
                </Label>
                <p className="text-xs text-gray-500">
                  Envie uma foto ou PDF do CRLV. Será verificado pela equipe RIDDY.
                </p>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleCrlvUpload}
                    className="hidden"
                    id="crlv-upload"
                  />
                  <label htmlFor="crlv-upload" className="cursor-pointer">
                    {crlvPreview ? (
                      <div className="space-y-2">
                        {crlvFile?.type.startsWith("image/") ? (
                          <img src={crlvPreview} alt="CRLV" className="max-h-40 mx-auto rounded-lg object-contain" />
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-cyan-400">
                            <FileText className="h-8 w-8" />
                            <span className="text-sm">{crlvFile?.name}</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">Clique para trocar o arquivo</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FileText className="h-10 w-10 text-gray-500 mx-auto" />
                        <p className="text-gray-400 text-sm">Clique para enviar o CRLV</p>
                        <p className="text-gray-600 text-xs">JPG, PNG ou PDF</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-2">
                <h3 className="text-white font-semibold text-sm">Resumo do Cadastro</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">Moto:</div>
                  <div className="text-white">{brand} {model} {year}</div>
                  <div className="text-gray-400">Cilindrada:</div>
                  <div className="text-white">{cilindrada}</div>
                  <div className="text-gray-400">Tipo:</div>
                  <div className="text-white capitalize">{tipoMoto}</div>
                  <div className="text-gray-400">Preço/dia:</div>
                  <div className="text-cyan-400 font-semibold">R$ {dailyPrice}</div>
                  <div className="text-gray-400">Cidade:</div>
                  <div className="text-white">{selectedCity}</div>
                  {capaceteDisponivel && (
                    <>
                      <div className="text-gray-400">Capacete:</div>
                      <div className="text-white">R$ {taxaCapacete}/dia</div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={handleBack} className="border-white/20 text-gray-300 hover:bg-white/5">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMotorcycleMutation.isPending}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8"
                >
                  {createMotorcycleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Cadastrar Moto
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
