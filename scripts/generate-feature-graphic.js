/**
 * Generate Play Store Feature Graphic (1024x500)
 * Run: node scripts/generate-feature-graphic.js
 */

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const WIDTH = 1024;
const HEIGHT = 500;

async function generate() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // ─── Background gradient (dark theme) ───
  const bgGrad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bgGrad.addColorStop(0, '#06090F');
  bgGrad.addColorStop(0.4, '#0E1520');
  bgGrad.addColorStop(1, '#131D2E');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ─── Subtle geometric shapes in background ───
  // Circle glow top-right
  const glowGrad1 = ctx.createRadialGradient(820, 80, 0, 820, 80, 250);
  glowGrad1.addColorStop(0, 'rgba(99,102,241,0.15)');
  glowGrad1.addColorStop(1, 'rgba(99,102,241,0)');
  ctx.fillStyle = glowGrad1;
  ctx.fillRect(570, 0, 454, 330);

  // Circle glow bottom-left
  const glowGrad2 = ctx.createRadialGradient(200, 420, 0, 200, 420, 220);
  glowGrad2.addColorStop(0, 'rgba(59,130,246,0.12)');
  glowGrad2.addColorStop(1, 'rgba(59,130,246,0)');
  ctx.fillStyle = glowGrad2;
  ctx.fillRect(0, 200, 420, 300);

  // ─── Subtle grid pattern ───
  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 1;
  for (let x = 0; x < WIDTH; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  // ─── Accent line top ───
  const lineGrad = ctx.createLinearGradient(0, 0, WIDTH, 0);
  lineGrad.addColorStop(0, 'rgba(99,102,241,0)');
  lineGrad.addColorStop(0.3, 'rgba(99,102,241,0.8)');
  lineGrad.addColorStop(0.7, 'rgba(59,130,246,0.8)');
  lineGrad.addColorStop(1, 'rgba(59,130,246,0)');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(0, 0, WIDTH, 3);

  // ─── Logo ───
  const logoPath = path.join(__dirname, '..', 'src', 'assets', 'images', 'logo.png');
  let logoX = 80;
  let logoY = 155;
  let logoSize = 90;
  
  try {
    const logo = await loadImage(logoPath);
    // Draw logo with rounded background
    const logoBgSize = logoSize + 20;
    const logoBgX = logoX - 10;
    const logoBgY = logoY - 10;
    
    // Logo glow
    const logoGlow = ctx.createRadialGradient(
      logoX + logoSize/2, logoY + logoSize/2, logoSize/4,
      logoX + logoSize/2, logoY + logoSize/2, logoSize
    );
    logoGlow.addColorStop(0, 'rgba(99,102,241,0.2)');
    logoGlow.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.fillStyle = logoGlow;
    ctx.beginPath();
    ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize, 0, Math.PI * 2);
    ctx.fill();

    // Rounded rect behind logo
    const r = 20;
    ctx.fillStyle = 'rgba(99,102,241,0.12)';
    ctx.strokeStyle = 'rgba(99,102,241,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(logoBgX + r, logoBgY);
    ctx.lineTo(logoBgX + logoBgSize - r, logoBgY);
    ctx.arcTo(logoBgX + logoBgSize, logoBgY, logoBgX + logoBgSize, logoBgY + r, r);
    ctx.lineTo(logoBgX + logoBgSize, logoBgY + logoBgSize - r);
    ctx.arcTo(logoBgX + logoBgSize, logoBgY + logoBgSize, logoBgX + logoBgSize - r, logoBgY + logoBgSize, r);
    ctx.lineTo(logoBgX + r, logoBgY + logoBgSize);
    ctx.arcTo(logoBgX, logoBgY + logoBgSize, logoBgX, logoBgY + logoBgSize - r, r);
    ctx.lineTo(logoBgX, logoBgY + r);
    ctx.arcTo(logoBgX, logoBgY, logoBgX + r, logoBgY, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
  } catch (e) {
    // If logo not loadable, draw a placeholder icon
    ctx.fillStyle = 'rgba(99,102,241,0.15)';
    ctx.beginPath();
    ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#6366F1';
    ctx.font = 'bold 50px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IT', logoX + logoSize/2, logoY + logoSize/2);
  }

  // ─── App name ───
  const textX = logoX + logoSize + 40;
  const textY = 175;

  ctx.fillStyle = '#EEF2FF';
  ctx.font = 'bold 52px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('IT Inventory', textX, textY);

  // ─── Tagline ───
  ctx.fillStyle = '#94A3B8';
  ctx.font = '24px Arial, Helvetica, sans-serif';
  ctx.fillText('Gestion de stock IT intelligente', textX, textY + 65);

  // ─── Feature pills on the right side ───
  const features = [
    { icon: '📷', text: 'Scan codes-barres', color: '#6366F1' },
    { icon: '📊', text: 'Tableau de bord', color: '#3B82F6' },
    { icon: '🔄', text: 'Mouvements & transferts', color: '#8B5CF6' },
    { icon: '⚠️', text: 'Alertes de stock', color: '#F59E0B' },
    { icon: '🏢', text: 'Multi-sites', color: '#10B981' },
    { icon: '📶', text: 'Mode hors-ligne', color: '#EC4899' },
  ];

  const pillStartX = 560;
  const pillStartY = 90;
  const pillW = 210;
  const pillH = 52;
  const pillGap = 16;
  const pillCols = 2;

  features.forEach((feat, i) => {
    const col = i % pillCols;
    const row = Math.floor(i / pillCols);
    const px = pillStartX + col * (pillW + pillGap);
    const py = pillStartY + row * (pillH + pillGap);

    // Pill background
    const pillR = 14;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.strokeStyle = feat.color + '40';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px + pillR, py);
    ctx.lineTo(px + pillW - pillR, py);
    ctx.arcTo(px + pillW, py, px + pillW, py + pillR, pillR);
    ctx.lineTo(px + pillW, py + pillH - pillR);
    ctx.arcTo(px + pillW, py + pillH, px + pillW - pillR, py + pillH, pillR);
    ctx.lineTo(px + pillR, py + pillH);
    ctx.arcTo(px, py + pillH, px, py + pillH - pillR, pillR);
    ctx.lineTo(px, py + pillR);
    ctx.arcTo(px, py, px + pillR, py, pillR);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Left accent bar
    ctx.fillStyle = feat.color;
    ctx.beginPath();
    ctx.moveTo(px + pillR, py);
    ctx.lineTo(px + pillR, py);
    ctx.arcTo(px, py, px, py + pillR, pillR);
    ctx.lineTo(px, py + pillH - pillR);
    ctx.arcTo(px, py + pillH, px + pillR, py + pillH, pillR);
    ctx.lineTo(px + 4, py + pillH);
    ctx.lineTo(px + 4, py);
    ctx.closePath();
    ctx.fill();

    // Icon
    ctx.font = '20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(feat.icon, px + 16, py + pillH / 2);

    // Text
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '15px Arial, Helvetica, sans-serif';
    ctx.fillText(feat.text, px + 44, py + pillH / 2 + 1);
  });

  // ─── Bottom accent bar ───
  const bottomGrad = ctx.createLinearGradient(0, HEIGHT - 3, WIDTH, HEIGHT - 3);
  bottomGrad.addColorStop(0, 'rgba(99,102,241,0)');
  bottomGrad.addColorStop(0.3, 'rgba(99,102,241,0.6)');
  bottomGrad.addColorStop(0.7, 'rgba(59,130,246,0.6)');
  bottomGrad.addColorStop(1, 'rgba(59,130,246,0)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, HEIGHT - 3, WIDTH, 3);

  // ─── Bottom tagline ───
  ctx.fillStyle = 'rgba(148,163,184,0.5)';
  ctx.font = '14px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Scan • Stock • Alertes • Multi-sites • Hors-ligne', WIDTH / 2, HEIGHT - 18);

  // ─── Save ───
  const outputDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'play-store');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, 'feature-graphic.png');
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Feature graphic generated: ${outputPath}`);
  console.log(`   Size: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(1)} KB)`);
  console.log(`   Dimensions: ${WIDTH}x${HEIGHT}px`);
}

generate().catch(err => {
  console.error('Error generating feature graphic:', err);
  process.exit(1);
});
