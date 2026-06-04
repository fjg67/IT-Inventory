# 🚀 PC En Panne - Integration Guide

## Overview

The PC En Panne (PC Breakdown) feature has been 80% implemented. This guide shows how to complete the remaining 20% to fully integrate the feature into your screens.

## ✅ What's Already Done

- ✅ Database migration (supabase/migrations/009_add_pc_pannes.sql)
- ✅ 10 UI components created (modal, grid, timeline, banner, etc.)
- ✅ Types & configuration files
- ✅ Hooks for panne management
- ✅ Repository for database access
- ✅ PCCard updated with en_panne styles & icons
- ✅ Swipe actions tokens updated

## 📋 Remaining Integration Tasks

### Task 1: Update ParcPCScreen

**File:** `src/screens/ParcPCScreen.tsx`

#### 1.1 Add to Interface Props
```tsx
interface ParcPCScreenProps {
  // ... existing props ...
  onMarkBreakdown?: (articleId: number | string) => void;  // ADD THIS
}
```

#### 1.2 Pass Callback to PCCard
```tsx
const isSent = String(item.id).startsWith('sent-');
return (
  <PCCard
    article={item}
    index={Math.max(0, index - 1)}
    onPress={isSent ? () => onSentArticlePress() : onArticlePress}
    onMarkSent={onMarkSent}
    onMarkHot={onMarkHot}
    onMarkAvailable={onMarkAvailable}
    onMarkProcessing={onMarkProcessing}
    onMarkBreakdown={onMarkBreakdown}  // ADD THIS
    onDelete={onDelete}
  />
);
```

---

### Task 2: Update ArticlesListScreen (or ParcPC Caller)

**File:** `src/screens/Articles/ArticlesListScreen.tsx` (or wherever ParcPCScreen is used)

Find where you call `<ParcPCScreen ... />` and add:

```tsx
const handleMarkBreakdown = (articleId: number | string) => {
  // This will open the panne declaration modal
  // You'll need to set state to show the modal
  setSelectedPCId(articleId);
  setShowPanneModal(true);
};

<ParcPCScreen
  // ... existing props ...
  onMarkBreakdown={handleMarkBreakdown}
/>
```

---

### Task 3: Add PanneDeclarationModal to Screen

In the same screen (ArticlesListScreen or where ParcPCScreen is used):

#### 3.1 Add State
```tsx
import { PanneDeclarationModal } from '@/components/panne';
import { usePannes } from '@/hooks/usePannes';
import { panneRepository } from '@/database/repositories';

const [selectedPCId, setSelectedPCId] = useState<string | null>(null);
const [showPanneModal, setShowPanneModal] = useState(false);
const { createPanne } = usePannes();

// Get the selected PC article if needed
const selectedPC = articles.find(a => String(a.id) === String(selectedPCId));
```

#### 3.2 Add Modal Handler
```tsx
const handleCreatePanne = async (panneData: any) => {
  if (!selectedPCId) return;
  
  try {
    // Create the panne
    await createPanne({
      ...panneData,
      pc_id: selectedPCId,
      technicien_id: currentUser?.id,
    });
    
    // Update PC status to 'en_panne'
    await articleRepository.update(Number(selectedPCId), {
      status: 'en_panne'
    });
    
    // Refresh data
    await loadData();
    setShowPanneModal(false);
    
    // Optional: show success toast
    showAlert('Panne déclarée', 'Panne créée avec succès');
  } catch (error) {
    showAlert('Erreur', 'Impossible de créer la panne');
  }
};
```

#### 3.3 Add Modal to JSX
```tsx
{showPanneModal && selectedPC && (
  <PanneDeclarationModal
    pcId={String(selectedPC.id)}
    onClose={() => {
      setShowPanneModal(false);
      setSelectedPCId(null);
    }}
    onSuccess={() => {
      setShowPanneModal(false);
      setSelectedPCId(null);
      loadData(); // Refresh the list
    }}
    onCreatePanne={handleCreatePanne}
  />
)}
```

---

### Task 4: Enhance PCCard to Show Panne Info

**File:** `src/components/parcpc/PCCard.tsx` (Optional Enhancement)

Add panne type/priority under PC name when status is en_panne:

```tsx
{isBreakdown && activePanne && (
  <Text style={styles.panneSubtitle}>
    {PANNE_TYPE_CONFIG[activePanne.type_panne].label} · {PRIORITE_CONFIG[activePanne.priorite].label}
  </Text>
)}
```

Add to styles:
```tsx
panneSubtitle: {
  fontSize: 10,
  color: '#EF4444',
  fontWeight: '500',
  marginTop: 2,
}
```

---

### Task 5: Add Panne Section to PC Detail Screen

**File:** `src/screens/Articles/ArticleDetailScreen.tsx`

#### 5.1 Imports
```tsx
import { PanneBanner, PanneHistoryTimeline, PanneResolutionSheet } from '@/components/panne';
import { usePannes } from '@/hooks/usePannes';
import { panneRepository } from '@/database/repositories';
```

#### 5.2 Get Panne Data
```tsx
const [article, setArticle] = useState<Article | null>(null);
const [showResolutionSheet, setShowResolutionSheet] = useState(false);

// Add panne hook
const { pannes, getActivePanne } = usePannes(String(article?.id));
const activePanne = article?.id ? getActivePanne(String(article.id)) : null;

useEffect(() => {
  if (article?.id) {
    // Fetch pannes for this PC
    panneRepository.getPannesForPC(String(article.id)).then(setPannes);
  }
}, [article?.id]);
```

#### 5.3 Add Panne Section JSX
```tsx
{article?.status === 'en_panne' && activePanne && (
  <View style={styles.panneSection}>
    <PanneBanner activePanne={activePanne} />
    
    <View style={styles.panneActions}>
      <TouchableOpacity
        style={styles.resolveBtn}
        onPress={() => setShowResolutionSheet(true)}
      >
        <Icon name="check-circle" size={16} color="#22C55E" />
        <Text style={styles.resolveBtnText}>Marquer comme résolu</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.repairBtn}
        onPress={() => {
          // Update to en_reparation status
          panneRepository.updatePanne(activePanne.id, {
            statut_reparation: 'en_reparation'
          });
        }}
      >
        <Icon name="tools" size={16} color="#F59E0B" />
        <Text style={styles.repairBtnText}>Mise en réparation</Text>
      </TouchableOpacity>
    </View>
  </View>
)}

{/* Panne History */}
{pannes.length > 0 && (
  <View style={styles.historySection}>
    <Text style={styles.historyTitle}>Historique des pannes</Text>
    <PanneHistoryTimeline pannes={pannes} />
  </View>
)}

{/* Resolution Sheet Modal */}
{showResolutionSheet && activePanne && (
  <PanneResolutionSheet
    panne={activePanne}
    onClose={() => setShowResolutionSheet(false)}
    onSuccess={() => {
      setShowResolutionSheet(false);
      loadArticleData(); // Refresh
    }}
    onUpdatePanne={(panneId, updates) =>
      panneRepository.updatePanne(panneId, updates)
    }
    onUpdatePCStatus={(pcId, newStatus) =>
      articleRepository.update(Number(pcId), { status: newStatus })
    }
  />
)}
```

#### 5.4 Add Styles
```tsx
const styles = StyleSheet.create({
  panneSection: {
    backgroundColor: '#16231A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.30)',
    padding: 12,
    gap: 12,
  },
  panneActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resolveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  resolveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22C55E',
  },
  repairBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  repairBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  historySection: {
    gap: 8,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F0FDF4',
  },
});
```

---

## 🗄️ Database Migration

Before testing, run this migration on Supabase:

**File:** `supabase/migrations/009_add_pc_pannes.sql`

This migration:
- Adds 'en_panne' status to pc_portables table
- Creates PCPannes table with full schema
- Sets up RLS policies
- Creates necessary indexes
- Sets up updated_at trigger

---

## 🧪 Testing Workflow

1. **Declare Panne**
   - Scroll to PC in ParcPCScreen
   - Swipe left and tap "En panne"
   - PanneDeclarationModal opens
   - Fill type, priority, description
   - Tap "Déclarer la panne"
   - PC status changes to en_panne

2. **View in List**
   - PC appears with red icon (device-laptop-off)
   - Red left border on card

3. **View Details**
   - Tap PC to open detail screen
   - PanneBanner shows at top
   - PanneHistoryTimeline shows events
   - Action buttons available

4. **Resolve**
   - Tap "Marquer comme résolu"
   - PanneResolutionSheet opens
   - Select resolution type
   - Enter note (≥5 chars)
   - Choose new PC status
   - Tap "Confirmer"
   - PC status returns to selected status

---

## 📊 Success Criteria Checklist

- [ ] Migration runs without errors on Supabase
- [ ] `'en_panne'` appears in stat cards
- [ ] PCCard shows red icon + border for en_panne status
- [ ] PanneDeclarationModal opens from swipe action
- [ ] Type selector with 5 options works
- [ ] Priority "Critique" shows red background
- [ ] Description validation (≥10 chars) works
- [ ] Panne created and PC status updated
- [ ] Timeline shows newest→oldest events
- [ ] Resolution updates PC status correctly
- [ ] TC22 screen tapping is easy and responsive

---

## 💡 Tips

- Uses Supabase `getSupabaseClient()` for all database calls
- RLS policies require authentication
- All timestamps handled automatically by triggers
- Optional fields: `ticket_sav`, `technicien_id`, `resolu_par`
- Pannes can be marked as 'irreparable' (stays in status, but PC marked as 'a_reusiner')

---

## 🔗 File References

- **Components:** `src/components/panne/`
- **Hook:** `src/hooks/usePannes.ts`
- **Repository:** `src/database/repositories/panneRepository.ts`
- **Types:** `src/types/pc.types.ts`
- **Migration:** `supabase/migrations/009_add_pc_pannes.sql`

---

Need help? Check the repository status in `/memories/repo/PC-Pannes-Feature-Status.md`
