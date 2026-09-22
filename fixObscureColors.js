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

      // Fix specific rgba backgrounds that were missed
      content = content.replace(/rgba\(10,\s*15,\s*13,\s*([0-9.]+)\)/ig, 'rgba(255,255,255,$1)');
      
      // Fix obscure button backgrounds and text colors used in AddPC components
      content = content.replace(/#2A3430/ig, '#F0F0F0'); // Disabled button background -> light gray
      content = content.replace(/#A9B7B2/ig, '#007D70'); // Cancel button text -> CA Teal
      content = content.replace(/#9AA8A4/ig, '#888880'); // Disabled button text -> Gray
      content = content.replace(/#101915/ig, '#FFFFFF'); // Double check #101915
      
      // Check if there are other similar obscure rgba's:
      // like rgba(17,26,20, ...)
      content = content.replace(/rgba\(17,\s*26,\s*20,\s*([0-9.]+)\)/ig, 'rgba(255,255,255,$1)');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

dirs.forEach(processDir);
console.log('Fixed missed rgba and disabled button colors');
