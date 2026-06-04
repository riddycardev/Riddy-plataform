/**
 * Motorcycles Listing Page - Map View
 * Lists all available motorcycles with interactive map
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { 
  MapPin, 
  Star, 
  SlidersHorizontal,
  Grid,
  Map as MapIcon,
  X,
  ChevronLeft,
  Zap,
  Calendar,
  Fuel,
  DollarSign,
  Settings2,
  Bike,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/Header";
import { MapView } from "@/components/Map";

// City coordinates — comprehensive list covering all Brazilian states and major interior cities
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  // Major capitals
  "São Paulo": { lat: -23.5505, lng: -46.6333 },
  "Rio de Janeiro": { lat: -22.9068, lng: -43.1729 },
  "Belo Horizonte": { lat: -19.9167, lng: -43.9345 },
  "Brasília": { lat: -15.7942, lng: -47.8822 },
  "Curitiba": { lat: -25.4284, lng: -49.2733 },
  "Salvador": { lat: -12.9714, lng: -38.5014 },
  "Fortaleza": { lat: -3.7172, lng: -38.5433 },
  "Recife": { lat: -8.0476, lng: -34.8770 },
  "Porto Alegre": { lat: -30.0346, lng: -51.2177 },
  "Florianópolis": { lat: -27.5954, lng: -48.5480 },
  "Manaus": { lat: -3.1190, lng: -60.0217 },
  "Goiânia": { lat: -16.6869, lng: -49.2648 },
  "Campinas": { lat: -22.9099, lng: -47.0626 },
  "Guarulhos": { lat: -23.4538, lng: -46.5333 },
  "Niterói": { lat: -22.8833, lng: -43.1036 },
  "Santos": { lat: -23.9608, lng: -46.3336 },
  "Vitória": { lat: -20.3155, lng: -40.3128 },
  "Natal": { lat: -5.7793, lng: -35.2009 },
  "Maceió": { lat: -9.6658, lng: -35.7350 },
  "João Pessoa": { lat: -7.1195, lng: -34.8450 },
  "Campo Grande": { lat: -20.4697, lng: -54.6201 },
  "Cuiabá": { lat: -15.6014, lng: -56.0979 },
  "Belém": { lat: -1.4558, lng: -48.4902 },
  "Uberlândia": { lat: -18.9186, lng: -48.2772 },
  "Ribeirão Preto": { lat: -21.1775, lng: -47.8103 },
  "Sorocaba": { lat: -23.5015, lng: -47.4526 },
  "Joinville": { lat: -26.3045, lng: -48.8487 },
  "Londrina": { lat: -23.3045, lng: -51.1696 },
  "Juiz de Fora": { lat: -21.7642, lng: -43.3503 },
  "Porto Velho": { lat: -8.7612, lng: -63.9004 },
  "Rio Branco": { lat: -9.9754, lng: -67.8249 },
  "Macapá": { lat: 0.0356, lng: -51.0705 },
  "Boa Vista": { lat: 2.8235, lng: -60.6758 },
  "Palmas": { lat: -10.2491, lng: -48.3243 },
  "São Luís": { lat: -2.5297, lng: -44.3028 },
  "Teresina": { lat: -5.0892, lng: -42.8019 },
  "Aracaju": { lat: -10.9472, lng: -37.0731 },
  // Rondônia cities
  "Ji-Paraná": { lat: -10.8778, lng: -61.9492 },
  "Ariquemes": { lat: -9.9133, lng: -63.0392 },
  "Vilhena": { lat: -12.7406, lng: -60.1461 },
  "Cacoal": { lat: -11.4386, lng: -61.4472 },
  "Rolim de Moura": { lat: -11.7281, lng: -61.7756 },
  "Guajará-Mirim": { lat: -10.7833, lng: -65.3333 },
  "Jaru": { lat: -10.4389, lng: -62.4681 },
  "Pimenta Bueno": { lat: -11.6728, lng: -61.1939 },
  "Ouro Preto do Oeste": { lat: -10.7208, lng: -62.2158 },
  "Espigão do Oeste": { lat: -11.5244, lng: -60.8561 },
  "Colorado do Oeste": { lat: -13.1181, lng: -60.5414 },
  "Cerejeiras": { lat: -13.1878, lng: -60.8178 },
  "Presidente Médici": { lat: -11.1736, lng: -61.9006 },
  "Alvorada do Oeste": { lat: -11.3481, lng: -62.2036 },
  "Alta Floresta do Oeste": { lat: -11.9319, lng: -61.9997 },
  "Buritis": { lat: -10.2083, lng: -63.8319 },
  "Machadinho do Oeste": { lat: -9.4247, lng: -62.0072 },
  "Mirante da Serra": { lat: -11.5019, lng: -62.6756 },
  "Nova Mamoré": { lat: -10.4167, lng: -65.3333 },
  "São Francisco do Guaporé": { lat: -12.0500, lng: -63.5667 },
  "São Miguel do Guaporé": { lat: -11.6944, lng: -62.9139 },
  "Urupá": { lat: -11.1333, lng: -62.3667 },
  // Acre cities
  "Cruzeiro do Sul": { lat: -7.6281, lng: -72.6703 },
  "Sena Madureira": { lat: -9.0667, lng: -68.6667 },
  "Tarauacá": { lat: -8.1667, lng: -70.7667 },
  // Amazonas cities
  "Parintins": { lat: -2.6278, lng: -56.7358 },
  "Itacoatiara": { lat: -3.1433, lng: -58.4442 },
  "Coari": { lat: -4.0850, lng: -63.1408 },
  "Tefé": { lat: -3.3667, lng: -64.7167 },
  "Tabatinga": { lat: -4.2500, lng: -69.9333 },
  "Humaitá": { lat: -7.5083, lng: -63.0167 },
  // Pará cities
  "Santarém": { lat: -2.4444, lng: -54.7083 },
  "Marabá": { lat: -5.3686, lng: -49.1178 },
  "Altamira": { lat: -3.2039, lng: -52.2067 },
  "Castanhal": { lat: -1.2939, lng: -47.9228 },
  "Parauapebas": { lat: -6.0686, lng: -49.9014 },
  "Tucuruí": { lat: -3.7667, lng: -49.6667 },
  // Mato Grosso cities
  "Sinop": { lat: -11.8644, lng: -55.5044 },
  "Rondonópolis": { lat: -16.4703, lng: -54.6383 },
  "Várzea Grande": { lat: -15.6467, lng: -56.1322 },
  "Tangará da Serra": { lat: -14.6228, lng: -57.4944 },
  "Cáceres": { lat: -16.0722, lng: -57.6808 },
  "Sorriso": { lat: -12.5444, lng: -55.7133 },
  "Lucas do Rio Verde": { lat: -13.0583, lng: -55.9083 },
  "Alta Floresta": { lat: -9.8756, lng: -56.0861 },
  "Barra do Garças": { lat: -15.8903, lng: -52.2567 },
  "Primavera do Leste": { lat: -15.5556, lng: -54.2994 },
  // Tocantins cities
  "Araguaína": { lat: -7.1919, lng: -48.2044 },
  "Gurupi": { lat: -11.7297, lng: -49.0681 },
  "Porto Nacional": { lat: -10.7072, lng: -48.4167 },
  // Maranhão cities
  "Imperatriz": { lat: -5.5258, lng: -47.4919 },
  "Caxias": { lat: -4.8667, lng: -43.3500 },
  "Timon": { lat: -5.0944, lng: -42.8361 },
  "Açailândia": { lat: -4.9500, lng: -47.5000 },
  // Ceará cities
  "Juazeiro do Norte": { lat: -7.2133, lng: -39.3153 },
  "Sobral": { lat: -3.6886, lng: -40.3483 },
  "Caucaia": { lat: -3.7333, lng: -38.6500 },
  "Crato": { lat: -7.2333, lng: -39.4167 },
  // Paraíba cities
  "Campina Grande": { lat: -7.2306, lng: -35.8811 },
  "Patos": { lat: -7.0167, lng: -37.2833 },
  // Pernambuco cities
  "Caruaru": { lat: -8.2833, lng: -35.9833 },
  "Petrolina": { lat: -9.3978, lng: -40.4978 },
  "Olinda": { lat: -8.0089, lng: -34.8553 },
  "Jaboatão dos Guararapes": { lat: -8.1133, lng: -35.0133 },
  // Bahia cities
  "Feira de Santana": { lat: -12.2664, lng: -38.9663 },
  "Vitória da Conquista": { lat: -14.8619, lng: -40.8444 },
  "Ilhéus": { lat: -14.7889, lng: -39.0481 },
  "Juazeiro": { lat: -9.4167, lng: -40.5000 },
  "Barreiras": { lat: -12.1500, lng: -44.9833 },
  "Lauro de Freitas": { lat: -12.8972, lng: -38.3297 },
  "Camaçari": { lat: -12.6997, lng: -38.3244 },
  // Minas Gerais cities
  "Contagem": { lat: -19.9317, lng: -44.0536 },
  "Betim": { lat: -19.9678, lng: -44.1981 },
  "Montes Claros": { lat: -16.7281, lng: -43.8614 },
  "Uberaba": { lat: -19.7481, lng: -47.9319 },
  "Governador Valadares": { lat: -18.8511, lng: -41.9494 },
  "Ipatinga": { lat: -19.4681, lng: -42.5369 },
  "Sete Lagoas": { lat: -19.4681, lng: -44.2469 },
  "Varginha": { lat: -21.5519, lng: -45.4297 },
  "Patos de Minas": { lat: -18.5781, lng: -46.5181 },
  "Poços de Caldas": { lat: -21.7869, lng: -46.5619 },
  "Teófilo Otoni": { lat: -17.8581, lng: -41.5056 },
  // São Paulo interior cities
  "São José dos Campos": { lat: -23.1794, lng: -45.8869 },
  "Osasco": { lat: -23.5322, lng: -46.7919 },
  "Santo André": { lat: -23.6639, lng: -46.5383 },
  "São Bernardo do Campo": { lat: -23.6914, lng: -46.5646 },
  "Mauá": { lat: -23.6681, lng: -46.4619 },
  "Diadema": { lat: -23.6861, lng: -46.6219 },
  "Bauru": { lat: -22.3147, lng: -49.0608 },
  "Piracicaba": { lat: -22.7253, lng: -47.6492 },
  "Franca": { lat: -20.5386, lng: -47.4008 },
  "Limeira": { lat: -22.5647, lng: -47.4014 },
  "São José do Rio Preto": { lat: -20.8197, lng: -49.3794 },
  "Mogi das Cruzes": { lat: -23.5219, lng: -46.1853 },
  "Taubaté": { lat: -23.0261, lng: -45.5556 },
  "Jundiaí": { lat: -23.1864, lng: -46.8844 },
  "Presidente Prudente": { lat: -22.1208, lng: -51.3883 },
  "Araçatuba": { lat: -21.2086, lng: -50.4333 },
  "Araraquara": { lat: -21.7942, lng: -48.1758 },
  "Marília": { lat: -22.2136, lng: -49.9456 },
  "Americana": { lat: -22.7386, lng: -47.3319 },
  "Barueri": { lat: -23.5053, lng: -46.8761 },
  "Carapicuíba": { lat: -23.5228, lng: -46.8353 },
  "Suzano": { lat: -23.5428, lng: -46.3103 },
  "Itaquaquecetuba": { lat: -23.4833, lng: -46.3486 },
  // Rio de Janeiro interior cities
  "Nova Iguaçu": { lat: -22.7558, lng: -43.4511 },
  "Duque de Caxias": { lat: -22.7853, lng: -43.3119 },
  "São Gonçalo": { lat: -22.8267, lng: -43.0539 },
  "Petrópolis": { lat: -22.5050, lng: -43.1789 },
  "Volta Redonda": { lat: -22.5231, lng: -44.1039 },
  "Macaé": { lat: -22.3706, lng: -41.7869 },
  "Campos dos Goytacazes": { lat: -21.7542, lng: -41.3242 },
  // Espírito Santo cities
  "Serra": { lat: -20.1281, lng: -40.3069 },
  "Vila Velha": { lat: -20.3297, lng: -40.2928 },
  "Cariacica": { lat: -20.2631, lng: -40.4169 },
  "Cachoeiro de Itapemirim": { lat: -20.8481, lng: -41.1131 },
  // Paraná interior cities
  "Foz do Iguaçu": { lat: -25.5478, lng: -54.5882 },
  "Cascavel": { lat: -24.9558, lng: -53.4553 },
  "Maringá": { lat: -23.4253, lng: -51.9386 },
  "Ponta Grossa": { lat: -25.0947, lng: -50.1619 },
  "Guarapuava": { lat: -25.3908, lng: -51.4578 },
  "Apucarana": { lat: -23.5508, lng: -51.4614 },
  "Umuarama": { lat: -23.7658, lng: -53.3258 },
  // Santa Catarina interior cities
  "Blumenau": { lat: -26.9194, lng: -49.0661 },
  "Chapecó": { lat: -27.1006, lng: -52.6153 },
  "Itajaí": { lat: -26.9078, lng: -48.6619 },
  "Criciúma": { lat: -28.6778, lng: -49.3694 },
  "Lages": { lat: -27.8161, lng: -50.3261 },
  "Jaraguá do Sul": { lat: -26.4856, lng: -49.0694 },
  "Balneário Camboriú": { lat: -26.9906, lng: -48.6353 },
  // Rio Grande do Sul interior cities
  "Caxias do Sul": { lat: -29.1678, lng: -51.1794 },
  "Pelotas": { lat: -31.7719, lng: -52.3422 },
  "Canoas": { lat: -29.9178, lng: -51.1836 },
  "Santa Maria": { lat: -29.6842, lng: -53.8069 },
  "Novo Hamburgo": { lat: -29.6781, lng: -51.1303 },
  "São Leopoldo": { lat: -29.7597, lng: -51.1478 },
  "Rio Grande": { lat: -32.0350, lng: -52.0986 },
  "Passo Fundo": { lat: -28.2619, lng: -52.4069 },
  "Uruguaiana": { lat: -29.7547, lng: -57.0883 },
  // Goiás interior cities
  "Aparecida de Goiânia": { lat: -16.8228, lng: -49.2464 },
  "Anápolis": { lat: -16.3281, lng: -48.9536 },
  "Rio Verde": { lat: -17.7981, lng: -50.9278 },
  "Águas Lindas de Goiás": { lat: -15.7453, lng: -48.2808 },
  "Formosa": { lat: -15.5358, lng: -47.3353 },
  // Mato Grosso do Sul cities
  "Dourados": { lat: -22.2231, lng: -54.8058 },
  "Três Lagoas": { lat: -20.7519, lng: -51.6781 },
  "Corumbá": { lat: -19.0089, lng: -57.6531 },
  "Ponta Porã": { lat: -22.5358, lng: -55.7258 },
};

// Cilindrada options
const cilindradaOptions = [
  { id: "125", label: "125cc" },
  { id: "150", label: "150cc" },
  { id: "160", label: "160cc" },
  { id: "300", label: "300cc" },
  { id: "600", label: "600cc" },
  { id: "1000", label: "1000cc" },
  { id: "1200", label: "1200cc" },
];

// Transmission options
const transmissionOptions = [
  { id: "manual", label: "Manual" },
  { id: "automatico", label: "Automático" },
  { id: "cvt", label: "CVT" },
];

// Fuel type options
const fuelTypeOptions = [
  { id: "gasolina", label: "Gasolina" },
  { id: "eletrica", label: "Elétrica" },
];

export default function Motorcycles() {
  const [, navigate] = useLocation();
  const queryParams = useSearch();
  
  // Parse URL parameters
  const searchParams = new URLSearchParams(queryParams);
  const searchCityRaw = searchParams.get("city") || "";
  // Normalize city name: "Porto Velho - RO" → "Porto Velho"
  const searchCity = searchCityRaw.includes(" - ") ? searchCityRaw.split(" - ")[0].trim() : searchCityRaw;
  const searchStartDate = searchParams.get("startDate") || searchParams.get("start") || "";
  const searchEndDate = searchParams.get("endDate") || searchParams.get("end") || "";

  // Filters
  const [filterCilindrada, setFilterCilindrada] = useState<string[]>([]);
  const [selectedTransmission, setSelectedTransmission] = useState<string[]>([]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  const [showMapOnMobile, setShowMapOnMobile] = useState(false);
  const [selectedPinCity, setSelectedPinCity] = useState<string | null>(null);
  const [hoveredVehicleId, setHoveredVehicleId] = useState<number | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Fetch motorcycles
  const { data: motorcycles, isLoading } = trpc.motorcycle.list.useQuery({
    cilindrada: filterCilindrada.length > 0 ? filterCilindrada[0] : undefined,
    city: searchCity || undefined,
    maxPrice: priceRange[1] < 1000 ? priceRange[1] : undefined,
  });

  // Group motorcycles by city
  const motorcyclesByCity = useMemo(() => {
    if (!motorcycles) return {};
    
    const grouped: Record<string, any[]> = {};
    motorcycles.forEach((moto: any) => {
      // Backend returns { vehicle: {...}, specs: {...} } structure
      const city = moto.vehicle?.pickupCity || moto.pickupCity || moto.cidade || "Desconhecida";
      if (!grouped[city]) grouped[city] = [];
      grouped[city].push(moto);
    });
    return grouped;
  }, [motorcycles]);

  // Filter motorcycles based on price range
  const filteredMotorcycles = useMemo(() => {
    if (!motorcycles) return [];
    
    return motorcycles.filter((moto: any) => {
      // Backend returns { vehicle: {...}, specs: {...} } structure
      const price = parseFloat(moto.vehicle?.dailyPrice || moto.preco_diario || "0");
      const transmission = moto.specs?.cambio || moto.vehicle?.transmission || moto.cambio;
      const fuel = moto.specs?.combustivel || moto.vehicle?.fuelType || moto.combustivel;
      const city = moto.vehicle?.pickupCity || moto.pickupCity || moto.cidade;
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchesTransmission = selectedTransmission.length === 0 || selectedTransmission.includes(transmission);
      const matchesFuel = selectedFuelTypes.length === 0 || selectedFuelTypes.includes(fuel);
      const matchesCity = !selectedPinCity || city === selectedPinCity;
      
      return matchesPrice && matchesTransmission && matchesFuel && matchesCity;
    });
  }, [motorcycles, priceRange, selectedTransmission, selectedFuelTypes, selectedPinCity]);

  // Calculate active filters count
  const activeFiltersCount = [
    filterCilindrada.length > 0,
    selectedTransmission.length > 0,
    selectedFuelTypes.length > 0,
    priceRange[1] < 1000,
  ].filter(Boolean).length;

  // Get center coordinates for the searched city
  // Priority: (1) exact match in hardcoded list, (2) partial match, (3) first vehicle's GPS coords, (4) Brazil center
  const centerCoords = useMemo(() => {
    if (!searchCity) return { lat: -14.2350, lng: -51.9253 };
    if (cityCoordinates[searchCity]) return cityCoordinates[searchCity];
    const matchKey = Object.keys(cityCoordinates).find(k => k.startsWith(searchCity));
    if (matchKey) return cityCoordinates[matchKey];
    // Use coordinates from the first vehicle that has them
    if (motorcycles) {
      const motoWithCoords = motorcycles.find((m: any) => {
        const lat = m.vehicle?.pickupLatitude || m.pickupLatitude;
        const lng = m.vehicle?.pickupLongitude || m.pickupLongitude;
        return lat && lng;
      });
      if (motoWithCoords) {
        const lat = parseFloat(motoWithCoords.vehicle?.pickupLatitude as string);
        const lng = parseFloat(motoWithCoords.vehicle?.pickupLongitude as string);
        return { lat, lng };
      }
    }
    return { lat: -14.2350, lng: -51.9253 };
  }, [searchCity, motorcycles]);

  // Handle map ready
  const handleMapReady = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    const zoom = searchCity ? 11 : 4;
    map.setCenter(centerCoords);
    map.setZoom(zoom);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty: map is only mounted once

  // Re-center map whenever the searched city changes
  useEffect(() => {
    if (!mapInstance) return;
    if (searchCity) {
      mapInstance.setCenter(centerCoords);
      mapInstance.setZoom(11);
    }
  }, [mapInstance, centerCoords, searchCity]);

  // Create markers for each city
  useEffect(() => {
    if (!mapInstance) return;

    const markers: google.maps.marker.AdvancedMarkerElement[] = [];

    Object.entries(motorcyclesByCity).forEach(([city, motos]) => {
      // Try hardcoded coords first, then fall back to vehicle's actual GPS coordinates
      let coords = cityCoordinates[city];
      if (!coords) {
        const motoWithCoords = (motos as any[]).find(m => {
          const lat = m.vehicle?.pickupLatitude || m.pickupLatitude;
          const lng = m.vehicle?.pickupLongitude || m.pickupLongitude;
          return lat && lng;
        });
        if (motoWithCoords) {
          coords = {
            lat: parseFloat(motoWithCoords.vehicle?.pickupLatitude || motoWithCoords.pickupLatitude),
            lng: parseFloat(motoWithCoords.vehicle?.pickupLongitude || motoWithCoords.pickupLongitude),
          };
        }
      }
      if (!coords) return;

      const minPrice = Math.min(...(motos as any[]).map(m => parseFloat(m.vehicle?.dailyPrice || m.preco_diario || "0")));
      const isSelected = selectedPinCity === city;
      const hasHoveredVehicle = (motos as any[]).some(m => m.id === hoveredVehicleId);

      const markerContent = document.createElement("div");
      markerContent.className = `
        px-3 py-2 rounded-full font-semibold text-sm cursor-pointer transition-all duration-200
        ${isSelected || hasHoveredVehicle 
          ? "bg-orange-500 text-white scale-110 shadow-lg" 
          : "bg-white text-black shadow-md hover:scale-105"
        }
      `;
      markerContent.innerHTML = `R$ ${Math.round(minPrice)}`;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance,
        position: coords,
        content: markerContent,
        title: city,
      });

      marker.addListener("click", () => {
        setSelectedPinCity(selectedPinCity === city ? null : city);
      });

      markers.push(marker);
    });

    return () => {
      markers.forEach(marker => {
        marker.map = null;
      });
    };
  }, [mapInstance, motorcyclesByCity, selectedPinCity, hoveredVehicleId]);

  // Format dates for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilterCilindrada([]);
    setSelectedTransmission([]);
    setSelectedFuelTypes([]);
    setPriceRange([0, 1000]);
    setSelectedPinCity(null);
  };

  return (
    <div className="h-screen bg-[#0A0F1C] flex flex-col overflow-hidden">
      <Header />
      
      {/* Spacer for fixed header */}
      <div className="shrink-0 h-14 sm:h-16 lg:h-20" />
      
      {/* Search Bar */}
      <div className="shrink-0 bg-[#0B1426] border-b border-white/10 py-4 px-4">
        <div className="container flex items-center justify-between gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 flex items-center gap-4 bg-white/5 rounded-full px-4 py-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span className="text-white font-medium">{searchCity}</span>
            </div>
            {searchStartDate && searchEndDate && (
              <>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-300 text-sm">
                    {formatDate(searchStartDate)} - {formatDate(searchEndDate)}
                  </span>
                </div>
              </>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#0B1426] border-b border-white/10 overflow-hidden"
          >
            <div className="container py-4 px-4">
              <div className="flex flex-col gap-6">
                {/* Cilindrada */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Bike className="w-4 h-4 text-orange-400" />
                    Cilindrada
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {cilindradaOptions.map(option => (
                      <Button
                        key={option.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilterCilindrada(filterCilindrada.includes(option.id) ? [] : [option.id])}
                        className={`${
                          filterCilindrada.includes(option.id)
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/50"
                            : "text-gray-400 hover:text-white hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Transmission */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-orange-400" />
                    Tipo de Câmbio
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {transmissionOptions.map(option => (
                      <Button
                        key={option.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTransmission(selectedTransmission.includes(option.id) ? selectedTransmission.filter(t => t !== option.id) : [...selectedTransmission, option.id])}
                        className={`${
                          selectedTransmission.includes(option.id)
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/50"
                            : "text-gray-400 hover:text-white hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Fuel Type */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-orange-400" />
                    Tipo de Combustível
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {fuelTypeOptions.map(option => (
                      <Button
                        key={option.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFuelTypes(selectedFuelTypes.includes(option.id) ? selectedFuelTypes.filter(f => f !== option.id) : [...selectedFuelTypes, option.id])}
                        className={`${
                          selectedFuelTypes.includes(option.id)
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/50"
                            : "text-gray-400 hover:text-white hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Price Range */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-orange-400" />
                    Preço por Dia
                  </h4>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      min={0}
                      max={1000}
                      step={10}
                      className="flex-1"
                    />
                    <span className="text-white font-medium whitespace-nowrap">
                      R$ {priceRange[1]}
                    </span>
                  </div>
                </div>
                
                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpar Filtros ({activeFiltersCount})
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile View Toggle */}
      <div className="shrink-0 lg:hidden bg-[#0B1426] border-b border-white/10 py-2 px-4">
        <div className="container flex justify-center gap-2">
          <Button
            variant={!showMapOnMobile ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowMapOnMobile(false)}
            className={!showMapOnMobile ? "bg-orange-500 text-black" : "text-gray-400"}
          >
            <Grid className="w-4 h-4 mr-2" />
            Lista
          </Button>
          <Button
            variant={showMapOnMobile ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowMapOnMobile(true)}
            className={showMapOnMobile ? "bg-orange-500 text-black" : "text-gray-400"}
          >
            <MapIcon className="w-4 h-4 mr-2" />
            Mapa
          </Button>
        </div>
      </div>
      
      {/* Main Content — split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Motorcycle List — scrollable */}
        <div className={`w-full lg:w-[45%] xl:w-2/5 overflow-y-auto ${showMapOnMobile ? "hidden lg:block" : ""}`}>
          <div className="p-4">
            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando motos...
                  </span>
                ) : (
                  <>
                    <span className="text-white font-semibold">{filteredMotorcycles.length}</span> motos encontradas
                    {selectedPinCity && (
                      <span className="ml-2">
                        em <span className="text-orange-400">{selectedPinCity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPinCity(null)}
                          className="ml-1 p-1 h-auto text-gray-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
            
            {/* Privacy Notice */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-orange-300">
                <MapPin className="w-3 h-3 inline mr-1" />
                Para sua segurança, localizações exatas são compartilhadas apenas após a confirmação da reserva.
              </p>
            </div>
            
            {/* Motorcycle Cards */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin mb-4" />
                <p className="text-gray-400">Carregando motos...</p>
              </div>
            ) : filteredMotorcycles.length === 0 ? (
              <div className="text-center py-12">
                <Bike className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Nenhuma moto encontrada</h3>
                <p className="text-gray-400 mb-4">
                  Não encontramos motos disponíveis com os filtros selecionados.
                </p>
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className="border-white/20 text-gray-300 hover:bg-white/5"
                >
                  Limpar Filtros
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMotorcycles.map((moto: any) => (
                  <Link key={moto.id} href={`/motorcycles/${moto.id}`}>
                    <Card 
                      className="bg-[#0B1426] border-white/10 hover:border-orange-500/50 cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredVehicleId(moto.id)}
                      onMouseLeave={() => setHoveredVehicleId(null)}
                    >
                      <CardContent className="p-3">
                        {/* Image */}
                        <div className="relative w-full h-40 rounded-lg overflow-hidden mb-3 bg-gray-800">
                          {moto.imagem_principal && (
                            <img
                              loading="lazy" 
                              src={moto.imagem_principal} 
                              alt={`${moto.cilindrada}cc`}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        
                        {/* Details */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-white font-semibold">
                              {moto.cilindrada}cc {moto.tipo}
                            </h3>
                            <p className="text-gray-400 text-sm">{moto.proprietario_nome}</p>
                          </div>
                        </div>
                        
                        {/* Features */}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                            {moto.cambio}
                          </span>
                          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                            {moto.combustivel}
                          </span>
                        </div>
                        
                        {/* Rating & Location */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            {moto.avaliacao && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-white text-sm">{moto.avaliacao.toFixed(2)}</span>
                              </div>
                            )}
                            <span className="text-gray-500 text-sm">({moto.total_viagens} viagens)</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400 text-sm">
                            <MapPin className="w-3 h-3" />
                            {moto.cidade}
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="mt-3 text-right">
                          <span className="text-orange-400 font-bold text-lg">
                            R$ {moto.preco_diario}
                          </span>
                          <span className="text-gray-400 text-sm">/dia</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Map — sticky right panel */}
        <div className={`hidden lg:flex-1 lg:block lg:relative ${showMapOnMobile ? "block" : ""}`}>
          <MapView 
            onMapReady={handleMapReady}
            className="absolute inset-0 w-full h-full"
          />
          
          {/* Map Price Slider Overlay */}
          <div className="absolute top-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Filtrar por preço</span>
              <span className="text-sm text-white font-medium">
                R$ {priceRange[0]} - R$ {priceRange[1]}
              </span>
            </div>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              min={0}
              max={1000}
              step={10}
              className="w-full"
            />
          </div>
          
          {/* Selected Pin Info */}
          {selectedPinCity && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{selectedPinCity}</p>
                  <p className="text-gray-400 text-sm">
                    {motorcyclesByCity[selectedPinCity]?.length || 0} motos disponíveis
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPinCity(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
