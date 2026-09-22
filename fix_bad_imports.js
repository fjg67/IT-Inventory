const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'src', 'components', 'add-pc');
const files = [
  'AddPCAssetInput.tsx',
  'AddPCFooter.tsx',
  'AddPCHero.tsx',
  'AddPCHostnameInput.tsx',
  'AddPCModelSelector.tsx',
  'AddPCProgressBar.tsx',
  'AddPCSubmitButton.tsx',
  'PCSuccessActions.tsx',
  'PCSuccessCard.tsx',
  'PCSuccessOverlay.tsx',
  'PCSuccessParticles.tsx',
  'PanneDetailsPanel.tsx'
];

for (const file of files) {
  const filePath = path.join(dirPath, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove all instances of the import
  const importStatement = "import { CA_THEME } from '@/constants/caTheme';\n";
  const importStatementNoNewline = "import { CA_THEME } from '@/constants/caTheme';";
  
  content = content.replace(importStatement, "");
  content = content.replace(importStatementNoNewline + "\n", "");
  content = content.replace(importStatementNoNewline, "");

  // Prepend at the top (after React import)
  content = content.replace("import React", "import { CA_THEME } from '@/constants/caTheme';\nimport React");
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
}
