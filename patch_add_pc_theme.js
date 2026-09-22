const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'src', 'components', 'add-pc');
const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.tsx'));

const replacements = [
  { regex: /'#1A1A1A'/g, replace: 'CA_THEME.textPrimary' },
  { regex: /'#5A5A55'/g, replace: 'CA_THEME.textSecondary' },
  { regex: /'#888880'/g, replace: 'CA_THEME.textMuted' },
  { regex: /'#FFFFFF'/g, replace: 'CA_THEME.white' },
  { regex: /'#007D70'/g, replace: 'CA_THEME.green' },
  { regex: /'#006359'/g, replace: 'CA_THEME.greenDark' },
  { regex: /'#00A391'/g, replace: 'CA_THEME.greenLight' },
  { regex: /'rgba\(0,\s*125,\s*112,\s*0\.[1-9][0-9]*\)'/g, replace: 'CA_THEME.borderGray' },
];

for (const file of files) {
  const filePath = path.join(dirPath, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const { regex, replace } of replacements) {
    content = content.replace(regex, replace);
  }

  // If content changed and doesn't import CA_THEME, add it
  if (content !== originalContent && !content.includes('CA_THEME')) {
    // Find last import
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        lastImportIdx = i;
      }
    }
    
    if (lastImportIdx !== -1) {
      lines.splice(lastImportIdx + 1, 0, "import { CA_THEME } from '@/constants/caTheme';");
      content = lines.join('\n');
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Patched ${file}`);
}
