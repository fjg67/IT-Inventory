const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'src', 'components', 'add-pc');
const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dirPath, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if file uses CA_THEME
  if (content.includes('CA_THEME')) {
    // Check if it already imports it
    const importStatement = "import { CA_THEME } from '@/constants/caTheme';";
    if (!content.includes("import { CA_THEME }") && !content.includes("import {CA_THEME}")) {
      // Find the last import
      const lines = content.split('\n');
      let lastImportIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          lastImportIdx = i;
        }
      }
      
      if (lastImportIdx !== -1) {
        lines.splice(lastImportIdx + 1, 0, importStatement);
        content = lines.join('\n');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Added import to ${file}`);
      }
    }
  }
}
