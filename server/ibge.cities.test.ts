import { describe, it, expect } from 'vitest';

describe('IBGE Cities API Integration', () => {
  it('deve buscar cidades da API do IBGE com sucesso', async () => {
    const response = await fetch(
      'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome'
    );

    expect(response.ok).toBe(true);
    const data = await response.json();
    
    // Deve retornar array de cidades
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(5000); // Brasil tem 5570 municípios
  });

  it('deve retornar cidades com estrutura correta', async () => {
    const response = await fetch(
      'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome'
    );

    const data = await response.json();
    const firstCity = data[0];

    // Verificar estrutura básica
    expect(firstCity).toHaveProperty('id');
    expect(firstCity).toHaveProperty('nome');
    
    // Algumas cidades podem ter microrregiao null, então filtramos
    const validCities = data.filter((city: any) => 
      city.microrregiao && 
      city.microrregiao.mesorregiao && 
      city.microrregiao.mesorregiao.UF
    );

    expect(validCities.length).toBeGreaterThan(5000);

    // Verificar primeira cidade válida
    const validCity = validCities[0];
    expect(validCity.microrregiao.mesorregiao.UF).toHaveProperty('sigla');
    expect(validCity.microrregiao.mesorregiao.UF).toHaveProperty('nome');
  });

  it('deve encontrar São Paulo na lista', async () => {
    const response = await fetch(
      'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome'
    );

    const data = await response.json();
    const saoPaulo = data.find((city: any) => 
      city.nome === 'São Paulo' && 
      city.microrregiao?.mesorregiao?.UF?.sigla === 'SP'
    );

    expect(saoPaulo).toBeDefined();
    expect(saoPaulo.nome).toBe('São Paulo');
    expect(saoPaulo.microrregiao.mesorregiao.UF.sigla).toBe('SP');
  });
});
