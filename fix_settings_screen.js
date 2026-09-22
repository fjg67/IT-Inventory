const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'Settings', 'SettingsScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add useSafeAreaInsets
content = content.replace(
  "import { useNavigation } from '@react-navigation/native';",
  "import { useNavigation } from '@react-navigation/native';\nimport { useSafeAreaInsets } from 'react-native-safe-area-context';"
);

// 2. Add insets
content = content.replace(
  "const { toasts, show: toastShow, dismiss: dismissToast } = useToast();",
  "const { toasts, show: toastShow, dismiss: dismissToast } = useToast();\n  const insets = useSafeAreaInsets();"
);

// 3. Add profileMenuVisible
content = content.replace(
  "const [siteModalVisible, setSiteModalVisible] = useState(false);",
  "const [siteModalVisible, setSiteModalVisible] = useState(false);\n  const [profileMenuVisible, setProfileMenuVisible] = useState(false);"
);

// 4. Update handleSiteMenu
content = content.replace(
  /const handleSiteMenu = useCallback\(\(\) => {[\s\S]*?}, \[showToast\]\);/,
  `const handleSiteMenu = useCallback(() => {
    setProfileMenuVisible(true);
  }, []);`
);

// 5. Update ScrollView padding
content = content.replace(
  'contentContainerStyle={styles.content}',
  'contentContainerStyle={[styles.content, { paddingTop: Math.max(12, insets.top + 12) }]}'
);

// 6. Add profile menu modal
const profileMenuModal = `
      <Modal visible={profileMenuVisible} transparent animationType="slide" onRequestClose={() => setProfileMenuVisible(false)}>
        <View style={styles.sheetBackdrop}>
          <TouchableWithoutFeedback onPress={() => setProfileMenuVisible(false)}>
            <View style={styles.sheetBackdropTap} />
          </TouchableWithoutFeedback>

          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Profil</Text>
            
            <Pressable style={styles.sheetRow} onPress={() => { setProfileMenuVisible(false); showToast('Edition profil bientot disponible'); }}>
              <Icon name="account-edit-outline" size={20} color={SETTINGS_COLORS.text_muted} />
              <Text style={styles.sheetRowText}>Modifier le profil</Text>
            </Pressable>
            
            <Pressable style={styles.sheetRow} onPress={() => { setProfileMenuVisible(false); setSiteModalVisible(true); }}>
              <Icon name="office-building-marker-outline" size={20} color={SETTINGS_COLORS.text_muted} />
              <Text style={styles.sheetRowText}>Changer de site actif</Text>
            </Pressable>
            
            <Pressable style={styles.sheetRow} onPress={() => { setProfileMenuVisible(false); showToast('Historique bientot disponible'); }}>
              <Icon name="history" size={20} color={SETTINGS_COLORS.text_muted} />
              <Text style={styles.sheetRowText}>Voir historique</Text>
            </Pressable>
            
            <Pressable style={[styles.sheetRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', marginTop: 8, paddingTop: 16 }]} onPress={() => setProfileMenuVisible(false)}>
              <Icon name="close" size={20} color={SETTINGS_COLORS.red} />
              <Text style={[styles.sheetRowText, { color: SETTINGS_COLORS.red }]}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

`;

content = content.replace(
  '<Modal visible={siteModalVisible} transparent animationType="slide" onRequestClose={() => setSiteModalVisible(false)}>',
  profileMenuModal + '<Modal visible={siteModalVisible} transparent animationType="slide" onRequestClose={() => setSiteModalVisible(false)}>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('SettingsScreen.tsx patched successfully');
