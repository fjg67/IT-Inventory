/**
 * Generate Play Store Feature Graphic (1024x500)
 * Obsidian Showcase design.
 * Run: node scripts/generate-feature-graphic.js
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const WIDTH = 1024;
const HEIGHT = 500;

const C = {
  bg: '#0A0F0D',
  greenPrimary: '#1B8A3E',
  greenLight: '#22C55E',
  greenSoft: '#86EFAC',
  textPrimary: '#F0FDF4',
  textMuted: '#6B7280',
  card: '#111A14',
  cardElevated: '#16231A',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawGrid(ctx) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = 'rgba(34,197,94,0.025)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  const glowTR = ctx.createRadialGradient(950, 20, 20, 950, 20, 260);
  glowTR.addColorStop(0, 'rgba(27,138,62,0.12)');
  glowTR.addColorStop(0.5, 'rgba(27,138,62,0.08)');
  glowTR.addColorStop(1, 'rgba(27,138,62,0)');
  ctx.fillStyle = glowTR;
  ctx.fillRect(620, -80, 460, 360);

  const glowBL = ctx.createRadialGradient(30, 520, 10, 30, 520, 200);
  glowBL.addColorStop(0, 'rgba(34,197,94,0.07)');
  glowBL.addColorStop(1, 'rgba(34,197,94,0)');
  ctx.fillStyle = glowBL;
  ctx.fillRect(-80, 280, 320, 260);
}

function drawVerticalSeparator(ctx) {
  const x = 410;
  const y1 = 40;
  const y2 = 460;
  const grad = ctx.createLinearGradient(x, y1, x, y2);
  grad.addColorStop(0, 'rgba(34,197,94,0)');
  grad.addColorStop(0.5, 'rgba(34,197,94,0.38)');
  grad.addColorStop(1, 'rgba(34,197,94,0)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.stroke();
}

function drawLogo(ctx) {
  const x = 60;
  const y = 140;
  const size = 72;

  ctx.save();
  ctx.shadowColor = C.greenLight;
  ctx.shadowBlur = 16;
  const g = ctx.createLinearGradient(x, y, x + size, y + size);
  g.addColorStop(0, C.greenPrimary);
  g.addColorStop(1, '#0D5C26');
  ctx.fillStyle = g;
  roundRect(ctx, x, y, size, size, 16);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(34,197,94,0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, size, size, 16);
  ctx.stroke();

  const ix = x + 16;
  const iy = y + 15;

  ctx.fillStyle = '#22C55E';
  roundRect(ctx, ix + 0, iy + 32, 40, 12, 3);
  ctx.fill();

  ctx.fillStyle = 'rgba(34,197,94,0.72)';
  roundRect(ctx, ix + 4, iy + 20, 32, 10, 3);
  ctx.fill();

  ctx.fillStyle = 'rgba(34,197,94,0.45)';
  roundRect(ctx, ix + 8, iy + 9, 24, 9, 3);
  ctx.fill();

  ctx.strokeStyle = C.greenSoft;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ix + 20, iy + 7);
  ctx.lineTo(ix + 20, iy + 47);
  ctx.stroke();
}

function drawLeftText(ctx) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  ctx.fillStyle = C.textPrimary;
  ctx.font = '900 52px Arial';
  ctx.fillText('IT-Inventory', 60, 250);

  ctx.fillStyle = C.textMuted;
  ctx.font = '400 18px Arial';
  ctx.fillText('Gestion de stock IT intelligente', 60, 305);

  const sep = ctx.createLinearGradient(60, 0, 180, 0);
  sep.addColorStop(0, C.greenLight);
  sep.addColorStop(1, 'rgba(34,197,94,0)');
  ctx.fillStyle = sep;
  ctx.fillRect(60, 330, 120, 1);

  ctx.fillStyle = 'rgba(134,239,172,0.60)';
  ctx.font = '500 13px Arial';
  ctx.fillText('SCAN · STOCK · ALERTES · MULTI-SITES · HORS-LIGNE', 60, 360);
}

function drawFeatureIcon(ctx, x, y, type, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (type === 'qr') {
    ctx.strokeRect(x + 1, y + 1, 6, 6);
    ctx.strokeRect(x + 11, y + 1, 6, 6);
    ctx.strokeRect(x + 1, y + 11, 6, 6);
    ctx.fillRect(x + 11, y + 11, 2.5, 2.5);
    ctx.fillRect(x + 15, y + 11, 2.5, 2.5);
    ctx.fillRect(x + 11, y + 15, 2.5, 2.5);
  } else if (type === 'chart') {
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 16);
    ctx.lineTo(x + 2, y + 8);
    ctx.moveTo(x + 7, y + 16);
    ctx.lineTo(x + 7, y + 4);
    ctx.moveTo(x + 12, y + 16);
    ctx.lineTo(x + 12, y + 10);
    ctx.moveTo(x + 17, y + 16);
    ctx.lineTo(x + 17, y + 2);
    ctx.stroke();
  } else if (type === 'arrows') {
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 6);
    ctx.lineTo(x + 16, y + 6);
    ctx.lineTo(x + 13, y + 3);
    ctx.moveTo(x + 16, y + 12);
    ctx.lineTo(x + 2, y + 12);
    ctx.lineTo(x + 5, y + 15);
    ctx.stroke();
  } else if (type === 'bell') {
    ctx.beginPath();
    ctx.arc(x + 9, y + 8, 5, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 8);
    ctx.lineTo(x + 4, y + 13);
    ctx.lineTo(x + 14, y + 13);
    ctx.lineTo(x + 14, y + 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 9, y + 15.5, 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'building') {
    ctx.strokeRect(x + 2, y + 3, 14, 13);
    ctx.strokeRect(x + 6, y + 7, 2, 2);
    ctx.strokeRect(x + 10, y + 7, 2, 2);
    ctx.strokeRect(x + 6, y + 11, 2, 2);
    ctx.strokeRect(x + 10, y + 11, 2, 2);
  } else if (type === 'wifiOff') {
    ctx.beginPath();
    ctx.arc(x + 9, y + 11, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 3);
    ctx.lineTo(x + 16, y + 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 9, y + 10, 6, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
}

function drawFeatureBadge(ctx, item, x, y, w, h) {
  const r = 14;
  ctx.fillStyle = C.card;
  ctx.strokeStyle = 'rgba(34,197,94,0.15)';
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.fillStyle = item.accent;
  ctx.globalAlpha = 0.8;
  ctx.fillRect(x, y, 3, h);
  ctx.restore();
  ctx.globalAlpha = 1;

  ctx.fillStyle = item.iconBg;
  ctx.strokeStyle = item.iconBorder;
  ctx.lineWidth = 1;
  roundRect(ctx, x + 16, y + 27, 36, 36, 18);
  ctx.fill();
  ctx.stroke();

  drawFeatureIcon(ctx, x + 25, y + 36, item.icon, item.accent);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = C.textPrimary;
  ctx.font = '600 14px Arial';
  ctx.fillText(item.label, x + 64, y + 28);

  ctx.fillStyle = C.textMuted;
  ctx.font = '12px Arial';
  ctx.fillText(item.sub, x + 64, y + 50);
}

function drawRightFeatures(ctx) {
  const features = [
    {
      label: 'Scan codes-barres',
      sub: 'TC22 · Zebra · Caméra',
      accent: '#22C55E',
      iconBg: 'rgba(34,197,94,0.15)',
      iconBorder: 'rgba(34,197,94,0.3)',
      icon: 'qr',
    },
    {
      label: 'Tableau de bord',
      sub: 'Stats · Graphiques · Temps réel',
      accent: '#3B82F6',
      iconBg: 'rgba(59,130,246,0.15)',
      iconBorder: 'rgba(59,130,246,0.3)',
      icon: 'chart',
    },
    {
      label: 'Mouvements & transferts',
      sub: 'Entrées · Sorties · Ajustements',
      accent: '#8B5CF6',
      iconBg: 'rgba(139,92,246,0.15)',
      iconBorder: 'rgba(139,92,246,0.3)',
      icon: 'arrows',
    },
    {
      label: 'Alertes de stock',
      sub: 'Seuils · Notifications push',
      accent: '#F59E0B',
      iconBg: 'rgba(245,158,11,0.15)',
      iconBorder: 'rgba(245,158,11,0.3)',
      icon: 'bell',
    },
    {
      label: 'Multi-sites',
      sub: 'Siège · Agences · Inventaires',
      accent: '#22C55E',
      iconBg: 'rgba(34,197,94,0.15)',
      iconBorder: 'rgba(34,197,94,0.3)',
      icon: 'building',
    },
    {
      label: 'Mode hors-ligne',
      sub: 'Sync auto · Données locales',
      accent: '#6B7280',
      iconBg: 'rgba(107,114,128,0.15)',
      iconBorder: 'rgba(107,114,128,0.3)',
      icon: 'wifiOff',
    },
  ];

  const colX = [440, 710];
  const rowY = [80, 195, 310];
  const w = 250;
  const h = 90;

  let i = 0;
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      drawFeatureBadge(ctx, features[i], colX[col], rowY[row], w, h);
      i += 1;
    }
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveOutputs(buffer) {
  const outputs = [
    path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'play-store', 'feature-graphic.png'),
    path.join(__dirname, '..', 'src', 'assets', 'images', 'feature-graphic.png'),
    path.join(__dirname, '..', 'src', 'assets', 'images', 'feature-graphic-1024x500.png'),
  ];

  outputs.forEach((outputPath) => {
    ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, buffer);
    console.log(`OK ${outputPath}`);
  });
}

async function generate() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  drawGrid(ctx);
  drawVerticalSeparator(ctx);
  drawLogo(ctx);
  drawLeftText(ctx);
  drawRightFeatures(ctx);

  const buffer = canvas.toBuffer('image/png');
  saveOutputs(buffer);

  console.log(`Done feature graphic ${WIDTH}x${HEIGHT} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

generate().catch((err) => {
  console.error('Error generating feature graphic:', err);
  process.exit(1);
});
