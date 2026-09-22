const fs = require('fs');

const path = 'c:\\Users\\flori\\Documents\\Projet\\IT Inventory mobile\\src\\screens\\Settings\\SettingsScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replacements des imports
content = content.replace(
`import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { ProfileCard } from '@/components/settings/ProfileCard';
import { AuditPulseWidget } from '@/components/settings/AuditPulseWidget';
import { SectionHeader } from '@/components/settings/SectionHeader';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsRowAction } from '@/components/settings/SettingsRowAction';
import { VersionCard } from '@/components/settings/VersionCard';
import { CreatorCard } from '@/components/settings/CreatorCard';
import { LogoutButton } from '@/components/settings/LogoutButton';
import { SettingsFooter } from '@/components/settings/SettingsFooter';`,
`import { CAParametresHeader } from '@/components/parametres/CAParametresHeader';
import { CAProfileCard } from '@/components/parametres/CAProfileCard';
import { CAAuditCard, type AuditLevel } from '@/components/parametres/CAAuditCard';
import { CASettingSection } from '@/components/parametres/CASettingSection';
import { CASettingCard } from '@/components/parametres/CASettingCard';
import { CASettingRow } from '@/components/parametres/CASettingRow';
import { CAActionButton } from '@/components/parametres/CAActionButton';
import { CAStatusPill } from '@/components/parametres/CAStatusPill';
import { CAAboutCard } from '@/components/parametres/CAAboutCard';
import { LogoutButton } from '@/components/settings/LogoutButton';
import { SettingsFooter } from '@/components/settings/SettingsFooter';
import { CA_THEME } from '@/constants/caTheme';`
);

// 2. Add audit level helper
content = content.replace(
`  const complianceVisual = getComplianceVisual(daysSinceRecount);`,
`  const complianceVisual = getComplianceVisual(daysSinceRecount);

  let auditLevel: AuditLevel = 'ok';
  if (daysSinceRecount === null || daysSinceRecount > 30) auditLevel = 'critique';
  else if (daysSinceRecount > 15) auditLevel = 'warning';
`
);

// 3. Header replacement
content = content.replace(
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[0]).duration(300)}>
          <SettingsHeader onBellPress={() => showToast('Notifications systeme bientot disponibles')} />
        </Animated.View>`,
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[0]).duration(300)}>
          <CAParametresHeader />
        </Animated.View>`
);

// 4. Profile Card replacement
content = content.replace(
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[1]).duration(300)}>
          <ProfileCard
            initials={initials}
            fullName={fullName}
            roleLabel={roleLabel}
            roleIcon={roleVisual.icon}
            roleColor={roleVisual.color}
            roleBg={roleVisual.bg}
            siteName={siteActif?.nom ?? 'Site non selectionne'}
            sessionCount={profileStats.sessionCount}
            connectionLabel={profileStats.connectionLabel}
            movementCount={profileStats.movementCount}
            onMenuPress={handleSiteMenu}
          />
        </Animated.View>`,
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[1]).duration(300)}>
          <CAProfileCard
            user={{
              initials: initials,
              fullName: fullName,
              role: roleLabel,
              site: siteActif?.nom ?? 'Site non sélectionné',
              sessionCount: profileStats.sessionCount,
              lastLogin: profileStats.connectionLabel,
              movementsCount: profileStats.movementCount,
            }}
            onMenuPress={handleSiteMenu}
          />
        </Animated.View>`
);

// 5. Audit Card replacement
content = content.replace(
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[2]).duration(300)}>
          <AuditPulseWidget
            daysSinceRecount={daysSinceRecount}
            lastRecountDateLabel={lastRecountDateLabel}
            siteName={siteActif?.nom ?? 'Site non selectionne'}
            recountLoading={recountLoading}
            onExplore={() => setComplianceModalVisible(true)}
            onRecount={() => {
              recordRecount().catch(console.error);
            }}
          />
        </Animated.View>`,
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[2]).duration(300)}>
          <CASettingSection title="Audit inventaire" icon="shield-check">
            <CAAuditCard
              daysSince={daysSinceRecount ?? '--'}
              lastDate={lastRecountDateLabel}
              level={auditLevel}
              site={siteActif?.nom ?? 'Site non sélectionné'}
              onExplore={() => setComplianceModalVisible(true)}
              onRelaunch={() => { recordRecount().catch(console.error); }}
            />
          </CASettingSection>
        </Animated.View>`
);

// 6. Security section replacement
content = content.replace(
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[4]).duration(300)} style={styles.sectionWrap}>
          <SectionHeader title="Securite" />

          <View style={styles.rowsStack}>
            <SettingsRowAction
              icon="fingerprint"
              iconBg={SETTINGS_COLORS.green_subtle}
              iconColor={SETTINGS_COLORS.green_light}
              title="Connexion biometrique"
              subtitle={
                biometricAvailable
                  ? \`\${biometricLabel} disponible (\${biometricEnabled ? 'activee' : 'desactivee'})\`
                  : 'Aucune biometrie configuree sur cet appareil'
              }
              variant="info"
              badgeStatus={biometricEnabled ? 'active' : 'inactive'}
              actionButton={{
                label: biometricEnabled ? 'Desactiver la biometrie' : 'Activer la biometrie',
                icon: biometricEnabled ? 'fingerprint-off' : 'fingerprint',
                color: biometricEnabled ? 'danger' : 'green',
                onPress: biometricEnabled ? handleDisableBiometric : () => {
                  handleEnableBiometric().catch(console.error);
                },
                disabled: biometricLoading,
              }}
            />

            <SettingsRowAction
              icon={pushEnabled ? 'bell-ring-outline' : 'bell-off-outline'}
              iconBg={SETTINGS_COLORS.teal_subtle}
              iconColor={SETTINGS_COLORS.teal}
              title="Notifications de mouvements"
              subtitle={
                pushEnabled
                  ? "Vous recevez les alertes meme si l'application est fermee"
                  : 'Les alertes push sont coupees sur cet appareil'
              }
              variant="info"
              badgeStatus={pushEnabled ? 'active' : 'inactive'}
              actionButton={{
                label: pushEnabled ? 'Desactiver les notifications' : 'Activer les notifications',
                icon: pushEnabled ? 'bell-off-outline' : 'bell-ring-outline',
                color: pushEnabled ? 'danger' : 'green',
                onPress: () => {
                  handleTogglePushNotifications().catch(console.error);
                },
                disabled: pushLoading,
              }}
            />
          </View>
        </Animated.View>`,
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[4]).duration(300)} style={styles.sectionWrap}>
          <CASettingSection title="Sécurité" icon="lock">
            <CASettingCard>
              <CASettingRow
                icon="fingerprint"
                iconVariant="blue"
                title="Connexion biométrique"
                subtitle={biometricEnabled ? 'Configurée sur cet appareil' : 'Aucune biométrie configurée'}
                rightElement={<CAStatusPill active={biometricEnabled} />}
              />
            </CASettingCard>
            <View style={{ marginTop: 8 }}>
              <CAActionButton
                label={biometricEnabled ? "Désactiver la biométrie" : "Activer la biométrie"}
                icon={biometricEnabled ? "fingerprint-off" : "fingerprint"}
                variant={biometricEnabled ? "danger" : "primary"}
                onPress={biometricEnabled ? handleDisableBiometric : () => handleEnableBiometric().catch(console.error)}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <CASettingCard>
                <CASettingRow
                  icon="bell"
                  iconVariant="green"
                  title="Notifications de mouvements"
                  subtitle="Vous recevez les alertes même si l'application est fermée"
                  rightElement={<CAStatusPill active={pushEnabled} />}
                />
              </CASettingCard>
            </View>
            <View style={{ marginTop: 8 }}>
              <CAActionButton
                label={pushEnabled ? "Désactiver les notifications" : "Activer les notifications"}
                icon={pushEnabled ? "bell-off" : "bell-ring"}
                variant={pushEnabled ? "danger" : "primary"}
                onPress={() => handleTogglePushNotifications().catch(console.error)}
              />
            </View>
          </CASettingSection>
        </Animated.View>`
);

// 7. Inventory section replacement
content = content.replace(
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[5]).duration(300)} style={styles.sectionWrap}>
          <SectionHeader title="Inventaire complet" />

          <View style={styles.rowsStack}>
            <SettingsRow
              icon="clipboard-check-outline"
              iconBg={SETTINGS_COLORS.warning_subtle}
              iconColor={SETTINGS_COLORS.warning}
              title="Dernier inventaire"
              subtitle={lastRecount ? \`Par \${lastRecount.technicianName}\` : 'Aucun inventaire enregistre'}
              variant="info"
              rightValue={lastRecountDateLabel}
            />

            <SettingsRow
              icon="playlist-check"
              iconBg={SETTINGS_COLORS.green_subtle}
              iconColor={SETTINGS_COLORS.green_light}
              title="Enregistrer un inventaire"
              subtitle="Marquer la date du recomptage complet"
              variant="navigate"
              onPress={() => {
                recordRecount().catch(console.error);
              }}
            />
          </View>
        </Animated.View>`,
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[5]).duration(300)} style={styles.sectionWrap}>
          <CASettingSection title="Inventaire complet" icon="clipboard-list">
            <CASettingCard>
              <CASettingRow
                icon="clipboard-check"
                iconVariant="orange"
                title="Dernier inventaire"
                subtitle={lastRecount ? \`Par \${lastRecount.technicianName}\` : 'Aucun inventaire enregistré'}
                rightElement={<Text style={styles.dateText}>{lastRecountDateLabel}</Text>}
              />
              <CASettingRow
                icon="playlist-check"
                iconVariant="green"
                title="Enregistrer un inventaire"
                subtitle="Marquer la date du recomptage complet"
                onPress={() => {
                  recordRecount().catch(console.error);
                }}
                showChevron
              />
            </CASettingCard>
          </CASettingSection>
        </Animated.View>`
);

// 8. Personal Data section replacement
content = content.replace(
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[6]).duration(300)} style={styles.sectionWrap}>
          <SectionHeader title="Donnees personnelles" />

          <View style={styles.rowsStack}>
            <SettingsRow
              icon="file-export-outline"
              iconBg={SETTINGS_COLORS.info_subtle}
              iconColor={SETTINGS_COLORS.info}
              title={exporting ? 'Export en cours...' : 'Exporter mes donnees'}
              subtitle="Format JSON (RGPD)"
              variant="navigate"
              onPress={handleExportData}
            />

            {!isSuperviseur ? (
              <SettingsRow
                icon="delete-outline"
                iconBg={SETTINGS_COLORS.danger_subtle}
                iconColor={SETTINGS_COLORS.danger}
                title={deleting ? 'Suppression en cours...' : 'Supprimer mes donnees'}
                subtitle="Action irreversible"
                variant="danger"
                onPress={deleting ? undefined : handleDeleteData}
              />
            ) : null}
          </View>
        </Animated.View>`,
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[6]).duration(300)} style={styles.sectionWrap}>
          <CASettingSection title="Données personnelles" icon="database">
            <CASettingCard>
              <CASettingRow
                icon="export"
                iconVariant="blue"
                title={exporting ? 'Export en cours...' : 'Exporter mes données'}
                subtitle="Format JSON (RGPD)"
                onPress={handleExportData}
                showChevron
              />
              {!isSuperviseur ? (
                <CASettingRow
                  icon="trash-can"
                  iconVariant="danger"
                  title={deleting ? 'Suppression en cours...' : 'Supprimer mes données'}
                  subtitle="Action irréversible"
                  variant="danger"
                  onPress={deleting ? undefined : handleDeleteData}
                  showChevron
                />
              ) : null}
            </CASettingCard>
          </CASettingSection>
        </Animated.View>`
);

// 9. About section replacement
content = content.replace(
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[7]).duration(300)} style={styles.sectionWrap}>
          <SectionHeader title="A propos" />

          <View style={styles.rowsStack}>
            <VersionCard version={APP_CONFIG.version} onPress={() => setChangelogVisible(true)} />
            <CreatorCard onLicensePress={() => showToast('Licence MIT - consultez le fichier LICENSE')} />

            <SettingsRow
              icon="lifebuoy"
              iconBg={SETTINGS_COLORS.teal_subtle}
              iconColor={SETTINGS_COLORS.teal}
              title="Aide et support"
              subtitle="FAQ et assistance"
              variant="navigate"
              onPress={() => navigation.navigate('Help')}
            />

            <SettingsRow
              icon="file-document-outline"
              iconBg={SETTINGS_COLORS.bg_card_elevated}
              iconColor={SETTINGS_COLORS.text_secondary}
              title="Conditions d'utilisation"
              subtitle="CGU et mentions legales"
              variant="navigate"
              onPress={() => navigation.navigate('Terms')}
            />
          </View>
        </Animated.View>`,
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[7]).duration(300)} style={styles.sectionWrap}>
          <CASettingSection title="À propos" icon="information">
            <CAAboutCard
              version={APP_CONFIG.version}
              authorName={fullName}
              authorRole="Créateur et Développeur"
              initials={initials}
              copyright={\`© \${new Date().getFullYear()} \${fullName}\`}
              onInfoPress={() => navigation.navigate('Help')}
            />
          </CASettingSection>
        </Animated.View>`
);

// 10. Styles replacements
content = content.replace(
`  container: {
    flex: 1,
    backgroundColor: SETTINGS_COLORS.bg_primary,
  },`,
`  container: {
    flex: 1,
    backgroundColor: CA_THEME.lightGray,
  },
  dateText: { fontSize: 12, fontWeight: '600', color: CA_THEME.textSecondary },`
);

content = content.replace(
`  content: {
    paddingBottom: 40,
  },`,
`  content: {
    paddingBottom: 40,
    gap: 12,
    padding: 12,
    paddingTop: 0,
  },`
);

content = content.replace(
`        <Animated.View entering={FadeInDown.delay(SECTION_DELAYS[0]).duration(300)}>
          <CAParametresHeader />
        </Animated.View>`,
`        <CAParametresHeader />`
);

// Save the content back to the file
fs.writeFileSync(path, content, 'utf8');
console.log('Replacements completed successfully.');
