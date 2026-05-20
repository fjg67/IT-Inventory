const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const MASTER_IMAGE = path.join(ROOT, 'src', 'assets', 'icon-master.svg');
const ADAPTIVE_BG_COLOR = '#0D1F12';

const outputs = [
  // PWA/Web
  { size: 512, out: 'src/assets/icon-512.png' },
  { size: 192, out: 'src/assets/icon-192.png' },

  // Android launcher
  { size: 48, out: 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png' },
  { size: 72, out: 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png' },
  { size: 96, out: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png' },
  { size: 144, out: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png' },
  { size: 192, out: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png' },

  // iOS AppIcon.appiconset (existing filenames used by Contents.json)
  { size: 40, out: 'ios/StockProApp/Images.xcassets/AppIcon.appiconset/icon-40.png' },
  { size: 58, out: 'ios/StockProApp/Images.xcassets/AppIcon.appiconset/icon-58.png' },
  { size: 60, out: 'ios/StockProApp/Images.xcassets/AppIcon.appiconset/icon-60.png' },
  { size: 80, out: 'ios/StockProApp/Images.xcassets/AppIcon.appiconset/icon-80.png' },
  { size: 87, out: 'ios/StockProApp/Images.xcassets/AppIcon.appiconset/icon-87.png' },
  { size: 120, out: 'ios/StockProApp/Images.xcassets/AppIcon.appiconset/icon-120.png' },
  { size: 180, out: 'ios/StockProApp/Images.xcassets/AppIcon.appiconset/icon-180.png' },
  { size: 1024, out: 'ios/StockProApp/Images.xcassets/AppIcon.appiconset/icon-1024.png' },

  // iOS additional requested names
  { size: 120, out: 'ios/StockProApp/Images.xcassets/AppIcon.appiconset/Icon-60@2x.png' },
  { size: 180, out: 'ios/StockProApp/Images.xcassets/AppIcon.appiconset/Icon-60@3x.png' },
  { size: 152, out: 'ios/StockProApp/Images.xcassets/AppIcon.appiconset/Icon-76@2x.png' },
  { size: 1024, out: 'ios/StockProApp/Images.xcassets/AppIcon.appiconset/Icon-1024.png' },
];

const roundOutputs = [
  { size: 48, out: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png' },
  { size: 72, out: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png' },
  { size: 96, out: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png' },
  { size: 144, out: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png' },
  { size: 192, out: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png' },
];

const adaptiveOutputs = [
  { size: 48, out: 'android/app/src/main/res/mipmap-mdpi' },
  { size: 72, out: 'android/app/src/main/res/mipmap-hdpi' },
  { size: 96, out: 'android/app/src/main/res/mipmap-xhdpi' },
  { size: 144, out: 'android/app/src/main/res/mipmap-xxhdpi' },
  { size: 192, out: 'android/app/src/main/res/mipmap-xxxhdpi' },
];

async function ensureDir(filePath) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
}

async function renderPng(imageBuffer, size, outPath) {
  const absPath = path.join(ROOT, outPath);
  await ensureDir(absPath);
  await sharp(imageBuffer)
    .resize(size, size)
    .png()
    .toFile(absPath);
  console.log(`OK ${size}x${size} ${outPath}`);
}

async function renderRoundPng(imageBuffer, size, outPath) {
  const absPath = path.join(ROOT, outPath);
  await ensureDir(absPath);

  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/>` +
    '</svg>'
  );

  await sharp(imageBuffer)
    .resize(size, size)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toFile(absPath);

  console.log(`OK round ${size}x${size} ${outPath}`);
}

async function renderMaskable(imageBuffer) {
  const outPath = path.join(ROOT, 'src/assets/icon-maskable-512.png');
  await ensureDir(outPath);

  const padded = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: ADAPTIVE_BG_COLOR,
    },
  })
    .composite([
      {
        input: await sharp(imageBuffer).resize(410, 410).png().toBuffer(),
        left: 51,
        top: 51,
      },
    ])
    .png()
    .toBuffer();

  await sharp(padded).png().toFile(outPath);
  console.log('OK 512x512 src/assets/icon-maskable-512.png');
}

async function renderAdaptiveLayers(imageBuffer, size, outDir) {
  const absDir = path.join(ROOT, outDir);
  await fs.promises.mkdir(absDir, { recursive: true });

  const bgPath = path.join(absDir, 'ic_launcher_background.png');
  const fgPath = path.join(absDir, 'ic_launcher_foreground.png');
  const monoPath = path.join(absDir, 'ic_launcher_monochrome.png');

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: ADAPTIVE_BG_COLOR,
    },
  })
    .png()
    .toFile(bgPath);

  const logoSize = Math.round(size * 0.65);
  const offset = Math.round((size - logoSize) / 2);
  const foregroundBuffer = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(imageBuffer).resize(logoSize, logoSize).png().toBuffer(),
        left: offset,
        top: offset,
      },
    ])
    .png()
    .toBuffer();

  await sharp(foregroundBuffer).png().toFile(fgPath);
  await sharp(foregroundBuffer).png().toFile(monoPath);

  console.log(`OK adaptive ${size}x${size} ${outDir}`);
}

async function main() {
  if (!fs.existsSync(MASTER_IMAGE)) {
    throw new Error(`Master image not found: ${MASTER_IMAGE}`);
  }

  const imageBuffer = await fs.promises.readFile(MASTER_IMAGE);

  for (const target of outputs) {
    await renderPng(imageBuffer, target.size, target.out);
  }

  for (const target of roundOutputs) {
    await renderRoundPng(imageBuffer, target.size, target.out);
  }

  for (const target of adaptiveOutputs) {
    await renderAdaptiveLayers(imageBuffer, target.size, target.out);
  }

  await renderMaskable(imageBuffer);

  console.log('Done generating icons.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
