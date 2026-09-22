const fs = require('fs');
const file = 'src/screens/StockMap/StockMapScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

let newContent = '';
let i = 0;
while (i < content.length) {
    let match = content.substr(i).match(/<View style=\{\[styles\.zone([^\]]*),\s*highlightBarcode === '([^']+)' && styles\.zoneHighlighted\]\}>/);
    if (!match) {
        newContent += content.substr(i);
        break;
    }
    
    let before = content.substr(i, match.index);
    newContent += before;
    
    let replacement = `<PulseZone isHighlighted={highlightBarcode === '${match[2]}'} style={[styles.zone${match[1]}]}>`;
    newContent += replacement;
    
    i += match.index + match[0].length;
    
    // Now find the matching </View>
    let depth = 1;
    while (depth > 0 && i < content.length) {
        let nextOpen = content.indexOf('<View', i);
        let nextClose = content.indexOf('</View>', i);
        
        if (nextClose === -1) break; // error
        
        if (nextOpen !== -1 && nextOpen < nextClose) {
            depth++;
            newContent += content.substring(i, nextOpen + 5);
            i = nextOpen + 5;
        } else {
            depth--;
            if (depth === 0) {
                newContent += content.substring(i, nextClose);
                newContent += '</PulseZone>';
                i = nextClose + 7;
            } else {
                newContent += content.substring(i, nextClose + 7);
                i = nextClose + 7;
            }
        }
    }
}
fs.writeFileSync(file, newContent);
console.log('Patched correctly');
