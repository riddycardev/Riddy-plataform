/**
 * Diagnóstico técnico da chave OpenAI
 * Não expõe a chave no log.
 * Não altera nenhum código do projeto.
 */

import { execSync } from "child_process";
import https from "https";

const KEY_ENV = "OPENAI_API_KEY";
const MODEL = "gpt-4o-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";

// 1. Verificar qual variável está sendo lida
const rawKey = process.env[KEY_ENV];
console.log("\n=== 1. Variável de ambiente ===");
console.log(`Nome da variável: ${KEY_ENV}`);
console.log(`Presente: ${!!rawKey}`);
if (rawKey) {
  const masked = rawKey.slice(0, 7) + "..." + rawKey.slice(-4);
  console.log(`Valor (mascarado): ${masked}`);
  console.log(`Comprimento: ${rawKey.length} caracteres`);
  console.log(`Prefixo esperado (sk-): ${rawKey.startsWith("sk-")}`);
  console.log(`Prefixo real: ${rawKey.slice(0, 3)}`);
} else {
  console.log("ERRO: Variável não encontrada no process.env");
}

// 2. Verificar se há hardcoded ou duplicatas no projeto
console.log("\n=== 2. Verificação de hardcoded/duplicatas ===");
try {
  const grepResult = execSync(
    `grep -r "sk-" /home/ubuntu/riddy-website/server --include="*.ts" --include="*.js" -l 2>/dev/null || echo "nenhum arquivo"`,
    { encoding: "utf8" }
  ).trim();
  console.log(`Arquivos com possível chave hardcoded: ${grepResult || "nenhum"}`);
} catch {
  console.log("Grep: nenhum arquivo com sk- hardcoded");
}

try {
  const envFiles = execSync(
    `find /home/ubuntu/riddy-website -name ".env*" -not -path "*/node_modules/*" 2>/dev/null`,
    { encoding: "utf8" }
  ).trim();
  console.log(`Arquivos .env encontrados: ${envFiles || "nenhum"}`);
  if (envFiles) {
    // Mostra apenas os nomes das variáveis, não os valores
    const keys = execSync(
      `grep -h "^[A-Z]" ${envFiles.split("\n").join(" ")} 2>/dev/null | cut -d= -f1 | sort | uniq`,
      { encoding: "utf8" }
    ).trim();
    console.log(`Variáveis nos .env (apenas nomes): ${keys || "nenhuma"}`);
  }
} catch {
  console.log("Nenhum arquivo .env encontrado");
}

// 3. Verificar como o backend lê a variável (env.ts)
console.log("\n=== 3. Como o backend lê OPENAI_API_KEY ===");
try {
  const envTs = execSync(
    `grep -n "OPENAI\|openai" /home/ubuntu/riddy-website/server/_core/env.ts 2>/dev/null || echo "não encontrado"`,
    { encoding: "utf8" }
  ).trim();
  console.log(`env.ts:\n${envTs}`);
} catch {
  console.log("env.ts não encontrado");
}

try {
  const llmTs = execSync(
    `grep -n "OPENAI\|openai\|apiKey\|api_key" /home/ubuntu/riddy-website/server/_core/llm.ts 2>/dev/null | head -20`,
    { encoding: "utf8" }
  ).trim();
  console.log(`llm.ts:\n${llmTs || "nenhuma referência"}`);
} catch {
  console.log("llm.ts não encontrado");
}

// 4. Teste de conexão real com a OpenAI (requisição mínima via https nativo)
console.log("\n=== 4. Teste de conexão com a OpenAI ===");
console.log(`Endpoint: ${ENDPOINT}`);
console.log(`Modelo: ${MODEL}`);
console.log(`Variável usada: ${KEY_ENV}`);

if (!rawKey) {
  console.log("ABORTADO: Chave não encontrada no process.env");
  process.exit(1);
}

const body = JSON.stringify({
  model: MODEL,
  messages: [{ role: "user", content: "ping" }],
  max_tokens: 3,
});

const options = {
  hostname: "api.openai.com",
  path: "/v1/chat/completions",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${rawKey}`,
    "Content-Length": Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log(`\nStatus HTTP: ${res.statusCode}`);
    console.log(`Headers relevantes: x-request-id=${res.headers["x-request-id"] ?? "n/a"}`);
    try {
      const parsed = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log("SUCESSO: Chave válida e funcionando!");
        console.log(`Modelo retornado: ${parsed.model}`);
        console.log(`Tokens usados: ${JSON.stringify(parsed.usage)}`);
      } else {
        console.log("ERRO da API:");
        console.log(`  type: ${parsed.error?.type}`);
        console.log(`  code: ${parsed.error?.code}`);
        console.log(`  message: ${parsed.error?.message}`);
        console.log(`  param: ${parsed.error?.param}`);
      }
    } catch {
      console.log("Resposta bruta (não-JSON):", data.slice(0, 300));
    }
  });
});

req.on("error", (e) => {
  console.log(`Erro de rede: ${e.message}`);
});

req.write(body);
req.end();
