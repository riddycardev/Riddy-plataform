import { useState, useRef, useEffect } from 'react';
import { useBrazilianCities, CityOption } from '@/hooks/useBrazilianCities';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string, stateCode?: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Digite o nome da cidade',
  className = '',
  error,
}: CityAutocompleteProps) {
  const { searchCities, loading } = useBrazilianCities();
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<CityOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Atualizar inputValue quando value externo mudar
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue.length >= 2) {
      const results = searchCities(newValue);
      setSuggestions(results);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectCity = (city: CityOption) => {
    setInputValue(city.value);
    onChange(city.value, city.stateCode);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectCity(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.length >= 2) {
              const results = searchCities(inputValue);
              setSuggestions(results);
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={`pl-10 border-2 ${error ? 'border-red-500' : 'border-cyan-500/50 focus:border-cyan-500'}`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((city, index) => (
            <button
              key={city.value}
              type="button"
              onClick={() => handleSelectCity(city)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900">{city.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && inputValue.length >= 2 && suggestions.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            Nenhuma cidade encontrada
          </p>
        </div>
      )}
    </div>
  );
}
