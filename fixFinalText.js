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

      // Fix specific light text colors that are invisible on white background
      content = content.replace(/#F1F7F4/ig, '#1A1A1A'); // Text input color
      content = content.replace(/#FCA5A5/ig, '#DC2626'); // Error text color
      content = content.replace(/#647570/ig, '#888880'); // Placeholder text
      
      // Fix scan button background
      content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.5\)/ig, 'rgba(0,125,112,0.1)');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

dirs.forEach(processDir);
console.log('Fixed final invisible texts');
