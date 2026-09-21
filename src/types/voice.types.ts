import { PanneType, PCStatus } from './pc.types';
import { Site } from './models';

// Les types d'actions vocales supportées
export type VoiceActionType =
  | 'stock_entree'        // "entrée de X [article]"
  | 'stock_sortie'        // "sortie de X [article]"
  | 'stock_ajustement'    // "ajuster le stock de X à Y"
  | 'stock_transfert'     // "transférer X [article] vers [site]"
  | 'stock_consultation'  // "combien de [article]"
  | 'pc_panne'            // "PC [hostname] en panne [type]"
  | 'pc_status'           // "PC [hostname] est disponible"
  | 'pc_transfert'        // "transférer PC [hostname] vers [site]"
  | 'site_change'         // "changer de site [nom]"
  | 'unknown';            // commande non reconnue

export interface ParsedVoiceCommand {
  rawText:      string;           // texte brut reconnu
  actionType:   VoiceActionType;
  confidence:   number;           // 0-1 (confiance du parsing)

  // Pour articles (entree, sortie, ajustement, transfert, consultation)
  articleName?: string;           // nom brut prononcé
  articleId?:   string;           // ID Supabase résolu
  articleLabel?:string;           // nom propre de l'article
  quantity?:    number;           // quantité prononcée

  // Pour PCs (panne, status, transfert)
  pcHostname?:  string;
  pcId?:        string;
  panneType?:   PanneType;
  pcStatus?:    PCStatus;         // statut cible du PC

  // Pour transferts et changements de site
  targetSiteRaw?: string;         // nom brut du site cible prononcé
  targetSiteId?:string | number;  // ID du site cible résolu
  targetSiteLabel?: string;       // nom propre du site cible

  // Contexte de l'exécution
  siteId:       string | number;  // ID du site actif (Redux)
  executedBy:   string | number;  // userId du technicien (Redux)
}

export type VoiceModalState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'confirm'
  | 'executing'
  | 'success'
  | 'error';

export interface VoiceError {
  code:    'NOT_FOUND' | 'AMBIGUOUS' | 'NO_PERMISSION' | 'NETWORK' | 'PARSE_FAILED';
  message: string;
  suggestions?: string[];   // articles similaires si NOT_FOUND
}
