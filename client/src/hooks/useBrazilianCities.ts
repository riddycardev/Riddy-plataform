import { useState, useEffect, useCallback } from 'react';

export interface City {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
        nome: string;
      };
    };
  };
}

export interface CityOption {
  value: string;
  label: string;
  state: string;
  stateCode: string;
}

/**
 * Hook para buscar cidades brasileiras da API do IBGE
 * Retorna lista de cidades formatadas para uso em autocomplete
 */
export function useBrazilianCities() {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se já tem cache
    const cachedCities = localStorage.getItem('brazilian_cities');
    const cacheTimestamp = localStorage.getItem('brazilian_cities_timestamp');
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // 1 semana em ms

    if (cachedCities && cacheTimestamp) {
      const timestamp = parseInt(cacheTimestamp);
      const now = Date.now();
      
      // Se cache tem menos de 1 semana, usar cache
      if (now - timestamp < ONE_WEEK) {
        setCities(JSON.parse(cachedCities));
        return;
      }
    }

    // Buscar da API
    fetchCities();
  }, []);

  const fetchCities = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome'
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar cidades');
      }

      const data: City[] = await response.json();

      const formattedCities: CityOption[] = data
        .filter((city) => city.microrregiao && city.microrregiao.mesorregiao && city.microrregiao.mesorregiao.UF)
        .map((city) => ({
          value: `${city.nome}, ${city.microrregiao.mesorregiao.UF.sigla}`,
          label: `${city.nome} - ${city.microrregiao.mesorregiao.UF.sigla}`,
          state: city.microrregiao.mesorregiao.UF.nome,
          stateCode: city.microrregiao.mesorregiao.UF.sigla,
        }));

      setCities(formattedCities);

      // Salvar no cache
      localStorage.setItem('brazilian_cities', JSON.stringify(formattedCities));
      localStorage.setItem('brazilian_cities_timestamp', Date.now().toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao buscar cidades:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchCities = useCallback((query: string): CityOption[] => {
    if (!query || query.length < 2) return [];

    const normalizedQuery = query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return cities
      .filter((city) => {
        const normalizedCity = city.label
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return normalizedCity.includes(normalizedQuery);
      })
      .slice(0, 50); // Limitar a 50 resultados
  }, [cities]);

  return {
    cities,
    loading,
    error,
    searchCities,
  };
}
