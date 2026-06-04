import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { Star, Car, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FavoriteButton } from "@/components/FavoriteButton";

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  dailyPrice: string;
  mainImageUrl: string | null;
  averageRating?: string | null;
  totalTrips?: number;
}

interface VehicleGridProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 12;

export function VehicleGrid({ vehicles, isLoading }: VehicleGridProps) {
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Paginate vehicles
  const paginatedVehicles = useMemo(() => {
    return vehicles.slice(0, displayedCount);
  }, [vehicles, displayedCount]);

  // Check if there are more vehicles to load
  const hasMoreVehicles = useMemo(() => {
    return vehicles.length > displayedCount;
  }, [vehicles, displayedCount]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreVehicles && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setDisplayedCount(prev => prev + ITEMS_PER_PAGE);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMoreVehicles, isLoadingMore]);

  // Reset pagination when vehicles change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [vehicles]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
        <p className="text-gray-400">Carregando veículos...</p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Nenhum carro encontrado</h3>
        <p className="text-gray-400">
          Não encontramos carros disponíveis com os filtros selecionados.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-2 gap-2.5 md:gap-4">
        {paginatedVehicles.map(vehicle => {
          const cleanModel = vehicle.model.toLowerCase().includes(vehicle.brand.toLowerCase())
            ? vehicle.model
            : `${vehicle.brand} ${vehicle.model}`;
          const displayTitle = cleanModel.charAt(0).toUpperCase() + cleanModel.slice(1);

          return (
            <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`}>
              <Card 
                className="bg-transparent border-0 overflow-hidden cursor-pointer transition-all duration-300 group"
              >
                <div className="flex flex-col">
                  {/* Image — 4:3 aspect ratio */}
                  <div className="relative bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] aspect-[4/3] rounded-lg overflow-hidden">
                    {vehicle.mainImageUrl ? (
                      <img
                        loading="lazy" 
                        src={vehicle.mainImageUrl}
                        alt={displayTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center ${vehicle.mainImageUrl ? 'hidden' : ''}`}>
                      <div className="text-center">
                        <Car className="w-8 h-8 text-slate-500 mx-auto mb-1" />
                        <span className="text-xs text-slate-500">Foto em breve</span>
                      </div>
                    </div>
                    
                    {/* Favorite button */}
                    <div className="absolute top-2.5 right-2.5">
                      <FavoriteButton vehicleId={vehicle.id} size="sm" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="pt-3">
                    {/* Title */}
                    <h3 className="text-white font-bold text-sm leading-tight truncate">
                      {displayTitle}
                    </h3>
                    
                    {/* Year & Rating */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-gray-400 text-xs">{vehicle.year}</span>
                      {vehicle.averageRating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-gray-300 text-xs font-medium">{parseFloat(vehicle.averageRating).toFixed(1)}</span>
                          {vehicle.totalTrips && vehicle.totalTrips > 0 && (
                            <span className="text-gray-500 text-xs">({vehicle.totalTrips})</span>
                          )}
                        </div>
                      ) : vehicle.totalTrips && vehicle.totalTrips > 0 ? (
                        <span className="text-gray-500 text-xs">({vehicle.totalTrips})</span>
                      ) : (
                        <span className="text-gray-600 text-xs">Novo</span>
                      )}
                    </div>
                    
                    {/* Price */}
                    <div className="mt-3 pt-2.5 border-t border-white/10">
                      <p className="text-white font-bold text-lg">
                        R$ {parseFloat(vehicle.dailyPrice).toFixed(0)}
                      </p>
                      <p className="text-gray-500 text-xs">/dia</p>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
      
      {/* Load more trigger */}
      {hasMoreVehicles && (
        <div ref={observerTarget} className="flex justify-center py-8">
          {isLoadingMore && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="text-gray-400">Carregando mais carros...</span>
            </div>
          )}
        </div>
      )}
      
      {/* Results count */}
      {vehicles.length > 0 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          Mostrando {paginatedVehicles.length} de {vehicles.length} carros
        </div>
      )}
    </div>
  );
}
