const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'ParcPCScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add useNavigation if missing
if (!content.includes("import { useNavigation }")) {
  content = content.replace(
    "import { FlashList } from '@shopify/flash-list';",
    "import { FlashList } from '@shopify/flash-list';\nimport { useNavigation } from '@react-navigation/native';"
  );
}

// 2. Import PCParcFAB
if (!content.includes("PCParcFAB")) {
  content = content.replace(
    "import { CAParcPCHeroCard } from '@/components/parcpc/CAParcPCHeroCard';",
    "import { CAParcPCHeroCard } from '@/components/parcpc/CAParcPCHeroCard';\nimport { PCParcFAB } from '@/components/parcpc/PCParcFAB';"
  );
}

// 3. Update styles.stickyControls
content = content.replace(
  "backgroundColor: CA_THEME.lightGray,",
  "backgroundColor: 'rgba(247, 248, 250, 0.93)',"
);

// 4. Add navigation hook
if (!content.includes("const navigation = useNavigation<any>();")) {
  content = content.replace(
    "const listRef = useRef<FlashList<ParcPCListItem> | null>(null);",
    "const navigation = useNavigation<any>();\n  const listRef = useRef<FlashList<ParcPCListItem> | null>(null);"
  );
}

// 5. Add FAB at the end of the view
const searchStr = `      ) : null}
    </View>
  );
};`;

const replacementStr = `      ) : null}

      <PCParcFAB 
        onAddPC={() => navigation.navigate('Articles', { screen: 'AddPC' })}
        onBulkScan={() => console.log('Bulk Scan non implemente')}
        onExport={onExportSentCsv}
      />
    </View>
  );
};`;

content = content.replace(searchStr, replacementStr);

fs.writeFileSync(filePath, content, 'utf8');
console.log('ParcPCScreen.tsx patched successfully');
