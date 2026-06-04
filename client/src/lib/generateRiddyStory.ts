/**
 * RIDDY Stories Engine — Canvas 2D API
 * 6 formatos cinematográficos premium para Instagram Stories (1080×1920px)
 *
 * Referências: Apple · Spotify Wrapped · Porsche · Uber Black · Nubank Ultravioleta
 *
 * FILOSOFIA:
 * — Cada Story é uma PEÇA PUBLICITÁRIA da marca RIDDY
 * — Foto de carro real ocupa 100% da tela (sem moldura, sem card)
 * — Tipografia massiva, poucos elementos, muito impacto
 * — ZERO aparência de dashboard, relatório ou print de sistema
 * — O usuário deve sentir ORGULHO ao compartilhar
 */

// ─── DIMENSÕES ───────────────────────────────────────────────────────────────
const W = 1080;
const H = 1920;

// ─── PALETA RIDDY ────────────────────────────────────────────────────────────
const CYAN    = "#00D4FF";
const BLUE    = "#0066FF";
const DARK    = "#020A14";
const WHITE   = "#FFFFFF";
const W70     = "rgba(255,255,255,0.70)";
const W50     = "rgba(255,255,255,0.50)";
const W30     = "rgba(255,255,255,0.30)";
const W10     = "rgba(255,255,255,0.10)";

// ─── IMAGENS ─────────────────────────────────────────────────────────────────
// Cada formato tem sua própria imagem de carro para identidade visual única
const IMG = {
  welcome:     "/manus-storage/car-blue-night_0c7080d8.jpg",
  firstRental: "/manus-storage/car-sunset_f8d1bad3.jpg",
  levelUp:     "/manus-storage/car-city-lights_badcb2b2.jpg",
  kmMilestone: "/manus-storage/road-milkyway_53e6998d.jpg",
  motivational:"/manus-storage/car-city-blue_fe8d6026.jpg",
  explorer:    "/manus-storage/car-blue-night_0c7080d8.jpg",
};

// ─── TIPOS ───────────────────────────────────────────────────────────────────
export type StoryType =
  | "welcome"
  | "first_rental"
  | "level_up"
  | "km_milestone"
  | "motivational"
  | "explorer";

export interface StoryData {
  type: StoryType;
  userName: string;
  levelName?: string;
  levelColor?: string;
  newLevelName?: string;
  km?: number;
  nextGoal?: string;
}

// ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(new Image());
    img.src = src;
  });
}

/** Cobre o canvas com a imagem, centralizada e sem distorção (object-fit: cover) */
function coverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x = 0, y = 0, w = W, h = H
) {
  if (!img.width || !img.height) return;
  const scale = Math.max(w / img.width, h / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
}

/** Texto com quebra automática de linha */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (const word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > maxWidth && line !== "") {
      ctx.fillText(line.trim(), x, currentY);
      line = word + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

/** Logo RIDDY — "R RIDDY" no topo */
function drawLogo(
  ctx: CanvasRenderingContext2D,
  x = 72, y = 112,
  style: "white" | "cyan" = "white"
) {
  const r = 34;
  // Círculo gradiente
  const cg = ctx.createRadialGradient(x, y, 0, x, y, r);
  cg.addColorStop(0, CYAN);
  cg.addColorStop(1, BLUE);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = cg;
  ctx.fill();

  // "R"
  ctx.fillStyle = DARK;
  ctx.font = "bold 34px 'Arial Black', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("R", x, y + 1);

  // "RIDDY"
  ctx.fillStyle = style === "cyan" ? CYAN : WHITE;
  ctx.font = "bold 38px 'Arial Black', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "6px";
  ctx.fillText("RIDDY", x + r + 14, y);
  ctx.letterSpacing = "0px";
}

/** Rodapé minimalista */
function drawFooter(
  ctx: CanvasRenderingContext2D,
  tagline = "LIBERDADE PARA IR. SEGURANÇA PARA FICAR.",
  url = "riddycar.com"
) {
  const y = H - 88;

  ctx.fillStyle = W30;
  ctx.font = "500 24px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "3px";
  ctx.fillText(tagline, W / 2, y);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = CYAN;
  ctx.font = "500 26px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(url, W / 2, y + 44);
}

/** Avatar com iniciais — círculo com borda */
function drawAvatar(
  ctx: CanvasRenderingContext2D,
  name: string,
  cx: number, cy: number,
  r = 52,
  borderColor = CYAN
) {
  ctx.beginPath();
  ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill();

  const initials = name.trim().split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase() ?? "").join("");
  ctx.fillStyle = WHITE;
  ctx.font = `bold ${Math.round(r * 0.72)}px 'Arial Black', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, cx, cy + 1);
}

/** Linha decorativa com gradiente */
function accentLine(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  width = 120,
  color = CYAN
) {
  const g = ctx.createLinearGradient(x, 0, x + width, 0);
  g.addColorStop(0, color);
  g.addColorStop(1, "transparent");
  ctx.strokeStyle = g;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();
}

/** Glow radial suave */
function glow(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  color: string, alpha = 0.22
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Partículas decorativas */
function particles(
  ctx: CanvasRenderingContext2D,
  count: number, color: string, seed = 1
) {
  const rng = (n: number) => Math.abs(Math.sin(n * seed * 127.1 + 43758.5453) % 1);
  for (let i = 0; i < count; i++) {
    const x = rng(i * 3) * W;
    const y = rng(i * 3 + 1) * H;
    const r = rng(i * 3 + 2) * 4 + 0.6;
    const a = rng(i * 3 + 0.5) * 0.5 + 0.06;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATO 1: BEM-VINDO À RIDDY
// Referência: foto de Audi/Lamborghini azul noturno, "BEM-VINDO À RIDDY" em
// tipografia massiva, "Sua jornada começou.", avatar + nome + nível no rodapé
// ─────────────────────────────────────────────────────────────────────────────
async function drawWelcome(ctx: CanvasRenderingContext2D, d: StoryData) {
  const img = await loadImage(IMG.welcome);

  // Foto de carro cobre 100% da tela
  coverImage(ctx, img);

  // Overlay cinematográfico — escurece da esquerda e de baixo
  const vL = ctx.createLinearGradient(0, 0, W * 0.6, 0);
  vL.addColorStop(0, "rgba(2,10,20,0.82)");
  vL.addColorStop(1, "rgba(2,10,20,0)");
  ctx.fillStyle = vL;
  ctx.fillRect(0, 0, W, H);

  const vB = ctx.createLinearGradient(0, H * 0.45, 0, H);
  vB.addColorStop(0, "rgba(2,10,20,0)");
  vB.addColorStop(0.55, "rgba(2,10,20,0.88)");
  vB.addColorStop(1, "rgba(2,10,20,0.98)");
  ctx.fillStyle = vB;
  ctx.fillRect(0, 0, W, H);

  drawLogo(ctx);

  // Linha decorativa azul
  accentLine(ctx, 72, 1040, 160, CYAN);

  // "BEM-VINDO À" — letras espalhadas
  ctx.fillStyle = W70;
  ctx.font = "600 52px 'Arial', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.letterSpacing = "10px";
  ctx.fillText("BEM-VINDO À", 72, 1068);
  ctx.letterSpacing = "0px";

  // "RIDDY" — tipografia massiva com gradiente cyan→branco
  const tg = ctx.createLinearGradient(72, 1200, 900, 1200);
  tg.addColorStop(0, WHITE);
  tg.addColorStop(0.4, CYAN);
  tg.addColorStop(1, BLUE);
  ctx.fillStyle = tg;
  ctx.font = "900 220px 'Arial Black', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.shadowColor = CYAN;
  ctx.shadowBlur = 60;
  ctx.fillText("RIDDY", 60, 1120);
  ctx.shadowBlur = 0;

  // "Sua jornada começou."
  ctx.fillStyle = W50;
  ctx.font = "400 46px 'Arial', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Sua jornada começou.", 74, 1390);

  // Separador
  ctx.strokeStyle = W10;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 1490);
  ctx.lineTo(W - 72, 1490);
  ctx.stroke();

  // Avatar + nome + nível
  drawAvatar(ctx, d.userName, 128, 1580, 52);

  ctx.fillStyle = WHITE;
  ctx.font = "bold 46px 'Arial Black', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(d.userName.toUpperCase(), 208, 1568);

  ctx.fillStyle = d.levelColor ?? CYAN;
  ctx.font = "500 30px 'Arial', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "2px";
  ctx.fillText((d.levelName ?? "EXPLORER").toUpperCase() + "  ✦", 208, 1616);
  ctx.letterSpacing = "0px";

  drawFooter(ctx);
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATO 2: PRIMEIRA LOCAÇÃO CONCLUÍDA
// Referência: carro ao pôr do sol, troféu dourado, "PRIMEIRA LOCAÇÃO CONCLUÍDA",
// "Você deu o primeiro passo.", avatar + próximo objetivo
// ─────────────────────────────────────────────────────────────────────────────
async function drawFirstRental(ctx: CanvasRenderingContext2D, d: StoryData) {
  const img = await loadImage(IMG.firstRental);
  coverImage(ctx, img);

  // Overlay top-bottom — preserva o carro no meio
  const vT = ctx.createLinearGradient(0, 0, 0, H * 0.38);
  vT.addColorStop(0, "rgba(2,10,20,0.92)");
  vT.addColorStop(1, "rgba(2,10,20,0)");
  ctx.fillStyle = vT;
  ctx.fillRect(0, 0, W, H);

  const vB = ctx.createLinearGradient(0, H * 0.55, 0, H);
  vB.addColorStop(0, "rgba(2,10,20,0)");
  vB.addColorStop(0.5, "rgba(2,10,20,0.88)");
  vB.addColorStop(1, "rgba(2,10,20,0.98)");
  ctx.fillStyle = vB;
  ctx.fillRect(0, 0, W, H);

  drawLogo(ctx);

  // Ícone troféu com glow dourado
  const GOLD = "#FFB800";
  glow(ctx, W / 2, 820, 200, GOLD, 0.20);

  ctx.beginPath();
  ctx.arc(W / 2, 820, 80, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,184,0,0.08)";
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = "88px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🏆", W / 2, 824);

  // "PRIMEIRA" — branco
  ctx.fillStyle = WHITE;
  ctx.font = "900 108px 'Arial Black', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("PRIMEIRA", W / 2, 980);

  // "LOCAÇÃO" — gradiente cyan
  const tg = ctx.createLinearGradient(0, 1100, W, 1100);
  tg.addColorStop(0, CYAN);
  tg.addColorStop(1, BLUE);
  ctx.fillStyle = tg;
  ctx.shadowColor = CYAN;
  ctx.shadowBlur = 30;
  ctx.fillText("LOCAÇÃO", W / 2, 1090);
  ctx.shadowBlur = 0;

  // "CONCLUÍDA!" — branco
  ctx.fillStyle = W70;
  ctx.fillText("CONCLUÍDA!", W / 2, 1200);

  // Subtítulo
  ctx.fillStyle = W50;
  ctx.font = "400 44px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "2px";
  ctx.fillText("VOCÊ DEU O PRIMEIRO PASSO.", W / 2, 1360);
  ctx.letterSpacing = "0px";

  // Separador
  ctx.strokeStyle = W10;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 1460);
  ctx.lineTo(W - 72, 1460);
  ctx.stroke();

  // Avatar + nome + nível
  drawAvatar(ctx, d.userName, W / 2, 1555, 52);

  ctx.fillStyle = WHITE;
  ctx.font = "bold 46px 'Arial Black', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(d.userName.toUpperCase(), W / 2, 1635);

  ctx.fillStyle = d.levelColor ?? CYAN;
  ctx.font = "500 30px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "2px";
  ctx.fillText((d.levelName ?? "EXPLORER").toUpperCase(), W / 2, 1695);
  ctx.letterSpacing = "0px";

  // Próximo objetivo
  if (d.nextGoal) {
    ctx.fillStyle = W30;
    ctx.font = "400 26px 'Arial', sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "3px";
    ctx.fillText("PRÓXIMO OBJETIVO:", W / 2, 1762);
    ctx.letterSpacing = "0px";

    ctx.fillStyle = CYAN;
    ctx.font = "bold 34px 'Arial Black', Arial, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(d.nextGoal.toUpperCase(), W / 2, 1800);
    ctx.letterSpacing = "0px";
  }

  drawFooter(ctx, "RIDDY");
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATO 3: NOVO NÍVEL DESBLOQUEADO
// Referência: carro noturno com luzes, hexágono com estrela, "NOVO NÍVEL
// DESBLOQUEADO", nome do nível em destaque máximo, "VOCÊ AGORA É ROAD RIDER"
// ─────────────────────────────────────────────────────────────────────────────
async function drawLevelUp(ctx: CanvasRenderingContext2D, d: StoryData) {
  const img = await loadImage(IMG.levelUp);
  coverImage(ctx, img);

  // Overlay escuro com glow colorido do nível
  ctx.fillStyle = "rgba(2,10,20,0.75)";
  ctx.fillRect(0, 0, W, H);

  const lvlColor = d.levelColor ?? CYAN;
  particles(ctx, 60, lvlColor, 17);
  glow(ctx, W / 2, H * 0.40, 480, lvlColor, 0.22);

  drawLogo(ctx);

  // Hexágono com estrela
  const hcx = W / 2, hcy = 660, hr = 110;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = hcx + hr * Math.cos(a);
    const py = hcy + hr * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = lvlColor;
  ctx.lineWidth = 3;
  ctx.shadowColor = lvlColor;
  ctx.shadowBlur = 24;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = `${lvlColor}14`;
  ctx.fill();

  ctx.font = "100px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⭐", hcx, hcy + 4);

  // "NOVO NÍVEL"
  ctx.fillStyle = W70;
  ctx.font = "600 52px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.letterSpacing = "12px";
  ctx.fillText("NOVO NÍVEL", W / 2, 840);
  ctx.letterSpacing = "0px";

  // "DESBLOQUEADO"
  ctx.fillStyle = WHITE;
  ctx.font = "900 86px 'Arial Black', Arial, sans-serif";
  ctx.fillText("DESBLOQUEADO", W / 2, 910);

  // Nome do nível — destaque máximo
  const newLvl = (d.newLevelName ?? d.levelName ?? "Road Rider").toUpperCase();
  const ng = ctx.createLinearGradient(0, 1080, W, 1080);
  ng.addColorStop(0, lvlColor);
  ng.addColorStop(0.5, WHITE);
  ng.addColorStop(1, lvlColor);
  ctx.fillStyle = ng;
  const fs = newLvl.length > 12 ? 88 : newLvl.length > 8 ? 108 : 130;
  ctx.font = `900 ${fs}px 'Arial Black', Arial, sans-serif`;
  ctx.shadowColor = lvlColor;
  ctx.shadowBlur = 55;
  ctx.fillText(newLvl, W / 2, 1050);
  ctx.shadowBlur = 0;

  // "Parabéns, [nome]!"
  ctx.fillStyle = W70;
  ctx.font = "400 46px 'Arial', sans-serif";
  ctx.fillText(`Parabéns, ${d.userName}!`, W / 2, 1270);

  // Separador
  ctx.strokeStyle = W10;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 1370);
  ctx.lineTo(W - 72, 1370);
  ctx.stroke();

  // Badge "VOCÊ AGORA É [NÍVEL]"
  ctx.fillStyle = W30;
  ctx.font = "400 28px 'Arial', sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("VOCÊ AGORA É", W / 2, 1420);
  ctx.letterSpacing = "0px";

  // Pill com nome do nível
  ctx.font = "bold 32px 'Arial Black', Arial, sans-serif";
  const tw = ctx.measureText(newLvl).width;
  const bw = tw + 64, bh = 60, bx = W / 2 - bw / 2, by = 1480;
  ctx.shadowColor = lvlColor;
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, bh / 2);
  ctx.fillStyle = `${lvlColor}20`;
  ctx.fill();
  ctx.strokeStyle = lvlColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = lvlColor;
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "3px";
  ctx.fillText(newLvl, W / 2, by + bh / 2);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = W30;
  ctx.font = "400 32px 'Arial', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("Continue explorando.", W / 2, 1600);
  ctx.fillText("Novos destinos te esperam.", W / 2, 1648);

  drawFooter(ctx);
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATO 4: MARCO DE QUILOMETRAGEM
// Referência: estrada com Via Láctea, número de km em 270px com glow cyan,
// "KM RODADOS", "O mundo é grande demais para ficar parado."
// ─────────────────────────────────────────────────────────────────────────────
async function drawKmMilestone(ctx: CanvasRenderingContext2D, d: StoryData) {
  const img = await loadImage(IMG.kmMilestone);
  coverImage(ctx, img);

  ctx.fillStyle = "rgba(2,10,20,0.58)";
  ctx.fillRect(0, 0, W, H);

  const vB = ctx.createLinearGradient(0, H * 0.5, 0, H);
  vB.addColorStop(0, "rgba(2,10,20,0)");
  vB.addColorStop(1, "rgba(2,10,20,0.96)");
  ctx.fillStyle = vB;
  ctx.fillRect(0, 0, W, H);

  glow(ctx, W / 2, H * 0.68, 560, CYAN, 0.16);

  drawLogo(ctx);

  // "VOCÊ PERCORREU"
  ctx.fillStyle = W50;
  ctx.font = "500 48px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.letterSpacing = "10px";
  ctx.fillText("VOCÊ PERCORREU", W / 2, 760);
  ctx.letterSpacing = "0px";

  // Número KM — massivo
  const km = d.km ?? 1000;
  const kmStr = km.toLocaleString("pt-BR");
  const ng = ctx.createLinearGradient(0, 900, W, 900);
  ng.addColorStop(0, CYAN);
  ng.addColorStop(0.5, WHITE);
  ng.addColorStop(1, BLUE);
  ctx.fillStyle = ng;
  ctx.shadowColor = CYAN;
  ctx.shadowBlur = 80;
  const kmFs = kmStr.length > 6 ? 160 : kmStr.length > 4 ? 200 : kmStr.length > 2 ? 250 : 270;
  ctx.font = `900 ${kmFs}px 'Arial Black', Arial, sans-serif`;
  ctx.fillText(kmStr, W / 2, 830);
  ctx.shadowBlur = 0;

  // "KM"
  ctx.fillStyle = CYAN;
  ctx.font = "900 110px 'Arial Black', Arial, sans-serif";
  ctx.letterSpacing = "18px";
  ctx.fillText("KM", W / 2, 1090);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = W70;
  ctx.font = "400 44px 'Arial', sans-serif";
  ctx.fillText("rodados na RIDDY.", W / 2, 1240);

  // Separador
  ctx.strokeStyle = W10;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 1350);
  ctx.lineTo(W - 72, 1350);
  ctx.stroke();

  // Avatar + nome + nível
  drawAvatar(ctx, d.userName, W / 2, 1450, 52);

  ctx.fillStyle = WHITE;
  ctx.font = "bold 46px 'Arial Black', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(d.userName.toUpperCase(), W / 2, 1530);

  ctx.fillStyle = d.levelColor ?? CYAN;
  ctx.font = "500 30px 'Arial', sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText((d.levelName ?? "EXPLORER").toUpperCase() + "  ✦", W / 2, 1590);
  ctx.letterSpacing = "0px";

  // Frase motivacional
  ctx.fillStyle = W30;
  ctx.font = "italic 34px 'Arial', sans-serif";
  ctx.fillText('"O mundo é grande demais para ficar parado."', W / 2, 1680);

  drawFooter(ctx);
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATO 5: MOTIVACIONAL — "QUAL SERÁ SEU PRÓXIMO DESTINO?"
// Referência: carro azul na cidade, pergunta em tipografia massiva, avatar
// ─────────────────────────────────────────────────────────────────────────────
async function drawMotivational(ctx: CanvasRenderingContext2D, d: StoryData) {
  const img = await loadImage(IMG.motivational);
  coverImage(ctx, img);

  // Overlay suave — preserva o carro
  ctx.fillStyle = "rgba(2,10,20,0.52)";
  ctx.fillRect(0, 0, W, H);

  const vB = ctx.createLinearGradient(0, H * 0.48, 0, H);
  vB.addColorStop(0, "rgba(2,10,20,0)");
  vB.addColorStop(1, "rgba(2,10,20,0.95)");
  ctx.fillStyle = vB;
  ctx.fillRect(0, 0, W, H);

  drawLogo(ctx);

  // Ano
  ctx.fillStyle = CYAN;
  ctx.font = "500 44px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.letterSpacing = "14px";
  ctx.fillText(new Date().getFullYear().toString(), W / 2, 840);
  ctx.letterSpacing = "0px";

  // "QUAL SERÁ"
  ctx.fillStyle = WHITE;
  ctx.font = "900 108px 'Arial Black', Arial, sans-serif";
  ctx.fillText("QUAL SERÁ", W / 2, 920);

  // "SEU PRÓXIMO"
  ctx.fillText("SEU PRÓXIMO", W / 2, 1038);

  // "DESTINO?" — gradiente cyan
  const dg = ctx.createLinearGradient(0, 1160, W, 1160);
  dg.addColorStop(0, CYAN);
  dg.addColorStop(1, BLUE);
  ctx.fillStyle = dg;
  ctx.shadowColor = CYAN;
  ctx.shadowBlur = 40;
  ctx.fillText("DESTINO?", W / 2, 1156);
  ctx.shadowBlur = 0;

  // Linha decorativa central
  const lg = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
  lg.addColorStop(0, "transparent");
  lg.addColorStop(0.5, CYAN);
  lg.addColorStop(1, "transparent");
  ctx.strokeStyle = lg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 200, 1310);
  ctx.lineTo(W / 2 + 200, 1310);
  ctx.stroke();

  // Separador
  ctx.strokeStyle = W10;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 1440);
  ctx.lineTo(W - 72, 1440);
  ctx.stroke();

  // Avatar + nome + nível + "MEMBRO RIDDY"
  drawAvatar(ctx, d.userName, W / 2, 1540, 52);

  ctx.fillStyle = WHITE;
  ctx.font = "bold 46px 'Arial Black', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(d.userName.toUpperCase(), W / 2, 1622);

  ctx.fillStyle = d.levelColor ?? CYAN;
  ctx.font = "500 30px 'Arial', sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText((d.levelName ?? "EXPLORER").toUpperCase() + "  ✦", W / 2, 1680);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = W30;
  ctx.font = "400 26px 'Arial', sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("MEMBRO RIDDY", W / 2, 1730);
  ctx.letterSpacing = "0px";

  // Frase
  ctx.fillStyle = W30;
  ctx.font = "italic 32px 'Arial', sans-serif";
  ctx.fillText('"O mundo é grande demais para ficar parado."', W / 2, 1800);

  drawFooter(ctx, "RIDDY", "riddycar.com");
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATO 6: WELCOME EXPLORER — "EXPLORER / [NOME]"
// Referência: logo RIDDY grande no centro, nome do nível em tipografia massiva,
// "VOCÊ ACABA DE ENTRAR PARA UMA NOVA FORMA DE USAR CARROS.",
// 3 pilares: SEGURANÇA · CONFIANÇA · EXPERIÊNCIA
// ─────────────────────────────────────────────────────────────────────────────
async function drawExplorer(ctx: CanvasRenderingContext2D, d: StoryData) {
  // Fundo sólido escuro — sem foto (como o mockup de referência)
  ctx.fillStyle = DARK;
  ctx.fillRect(0, 0, W, H);

  // Glow sutil no centro
  glow(ctx, W / 2, H * 0.45, 600, BLUE, 0.18);
  glow(ctx, W / 2, H * 0.45, 300, CYAN, 0.10);

  // Logo RIDDY — centro, grande
  const logoR = 60;
  const logoCX = W / 2;
  const logoCY = 560;

  const cg = ctx.createRadialGradient(logoCX, logoCY, 0, logoCX, logoCY, logoR);
  cg.addColorStop(0, CYAN);
  cg.addColorStop(1, BLUE);
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, logoR, 0, Math.PI * 2);
  ctx.fillStyle = cg;
  ctx.fill();

  ctx.fillStyle = DARK;
  ctx.font = "bold 60px 'Arial Black', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("R", logoCX, logoCY + 1);

  ctx.fillStyle = WHITE;
  ctx.font = "bold 72px 'Arial Black', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.letterSpacing = "10px";
  ctx.fillText("RIDDY", W / 2, 648);
  ctx.letterSpacing = "0px";

  // Nome do nível — massivo
  const lvl = (d.levelName ?? "EXPLORER").toUpperCase();
  const lvlColor = d.levelColor ?? CYAN;
  const lvlFs = lvl.length > 10 ? 110 : lvl.length > 7 ? 140 : 170;
  const lvlG = ctx.createLinearGradient(0, 820, W, 820);
  lvlG.addColorStop(0, CYAN);
  lvlG.addColorStop(0.5, WHITE);
  lvlG.addColorStop(1, BLUE);
  ctx.fillStyle = lvlG;
  ctx.font = `900 ${lvlFs}px 'Arial Black', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.shadowColor = lvlColor;
  ctx.shadowBlur = 50;
  ctx.fillText(lvl, W / 2, 790);
  ctx.shadowBlur = 0;

  // Nome do usuário
  ctx.fillStyle = W70;
  ctx.font = "400 52px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(d.userName.toUpperCase(), W / 2, 1020);

  // Separador
  const sg = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
  sg.addColorStop(0, "transparent");
  sg.addColorStop(0.5, W30);
  sg.addColorStop(1, "transparent");
  ctx.strokeStyle = sg;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 200, 1120);
  ctx.lineTo(W / 2 + 200, 1120);
  ctx.stroke();

  // Texto principal
  ctx.fillStyle = W50;
  ctx.font = "400 40px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  wrapText(ctx, "VOCÊ ACABA DE ENTRAR PARA UMA NOVA FORMA DE USAR CARROS.", W / 2, 1160, 860, 56);

  // 3 pilares
  const pillars = [
    { icon: "🛡️", label: "SEGURANÇA" },
    { icon: "⭐", label: "CONFIANÇA" },
    { icon: "💎", label: "EXPERIÊNCIA" },
  ];
  const pillarY = 1440;
  const pillarSpacing = W / 3;
  for (let i = 0; i < pillars.length; i++) {
    const px = pillarSpacing * i + pillarSpacing / 2;

    ctx.font = "52px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pillars[i].icon, px, pillarY);

    ctx.fillStyle = W50;
    ctx.font = "500 24px 'Arial', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.letterSpacing = "3px";
    ctx.fillText(pillars[i].label, px, pillarY + 40);
    ctx.letterSpacing = "0px";
  }

  // Separador
  ctx.strokeStyle = W10;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 1560);
  ctx.lineTo(W - 72, 1560);
  ctx.stroke();

  // Tagline
  ctx.fillStyle = W30;
  ctx.font = "400 32px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("LIBERDADE PARA IR.", W / 2, 1600);

  ctx.fillStyle = CYAN;
  ctx.font = "500 32px 'Arial', sans-serif";
  ctx.fillText("SEGURANÇA PARA FICAR.", W / 2, 1646);

  // Rodapé
  ctx.fillStyle = W30;
  ctx.font = "500 26px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("riddycar.com", W / 2, H - 72);
}

// ─── DISPATCHER ──────────────────────────────────────────────────────────────

export async function generateRiddyStory(data: StoryData): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Fundo base escuro
  ctx.fillStyle = DARK;
  ctx.fillRect(0, 0, W, H);

  switch (data.type) {
    case "welcome":      await drawWelcome(ctx, data);      break;
    case "first_rental": await drawFirstRental(ctx, data);  break;
    case "level_up":     await drawLevelUp(ctx, data);      break;
    case "km_milestone": await drawKmMilestone(ctx, data);  break;
    case "motivational": await drawMotivational(ctx, data); break;
    case "explorer":     await drawExplorer(ctx, data);     break;
    default:             await drawWelcome(ctx, data);
  }

  return canvas.toDataURL("image/png");
}
