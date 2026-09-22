const fs = require('fs');
const path = require('path');

const dirs = ['./src'];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      // 1. All variations of the Obsidian Dark Background / Cards
      // #0A0F0D (done mostly, but let's be sure), #101915, #111B17, #111A14, #16231A
      content = content.replace(/#101915/ig, '#FFFFFF');
      content = content.replace(/#111B17/ig, '#FFFFFF');
      content = content.replace(/#111A14/ig, '#FFFFFF');
      content = content.replace(/#16231A/ig, '#FFFFFF');

      // 2. All variations of the light text colors designed for Obsidian Background
      // #EAF5EF, #ECF8F1, #DDEBE5, #CAD7D3, #F0FDF4, #ECFDF5, #F8FAFC
      // Wait, #FFFFFF is also sometimes used. We must only target these specific "Obsidian Light" hexes
      content = content.replace(/#EAF5EF/ig, '#1A1A1A');
      content = content.replace(/#ECF8F1/ig, '#1A1A1A');
      content = content.replace(/#DDEBE5/ig, '#1A1A1A');
      content = content.replace(/#CAD7D3/ig, '#1A1A1A');
      // #F0FDF4 is used as text_primary in OBSIDIAN_COLORS
      content = content.replace(/#F0FDF4/ig, '#1A1A1A');

      // 3. All variations of muted text colors designed for Obsidian
      // #8EA09A, #8CA09A, #8FA39C, #86EFAC, #6B7280 (tailwind gray 500), #94A3B8
      content = content.replace(/#8EA09A/ig, '#5A5A55');
      content = content.replace(/#8CA09A/ig, '#5A5A55');
      content = content.replace(/#8FA39C/ig, '#5A5A55');
      content = content.replace(/#86EFAC/ig, '#5A5A55');
      ccontent = content.replace(/#94A3B8/ig, '#5A5A55');

      // 4. White text that might be hardcoded as #FFF or #FFFFFF but ONLY in contexts where it should be dark
      // Note: #FFFFFF is standard, replacing it globally might break icons or buttons that have a colored background!
      // So I won't globally replace #FFFFFF.

      // 5. Borders
      // rgba(148,163,184,0.2) or 0.24 etc.
      // We can just regex replace rgba(148,163,184,x) -> rgba(0,125,112,x)
      content = content.replace(/rgba\(148,\s*163,\s*184,\s*([0-9.]+)\)/ig, 'rgba(0,125,112,$1)');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

dirs.forEach(processDir);
console.log('Hex colors fixed globally');
