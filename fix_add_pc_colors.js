const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'AddPCScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Import CA_THEME
if (!content.includes("CA_THEME")) {
  content = content.replace(
    "import { OBSIDIAN_COLORS } from '@/constants/colors';",
    "import { OBSIDIAN_COLORS } from '@/constants/colors';\nimport { CA_THEME } from '@/constants/caTheme';"
  );
}

// Replace container bg
content = content.replace(
  "backgroundColor: OBSIDIAN_COLORS.bg_primary,",
  "backgroundColor: CA_THEME.lightGray,"
);

// Replace hardcoded colors in styles
content = content.replace(/color: '#1A1A1A'/g, "color: CA_THEME.textPrimary");
content = content.replace(/color: '#5A5A55'/g, "color: CA_THEME.textSecondary");
content = content.replace(/backgroundColor: '#FFFFFF'/g, "backgroundColor: CA_THEME.white");
content = content.replace(/color: '#EF4444'/g, "color: CA_THEME.danger");
content = content.replace(/borderColor: 'rgba\(0,125,112,0.16\)'/g, "borderColor: CA_THEME.greenBg2");
content = content.replace(/borderColor: 'rgba\(0,125,112,0.24\)'/g, "borderColor: CA_THEME.greenBg2");

// Also apply font family
content = content.replace(/fontWeight: '800'/g, "fontWeight: '800',\n    fontFamily: CA_THEME.fontFamilyBold");
content = content.replace(/fontWeight: '700'/g, "fontWeight: '700',\n    fontFamily: CA_THEME.fontFamilyBold");
content = content.replace(/fontWeight: '500'/g, "fontWeight: '500',\n    fontFamily: CA_THEME.fontFamilyMedium");

fs.writeFileSync(filePath, content, 'utf8');
console.log('AddPCScreen.tsx patched successfully');
