const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'ParcPCScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /\s*\) : null\}\r?\n\s*<\/View>\r?\n\s*\);\r?\n\s*\};/;

const replacementStr = `
      ) : null}

      <PCParcFAB 
        onAddPC={() => navigation.navigate('Articles', { screen: 'AddPC' })}
        onBulkScan={() => console.log('Bulk Scan non implemente')}
        onExport={onExportSentCsv}
      />
    </View>
  );
};`;

if (regex.test(content)) {
  content = content.replace(regex, replacementStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('ParcPCScreen.tsx patched successfully with regex');
} else {
  console.log('Regex did not match!');
}
