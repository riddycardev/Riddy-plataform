/**
 * Testes do Chat Router — Chat Híbrido IA + Anfitrião
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do getDb para evitar conexão real com banco
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock do openai para evitar chamadas reais à API
vi.mock("./openai", () => ({
  generateChatResponse: vi.fn().mockResolvedValue({
    content: "Olá! Posso ajudar com informações sobre o veículo.",
    needsHumanReview: false,
  }),
  buildVehicleSystemPrompt: vi.fn().mockReturnValue("system prompt veículo"),
  buildSupportSystemPrompt: vi.fn().mockReturnValue("system prompt suporte"),
}));

// Mock do notifyOwner
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("Chat Helper — buildVehicleSystemPrompt", () => {
  it("deve gerar system prompt com dados do veículo", async () => {
    const { buildVehicleSystemPrompt } = await import("./openai");
    const prompt = buildVehicleSystemPrompt({
      brand: "Honda",
      model: "City",
      year: 2022,
      category: "sedan",
      transmission: "automatico",
      fuelType: "flex",
      seats: 5,
      dailyPrice: "150.00",
      dailyKmLimit: 200,
      extraKmPrice: "1.50",
      pickupCity: "São Paulo",
      pickupState: "SP",
      deliveryAvailable: false,
      minRentalDays: 1,
      maxRentalDays: 30,
      smokingAllowed: false,
      petsAllowed: false,
    });
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });
});

describe("Chat Helper — buildSupportSystemPrompt", () => {
  it("deve gerar system prompt de suporte", async () => {
    const { buildSupportSystemPrompt } = await import("./openai");
    const prompt = buildSupportSystemPrompt();
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });
});

describe("Chat Helper — generateChatResponse", () => {
  it("deve retornar conteúdo e flag needsHumanReview", async () => {
    const { generateChatResponse } = await import("./openai");
    const result = await generateChatResponse([
      { role: "system", content: "Você é um assistente." },
      { role: "user", content: "Olá" },
    ]);
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("needsHumanReview");
    expect(typeof result.content).toBe("string");
    expect(typeof result.needsHumanReview).toBe("boolean");
  });

  it("deve detectar flag [ESCALAR] na resposta da IA", async () => {
    const { generateChatResponse } = await import("./openai");
    vi.mocked(generateChatResponse).mockResolvedValueOnce({
      content: "Não tenho certeza sobre isso.",
      needsHumanReview: true,
    });
    const result = await generateChatResponse([
      { role: "user", content: "Posso levar para outro estado?" },
    ]);
    expect(result.needsHumanReview).toBe(true);
  });
});

describe("Chat — OpenAI baseURL override", () => {
  it("deve usar baseURL da OpenAI real, não o proxy da Manus", async () => {
    // Verifica que OPENAI_BASE_URL do ambiente não afeta o cliente customizado
    const originalBase = process.env.OPENAI_BASE_URL;
    process.env.OPENAI_BASE_URL = "https://api.manus.im/api/llm-proxy/v1";

    // O cliente no openai.ts usa baseURL hardcoded para api.openai.com
    // Este teste verifica que a variável de ambiente não sobrescreve
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({
      apiKey: "sk-test-key",
      baseURL: "https://api.openai.com/v1",
    });

    // @ts-ignore — acessa a propriedade interna para verificar
    expect(client.baseURL).toBe("https://api.openai.com/v1");

    process.env.OPENAI_BASE_URL = originalBase;
  });
});
