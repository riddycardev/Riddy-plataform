/**
 * Edit Vehicle Page
 * Form for hosts to edit their vehicles
 */

import { useState, useCallback, useEffect } from "react";
import { isValidBrazilianPlate, normalizePlate } from "@shared/licensePlate";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Header from "@/components/Header";
import ImageUpload, { UploadedImage } from "@/components/ImageUpload";
import ProtectionSection from "@/components/ProtectionSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  Save,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react";

// Brazilian states for selection
const brazilianStates = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

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

export default function EditVehicle() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Form state
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [plateError, setPlateError] = useState("");
  const [category, setCategory] = useState("");
  const [transmission, setTransmission] = useState("automatic");
  const [fuelType, setFuelType] = useState("flex");
  const [seats, setSeats] = useState("5");
  const [doors, setDoors] = useState("4");
  const [dailyPrice, setDailyPrice] = useState("");
  const [dailyKmLimit, setDailyKmLimit] = useState("300");
  const [extraKmPrice, setExtraKmPrice] = useState("0.50");
  const [pickupCity, setPickupCity] = useState("");
  const [pickupState, setPickupState] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [instantBooking, setInstantBooking] = useState(false);
  const [guaranteeAdjusted, setGuaranteeAdjusted] = useState(100);
  
  // Image upload state
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Fetch vehicle data
  const { data: vehicle, isLoading: vehicleLoading } = trpc.vehicle.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );
  
  // Mutations
  const uploadFile = trpc.vehicle.uploadFile.useMutation();
  const uploadImage = trpc.vehicle.uploadImage.useMutation();
  const deleteImage = trpc.vehicle.deleteImage.useMutation();
  const utils = trpc.useUtils();
  
  const updateVehicle = trpc.vehicle.update.useMutation({
    onSuccess: async () => {
      // Upload new images
      const newImages = images.filter(img => img.isUploaded && img.imageUrl && !img.id);
      if (newImages.length > 0) {
        try {
          for (let i = 0; i < newImages.length; i++) {
            const img = newImages[i];
            if (img.base64Data) {
              await uploadImage.mutateAsync({
                vehicleId: parseInt(id || "0"),
                base64Image: img.base64Data,
                sortOrder: existingImages.length + i,
                isMain: existingImages.length === 0 && i === 0,
              });
            }
          }
        } catch (error) {
          console.error("Error uploading images:", error);
        }
      }
      
      utils.vehicle.getById.invalidate({ id: parseInt(id || "0") });
      toast.success("Veículo atualizado com sucesso!");
      navigate("/host");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar veículo");
      setIsSubmitting(false);
    }
  });
  
  // Load vehicle data into form
  useEffect(() => {
    if (vehicle && !isLoaded) {
      setBrand(vehicle.brand || "");
      setModel(vehicle.model || "");
      setYear(vehicle.year?.toString() || "");
      setColor(vehicle.color || "");
      setLicensePlate(vehicle.licensePlate || "");
      setCategory(vehicle.category || "");
      setTransmission(vehicle.transmission || "automatic");
      setFuelType(vehicle.fuelType || "flex");
      setSeats(vehicle.seats?.toString() || "5");
      setDoors(vehicle.doors?.toString() || "4");
      setDailyPrice(vehicle.dailyPrice || "");
      setDailyKmLimit(vehicle.dailyKmLimit?.toString() || "300");
      setExtraKmPrice(vehicle.extraKmPrice || "0.50");
      setPickupCity(vehicle.pickupCity || "");
      setPickupState(vehicle.pickupState || "");
      setPickupAddress(vehicle.pickupAddress || "");
      setDescription("");
      setSelectedFeatures(Array.isArray(vehicle.features) ? vehicle.features : []);
      setInstantBooking(vehicle.instantBooking || false);
      setGuaranteeAdjusted(vehicle.guaranteeAdjusted ? parseFloat(vehicle.guaranteeAdjusted.toString()) : 100);
      
      // Load existing images
      if (vehicle.images && vehicle.images.length > 0) {
        setExistingImages(vehicle.images);
      }
      
      setIsLoaded(true);
    }
  }, [vehicle, isLoaded]);
  
  // Handle image upload to S3
  const handleImageUpload = useCallback(async (file: File): Promise<{ url: string; key: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const result = await uploadFile.mutateAsync({
            fileName: file.name,
            fileData: base64,
            contentType: file.type,
          });
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, [uploadFile]);
  
  // Handle delete existing image
  const handleDeleteExistingImage = async (imageId: number) => {
    try {
      await deleteImage.mutateAsync({ id: imageId, vehicleId: parseInt(id || "0") });
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      toast.success("Imagem removida");
    } catch (error) {
      toast.error("Erro ao remover imagem");
    }
  };
  
  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate("/login");
    return null;
  }
  
  // Check if user owns this vehicle
  if (vehicle && user && vehicle.hostId !== user.id) {
    navigate("/host");
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
    if (!brand || !model || !year || !licensePlate || !category || !dailyPrice || !pickupCity || !pickupState || !pickupAddress) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    if (!isValidBrazilianPlate(licensePlate)) {
      setPlateError("Placa inválida. Use MERCOSUL (ABC1D23) ou formato antigo (ABC1234 ou ABC-1234).");
      toast.error("Placa inválida. Verifique o formato.");
      return;
    }
    
    setIsSubmitting(true);
    
    // Get main image URL
    const uploadedImages = images.filter(img => img.isUploaded && img.imageUrl);
    const mainImageUrl = existingImages.length > 0 
      ? existingImages[0].imageUrl 
      : uploadedImages.length > 0 
        ? uploadedImages[0].imageUrl 
        : undefined;
    
    updateVehicle.mutate({
      id: parseInt(id || "0"),
      data: {
        brand,
        model,
        year: parseInt(year),
        color: color || undefined,
        licensePlate: normalizePlate(licensePlate),
        category: category as any,
        transmission: transmission as any,
        fuelType: fuelType as any,
        seats: parseInt(seats),
        doors: parseInt(doors),
        dailyPrice,
        dailyKmLimit: parseInt(dailyKmLimit),
        extraKmPrice,
        pickupCity: pickupCity.trim(),
        pickupState: pickupState.trim().toUpperCase(),
        pickupAddress,
        description: description || undefined,
        features: selectedFeatures,
        instantBooking,
        mainImageUrl,
        guaranteeAdjusted,
      },
    });
  };
  
  // Não bloquear por authLoading: com staleTime:Infinity, isAuthenticated já está em cache.
  // Manter vehicleLoading: precisa dos dados do veículo para renderizar o formulário.
  if (vehicleLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }
  
  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Veículo não encontrado</h1>
          <Button onClick={() => navigate("/host")}>Voltar ao Painel</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <Header />
      
      <main className="container py-8 px-4 pt-24">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/host")}
          className="text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Painel
        </Button>
        
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Editar Veículo
            </h1>
            <p className="text-gray-400">
              Atualize as informações do seu veículo.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
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
                      placeholder="Ex: Civic, Corolla, Onix"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  
                  {/* Year */}
                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-white">Ano *</Label>
                    <Input
                      id="year"
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="Ex: 2024"
                      min="2000"
                      max="2027"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  
                  {/* Color */}
                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-white">Cor</Label>
                    <Input
                      id="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="Ex: Preto, Branco, Prata"
                      className="bg-white/5 border-white/10 text-white"
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
                      placeholder="Ex: ABC1D23"
                      maxLength={8}
                      className={`bg-white/5 border-white/10 text-white uppercase ${
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
                        <SelectItem value="popular" className="text-white hover:bg-white/10">Popular</SelectItem>
                        <SelectItem value="hatch" className="text-white hover:bg-white/10">Hatch</SelectItem>
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
                <CardDescription>Detalhes técnicos do veículo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                        {[2, 4, 5, 6, 7, 8].map(n => (
                          <SelectItem key={n} value={n.toString()} className="text-white hover:bg-white/10">
                            {n} lugares
                          </SelectItem>
                        ))}
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
                        {[2, 4].map(n => (
                          <SelectItem key={n} value={n.toString()} className="text-white hover:bg-white/10">
                            {n} portas
                          </SelectItem>
                        ))}
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
                <CardDescription>Defina o valor da diária e limites</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Daily Price */}
                  <div className="space-y-2">
                    <Label htmlFor="dailyPrice" className="text-white">Preço por Dia (R$) *</Label>
                    <Input
                      id="dailyPrice"
                      type="number"
                      value={dailyPrice}
                      onChange={(e) => setDailyPrice(e.target.value)}
                      placeholder="Ex: 150"
                      min="50"
                      step="10"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  
                  {/* Daily KM Limit */}
                  <div className="space-y-2">
                    <Label htmlFor="dailyKmLimit" className="text-white">Limite KM/Dia</Label>
                    <Input
                      id="dailyKmLimit"
                      type="number"
                      value={dailyKmLimit}
                      onChange={(e) => setDailyKmLimit(e.target.value)}
                      placeholder="Ex: 300"
                      min="100"
                      step="50"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  
                  {/* Extra KM Price */}
                  <div className="space-y-2">
                    <Label htmlFor="extraKmPrice" className="text-white">Preço KM Extra (R$)</Label>
                    <Input
                      id="extraKmPrice"
                      type="number"
                      value={extraKmPrice}
                      onChange={(e) => setExtraKmPrice(e.target.value)}
                      placeholder="Ex: 0.50"
                      min="0"
                      step="0.10"
                      className="bg-white/5 border-white/10 text-white"
                    />
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
                <CardDescription>Onde o veículo será retirado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* City — free text */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="pickupCity" className="text-white">Cidade *</Label>
                    <Input
                      id="pickupCity"
                      value={pickupCity}
                      onChange={(e) => setPickupCity(e.target.value)}
                      placeholder="Ex: Ji-Paraná, Campinas, Uberlândia"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  
                  {/* State — select */}
                  <div className="space-y-2">
                    <Label className="text-white">Estado *</Label>
                    <Select value={pickupState} onValueChange={setPickupState}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B1426] border-white/10 max-h-60">
                        {brazilianStates.map(s => (
                          <SelectItem key={s} value={s} className="text-white hover:bg-white/10">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Pickup Address */}
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="pickupAddress" className="text-white">Endereço de Retirada *</Label>
                    <Input
                      id="pickupAddress"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="Ex: Av. Paulista, 1000, Bairro Centro"
                      className="bg-white/5 border-white/10 text-white"
                    />
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
                    <div key={feature.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature.id}
                        checked={selectedFeatures.includes(feature.id)}
                        onCheckedChange={() => toggleFeature(feature.id)}
                        className="border-white/30 data-[state=checked]:bg-cyan-500"
                      />
                      <Label htmlFor={feature.id} className="text-gray-300 cursor-pointer">
                        {feature.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-cyan-400" />
                    Fotos Atuais
                  </CardTitle>
                  <CardDescription>Fotos já cadastradas do veículo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((img, index) => (
                      <div key={img.id} className="relative group">
                        <img
                          loading="lazy" 
                          src={img.imageUrl} 
                          alt={`Foto ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingImage(img.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 text-xs bg-cyan-500 text-white px-2 py-0.5 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* New Images Upload */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-cyan-400" />
                  Adicionar Novas Fotos
                </CardTitle>
                <CardDescription>Adicione mais fotos do veículo</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  images={images}
                  onImagesChange={setImages}
                  onUpload={handleImageUpload}
                  maxImages={10 - existingImages.length}
                  minImages={0}
                />
              </CardContent>
            </Card>
            
            {/* Description */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Descrição</CardTitle>
                <CardDescription>Adicione informações extras sobre o veículo</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o veículo, condições especiais, regras de uso, etc."
                  className="bg-white/5 border-white/10 text-white min-h-[120px]"
                />
              </CardContent>
            </Card>
            
            {/* Protection Section (Caução) */}
            <ProtectionSection
              guaranteeAdjusted={guaranteeAdjusted}
              onGuaranteeChange={setGuaranteeAdjusted}
              dailyPrice={parseFloat(dailyPrice) || 0}
            />
            
            {/* Instant Booking */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">Reserva Instantânea</h3>
                    <p className="text-gray-400 text-sm">
                      Permita que locatários reservem sem aprovação prévia
                    </p>
                  </div>
                  <Checkbox
                    checked={instantBooking}
                    onCheckedChange={(checked) => setInstantBooking(checked as boolean)}
                    className="border-white/30 data-[state=checked]:bg-cyan-500 h-6 w-6"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Submit Button */}
            <div className="flex gap-4 pb-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/host")}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
