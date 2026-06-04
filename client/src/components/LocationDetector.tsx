import { useEffect, useState } from 'react';
import { useGeolocation, useVehiclesByLocation, useNearbyCities } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';

export interface LocationDetectorProps {
  onLocationDetected?: (lat: number, lon: number, city?: string, state?: string) => void;
  onVehiclesFound?: (vehicles: any[]) => void;
  radiusKm?: number;
  autoDetect?: boolean;
}

export function LocationDetector({
  onLocationDetected,
  onVehiclesFound,
  radiusKm = 50,
  autoDetect = false,
}: LocationDetectorProps) {
  const { location, loading, error, requestLocation, isSupported } = useGeolocation();
  const vehiclesQuery = useVehiclesByLocation(location, radiusKm);
  const citiesQuery = useNearbyCities(location, radiusKm * 2);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (autoDetect && isSupported && !location) {
      requestLocation();
    }
  }, [autoDetect, isSupported, location, requestLocation]);

  useEffect(() => {
    if (location && onLocationDetected) {
      onLocationDetected(location.latitude, location.longitude, location.city, location.state);
    }
  }, [location, onLocationDetected]);

  useEffect(() => {
    if (vehiclesQuery.data?.data && onVehiclesFound) {
      onVehiclesFound(vehiclesQuery.data.data);
      setShowSuggestions(vehiclesQuery.data.count === 0);
    }
  }, [vehiclesQuery.data, onVehiclesFound]);

  return (
    <div className="space-y-4">
      {!location && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-sm text-blue-900">
                Detectar sua localizacao
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Vamos mostrar carros proximos a voce
              </p>
            </div>
            <Button
              onClick={requestLocation}
              disabled={loading || !isSupported}
              size="sm"
              variant="outline"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Detectando...
                </>
              ) : (
                'Detectar'
              )}
            </Button>
          </div>
        </Card>
      )}

      {location && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-sm text-green-900">
                Localizacao detectada
              </p>
              <p className="text-xs text-green-700 mt-1">
                {location.city && location.state
                  ? `${location.city}, ${location.state}`
                  : `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Fonte: {location.source === 'gps' ? 'GPS' : location.source === 'ip' ? 'IP' : 'Manual'}
                {location.accuracy && ` - Precisao: ±${location.accuracy.toFixed(0)}m`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-sm text-red-900">Erro ao detectar localizacao</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {location && vehiclesQuery.isLoading && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Buscando carros proximos...</p>
          </div>
        </Card>
      )}

      {location && vehiclesQuery.data?.count === 0 && showSuggestions && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div>
            <p className="font-medium text-sm text-amber-900 mb-3">
              Nenhum carro encontrado em {radiusKm}km
            </p>
            {citiesQuery.data?.data && citiesQuery.data.data.length > 0 && (
              <div>
                <p className="text-xs text-amber-700 mb-2">Cidades proximas com carros:</p>
                <div className="space-y-2">
                  {citiesQuery.data.data.map((city) => (
                    <div
                      key={city.id}
                      className="flex items-center justify-between p-2 bg-white rounded border border-amber-100"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {city.name}, {city.state}
                        </p>
                        <p className="text-xs text-gray-500">
                          {city.vehicleCount} carro{city.vehicleCount !== 1 ? 's' : ''} - {city.distance.toFixed(1)}km
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.location.href = `/?cidade=${encodeURIComponent(city.name)}`;
                        }}
                      >
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {location && vehiclesQuery.data?.count! > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm font-medium text-green-900">
            {vehiclesQuery.data!.count} carro{vehiclesQuery.data!.count !== 1 ? 's' : ''} encontrado{vehiclesQuery.data!.count !== 1 ? 's' : ''} em {radiusKm}km
          </p>
        </Card>
      )}
    </div>
  );
}
