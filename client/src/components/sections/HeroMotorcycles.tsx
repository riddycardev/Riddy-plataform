/**
 * RIDDY Hero Section — Motos
 * Fundo laranja/preto, busca → /motorcycles
 * Tema exclusivo para motos
 */

import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { format, addDays } from "date-fns";
import { useCategory } from "@/contexts/CategoryContext";
import { MapPin, Shield, CheckCircle, Headphones, Bike, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface HeroMotorcyclesProps {
  activeCategory?: "cars" | "motorcycles";
  setActiveCategory?: (category: "cars" | "motorcycles") => void;
}

export default function HeroMotorcycles({ activeCategory: propActiveCategory = "motorcycles", setActiveCategory: propSetActiveCategory }: HeroMotorcyclesProps) {
  const [, navigate] = useLocation();
  const { activeCategory, setActiveCategory } = useCategory();
  const [searchCity, setSearchCity] = useState("");
  const [selectedDates, setSelectedDates] = useState<[Date | null, Date | null]>([null, null]);
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
    navigate(`/motorcycles?${params.toString()}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative min-h-[600px] sm:min-h-[700px] md:min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-orange-950 via-black to-black">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310519663324780556/5MKE4LDVikZTU9bHnRFBMx/HSJugwhZRJP0_1f2668c5.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black/90" />

      {/* Fundo com gradiente laranja/preto */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 right-10 w-96 h-96 bg-orange-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-orange-600 rounded-full blur-3xl opacity-15"></div>
      </div>

      {/* Content */}
      <div className="container relative z-10 pt-20 sm:pt-24 md:pt-28 pb-16 sm:pb-20 px-4 sm:px-6">
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-orange-500/10 border-orange-500/20 mb-8"
          >
            <span className="w-2 h-2 rounded-full animate-pulse bg-orange-400" />
            <span className="text-sm font-medium text-orange-400">
              O Marketplace de Motos do Brasil
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
          >
            <span className="text-white">Alugue a moto</span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              perfeita para você
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto"
          >
            Motos únicas de anfitriões locais em todo o Brasil. Sem filas, sem burocracia.
          </motion.p>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4 max-w-2xl mx-auto"
          >
            {/* Location Input */}
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Cidade ou aeroporto"
                value={searchCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="pl-12 h-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500"
              />
              {showSuggestions && citySuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#0A0F1C] border border-white/10 rounded-lg overflow-hidden z-50"
                >
                  {citySuggestions.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleSelectCity(city)}
                      className="w-full px-4 py-2 text-left text-gray-300 hover:bg-orange-500/20 transition-colors"
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
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-black font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-orange-500/25"
            >
              <Bike className="w-4 h-4 mr-2" />
              Buscar Motos
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
                <badge.icon className="w-4 h-4 text-orange-400" />
                <span>{badge.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
