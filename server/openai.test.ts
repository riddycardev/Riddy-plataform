import { describe, it, expect } from "vitest";
import OpenAI from "openai";

describe("OpenAI API Key Validation", () => {
  it("deve conectar à API da OpenAI com sucesso usando baseURL direto", async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    expect(apiKey, "OPENAI_API_KEY não configurada").toBeTruthy();

    // Usa baseURL explícito para contornar o proxy da Manus (OPENAI_BASE_URL)
    const openai = new OpenAI({
      apiKey,
      baseURL: "https://api.openai.com/v1",
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Responda apenas: OK" }],
      max_tokens: 5,
    });

    expect(response.choices[0].message.content).toBeTruthy();
  }, 30000);
});
