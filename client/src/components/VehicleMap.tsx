/**
 * VehicleMap Component
 * 
 * Mapa interativo que exibe veículos agregados por cidade/aeroporto.
 * NÃO exibe endereços ou localizações exatas por privacidade.
 * 
 * Features:
 * - Pins no nível de cidade/aeroporto apenas
 * - Sincronização com lista de veículos
 * - Preview de veículos ao clicar no pin
 * - Navegação para página de detalhes
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { MapView } from "./Map";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, X, Car, Plane } from "lucide-react";
import { Link } from "wouter";

// Coordenadas de cidades brasileiras (centro da cidade - sem endereços específicos)
export const CITY_COORDINATES: Record<string, { lat: number; lng: number; name: string; type: 'city' | 'airport' }> = {
  'sao-paulo': { lat: -23.5505, lng: -46.6333, name: 'São Paulo', type: 'city' },
  'rio-de-janeiro': { lat: -22.9068, lng: -43.1729, name: 'Rio de Janeiro', type: 'city' },
  'brasilia': { lat: -15.7942, lng: -47.8822, name: 'Brasília', type: 'city' },
  'belo-horizonte': { lat: -19.9167, lng: -43.9345, name: 'Belo Horizonte', type: 'city' },
  'curitiba': { lat: -25.4284, lng: -49.2733, name: 'Curitiba', type: 'city' },
  'salvador': { lat: -12.9714, lng: -38.5014, name: 'Salvador', type: 'city' },
  'florianopolis': { lat: -27.5954, lng: -48.5480, name: 'Florianópolis', type: 'city' },
  'porto-alegre': { lat: -30.0346, lng: -51.2177, name: 'Porto Alegre', type: 'city' },
  'recife': { lat: -8.0476, lng: -34.8770, name: 'Recife', type: 'city' },
  'fortaleza': { lat: -3.7172, lng: -38.5433, name: 'Fortaleza', type: 'city' },
  // Aeroportos principais
  'gru-airport': { lat: -23.4356, lng: -46.4731, name: 'Aeroporto de Guarulhos (GRU)', type: 'airport' },
  'gig-airport': { lat: -22.8099, lng: -43.2505, name: 'Aeroporto do Galeão (GIG)', type: 'airport' },
  'bsb-airport': { lat: -15.8711, lng: -47.9186, name: 'Aeroporto de Brasília (BSB)', type: 'airport' },
  'cgh-airport': { lat: -23.6261, lng: -46.6564, name: 'Aeroporto de Congonhas (CGH)', type: 'airport' },
  'cnf-airport': { lat: -19.6244, lng: -43.9719, name: 'Aeroporto de Confins (CNF)', type: 'airport' },
  'cwb-airport': { lat: -25.5285, lng: -49.1758, name: 'Aeroporto de Curitiba (CWB)', type: 'airport' },
};

// Veículos de exemplo com localização por cidade/aeroporto
export interface Vehicle {
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  trips: number;
  locationId: string;
  category: string;
  isNew?: boolean;
  discount?: number;
}

export const SAMPLE_VEHICLES: Vehicle[] = [
  { id: '1', name: 'BMW Série 5 2024', image: '/images/car-bmw-5.png', price: 450, rating: 4.97, trips: 42, locationId: 'sao-paulo', category: 'luxo' },
  { id: '2', name: 'Toyota RAV4 2024', image: '/images/car-rav4.png', price: 280, rating: 4.95, trips: 128, locationId: 'sao-paulo', category: 'suv', isNew: true },
  { id: '3', name: 'Mercedes-AMG GT 2023', image: '/images/car-mercedes-amg.png', price: 890, rating: 5.0, trips: 18, locationId: 'rio-de-janeiro', category: 'luxo' },
  { id: '4', name: 'Tesla Model 3 2024', image: '/images/car-tesla-3.png', price: 320, rating: 4.92, trips: 67, locationId: 'sao-paulo', category: 'eletrico', discount: 10 },
  { id: '5', name: 'Honda Civic 2024', image: '/images/car-civic.png', price: 180, rating: 4.88, trips: 215, locationId: 'belo-horizonte', category: 'sedan' },
  { id: '6', name: 'Porsche 911 2024', image: '/images/car-porsche-911.png', price: 1200, rating: 5.0, trips: 12, locationId: 'sao-paulo', category: 'luxo', isNew: true },
  { id: '7', name: 'Jeep Compass 2024', image: '/images/car-rav4.png', price: 250, rating: 4.85, trips: 89, locationId: 'curitiba', category: 'suv' },
  { id: '8', name: 'Volkswagen Polo 2024', image: '/images/car-civic.png', price: 120, rating: 4.75, trips: 320, locationId: 'brasilia', category: 'economico' },
  { id: '9', name: 'Audi A4 2024', image: '/images/car-bmw-5.png', price: 380, rating: 4.90, trips: 56, locationId: 'rio-de-janeiro', category: 'sedan' },
  { id: '10', name: 'Chevrolet Onix 2024', image: '/images/car-civic.png', price: 100, rating: 4.70, trips: 450, locationId: 'salvador', category: 'economico' },
  { id: '11', name: 'BMW X5 2024', image: '/images/car-rav4.png', price: 550, rating: 4.95, trips: 34, locationId: 'gru-airport', category: 'suv' },
  { id: '12', name: 'Mercedes C200 2024', image: '/images/car-bmw-5.png', price: 420, rating: 4.88, trips: 78, locationId: 'gig-airport', category: 'luxo' },
  { id: '13', name: 'Fiat Pulse 2024', image: '/images/car-rav4.png', price: 150, rating: 4.65, trips: 189, locationId: 'florianopolis', category: 'suv' },
  { id: '14', name: 'Hyundai HB20 2024', image: '/images/car-civic.png', price: 95, rating: 4.60, trips: 520, locationId: 'recife', category: 'economico' },
  { id: '15', name: 'Toyota Corolla 2024', image: '/images/car-civic.png', price: 200, rating: 4.92, trips: 156, locationId: 'fortaleza', category: 'sedan' },
];

interface VehicleMapProps {
  selectedCategory?: string;
  onVehicleSelect?: (vehicle: Vehicle) => void;
  selectedVehicleId?: string;
  className?: string;
}

export function VehicleMap({ 
  selectedCategory, 
  onVehicleSelect,
  selectedVehicleId,
  className 
}: VehicleMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isMapReady, setIsMapReady] = useState(false);

  // Filtrar veículos por categoria
  const filteredVehicles = selectedCategory && selectedCategory !== 'todos'
    ? SAMPLE_VEHICLES.filter(v => v.category === selectedCategory)
    : SAMPLE_VEHICLES;

  // Agrupar veículos por localização
  const vehiclesByLocation = filteredVehicles.reduce((acc, vehicle) => {
    if (!acc[vehicle.locationId]) {
      acc[vehicle.locationId] = [];
    }
    acc[vehicle.locationId].push(vehicle);
    return acc;
  }, {} as Record<string, Vehicle[]>);

  // Veículos na localização selecionada
  const vehiclesAtSelectedLocation = selectedLocation 
    ? vehiclesByLocation[selectedLocation] || []
    : [];

  // Criar marcadores no mapa
  const createMarkers = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    // Limpar marcadores existentes
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];

    // Criar novos marcadores para cada localização com veículos
    Object.entries(vehiclesByLocation).forEach(([locationId, vehicles]) => {
      const location = CITY_COORDINATES[locationId];
      if (!location) return;

      // Criar elemento customizado para o pin
      const pinElement = document.createElement('div');
      pinElement.className = 'vehicle-pin';
      pinElement.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #06b6d4, #0891b2);
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          border: 2px solid white;
        ">
          ${location.type === 'airport' ? '✈️' : '📍'}
          <span>${vehicles.length}</span>
        </div>
      `;

      // Efeito hover
      pinElement.addEventListener('mouseenter', () => {
        pinElement.style.transform = 'scale(1.1)';
      });
      pinElement.addEventListener('mouseleave', () => {
        pinElement.style.transform = 'scale(1)';
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: location.lat, lng: location.lng },
        content: pinElement,
        title: location.name,
      });

      // Click handler para mostrar popup
      marker.addListener('click', () => {
        setSelectedLocation(locationId);
        setShowPopup(true);
        
        // Centralizar mapa na localização
        mapRef.current?.panTo({ lat: location.lat, lng: location.lng });
        mapRef.current?.setZoom(12);
      });

      markersRef.current.push(marker);
    });
  }, [vehiclesByLocation]);

  // Atualizar marcadores quando veículos mudam
  useEffect(() => {
    if (isMapReady) {
      createMarkers();
    }
  }, [isMapReady, createMarkers]);

  // Centralizar no veículo selecionado
  useEffect(() => {
    if (selectedVehicleId && mapRef.current) {
      const vehicle = SAMPLE_VEHICLES.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        const location = CITY_COORDINATES[vehicle.locationId];
        if (location) {
          mapRef.current.panTo({ lat: location.lat, lng: location.lng });
          mapRef.current.setZoom(12);
          setSelectedLocation(vehicle.locationId);
          setShowPopup(true);
        }
      }
    }
  }, [selectedVehicleId]);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    setIsMapReady(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedLocation(null);
  };

  const locationInfo = selectedLocation ? CITY_COORDINATES[selectedLocation] : null;

  return (
    <div className={`relative ${className}`}>
      {/* Mapa */}
      <MapView
        className="w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden"
        initialCenter={{ lat: -15.7942, lng: -47.8822 }} // Centro do Brasil
        initialZoom={4}
        onMapReady={handleMapReady}
      />

      {/* Legenda */}
      <div className="absolute top-4 left-4 bg-[#0A0F1C]/90 backdrop-blur-sm rounded-xl p-3 border border-white/10">
        <div className="flex items-center gap-4 text-sm text-white">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Cidade</span>
          </div>
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-cyan-400" />
            <span>Aeroporto</span>
          </div>
        </div>
      </div>

      {/* Contador de veículos */}
      <div className="absolute top-4 right-4 bg-[#0A0F1C]/90 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
        <div className="flex items-center gap-2 text-white">
          <Car className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold">{filteredVehicles.length}</span>
          <span className="text-white/70 text-sm">veículos disponíveis</span>
        </div>
      </div>

      {/* Popup de veículos na localização */}
      {showPopup && locationInfo && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] bg-[#0A0F1C] rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-10">
          {/* Header do popup */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-teal-500/10">
            <div className="flex items-center gap-3">
              {locationInfo.type === 'airport' ? (
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-cyan-400" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-white">{locationInfo.name}</h3>
                <p className="text-sm text-white/60">
                  {vehiclesAtSelectedLocation.length} veículo{vehiclesAtSelectedLocation.length !== 1 ? 's' : ''} disponíve{vehiclesAtSelectedLocation.length !== 1 ? 'is' : 'l'}
                </p>
              </div>
            </div>
            <button 
              onClick={closePopup}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Lista de veículos */}
          <div className="max-h-[300px] overflow-y-auto p-2">
            {vehiclesAtSelectedLocation.map((vehicle) => (
              <Link key={vehicle.id} href={`/vehicle/${vehicle.id}`}>
                <div 
                  className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 ${
                    selectedVehicleId === vehicle.id ? 'bg-cyan-500/10 border border-cyan-500/30' : ''
                  }`}
                  onClick={() => onVehicleSelect?.(vehicle)}
                >
                  {/* Imagem do veículo */}
                  <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                    <img
                              loading="lazy" 
                      src={vehicle.image} 
                      alt={vehicle.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info do veículo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-white text-sm truncate">{vehicle.name}</h4>
                      {vehicle.isNew && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">Novo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-xs">{vehicle.rating}</span>
                      <span className="text-white/50 text-xs">({vehicle.trips} viagens)</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-cyan-400 font-semibold text-sm">
                        R$ {vehicle.price}/dia
                      </span>
                      {vehicle.discount && (
                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                          -{vehicle.discount}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer do popup */}
          <div className="p-3 border-t border-white/10">
            <Button 
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-black font-semibold"
              onClick={closePopup}
            >
              Ver todos em {locationInfo.name}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleMap;
