import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { getSupabaseClient, tables } from '@/api/supabase';
import { ParsedVoiceCommand } from '@/types/voice.types';
import { selectSite } from '@/store/slices/siteSlice';

export const useVoiceAction = () => {
  const dispatch = useDispatch();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeCommand = async (
    command: ParsedVoiceCommand
  ): Promise<{ success: boolean; message: string; newStock?: number }> => {
    setIsExecuting(true);
    const supabase = getSupabaseClient();

    try {
      switch (command.actionType) {

        // ── ENTRÉE DE STOCK ──────────────────────────────────────────────
        case 'stock_entree': {
          if (!command.articleId) throw new Error('Article non trouvé');

          const { data: stockRow } = await supabase
            .from(tables.stocksSites)
            .select('quantity, id')
            .eq('articleId', command.articleId)
            .eq('siteId', command.siteId)
            .maybeSingle();

          const currentStock = stockRow?.quantity ?? 0;
          const newStock = currentStock + (command.quantity ?? 1);

          if (stockRow) {
            const { error } = await supabase
              .from(tables.stocksSites)
              .update({ quantity: newStock })
              .eq('id', stockRow.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from(tables.stocksSites)
              .insert({
                articleId: command.articleId,
                siteId: command.siteId,
                quantity: newStock,
              });
            if (error) throw error;
          }

          await supabase.from(tables.mouvements).insert({
            articleId: command.articleId,
            siteId: command.siteId,
            type: 'entree',
            quantite: command.quantity,
            stockAvant: currentStock,
            stockApres: newStock,
            technicienId: command.executedBy,
            dateMouvement: new Date().toISOString(),
            commentaire: `Via commande vocale : "${command.rawText}"`,
            syncStatus: 'synced'
          });

          return {
            success:  true,
            message:  `+${command.quantity} ${command.articleLabel} → stock : ${newStock}`,
            newStock,
          };
        }

        // ── SORTIE DE STOCK ──────────────────────────────────────────────
        case 'stock_sortie': {
          if (!command.articleId) throw new Error('Article non trouvé');

          const { data: stockRow } = await supabase
            .from(tables.stocksSites)
            .select('quantity, id')
            .eq('articleId', command.articleId)
            .eq('siteId', command.siteId)
            .maybeSingle();

          const currentStock = stockRow?.quantity ?? 0;

          if (currentStock < (command.quantity ?? 1)) {
            return {
              success: false,
              message: `Stock insuffisant : ${currentStock} disponibles, vous demandez ${command.quantity}`,
            };
          }

          const newStock = currentStock - (command.quantity ?? 1);

          const { error } = await supabase
            .from(tables.stocksSites)
            .update({ quantity: newStock })
            .eq('id', stockRow!.id);
          
          if (error) throw error;

          await supabase.from(tables.mouvements).insert({
            articleId: command.articleId,
            siteId: command.siteId,
            type: 'sortie',
            quantite: command.quantity,
            stockAvant: currentStock,
            stockApres: newStock,
            technicienId: command.executedBy,
            dateMouvement: new Date().toISOString(),
            commentaire: `Via commande vocale : "${command.rawText}"`,
            syncStatus: 'synced'
          });

          return {
            success:  true,
            message:  `-${command.quantity} ${command.articleLabel} → stock : ${newStock}`,
            newStock,
          };
        }

        // ── CONSULTATION STOCK ───────────────────────────────────────────
        case 'stock_consultation': {
          if (!command.articleId) throw new Error('Article non trouvé');

          const { data: stockRow } = await supabase
            .from(tables.stocksSites)
            .select('quantity')
            .eq('articleId', command.articleId)
            .eq('siteId', command.siteId)
            .maybeSingle();

          const stock = stockRow?.quantity ?? 0;

          return {
            success:  true,
            message:  `${command.articleLabel} : ${stock} unité(s) en stock sur ce site.`,
            newStock: stock,
          };
        }

        // ── AJUSTEMENT DE STOCK ──────────────────────────────────────────
        case 'stock_ajustement': {
          if (!command.articleId) throw new Error('Article non trouvé');

          const { data: stockRow } = await supabase
            .from(tables.stocksSites)
            .select('quantity, id')
            .eq('articleId', command.articleId)
            .eq('siteId', command.siteId)
            .maybeSingle();

          const currentStock = stockRow?.quantity ?? 0;
          const newStock = command.quantity ?? 0;

          if (stockRow) {
            const { error } = await supabase
              .from(tables.stocksSites)
              .update({ quantity: newStock })
              .eq('id', stockRow.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from(tables.stocksSites)
              .insert({
                articleId: command.articleId,
                siteId: command.siteId,
                quantity: newStock,
              });
            if (error) throw error;
          }

          await supabase.from(tables.mouvements).insert({
            articleId: command.articleId,
            siteId: command.siteId,
            type: 'ajustement',
            quantite: newStock,
            stockAvant: currentStock,
            stockApres: newStock,
            technicienId: command.executedBy,
            dateMouvement: new Date().toISOString(),
            commentaire: `Via commande vocale : "${command.rawText}"`,
            syncStatus: 'synced'
          });

          return {
            success:  true,
            message:  `Ajustement : ${command.articleLabel} mis à ${newStock} (était ${currentStock})`,
            newStock,
          };
        }

        // ── TRANSFERT DE STOCK ───────────────────────────────────────────
        case 'stock_transfert': {
          if (!command.articleId) throw new Error('Article non trouvé');
          if (!command.targetSiteId) throw new Error('Site de destination introuvable');

          // Vérifier le stock actuel sur le site de départ
          const { data: stockSource } = await supabase
            .from(tables.stocksSites)
            .select('quantity, id')
            .eq('articleId', command.articleId)
            .eq('siteId', command.siteId)
            .maybeSingle();

          const currentStockSource = stockSource?.quantity ?? 0;
          const transferQty = command.quantity ?? 1;

          if (currentStockSource < transferQty) {
            return {
              success: false,
              message: `Stock insuffisant pour le transfert : ${currentStockSource} disponibles, vous demandez ${transferQty}`,
            };
          }

          const newStockSource = currentStockSource - transferQty;

          // 1. Soustraire du site source
          await supabase.from(tables.stocksSites)
            .update({ quantity: newStockSource })
            .eq('id', stockSource!.id);

          // 2. Ajouter au site cible
          const { data: stockTarget } = await supabase
            .from(tables.stocksSites)
            .select('quantity, id')
            .eq('articleId', command.articleId)
            .eq('siteId', command.targetSiteId)
            .maybeSingle();

          if (stockTarget) {
            await supabase.from(tables.stocksSites)
              .update({ quantity: stockTarget.quantity + transferQty })
              .eq('id', stockTarget.id);
          } else {
            await supabase.from(tables.stocksSites)
              .insert({
                articleId: command.articleId,
                siteId: command.targetSiteId,
                quantity: transferQty,
              });
          }

          // 3. Mouvement (on trace sur le site source)
          await supabase.from(tables.mouvements).insert({
            articleId: command.articleId,
            siteId: command.siteId,
            siteCibleId: command.targetSiteId,
            type: 'transfert',
            quantite: transferQty,
            stockAvant: currentStockSource,
            stockApres: newStockSource,
            technicienId: command.executedBy,
            dateMouvement: new Date().toISOString(),
            commentaire: `Transfert vocal vers ${command.targetSiteLabel} : "${command.rawText}"`,
            syncStatus: 'synced'
          });

          return {
            success:  true,
            message:  `${transferQty} ${command.articleLabel} transféré(s) vers ${command.targetSiteLabel}`,
            newStock: newStockSource,
          };
        }

        // ── PC EN PANNE ──────────────────────────────────────────────────
        case 'pc_panne': {
          if (!command.pcId) throw new Error('PC non trouvé');

          // Mettre à jour le statut du PC
          await supabase.from('pc_portables')
            .update({ status: 'en_panne' })
            .eq('id', command.pcId);

          // Créer l'entrée panne
          await supabase.from(tables.pcPannes).insert({
            pc_id:             command.pcId,
            type_panne:        command.panneType ?? 'autre',
            description:       `Déclaré via commande vocale : "${command.rawText}"`,
            priorite:          'moyenne',
            statut_reparation: 'en_attente',
            declared_at:       new Date().toISOString(),
            updated_at:        new Date().toISOString(),
          });

          return {
            success: true,
            message: `PC ${command.pcHostname} déclaré en panne (${command.panneType ?? 'type non précisé'})`,
          };
        }

        // ── CHANGEMENT STATUT PC ─────────────────────────────────────────
        case 'pc_status': {
          if (!command.pcId) throw new Error('PC non trouvé');
          if (!command.pcStatus) throw new Error('Statut non reconnu');

          const { error } = await supabase.from('pc_portables')
            .update({ status: command.pcStatus })
            .eq('id', command.pcId);
            
          if (error) throw error;

          return {
            success: true,
            message: `Le PC ${command.pcHostname} est maintenant en statut : ${command.pcStatus.replace('_', ' ')}`,
          };
        }

        // ── TRANSFERT DE PC ──────────────────────────────────────────────
        case 'pc_transfert': {
          if (!command.pcId) throw new Error('PC non trouvé');
          if (!command.targetSiteId) throw new Error('Site de destination introuvable');

          const { error } = await supabase.from('pc_portables')
            .update({ site: String(command.targetSiteId) })
            .eq('id', command.pcId);
            
          if (error) throw error;

          // Note: S'il existe une table historique_affectations, on pourrait l'insérer ici.
          return {
            success: true,
            message: `Le PC ${command.pcHostname} a été transféré vers ${command.targetSiteLabel}`,
          };
        }

        // ── CHANGEMENT DE SITE ───────────────────────────────────────────
        case 'site_change': {
          if (!command.targetSiteId) throw new Error('Site non reconnu');

          // Mettre à jour le site actif via Redux
          // selectSite est un AsyncThunk qui met aussi à jour AsyncStorage
          await dispatch(selectSite(command.targetSiteId) as any);

          return {
            success: true,
            message: `Site changé avec succès.`,
          };
        }

        default:
          return { success: false, message: 'Commande non reconnue' };
      }
    } catch (err: any) {
      console.error('Erreur exécution commande vocale:', err);
      return { success: false, message: err.message ?? 'Erreur inconnue' };
    } finally {
      setIsExecuting(false);
    }
  };

  return { executeCommand, isExecuting };
};
