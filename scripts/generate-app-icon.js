/**
 * Génère les icônes Android et iOS à partir de src/assets/images/logo.png
 * Usage: node scripts/generate-app-icon.js
 * Prérequis: npm install --save-dev jimp
 */

const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const LOGO_SRC = path.join(ROOT, 'src', 'assets', 'images', 'logo.png');

// Android: mipmap-densité -> taille en px
const ANDROID_SIZES = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// iOS: tailles requises pour AppIcon.appiconset
const IOS_SIZES = [40, 58, 60, 80, 87, 120, 180, 1024];
const IOS_APPICON_SET = path.join(ROOT, 'ios', 'StockProApp', 'Images.xcassets', 'AppIcon.appiconset');

async function main() {
  if (!fs.existsSync(LOGO_SRC)) {
    console.error('Fichier logo introuvable:', LOGO_SRC);
    process.exit(1);
  }

  let Jimp;
  try {
    Jimp = require('jimp');
  } catch (e) {
    console.error('Installez jimp: npm install --save-dev jimp');
    process.exit(1);
  }

  console.log('Lecture du logo...');
  const logo = await Jimp.read(LOGO_SRC);

  // Android
  const androidRes = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
  for (const { folder, size } of ANDROID_SIZES) {
    const dir = path.join(androidRes, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const resized = logo.clone().resize(size, size);
    await resized.writeAsync(path.join(dir, 'ic_launcher.png'));
    await resized.writeAsync(path.join(dir, 'ic_launcher_round.png'));
    console.log('Android', folder, size + 'x' + size);
  }

  // iOS
  if (!fs.existsSync(IOS_APPICON_SET)) fs.mkdirSync(IOS_APPICON_SET, { recursive: true });
  for (const size of IOS_SIZES) {
    const resized = logo.clone().resize(size, size);
    const filename = `icon-${size}.png`;
    await resized.writeAsync(path.join(IOS_APPICON_SET, filename));
    console.log('iOS', filename);
  }

  // Mise à jour Contents.json pour iOS
  const contentsJson = {
    images: [
      { idiom: 'iphone', scale: '2x', size: '20x20', filename: 'icon-40.png' },
      { idiom: 'iphone', scale: '3x', size: '20x20', filename: 'icon-60.png' },
      { idiom: 'iphone', scale: '2x', size: '29x29', filename: 'icon-58.png' },
      { idiom: 'iphone', scale: '3x', size: '29x29', filename: 'icon-87.png' },
      { idiom: 'iphone', scale: '2x', size: '40x40', filename: 'icon-80.png' },
      { idiom: 'iphone', scale: '3x', size: '40x40', filename: 'icon-120.png' },
      { idiom: 'iphone', scale: '2x', size: '60x60', filename: 'icon-120.png' },
      { idiom: 'iphone', scale: '3x', size: '60x60', filename: 'icon-180.png' },
      { idiom: 'ios-marketing', scale: '1x', size: '1024x1024', filename: 'icon-1024.png' },
    ],
    info: { author: 'xcode', version: 1 },
  };
  fs.writeFileSync(
    path.join(IOS_APPICON_SET, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2)
  );
  console.log('iOS Contents.json mis à jour.');

  console.log('Icônes générées avec succès.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
