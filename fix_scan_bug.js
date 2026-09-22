const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'Mouvements', 'ScanMouvementScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add scanTrigger state
content = content.replace(
  "const [article, setArticle] = useState<Article | null>(null);",
  "const [article, setArticle] = useState<Article | null>(null);\n  const [scanTrigger, setScanTrigger] = useState<{barcode: string, ts: number} | null>(null);"
);

// 2. Update onCodeScanned to set scanTrigger
content = content.replace(
  "dispatch(setBarcode(value));",
  "dispatch(setBarcode(value));\n        setScanTrigger({ barcode: value, ts: Date.now() });"
);

// 3. Update useEffect
const oldUseEffect = `  useEffect(() => {
    if (lastBarcode && siteActif) {
      searchArticle(lastBarcode).catch(() => {});
    }
  }, [lastBarcode, siteActif, searchArticle]);`;

const newUseEffect = `  useEffect(() => {
    if (scanTrigger && siteActif) {
      searchArticle(scanTrigger.barcode).catch(() => {});
    }
  }, [scanTrigger, siteActif, searchArticle]);`;

content = content.replace(oldUseEffect, newUseEffect);

// 4. Update useFocusEffect to clear scanTrigger
content = content.replace(
  "dispatch(clearLastBarcode());",
  "dispatch(clearLastBarcode());\n      setScanTrigger(null);"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('ScanMouvementScreen.tsx patched successfully');
