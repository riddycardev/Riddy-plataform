/**
 * generateRiddyCard — Geração de cartão 9:16 via Canvas 2D API puro
 * Sem html2canvas, sem dependências externas — funciona em iOS/Android mobile
 * Dimensões: 810×1440px (9:16 para Instagram Stories)
 */

export interface CardData {
  userName: string;
  context: "rider" | "host";
  levelName: string;
  levelSubtitle: string;
  levelNumber: number;
  levelColor: string;
  levelEmoji: string;
  progressPercent: number;
  nextLevelName?: string;
  scoreToNext?: number;
  stats: { label: string; value: string }[];
  phrase: string;
  unlockedAchievements?: number;
}

// Arredonda retângulo no canvas
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Converte hex para rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export async function generateRiddyCard(data: CardData): Promise<string> {
  const W = 810;
  const H = 1440;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const color = data.levelColor;
  const firstName = data.userName.split(" ")[0] || data.userName;

  // ── BACKGROUND ──────────────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#020A14");
  bgGrad.addColorStop(0.5, "#0A0F1C");
  bgGrad.addColorStop(1, "#020A14");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── RADIAL GLOWS ────────────────────────────────────────────────────────────
  const glow1 = ctx.createRadialGradient(W * 0.8, H * 0.1, 0, W * 0.8, H * 0.1, W * 0.6);
  glow1.addColorStop(0, hexToRgba(color, 0.22));
  glow1.addColorStop(1, "transparent");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W * 0.2, H * 0.85, 0, W * 0.2, H * 0.85, W * 0.5);
  glow2.addColorStop(0, hexToRgba(color, 0.14));
  glow2.addColorStop(1, "transparent");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // ── GRID PATTERN ────────────────────────────────────────────────────────────
  ctx.strokeStyle = hexToRgba(color, 0.05);
  ctx.lineWidth = 1;
  const gridSize = 60;
  for (let x = 0; x < W; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // ── TOP GLOW LINE ────────────────────────────────────────────────────────────
  const topLine = ctx.createLinearGradient(W * 0.1, 0, W * 0.9, 0);
  topLine.addColorStop(0, "transparent");
  topLine.addColorStop(0.5, color);
  topLine.addColorStop(1, "transparent");
  ctx.strokeStyle = topLine;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(W * 0.1, 2);
  ctx.lineTo(W * 0.9, 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── HEADER: RIDDY LOGO ───────────────────────────────────────────────────────
  const logoX = 56;
  const logoY = 64;
  const logoSize = 64;

  // Logo box
  roundRect(ctx, logoX, logoY, logoSize, logoSize, 18);
  const logoGrad = ctx.createLinearGradient(logoX, logoY, logoX + logoSize, logoY + logoSize);
  logoGrad.addColorStop(0, hexToRgba(color, 0.55));
  logoGrad.addColorStop(1, hexToRgba(color, 0.25));
  ctx.fillStyle = logoGrad;
  ctx.fill();
  ctx.strokeStyle = hexToRgba(color, 0.5);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // "R" letter
  ctx.fillStyle = color;
  ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("R", logoX + logoSize / 2, logoY + logoSize / 2);

  // RIDDY text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 30px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = "3px";
  ctx.fillText("RIDDY", logoX + logoSize + 18, logoY + 36);

  ctx.fillStyle = hexToRgba(color, 0.8);
  ctx.font = "500 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("RANKS", logoX + logoSize + 18, logoY + 58);

  // Context badge (right side)
  const badgeText = data.context === "rider" ? "LOCATÁRIO" : "ANFITRIÃO";
  const badgeW = 190;
  const badgeH = 44;
  const badgeX = W - 56 - badgeW;
  const badgeY = logoY + 10;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 22);
  ctx.fillStyle = hexToRgba(color, 0.12);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(color, 0.35);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);

  // ── LEVEL HERO ───────────────────────────────────────────────────────────────
  const heroY = 200;

  // Big emoji circle
  const emojiR = 100;
  const emojiCX = W / 2;
  const emojiCY = heroY + emojiR;

  // Glow behind emoji
  const emojiGlow = ctx.createRadialGradient(emojiCX, emojiCY, 0, emojiCX, emojiCY, emojiR * 1.8);
  emojiGlow.addColorStop(0, hexToRgba(color, 0.3));
  emojiGlow.addColorStop(1, "transparent");
  ctx.fillStyle = emojiGlow;
  ctx.fillRect(emojiCX - emojiR * 2, emojiCY - emojiR * 2, emojiR * 4, emojiR * 4);

  // Emoji box
  roundRect(ctx, emojiCX - emojiR, emojiCY - emojiR, emojiR * 2, emojiR * 2, 40);
  const emojiBoxGrad = ctx.createLinearGradient(
    emojiCX - emojiR,
    emojiCY - emojiR,
    emojiCX + emojiR,
    emojiCY + emojiR
  );
  emojiBoxGrad.addColorStop(0, hexToRgba(color, 0.25));
  emojiBoxGrad.addColorStop(1, hexToRgba(color, 0.08));
  ctx.fillStyle = emojiBoxGrad;
  ctx.fill();
  ctx.strokeStyle = hexToRgba(color, 0.4);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Emoji
  ctx.font = "90px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.levelEmoji, emojiCX, emojiCY + 4);

  // User first name
  ctx.fillStyle = hexToRgba(color, 0.9);
  ctx.font = "600 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(firstName.toUpperCase(), W / 2, heroY + emojiR * 2 + 52);

  // Level name
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 64px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(data.levelName, W / 2, heroY + emojiR * 2 + 120);

  // Level badge
  const lvlBadgeText = `NÍVEL ${data.levelNumber}  •  ${data.levelSubtitle}`;
  const lvlBadgeW = 500;
  const lvlBadgeH = 44;
  const lvlBadgeX = (W - lvlBadgeW) / 2;
  const lvlBadgeY = heroY + emojiR * 2 + 136;
  roundRect(ctx, lvlBadgeX, lvlBadgeY, lvlBadgeW, lvlBadgeH, 22);
  ctx.fillStyle = hexToRgba(color, 0.15);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(color, 0.3);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = hexToRgba(color, 0.9);
  ctx.font = "500 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(lvlBadgeText, W / 2, lvlBadgeY + lvlBadgeH / 2);

  // ── PROGRESS BAR ─────────────────────────────────────────────────────────────
  const progressY = heroY + emojiR * 2 + 220;
  const progressW = W - 112;
  const progressX = 56;
  const progressH = 16;

  // Label
  ctx.fillStyle = hexToRgba("#FFFFFF", 0.55);
  ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(
    data.nextLevelName ? `Para ${data.nextLevelName}` : "Nível máximo",
    progressX,
    progressY - 12
  );

  ctx.fillStyle = hexToRgba(color, 0.9);
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(data.progressPercent)}%`, progressX + progressW, progressY - 12);

  // Track
  roundRect(ctx, progressX, progressY, progressW, progressH, progressH / 2);
  ctx.fillStyle = hexToRgba("#FFFFFF", 0.08);
  ctx.fill();

  // Fill
  const fillW = Math.max(progressH, (data.progressPercent / 100) * progressW);
  roundRect(ctx, progressX, progressY, fillW, progressH, progressH / 2);
  const progressGrad = ctx.createLinearGradient(progressX, 0, progressX + fillW, 0);
  progressGrad.addColorStop(0, hexToRgba(color, 0.7));
  progressGrad.addColorStop(1, color);
  ctx.fillStyle = progressGrad;
  ctx.fill();

  // Score to next
  if (data.scoreToNext && data.scoreToNext > 0) {
    ctx.fillStyle = hexToRgba("#FFFFFF", 0.4);
    ctx.font = "400 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`${data.scoreToNext} pts para o próximo nível`, W / 2, progressY + progressH + 32);
  }

  // ── STATS GRID ───────────────────────────────────────────────────────────────
  const statsY = progressY + progressH + 80;
  const statW = (progressW - 32) / 3;

  data.stats.forEach((stat, i) => {
    const sx = progressX + i * (statW + 16);
    const sy = statsY;

    // Card
    roundRect(ctx, sx, sy, statW, 110, 16);
    ctx.fillStyle = hexToRgba("#FFFFFF", 0.04);
    ctx.fill();
    ctx.strokeStyle = hexToRgba("#FFFFFF", 0.08);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Value
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(stat.value, sx + statW / 2, sy + 58);

    // Label
    ctx.fillStyle = hexToRgba("#FFFFFF", 0.45);
    ctx.font = "400 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(stat.label, sx + statW / 2, sy + 86);
  });

  // ── PHRASE ───────────────────────────────────────────────────────────────────
  const phraseY = statsY + 140;
  const phraseMaxW = progressW;

  // Quote mark
  ctx.fillStyle = hexToRgba(color, 0.3);
  ctx.font = "bold 80px serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText('"', progressX, phraseY + 20);

  // Phrase text (word wrap)
  ctx.fillStyle = hexToRgba("#FFFFFF", 0.65);
  ctx.font = "italic 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const words = data.phrase.split(" ");
  let line = "";
  let lineY = phraseY + 30;
  const lineHeight = 34;
  for (const word of words) {
    const testLine = line + word + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > phraseMaxW - 40 && line !== "") {
      ctx.fillText(line.trim(), progressX + 40, lineY);
      line = word + " ";
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line.trim(), progressX + 40, lineY);

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  const footerY = H - 100;

  // Divider line
  const divLine = ctx.createLinearGradient(progressX, 0, progressX + progressW, 0);
  divLine.addColorStop(0, "transparent");
  divLine.addColorStop(0.5, hexToRgba("#FFFFFF", 0.12));
  divLine.addColorStop(1, "transparent");
  ctx.strokeStyle = divLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(progressX, footerY - 20);
  ctx.lineTo(progressX + progressW, footerY - 20);
  ctx.stroke();

  // Footer: emoji + name + url
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = hexToRgba(color, 0.9);
  ctx.fillText(data.levelEmoji, W / 2 - 100, footerY + 10);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(data.levelName, W / 2, footerY + 10);

  ctx.fillStyle = hexToRgba("#FFFFFF", 0.35);
  ctx.font = "400 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("riddycar.com", W / 2, footerY + 44);

  // ── BOTTOM GLOW LINE ─────────────────────────────────────────────────────────
  const bottomLine = ctx.createLinearGradient(W * 0.1, 0, W * 0.9, 0);
  bottomLine.addColorStop(0, "transparent");
  bottomLine.addColorStop(0.5, hexToRgba(color, 0.6));
  bottomLine.addColorStop(1, "transparent");
  ctx.strokeStyle = bottomLine;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(W * 0.1, H - 2);
  ctx.lineTo(W * 0.9, H - 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  return canvas.toDataURL("image/png");
}
