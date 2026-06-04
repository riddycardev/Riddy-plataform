/**
 * RIDDY Hero Section — Exclusiva para Carros
 * Fundo de carro, busca → /cars
 * Sem seletor de categoria (motos têm sua própria página em /motos-home)
 */

import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useCategory } from "@/contexts/CategoryContext";
import {
  Search, MapPin, Shield, CheckCircle, Headphones,
  Navigation, Loader2, Car, Bike
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/DateRangePicker";
import { useBrazilianCities } from "@/hooks/useBrazilianCities";

interface CityOption {
  name: string;
  state: string;
}

const trustBadges = [
  { icon: Shield, label: "Seguro Incluso" },
  { icon: CheckCircle, label: "Verificação Completa" },
  { icon: Headphones, label: "Suporte 24h" },
];

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  "São Paulo": { lat: -23.5505, lng: -46.6333 },
  "Rio de Janeiro": { lat: -22.9068, lng: -43.1729 },
  "Belo Horizonte": { lat: -19.9167, lng: -43.9345 },
  "Brasília": { lat: -15.7942, lng: -47.8822 },
  "Curitiba": { lat: -25.4284, lng: -49.2733 },
  "Salvador": { lat: -12.9714, lng: -38.5014 },
  "Fortaleza": { lat: -3.7172, lng: -38.5433 },
  "Recife": { lat: -8.0476, lng: -34.877 },
  "Porto Alegre": { lat: -30.0346, lng: -51.2177 },
  "Florianópolis": { lat: -27.5954, lng: -48.548 },
  "Manaus": { lat: -3.119, lng: -60.0217 },
  "Goiânia": { lat: -16.6869, lng: -49.2648 },
  "Campinas": { lat: -22.9099, lng: -47.0626 },
  "Guarulhos": { lat: -23.4538, lng: -46.5333 },
  "Niterói": { lat: -22.8833, lng: -43.1036 },
  "Santos": { lat: -23.9608, lng: -46.3336 },
  "Vitória": { lat: -20.3155, lng: -40.3128 },
  "Natal": { lat: -5.7793, lng: -35.2009 },
  "Maceió": { lat: -9.6658, lng: -35.735 },
  "João Pessoa": { lat: -7.1195, lng: -34.845 },
  "Campo Grande": { lat: -20.4697, lng: -54.6201 },
  "Cuiabá": { lat: -15.6014, lng: -56.0979 },
  "Belém": { lat: -1.4558, lng: -48.4902 },
  "Uberlândia": { lat: -18.9186, lng: -48.2772 },
  "Ribeirão Preto": { lat: -21.1775, lng: -47.8103 },
  "Sorocaba": { lat: -23.5015, lng: -47.4526 },
  "Joinville": { lat: -26.3045, lng: -48.8487 },
  "Londrina": { lat: -23.3045, lng: -51.1696 },
  "Juiz de Fora": { lat: -21.7642, lng: -43.3503 },
  "Aracaju": { lat: -10.9472, lng: -37.0731 },
  "Teresina": { lat: -5.0892, lng: -42.8019 },
  "São Luís": { lat: -2.5307, lng: -44.3068 },
  "Palmas": { lat: -10.1689, lng: -48.3317 },
  "Porto Velho": { lat: -8.7612, lng: -63.9004 },
  "Rio Branco": { lat: -9.9754, lng: -67.8249 },
  "Macapá": { lat: 0.0356, lng: -51.0705 },
  "Boa Vista": { lat: 2.8235, lng: -60.6758 },
};

interface HeroSectionProps {
  activeCategory?: "cars" | "motorcycles";
  setActiveCategory?: (category: "cars" | "motorcycles") => void;
}

export default function HeroSection({ activeCategory: propActiveCategory = "cars", setActiveCategory: propSetActiveCategory }: HeroSectionProps) {
  const [, navigate] = useLocation();
  const { activeCategory, setActiveCategory } = useCategory();
  // Use context values if available, otherwise fall back to props
  const [searchCity, setSearchCity] = useState("");
  const [selectedDates, setSelectedDates] = useState<[Date | null, Date | null]>([null, null]);
  const [cityLoading, setCityLoading] = useState(false);
  const { cities } = useBrazilianCities();
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const handleCityChange = (value: string) => {
    setSearchCity(value);
    if (value.length > 1) {
      const suggestions = cities
        .filter((c: any) => c.label?.toLowerCase().includes(value.toLowerCase()))
        .map((c: any) => c.label)
        .slice(0, 5);
      setCitySuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectCity = (city: string) => {
    setSearchCity(city);
    setShowSuggestions(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchCity) params.append("city", searchCity);
    if (selectedDates[0]) params.append("startDate", selectedDates[0].toISOString());
    if (selectedDates[1]) params.append("endDate", selectedDates[1].toISOString());
    navigate(`/cars?${params.toString()}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{ minHeight: "100svh" }}
    >
      {/* Fundo base escuro */}
      <div className="absolute inset-0 bg-[#020A14]" />

      {/* ── DESKTOP (sm+): cover centralizado — não altera */}
      <div
        className="absolute inset-0 hidden sm:block"
        style={{
          backgroundImage: `url('https://files.manuscdn.com/user_upload_by_module/session_file/310519663324780556/HuSLiukYkzzbFYmb.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center 55%",
          backgroundRepeat: "no-repeat",
          opacity: 0.55,
        }}
      />

      {/* ── MOBILE (<sm): contain + center bottom para o carro aparecer na parte inferior */}
      <div
        className="absolute inset-0 sm:hidden"
        style={{
          backgroundImage: `url('https://files.manuscdn.com/user_upload_by_module/session_file/310519663324780556/HuSLiukYkzzbFYmb.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center 55%",
          backgroundRepeat: "no-repeat",
          opacity: 0.60,
        }}
      />

      {/* Overlay — escurece topo (texto) e preserva carro na base */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(2,10,20,0.82) 0%, rgba(2,10,20,0.65) 45%, rgba(2,10,20,0.30) 75%, rgba(2,10,20,0.10) 100%)",
        }}
      />

      {/* Animated Background Blobs — Cyan para Carros */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 right-10 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-teal-600 rounded-full blur-3xl opacity-15"></div>
      </div>

      {/* Content — ocupa toda a altura, texto no topo, carro visivel na base */}
      <div className="container relative z-10 flex-1 flex flex-col justify-start pt-20 sm:pt-24 md:pt-28 pb-8 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">

          {/* Category Selector - Above Badge */}
          {setActiveCategory && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex gap-2 sm:gap-4 items-center justify-center mb-8 sm:mb-12"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setActiveCategory("cars")}
                  variant={activeCategory === "cars" ? "default" : "outline"}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    activeCategory === "cars"
                      ? "bg-cyan-500 text-white hover:bg-cyan-600"
                      : "text-gray-300 hover:text-cyan-400 border-cyan-400/30 hover:border-cyan-400"
                  }`}
                >
                  <Car className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Carros</span>
                  <span className="sm:hidden">Carros</span>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setActiveCategory("motorcycles")}
                  variant={activeCategory === "motorcycles" ? "default" : "outline"}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    activeCategory === "motorcycles"
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "text-gray-300 hover:text-orange-400 border-orange-400/30 hover:border-orange-400"
                  }`}
                >
                  <Bike className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Motos</span>
                  <span className="sm:hidden">Motos</span>
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border bg-cyan-500/10 border-cyan-500/20 mb-6 sm:mb-8"
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse bg-cyan-400" />
            <span className="text-xs sm:text-sm font-medium text-cyan-400">
              O Marketplace de Carros do Brasil
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
          >
            <span className="text-white">Alugue o carro</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              perfeito para você
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, x: -20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="text-base sm:text-lg text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto sm:mx-0 px-4 sm:px-0 leading-relaxed"
            style={{
              fontSize: 'clamp(15px, 4vw, 17px)',
              fontWeight: '600',
              textAlign: 'left',
              letterSpacing: '0.3px'
            }}
          >
            Carros únicos de anfitriões locais em todo o Brasil. Sem filas, sem burocracia.
          </motion.p>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4 max-w-2xl mx-auto"
          >
            {/* Location Input */}
            <div className="relative" ref={suggestionsRef}>
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cidade ou aeroporto"
                value={searchCity}
                onChange={(e) => handleCityChange(e.target.value)}
                onFocus={() => searchCity.length > 1 && setShowSuggestions(true)}
                className="w-full pl-12 pr-4 h-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
              {showSuggestions && citySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-lg overflow-hidden z-50">
                  {citySuggestions.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleSelectCity(city)}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Picker */}
            <DateRangePicker
              startDate={selectedDates[0] || undefined}
              endDate={selectedDates[1] || undefined}
              onStartDateChange={(date) => setSelectedDates([date || null, selectedDates[1]])}
              onEndDateChange={(date) => setSelectedDates([selectedDates[0], date || null])}
            />

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-black font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Buscar Carros
            </Button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 mt-12 pt-8 border-t border-white/10"
          >
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 text-sm text-gray-300">
                <badge.icon className="w-4 h-4 text-cyan-400" />
                <span>{badge.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
