const fs = require('fs');
const file = 'src/screens/StockMap/StockMapScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace barcodeText props
content = content.replace(/<Text style=\{styles\.barcodeText\}>([^<]+)<\/Text>/g, '<Text style={styles.barcodeText} numberOfLines={1} adjustsFontSizeToFit>$1</Text>');

// Inject QuantityBadge
content = content.replace(/<View style=\{\[styles\.zone(.*?)\]\}>\s*<View style=\{styles\.barcodePill\}>\s*<Icon name="barcode" [^>]+ \/>\s*<Text style=\{styles\.barcodeText\}[^>]*>([^<]+)<\/Text>/g, (match, p1, p2) => {
    return `<View style={[styles.zone${p1}]}>
                  <QuantityBadge barcode="${p2}" qtyMap={stockByRef} />
                  <View style={styles.barcodePill}>
                    <Icon name="barcode" size={14} color={CA_THEME.textMuted} />
                    <Text style={styles.barcodeText} numberOfLines={1} adjustsFontSizeToFit>${p2}</Text>`;
});

fs.writeFileSync(file, content);
