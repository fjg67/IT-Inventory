const fs = require('fs');

const path = './src/screens/Settings/SettingsScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Import CASheet
content = content.replace(
  `import { ToastContainer, useToast } from '@/components/common';`,
  `import { ToastContainer, useToast } from '@/components/common';\nimport { CASheet } from '@/components/common/CASheet';\nimport { BottomSheetModal } from '@gorhom/bottom-sheet';`
);

// 2. Add ref instead of state
content = content.replace(
  `const [siteModalVisible, setSiteModalVisible] = useState(false);`,
  `const siteSheetRef = React.useRef<BottomSheetModal>(null);`
);

// 3. Update handleSiteMenu
content = content.replace(
  `{ text: 'Changer de site actif', onPress: () => setSiteModalVisible(true) },`,
  `{ text: 'Changer de site actif', onPress: () => siteSheetRef.current?.present() },`
);

// 4. Update handleSelectSite
content = content.replace(
  `setSiteModalVisible(false);`,
  `siteSheetRef.current?.dismiss();`
);

// 5. Replace Modal with CASheet
const modalStr = `<Modal visible={siteModalVisible} transparent animationType="slide" onRequestClose={() => setSiteModalVisible(false)}>
        <View style={styles.sheetBackdrop}>
          <TouchableWithoutFeedback onPress={() => setSiteModalVisible(false)}>
            <View style={styles.sheetBackdropTap} />
          </TouchableWithoutFeedback>

          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Changer de site actif</Text>
            {sitesDisponibles.map((site) => (
              <Pressable key={site.id} style={styles.sheetRow} onPress={() => handleSelectSite(site.id)}>
                <Icon
                  name={siteActif?.id === site.id ? 'check-circle' : 'office-building-outline'}
                  size={16}
                  color={siteActif?.id === site.id ? SETTINGS_COLORS.green_light : SETTINGS_COLORS.text_muted}
                />
                <Text style={styles.sheetRowText}>{site.nom}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>`;

const sheetStr = `<CASheet ref={siteSheetRef} snapPoints={['40%', '60%']}>
        <View style={{ padding: 24, paddingTop: 12 }}>
          <Text style={[styles.sheetTitle, { marginBottom: 16 }]}>Changer de site actif</Text>
          {sitesDisponibles.map((site) => (
            <Pressable key={site.id} style={[styles.sheetRow, { paddingVertical: 14 }]} onPress={() => handleSelectSite(site.id)}>
              <Icon
                name={siteActif?.id === site.id ? 'check-circle' : 'office-building-outline'}
                size={20}
                color={siteActif?.id === site.id ? SETTINGS_COLORS.green_light : SETTINGS_COLORS.text_muted}
              />
              <Text style={[styles.sheetRowText, { fontSize: 16, marginLeft: 12 }]}>{site.nom}</Text>
            </Pressable>
          ))}
        </View>
      </CASheet>`;

content = content.replace(modalStr, sheetStr);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched SettingsScreen.tsx');
