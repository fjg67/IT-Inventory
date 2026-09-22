const fs = require('fs');
const file = 'src/screens/StockMap/StockMapScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<View style=\{\[styles\.zone([^\]]*)\]\}>\s*<QuantityBadge barcode="([^"]+)"/g, (match, p1, p2) => {
    return `<View style={[styles.zone${p1}, highlightBarcode === '${p2}' && styles.zoneHighlighted]}>\n                  <QuantityBadge barcode="${p2}"`;
});

fs.writeFileSync(file, content);
