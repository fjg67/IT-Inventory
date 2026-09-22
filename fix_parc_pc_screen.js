const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'ParcPCScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import PCParcFAB
content = content.replace(
  "import { CAParcPCHeroCard } from '@/components/parcpc/CAParcPCHeroCard';",
  "import { CAParcPCHeroCard } from '@/components/parcpc/CAParcPCHeroCard';\nimport { PCParcFAB } from '@/components/parcpc/PCParcFAB';"
);

// 2. Update styles.stickyControls
content = content.replace(
  "backgroundColor: CA_THEME.lightGray,",
  "backgroundColor: 'rgba(247, 248, 250, 0.93)',"
);

// 3. Render PCParcFAB at the end
const fabComponent = `
      <PCParcFAB 
        onAddPC={() => console.log('Add PC')}
        onBulkScan={() => console.log('Bulk Scan')}
        onExport={onExportSentCsv}
      />
    </View>
  );
};
`;

content = content.replace(
  "    </View>\n  );\n};\n",
  fabComponent
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('ParcPCScreen.tsx patched successfully');
