/**
 * Add Vehicle Page
 * Form for hosts to register their vehicles with S3 image upload
 */

import { useState, useCallback } from "react";
import { isValidBrazilianPlate, normalizePlate } from "@shared/licensePlate";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Header from "@/components/Header";
import ImageUpload, { UploadedImage } from "@/components/ImageUpload";
import StepIndicator from "@/components/StepIndicator";
import DocumentUpload from "@/components/DocumentUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import CityAutocomplete from "@/components/CityAutocomplete";
import ProtectionSection from "@/components/ProtectionSection";
import { 
  Car, 
  ArrowLeft, 
  Loader2,
  DollarSign,
  MapPin,
  Settings,
  Fuel,
  Users,
  Gauge,
  Camera,
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react";

// Cities will be loaded from IBGE API via CityAutocomplete component

// Car brands
const carBrands = [
  "Chevrolet", "Fiat", "Volkswagen", "Ford", "Toyota", "Honda", "Hyundai", 
  "Jeep", "Renault", "Nissan", "Mitsubishi", "Kia", "Peugeot", "Citroën",
  "BMW", "Mercedes-Benz", "Audi", "Volvo", "Land Rover", "Porsche", "Tesla",
  "BYD", "GWM", "Caoa Chery", "JAC", "RAM", "Dodge", "Lexus", "Mini"
];

// Vehicle features
const vehicleFeatures = [
  { id: "air_conditioning", label: "Ar Condicionado" },
  { id: "bluetooth", label: "Bluetooth" },
  { id: "gps", label: "GPS" },
  { id: "backup_camera", label: "Câmera de Ré" },
  { id: "parking_sensors", label: "Sensores de Estacionamento" },
  { id: "cruise_control", label: "Piloto Automático" },
  { id: "leather_seats", label: "Bancos de Couro" },
  { id: "sunroof", label: "Teto Solar" },
  { id: "usb_charger", label: "Carregador USB" },
  { id: "child_seat", label: "Cadeirinha Infantil" },
  { id: "roof_rack", label: "Rack de Teto" },
  { id: "tow_hitch", label: "Engate de Reboque" },
];

export default function AddVehicle() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Form state
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  
  // Vehicle Document states
  const [crlvFile, setCrlvFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [crlvPreview, setCrlvPreview] = useState<string | null>(null);
  const [insurancePreview, setInsurancePreview] = useState<string | null>(null);
  
  // Personal Document states (Owner)
  const [cnhFile, setCnhFile] = useState<File | null>(null);
  const [proofOfAddressFile, setProofOfAddressFile] = useState<File | null>(null);
  const [cnhPreview, setCnhPreview] = useState<string | null>(null);
  const [proofOfAddressPreview, setProofOfAddressPreview] = useState<string | null>(null);
  const [licensePlate, setLicensePlate] = useState("");
  const [plateError, setPlateError] = useState("");
  const [category, setCategory] = useState("");
  const [transmission, setTransmission] = useState("automatic");
  const [fuelType, setFuelType] = useState("flex");
  const [seats, setSeats] = useState("5");
  const [doors, setDoors] = useState("4");
  const [dailyPrice, setDailyPrice] = useState("");
  const [dailyKmLimit, setDailyKmLimit] = useState("100");
  const [extraKmPrice, setExtraKmPrice] = useState("0.50");
  const [selectedCity, setSelectedCity] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [instantBooking, setInstantBooking] = useState(false);
  const [guaranteeAdjusted, setGuaranteeAdjusted] = useState(100); // 100 = default (5x), 0-200 range
  const [hostCpfCnpj, setHostCpfCnpj] = useState(""); // CPF ou CNPJ do anfitrião para o contrato
  
  // Image upload state
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step/Etapa state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Document validation state
  const [crlvValidated, setCrlvValidated] = useState(false);
  const [cnhValidated, setCnhValidated] = useState(false);
  const [proofValidated, setProofValidated] = useState(false);
  
  // Mutations
  const uploadFile = trpc.vehicle.uploadFile.useMutation();
  const uploadImage = trpc.vehicle.uploadImage.useMutation();
  const uploadDocumentBase64 = trpc.user.uploadDocumentBase64.useMutation();
  
  const createVehicle = trpc.vehicle.create.useMutation({
    onSuccess: async (data) => {
      // Upload images to Cloudinary via backend
      if (images.length > 0 && data.id) {
        try {
          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (img.base64Data) {
              await uploadImage.mutateAsync({
                vehicleId: data.id,
                base64Image: img.base64Data,
                sortOrder: i,
                isMain: i === 0,
              });
            }
          }
        } catch (error) {
          console.error("Error uploading images:", error);
        }
      }
      
      // Upload personal documents (CNH and Proof of Address)
      try {
        if (cnhFile && cnhPreview) {
          await uploadDocumentBase64.mutateAsync({
            documentType: "cnh_front",
            base64Image: cnhPreview,
          });
        }
        
        if (proofOfAddressFile && proofOfAddressPreview) {
          await uploadDocumentBase64.mutateAsync({
            documentType: "proof_of_address",
            base64Image: proofOfAddressPreview,
          });
        }
      } catch (error) {
        console.error("Error uploading personal documents:", error);
        toast.error("Erro ao fazer upload dos documentos pessoais");
      }
      
      toast.success("Veículo cadastrado com sucesso!");
      navigate("/host/vehicles");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar veículo");
      setIsSubmitting(false);
    }
  });
  
  // Handle image conversion to base64 (upload happens later to Cloudinary)
  const handleImageUpload = useCallback(async (file: File): Promise<{ url: string; key: string; base64: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64WithPrefix = reader.result as string;
          // Create Object URL for preview (NOT base64 string)
          const previewUrl = URL.createObjectURL(file);
          // Return preview URL and base64 data (actual upload happens after vehicle creation)
          resolve({ 
            url: previewUrl, // Use Object URL for preview (not base64)
            key: file.name, // Temporary key
            base64: base64WithPrefix // Full base64 with prefix for Cloudinary
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);
  
  // Handle CRLV upload and validation
  const handleCrlvUpload = useCallback(async (file: File) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou PDF");
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB");
      return;
    }
    
    setCrlvFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setCrlvPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Document accepted for review - no fake OCR validation
    setCrlvValidated(true); // means "file received", not "OCR approved"
    toast.info("CRLV recebido. Será analisado pela equipe RIDDY.");
  }, []);
  
  // Handle insurance upload (optional)
  const handleInsuranceUpload = useCallback(async (file: File) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou PDF");
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB");
      return;
    }
    
    setInsuranceFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setInsurancePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    toast.success("Seguro adicionado!");
  }, []);
  
  // Handle CNH upload (required)
  const handleCnhUpload = useCallback(async (file: File) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou PDF");
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB");
      return;
    }
    
    setCnhFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setCnhPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Document accepted for review - no fake OCR validation
    setCnhValidated(true); // means "file received", not "OCR approved"
    toast.info("CNH recebida. Será analisada pela equipe RIDDY.");
  }, []);
  
  // Handle Proof of Address upload (required)
  const handleProofOfAddressUpload = useCallback(async (file: File) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou PDF");
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB");
      return;
    }
    
    setProofOfAddressFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setProofOfAddressPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Document accepted for review - no fake OCR validation
    setProofValidated(true); // means "file received", not "OCR approved"
    toast.info("Comprovante recebido. Será analisado pela equipe RIDDY.");
  }, []);
  
  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate("/login");
    return null;
  }
  
  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!brand || !model || !year || !licensePlate || !category || !dailyPrice || !selectedCity || !pickupAddress) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    // ETAPA 12: Validate license plate format
    if (!isValidBrazilianPlate(licensePlate)) {
      setPlateError("Placa inválida. Use MERCOSUL (ABC1D23) ou formato antigo (ABC1234 ou ABC-1234).");
      toast.error("Placa inválida. Verifique o formato.");
      return;
    }
    
    // Check if all images are uploaded
    const uploadedImages = images.filter(img => img.isUploaded && img.imageUrl);
    if (uploadedImages.length < 3) {
      toast.error("Por favor, adicione pelo menos 3 fotos do veículo");
      return;
    }
    
    // Check CRLV (mandatory)
    if (!crlvFile) {
      toast.error("O CRLV é obrigatório para cadastrar o veículo");
      return;
    }
    
    if (!crlvValidated) {
      toast.error("Aguarde a validação do CRLV");
      return;
    }
    
    // Check CNH (mandatory)
    if (!cnhFile) {
      toast.error("A CNH é obrigatória para cadastrar o veículo");
      return;
    }
    
    if (!cnhValidated) {
      toast.error("Aguarde a validação da CNH");
      return;
    }
    
    // Check Proof of Address (mandatory)
    if (!proofOfAddressFile) {
      toast.error("O Comprovante de Residência é obrigatório para cadastrar o veículo");
      return;
    }
    
    if (!proofValidated) {
      toast.error("Aguarde a validação do Comprovante de Residência");
      return;
    }
    
    // Extrair cidade e estado do formato "Cidade, UF"
    const [cityName, stateCode] = selectedCity.split(', ');
    if (!cityName || !stateCode) {
      toast.error("Cidade inválida");
      return;
    }
    
    setIsSubmitting(true);
    
    // Get base64 from CRLV file
    const reader = new FileReader();
    reader.onload = async () => {
      const crlvBase64 = reader.result as string;
      
      // Get insurance base64 if provided
      let insuranceBase64: string | undefined = undefined;
      if (insuranceFile) {
        const insuranceReader = new FileReader();
        insuranceReader.onload = () => {
          insuranceBase64 = insuranceReader.result as string;
          
          // Call mutation with documents
          createVehicle.mutate({
            brand,
            model,
            year: parseInt(year),
            color: color || undefined,
            licensePlate: normalizePlate(licensePlate), // ETAPA 12: canonical form
            category: category as any,
            transmission: transmission as any,
            fuelType: fuelType as any,
            seats: parseInt(seats),
            doors: parseInt(doors),
            dailyPrice: parseFloat(dailyPrice).toString(),
            dailyKmLimit: parseInt(dailyKmLimit),
            extraKmPrice: parseFloat(extraKmPrice).toString(),
            guaranteeAdjusted: parseFloat(guaranteeAdjusted.toString()),
            pickupCity: cityName,
            pickupState: stateCode,
            pickupAddress,
            features: selectedFeatures,
            mainImageUrl: uploadedImages[0]?.imageUrl,
            hostCpfCnpj: hostCpfCnpj || undefined,
            crlvBase64,
            insuranceBase64,
          });
        };
        insuranceReader.readAsDataURL(insuranceFile);
      } else {
        // No insurance, call mutation with just CRLV
        createVehicle.mutate({
          brand,
          model,
          year: parseInt(year),
          color: color || undefined,
          licensePlate: normalizePlate(licensePlate), // ETAPA 12: canonical form
          category: category as any,
          transmission: transmission as any,
          fuelType: fuelType as any,
          seats: parseInt(seats),
          doors: parseInt(doors),
          dailyPrice: parseFloat(dailyPrice).toString(),
          dailyKmLimit: parseInt(dailyKmLimit),
          extraKmPrice: parseFloat(extraKmPrice).toString(),
          guaranteeAdjusted: parseFloat(guaranteeAdjusted.toString()),
          pickupCity: cityName,
          pickupState: stateCode,
          pickupAddress,
          features: selectedFeatures,
          mainImageUrl: uploadedImages[0]?.imageUrl,
          hostCpfCnpj: hostCpfCnpj || undefined,
          crlvBase64,
        });
      }
    };
    reader.readAsDataURL(crlvFile);
  };
  
  // Não bloquear por authLoading: com staleTime:Infinity, isAuthenticated já está em cache.
  // ProtectedRoute garante que o usuário está autenticado antes de renderizar esta página.
  
  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <Header />
      
      <main className="container py-8 px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/host")}
          className="text-gray-400 hover:text-white mb-6" style={{marginTop: '13px'}}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Painel
        </Button>
        
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Cadastrar Novo Veículo
            </h1>
            <p className="text-gray-400">
              Preencha as informações do seu veículo para começar a receber reservas.
            </p>
          </div>
          
          <form id="add-vehicle-form" onSubmit={handleSubmit} className="space-y-8 pb-32">
            {/* Basic Info */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-cyan-400" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>Dados principais do veículo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Brand */}
                  <div className="space-y-2">
                    <Label htmlFor="brand" className="text-white">Marca *</Label>
                    <Select value={brand} onValueChange={setBrand}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Selecione a marca" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B1426] border-white/10 max-h-60">
                        {carBrands.map(b => (
                          <SelectItem key={b} value={b} className="text-white hover:bg-white/10">
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Model */}
                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-white">Modelo *</Label>
                    <Input
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Ex: Onix, Civic, Corolla"
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500"
                    />
                  </div>
                  
                  {/* Year */}
                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-white">Ano *</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B1426] border-white/10 max-h-60">
                        {Array.from({ length: 15 }, (_, i) => 2026 - i).map(y => (
                          <SelectItem key={y} value={y.toString()} className="text-white hover:bg-white/10">
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Color */}
                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-white">Cor</Label>
                    <Input
                      id="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="Ex: Preto, Branco, Prata"
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500"
                    />
                  </div>
                  
                  {/* License Plate */}
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate" className="text-white">Placa *</Label>
                    <Input
                      id="licensePlate"
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
                      placeholder="ABC1D23"
                      maxLength={8}
                      className={`bg-white/5 border-white/10 text-white placeholder-gray-500 uppercase ${
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
                  
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white">Categoria *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B1426] border-white/10">
                        <SelectItem value="hatch" className="text-white hover:bg-white/10">Hatch</SelectItem>
                        <SelectItem value="popular" className="text-white hover:bg-white/10">Econômico</SelectItem>
                        <SelectItem value="sedan" className="text-white hover:bg-white/10">Sedan</SelectItem>
                        <SelectItem value="suv" className="text-white hover:bg-white/10">SUV</SelectItem>
                        <SelectItem value="luxury" className="text-white hover:bg-white/10">Luxo</SelectItem>
                        <SelectItem value="electric" className="text-white hover:bg-white/10">Elétrico</SelectItem>
                        <SelectItem value="sport" className="text-white hover:bg-white/10">Esportivo</SelectItem>
                        <SelectItem value="pickup" className="text-white hover:bg-white/10">Pickup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Technical Specs */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  Especificações Técnicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* Transmission */}
                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <Gauge className="w-4 h-4" />
                      Câmbio
                    </Label>
                    <Select value={transmission} onValueChange={setTransmission}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B1426] border-white/10">
                        <SelectItem value="automatic" className="text-white hover:bg-white/10">Automático</SelectItem>
                        <SelectItem value="manual" className="text-white hover:bg-white/10">Manual</SelectItem>
                        <SelectItem value="cvt" className="text-white hover:bg-white/10">CVT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Fuel Type */}
                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <Fuel className="w-4 h-4" />
                      Combustível
                    </Label>
                    <Select value={fuelType} onValueChange={setFuelType}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B1426] border-white/10">
                        <SelectItem value="flex" className="text-white hover:bg-white/10">Flex</SelectItem>
                        <SelectItem value="gasoline" className="text-white hover:bg-white/10">Gasolina</SelectItem>
                        <SelectItem value="ethanol" className="text-white hover:bg-white/10">Etanol</SelectItem>
                        <SelectItem value="diesel" className="text-white hover:bg-white/10">Diesel</SelectItem>
                        <SelectItem value="electric" className="text-white hover:bg-white/10">Elétrico</SelectItem>
                        <SelectItem value="hybrid" className="text-white hover:bg-white/10">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Seats */}
                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Lugares
                    </Label>
                    <Select value={seats} onValueChange={setSeats}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B1426] border-white/10">
                        <SelectItem value="2" className="text-white hover:bg-white/10">2 lugares</SelectItem>
                        <SelectItem value="4" className="text-white hover:bg-white/10">4 lugares</SelectItem>
                        <SelectItem value="5" className="text-white hover:bg-white/10">5 lugares</SelectItem>
                        <SelectItem value="7" className="text-white hover:bg-white/10">7 lugares</SelectItem>
                        <SelectItem value="8" className="text-white hover:bg-white/10">8+ lugares</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Doors */}
                  <div className="space-y-2">
                    <Label className="text-white">Portas</Label>
                    <Select value={doors} onValueChange={setDoors}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B1426] border-white/10">
                        <SelectItem value="2" className="text-white hover:bg-white/10">2 portas</SelectItem>
                        <SelectItem value="4" className="text-white hover:bg-white/10">4 portas</SelectItem>
                        <SelectItem value="5" className="text-white hover:bg-white/10">5 portas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Pricing */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                  Preços e Quilometragem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Daily Price */}
                  <div className="space-y-2">
                    <Label htmlFor="dailyPrice" className="text-white">Preço por Dia *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                      <Input
                        id="dailyPrice"
                        type="number"
                        value={dailyPrice}
                        onChange={(e) => setDailyPrice(e.target.value)}
                        placeholder="150.00"
                        className="bg-white/5 border-white/10 text-white placeholder-gray-500 pl-10"
                      />
                    </div>
                  </div>
                  
                  {/* Daily KM Limit */}
                  <div className="space-y-2">
                    <Label htmlFor="dailyKmLimit" className="text-white">Limite de Km/Dia</Label>
                    <div className="relative">
                      <Input
                        id="dailyKmLimit"
                        type="number"
                        value={dailyKmLimit}
                        onChange={(e) => setDailyKmLimit(e.target.value)}
                        className="bg-white/5 border-white/10 text-white pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">km</span>
                    </div>
                  </div>
                  
                  {/* Extra KM Price */}
                  <div className="space-y-2">
                    <Label htmlFor="extraKmPrice" className="text-white">Preço por Km Extra *</Label>
                    <Select value={extraKmPrice} onValueChange={setExtraKmPrice}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Selecione o preço" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B1426] border-white/10">
                        <SelectItem value="0.50" className="text-white">R$ 0,50 por km</SelectItem>
                        <SelectItem value="1.00" className="text-white">R$ 1,00 por km</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Location */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  Localização
                </CardTitle>
                <CardDescription>Onde o veículo estará disponível para retirada</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* City */}
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-white">Cidade *</Label>
                    <CityAutocomplete
                      value={selectedCity}
                      onChange={(value) => setSelectedCity(value)}
                      placeholder="Digite o nome da cidade"
                    />
                  </div>
                  
                  {/* Pickup Address */}
                  <div className="space-y-2">
                    <Label htmlFor="pickupAddress" className="text-white">Endereço de Retirada *</Label>
                    <Input
                      id="pickupAddress"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="Ex: Rua das Flores, 123, Bairro Centro"
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-500">
                      Informe o endereço completo com rua, número e bairro. Ele será usado para localizar o veículo no mapa.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Features */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Recursos e Opcionais</CardTitle>
                <CardDescription>Selecione os recursos disponíveis no veículo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {vehicleFeatures.map(feature => (
                    <div 
                      key={feature.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedFeatures.includes(feature.id)
                          ? "bg-cyan-500/20 border-cyan-500/50"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <Checkbox 
                        checked={selectedFeatures.includes(feature.id)}
                        onCheckedChange={() => toggleFeature(feature.id)}
                        className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      />
                      <label 
                        className="text-sm text-white cursor-pointer flex-1"
                        onClick={() => toggleFeature(feature.id)}
                      >
                        {feature.label}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Photos */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-cyan-400" />
                  Fotos do Veículo
                </CardTitle>
                <CardDescription>
                  Adicione pelo menos 3 fotos. Fotos de qualidade aumentam suas chances de reserva.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  images={images}
                  onImagesChange={setImages}
                  maxImages={10}
                  minImages={3}
                  onUpload={handleImageUpload}
                />
              </CardContent>
            </Card>
            
            {/* Documents */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Documentos do Veículo
                </CardTitle>
                <CardDescription>
                  Envie o CRLV (obrigatório) e Seguro (opcional). O nome no CRLV deve coincidir com seu nome cadastrado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CPF / CNPJ do Anfitrião */}
                <div className="space-y-2">
                  <Label className="text-white font-semibold">
                    CPF ou CNPJ do Proprietário *
                  </Label>
                  <p className="text-xs text-gray-400">Será utilizado no contrato de locação. Informe apenas números.</p>
                  <Input
                    value={hostCpfCnpj}
                    onChange={(e) => {
                      // Allow only digits, dots, dashes and slashes
                      const raw = e.target.value.replace(/[^\d.\/\-]/g, "");
                      setHostCpfCnpj(raw);
                    }}
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    maxLength={18}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  />
                  {hostCpfCnpj.length > 0 && hostCpfCnpj.replace(/\D/g, "").length < 11 && (
                    <p className="text-amber-400 text-xs">CPF deve ter 11 dígitos ou CNPJ 14 dígitos</p>
                  )}
                </div>

                {/* CRLV Upload */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-white font-semibold">CRLV (Certificado de Registro) *</Label>
                    {crlvValidated && (
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Recebido
                      </Badge>
                    )}

                  </div>
                  
                  {!crlvFile ? (
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-cyan-500/50 transition-colors">
                      <input
                        type="file"
                        id="crlv-upload"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCrlvUpload(file);
                        }}
                        className="hidden"
                      />
                      <label htmlFor="crlv-upload" className="cursor-pointer">
                        <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-white font-medium mb-1">Clique para enviar o CRLV</p>
                        <p className="text-sm text-gray-400">JPG, PNG ou PDF (máx. 10MB)</p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative border border-white/20 rounded-lg p-4 bg-white/5">
                      <div className="flex items-center gap-4">
                        {crlvPreview && !crlvPreview.includes('pdf') && (
                          <img src={crlvPreview} alt="CRLV" className="w-20 h-20 object-cover rounded" />
                        )}
                        {crlvPreview?.includes('pdf') && (
                          <div className="w-20 h-20 bg-red-500/20 rounded flex items-center justify-center">
                            <FileText className="w-10 h-10 text-red-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">{crlvFile.name}</p>
                          <p className="text-sm text-gray-400">{(crlvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCrlvFile(null);
                            setCrlvPreview(null);
                            setCrlvValidated(false);
                          }}
                          className="text-red-400 hover:bg-red-500/20"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Insurance Upload (Optional) */}
                <div className="space-y-3">
                  <Label className="text-white font-semibold">Seguro (Opcional)</Label>
                  
                  {!insuranceFile ? (
                    <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-cyan-500/30 transition-colors">
                      <input
                        type="file"
                        id="insurance-upload"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleInsuranceUpload(file);
                        }}
                        className="hidden"
                      />
                      <label htmlFor="insurance-upload" className="cursor-pointer">
                        <FileText className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm mb-1">Clique para enviar o Seguro</p>
                        <p className="text-xs text-gray-500">JPG, PNG ou PDF (máx. 10MB)</p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative border border-white/20 rounded-lg p-4 bg-white/5">
                      <div className="flex items-center gap-4">
                        {insurancePreview && !insurancePreview.includes('pdf') && (
                          <img src={insurancePreview} alt="Seguro" className="w-20 h-20 object-cover rounded" />
                        )}
                        {insurancePreview?.includes('pdf') && (
                          <div className="w-20 h-20 bg-red-500/20 rounded flex items-center justify-center">
                            <FileText className="w-10 h-10 text-red-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">{insuranceFile.name}</p>
                          <p className="text-sm text-gray-400">{(insuranceFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setInsuranceFile(null);
                            setInsurancePreview(null);
                          }}
                          className="text-red-400 hover:bg-red-500/20"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Personal Documents */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Documentos Pessoais
                </CardTitle>
                <CardDescription>
                  Envie sua CNH e Comprovante de Residência (ambos obrigatórios)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CNH Upload */}
                <DocumentUpload
                  label="CNH (Carteira Nacional de Habilitação)"
                  description="Envie foto ou PDF da sua CNH válida"
                  required
                  file={cnhFile}
                  preview={cnhPreview}
                  onUpload={handleCnhUpload}
                  onRemove={() => {
                    setCnhFile(null);
                    setCnhPreview(null);
                    setCnhValidated(false);
                  }}
                  validated={cnhValidated}
                />
                
                {/* Proof of Address Upload */}
                <DocumentUpload
                  label="Comprovante de Residência"
                  description="Envie conta de luz, água ou telefone (máx. 3 meses)"
                  required
                  file={proofOfAddressFile}
                  preview={proofOfAddressPreview}
                  onUpload={handleProofOfAddressUpload}
                  onRemove={() => {
                    setProofOfAddressFile(null);
                    setProofOfAddressPreview(null);
                    setProofValidated(false);
                  }}
                  validated={proofValidated}
                />
              </CardContent>
            </Card>
            
            {/* Description */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Descrição</CardTitle>
                <CardDescription>Conte mais sobre seu veículo</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva seu veículo, condições especiais, dicas de uso..."
                  className="bg-white/5 border-white/10 text-white placeholder-gray-500 min-h-[120px]"
                />
              </CardContent>
            </Card>
            
            {/* Protection Section */}
            <ProtectionSection
              dailyPrice={parseFloat(dailyPrice) || 0}
              guaranteeAdjusted={guaranteeAdjusted}
              onGuaranteeChange={setGuaranteeAdjusted}
            />
            
            {/* Booking Options */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Opções de Reserva</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                    instantBooking
                      ? "bg-cyan-500/20 border-cyan-500/50"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                  onClick={() => setInstantBooking(!instantBooking)}
                >
                  <Checkbox 
                    checked={instantBooking}
                    className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                  />
                  <div>
                    <p className="text-white font-medium">Reserva Instantânea</p>
                    <p className="text-sm text-gray-400">
                      Locatários podem reservar imediatamente sem aguardar sua aprovação
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
          </form>
        </div>
      </main>
      
      {/* Sticky Footer with Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A0F1C] via-[#0A0F1C] to-transparent pt-8 pb-4 px-4 z-50 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/host")}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="add-vehicle-form"
            disabled={isSubmitting || createVehicle.isPending}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold px-8 py-2 h-auto"
          >
            {isSubmitting || createVehicle.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Cadastrar Veículo"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
