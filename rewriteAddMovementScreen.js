const fs = require('fs');
const path = 'c:\\Users\\flori\\Documents\\Projet\\IT Inventory mobile\\src\\screens\\AddMovementScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

const importRegex = /import \{\n  ArticleSearchInput,[\s\S]*?StockPreviewCard,\n\} from '@\/components\/movement';/;

content = content.replace(importRegex, 
`import { CAMouvementTopBar } from '@/components/create-mouvement/CAMouvementTopBar';
import { CAMouvementStepper, type StepStatus } from '@/components/create-mouvement/CAMouvementStepper';
import { CAMouvementArticleCard } from '@/components/create-mouvement/CAMouvementArticleCard';
import { CAMouvementTypeGrid, type MovementType } from '@/components/create-mouvement/CAMouvementTypeGrid';
import { CAMouvementQtyStepper } from '@/components/create-mouvement/CAMouvementQtyStepper';
import { CAMouvementStockPreview } from '@/components/create-mouvement/CAMouvementStockPreview';
import { CAMouvementStepArticle } from '@/components/create-mouvement/CAMouvementStepArticle';
import { CAScreenWrapper } from '@/components/common/CAScreenWrapper';
import { CA_THEME } from '@/constants/caTheme';
import { TextInput, ActivityIndicator } from 'react-native';`);

const returnStart = content.indexOf('  return (\n    <View style={styles.container}>');
const returnEnd = content.lastIndexOf('  );\n};\n');

const newRender = `  const steps = [
    { key: 'article', label: 'Article', status: flow.currentStepIndex > 0 ? 'done' : flow.state.step === 'article' ? 'active' : 'pending' },
    { key: 'type',    label: 'Type',    status: flow.currentStepIndex > 1 ? 'done' : flow.state.step === 'type' ? 'active' : 'pending' },
    { key: 'details', label: 'Détails', status: flow.state.step === 'details' ? 'active' : 'pending' },
  ] as { key: string; label: string; status: StepStatus }[];

  return (
    <CAScreenWrapper>
      <CAMouvementTopBar
        onBack={handleBack}
        onHistory={() => navigation.navigate('Mouvements')}
        onHelp={() => Alert.alert('Aide', 'Sélectionnez un article, un type de mouvement et la quantité pour valider le mouvement.')}
      />

      <CAMouvementStepper steps={steps} />

      {flow.state.step === 'article' && (
        <CAMouvementStepArticle
          onScan={openScanner}
          onManualSearch={search.onChangeQuery}
          searchQuery={search.query}
          searchResults={search.results.map(r => ({
            id: String(r.id),
            reference: r.reference,
            label: r.label,
            stock_actuel: r.quantiteActuelle,
          }))}
          onSelectArticle={(art) => {
            const fullArticle = search.results.find(r => String(r.id) === art.id);
            if (fullArticle) {
              flow.selectArticle(fullArticle);
              setErrors({});
              search.reset();
            }
          }}
        />
      )}

      {flow.state.step === 'type' && flow.state.article && (
        <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
          <Text style={styles.sectionLabel}>Article sélectionné</Text>
          <CAMouvementArticleCard
            article={{
              reference: flow.state.article.reference,
              label: flow.state.article.label,
              stockActuel: flow.state.article.quantiteActuelle,
              site: siteActif?.nom ?? 'Site non sélectionné',
              imageUrl: flow.state.article.photoUrl,
            }}
            onDeselect={() => {
              flow.setState(prev => ({ ...prev, article: null, step: 'article' }));
            }}
          />

          <Text style={styles.sectionLabel}>Type de mouvement <Text style={{color:CA_THEME.danger}}>*</Text></Text>
          <CAMouvementTypeGrid
            selected={flow.state.type as MovementType}
            onSelect={(t) => flow.updateField('type', t)}
          />

          <Text style={styles.sectionLabel}>Quantité <Text style={{color:CA_THEME.danger}}>*</Text></Text>
          <CAMouvementQtyStepper
            value={flow.state.quantity}
            onChange={(next) => {
              flow.updateField('quantity', next);
              Vibration.vibrate(8);
            }}
            movementType={(flow.state.type as MovementType) ?? 'entree'}
            max={maxQty}
            min={minQty}
          />

          <Pressable
            onPress={() => flow.nextStep()}
            disabled={!flow.state.type}
            style={[styles.btnContinue, !flow.state.type && { opacity: 0.4 }]}
            accessibilityRole="button" accessibilityLabel="Continuer vers les détails"
          >
            <Text style={styles.btnContinueText}>Continuer</Text>
            <Icon name="arrow-right" size={16} color={CA_THEME.white} />
          </Pressable>
        </ScrollView>
      )}

      {flow.state.step === 'details' && flow.state.article && flow.state.type && (
        <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
          <Text style={styles.sectionLabel}>Article sélectionné</Text>
          <CAMouvementArticleCard
            article={{
              reference: flow.state.article.reference,
              label: flow.state.article.label,
              stockActuel: flow.state.article.quantiteActuelle,
              site: siteActif?.nom ?? 'Site non sélectionné',
              imageUrl: flow.state.article.photoUrl,
            }}
            onDeselect={() => {
              flow.setState(prev => ({ ...prev, article: null, step: 'article' }));
            }}
          />

          <CAMouvementStockPreview
            stockBefore={stockActuel}
            stockAfter={preview.newStock}
            movementType={flow.state.type as MovementType}
            quantity={flow.state.quantity}
            threshold={stockMin}
          />

          <View>
            <Text style={styles.sectionLabel}>Commentaire (optionnel)</Text>
            <TextInput
              value={flow.state.comment}
              onChangeText={(c) => flow.updateField('comment', c)}
              placeholder="Motif, précision..."
              placeholderTextColor={CA_THEME.textMuted}
              multiline
              maxLength={200}
              textAlignVertical="top"
              style={styles.commentInput}
              accessibilityLabel="Commentaire optionnel"
            />
            <Text style={styles.charCount}>{(flow.state.comment || '').length}/200</Text>
          </View>

          <Pressable onPress={() => navigation.goBack()} style={styles.btnCancel}
            accessibilityRole="button" accessibilityLabel="Annuler le mouvement">
            <Icon name="close-circle" size={16} color={CA_THEME.danger} />
            <Text style={styles.btnCancelText}>Annuler le mouvement</Text>
          </Pressable>

          <Pressable onPress={submit} disabled={isSubmitting} style={styles.btnValidate}
            accessibilityRole="button" accessibilityLabel="Valider le mouvement">
            {isSubmitting ? (
              <ActivityIndicator color={CA_THEME.white} />
            ) : (
              <>
                <Icon name="check-circle" size={16} color={CA_THEME.white} />
                <Text style={styles.btnValidateText}>Valider le mouvement</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      )}

      <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <View style={styles.cameraContainer}>
          {device && hasPermission ? (
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={showCamera}
              codeScanner={codeScanner}
              photo={false}
              video={false}
              audio={false}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
          )}

          <View style={styles.cameraOverlay} pointerEvents="box-none">
            <View style={styles.cameraHeader}>
              <TouchableOpacity style={styles.cameraClose} onPress={() => setShowCamera(false)}>
                <Icon name="close" size={22} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Scanner le code-barres</Text>
              <View style={{ width: 42 }} />
            </View>

            <View style={styles.cameraFrameWrap}>
              <View style={styles.cameraFrame}>
                <View style={[styles.corner, styles.tl, { borderColor: CA_THEME.green }]} />
                <View style={[styles.corner, styles.tr, { borderColor: CA_THEME.green }]} />
                <View style={[styles.corner, styles.bl, { borderColor: CA_THEME.green }]} />
                <View style={[styles.corner, styles.br, { borderColor: CA_THEME.green }]} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </CAScreenWrapper>`;

content = content.substring(0, returnStart) + newRender + '\n' + content.substring(returnEnd);

content = content.replace('const styles = StyleSheet.create({', 
`const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: CA_THEME.green,
    textTransform: 'uppercase', letterSpacing: 1.0,
    marginBottom: 0,
  },
  btnContinue: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 12,
    backgroundColor: CA_THEME.green,
  },
  btnContinueText: { fontSize: 15, fontWeight: '700', color: CA_THEME.white },
  commentInput: {
    backgroundColor: CA_THEME.white,
    borderRadius: 10, borderWidth: 1, borderColor: CA_THEME.borderGray,
    padding: 12, fontSize: 13, color: CA_THEME.textPrimary,
    minHeight: 70,
  },
  charCount: { fontSize: 10, color: CA_THEME.textMuted, textAlign: 'right', marginTop: 4 },
  btnCancel: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 13, borderRadius: 12,
    backgroundColor: CA_THEME.dangerBg,
    borderWidth: 1.5, borderColor: 'rgba(211,47,47,0.25)',
  },
  btnCancelText:   { fontSize: 14, fontWeight: '700', color: CA_THEME.danger },
  btnValidate: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 12,
    backgroundColor: CA_THEME.green,
  },
  btnValidateText: { fontSize: 15, fontWeight: '700', color: CA_THEME.white },`);

fs.writeFileSync(path, content, 'utf8');
console.log('done');
