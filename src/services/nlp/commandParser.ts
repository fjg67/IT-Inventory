import { PanneType, PCStatus } from '@/types/pc.types';
import { ParsedVoiceCommand, VoiceActionType } from '@/types/voice.types';

// ─── Mots-clés d'action ──────────────────────────────────────────────────
const ENTRY_KEYWORDS  = ['entrée', 'ajouter', 'reçu', 'réceptionner', 'réception', 'reception', 'rentrer', 'rentrée', 'ajoute', 'ajout'];
const EXIT_KEYWORDS   = ['sortie', 'sortir', 'retirer', 'retire', 'enlever', 'enlève', 'distribuer', 'donner', 'sors', 'utilise', 'utilisé', 'utilisée'];
const QUERY_KEYWORDS  = ['combien', 'quantité', 'voir', 'reste', 'restant', 'disponible'];
const AJUSTEMENT_KEYWORDS = ['ajuster', 'mettre à jour', 'modifier à', 'corriger à'];
const TRANSFERT_KEYWORDS = ['transférer', 'transfert', 'déplacer', 'envoyer'];
const PC_KEYWORDS     = ['pc', 'portable', 'ordinateur', 'laptop', 'machine'];
const PANNE_KEYWORDS  = ['panne', 'cassé', 'défaillant', 'hs', 'défectueux', 'défectueuse', 'problème', 'souci'];
const SITE_KEYWORDS   = ['changer de site', 'aller sur', 'basculer vers', 'changer vers'];
const STATUT_KEYWORDS = ['statut', 'passer en', 'mettre en', 'est maintenant', 'devient'];

// ─── Stop words (mots à ignorer) ─────────────────────────────────────────
const STOP_WORDS = [
  'de', 'des', 'les', 'le', 'la', 'un', 'une', 'pour', 'en', 'stock', 'unités', 'unité',
  's\'il', 'te', 'plait', 'plaît', 'svp', 'je', 'voudrais', 'veux', 'il', 'me', 'faut',
  'mets', 'moi', 'ce', 'matin', 'cet', 'après-midi', 'aujourd\'hui', 'fait', 'fais',
  'sont', 'est', 'a', 'y', 'qui', 'vers', 'au', 'sur', 'dans'
];

// ─── Mots-clés de type de panne et statuts PC ────────────────────────────
const PANNE_TYPE_MAP: Record<string, PanneType> = {
  'matérielle': 'materielle', 'matériel': 'materielle', 'hardware': 'materielle',
  'logicielle': 'logicielle', 'logiciel': 'logicielle', 'software': 'logicielle',
  'batterie':   'batterie',   'pile': 'batterie',
  'réseau':     'reseau',     'wifi': 'reseau', 'résau': 'reseau', 'internet': 'reseau',
  'autre':      'autre',
};

const PC_STATUS_MAP: Record<string, PCStatus> = {
  'disponible': 'disponible', 'prêt': 'disponible', 'libre': 'disponible',
  'à chaud': 'a_chaud', 'chaud': 'a_chaud',
  'en usinage': 'en_usinage', 'usinage': 'en_usinage', 'préparation': 'en_usinage',
  'à réusiner': 'a_reusiner', 'réusiner': 'a_reusiner', 'formater': 'a_reusiner',
  'envoyé': 'envoye', 'expédié': 'envoye',
  'en panne': 'en_panne', 'panne': 'en_panne'
};

// ─── Extraction de quantité ──────────────────────────────────────────────
const NUMBER_WORDS: Record<string, number> = {
  'un':1,'une':1,'deux':2,'trois':3,'quatre':4,'cinq':5,'six':6,
  'sept':7,'huit':8,'neuf':9,'dix':10,'onze':11,'douze':12,'treize':13,
  'quatorze':14,'quinze':15,'seize':16,'vingt':20,'trente':30,
  'quarante':40,'cinquante':50,'soixante':60,'cent':100
};

// Fonction utilitaire pour échapper les regex
const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const parseVoiceCommand = (text: string): Partial<ParsedVoiceCommand> => {
  let t = text.toLowerCase().trim();
  const originalText = t;

  // ── Détection du type d'action ──
  const isEntry   = ENTRY_KEYWORDS.some(k => t.includes(k));
  const isExit    = EXIT_KEYWORDS.some(k => t.includes(k));
  const isQuery   = QUERY_KEYWORDS.some(k => t.includes(k));
  const isAjustement = AJUSTEMENT_KEYWORDS.some(k => t.includes(k));
  const isTransfert = TRANSFERT_KEYWORDS.some(k => t.includes(k));
  const isPCPanne = PC_KEYWORDS.some(k => t.includes(k)) && PANNE_KEYWORDS.some(k => t.includes(k));
  const isPCStatus = PC_KEYWORDS.some(k => t.includes(k)) && (STATUT_KEYWORDS.some(k => t.includes(k)) || Object.keys(PC_STATUS_MAP).some(k => t.includes(` ${k}`) || t.startsWith(k)));
  const isSite    = SITE_KEYWORDS.some(k => t.includes(k));
  const isPC      = PC_KEYWORDS.some(k => t.includes(k));

  // ── Détermination de l'action principale ──
  let actionType: VoiceActionType = 'unknown';
  if (isSite) actionType = 'site_change';
  else if (isTransfert && isPC) actionType = 'pc_transfert';
  else if (isTransfert) actionType = 'stock_transfert';
  else if (isPCPanne) actionType = 'pc_panne';
  else if (isPCStatus) actionType = 'pc_status';
  else if (isAjustement) actionType = 'stock_ajustement';
  else if (isEntry) actionType = 'stock_entree';
  else if (isExit) actionType = 'stock_sortie';
  else if (isQuery) actionType = 'stock_consultation';

  // ── Extraction de la quantité ──
  let quantity = 1;
  let matchedQuantityWord = '';
  
  if (['stock_entree', 'stock_sortie', 'stock_ajustement', 'stock_transfert'].includes(actionType)) {
    const numMatch = t.match(/\b(\d+)\b/);
    if (numMatch) {
      quantity = parseInt(numMatch[1], 10);
      matchedQuantityWord = numMatch[1];
    } else {
      const sortedWords = Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length);
      for (const word of sortedWords) {
        if (new RegExp(`\\b${word}\\b`).test(t)) {
          quantity = NUMBER_WORDS[word];
          matchedQuantityWord = word;
          break;
        }
      }
    }
  }

  // ── Extraction des cibles (Site) pour les transferts ──
  let targetSiteRaw: string | undefined = undefined;
  if (['stock_transfert', 'pc_transfert'].includes(actionType)) {
    // Cherche "vers XXX", "sur XXX", "au XXX"
    const targetMatch = t.match(/(?:vers|sur|au|à)\s+(.+)$/i);
    if (targetMatch) {
      targetSiteRaw = targetMatch[1].trim();
      // Enlève la cible du texte restant pour ne pas polluer l'article
      t = t.replace(targetMatch[0], ' ');
    }
  }

  // ── Nettoyage pour extraire l'Article / Hostname ──
  let remainingText = t;

  const allKeywords = [
    ...(actionType === 'stock_entree' ? ENTRY_KEYWORDS : []),
    ...(actionType === 'stock_sortie' ? EXIT_KEYWORDS : []),
    ...(actionType === 'stock_consultation' ? QUERY_KEYWORDS : []),
    ...(actionType === 'stock_ajustement' ? AJUSTEMENT_KEYWORDS : []),
    ...(['stock_transfert', 'pc_transfert'].includes(actionType) ? TRANSFERT_KEYWORDS : []),
    ...(['pc_panne', 'pc_status', 'pc_transfert'].includes(actionType) ? PC_KEYWORDS : []),
    ...(actionType === 'pc_panne' ? PANNE_KEYWORDS : []),
    ...(actionType === 'pc_status' ? STATUT_KEYWORDS : []),
    ...(actionType === 'site_change' ? SITE_KEYWORDS : []),
  ];
  allKeywords.sort((a, b) => b.length - a.length);
  
  for (const kw of allKeywords) {
    remainingText = remainingText.replace(new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'gi'), ' ');
  }

  if (matchedQuantityWord) {
    remainingText = remainingText.replace(new RegExp(`\\b${matchedQuantityWord}\\b`, 'gi'), ' ');
  }

  // Types de pannes et Statuts
  let panneType: PanneType | undefined;
  let pcStatus: PCStatus | undefined;

  if (actionType === 'pc_panne') {
    for (const [kw, type] of Object.entries(PANNE_TYPE_MAP)) {
      if (new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i').test(t)) {
        panneType = type;
        remainingText = remainingText.replace(new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'gi'), ' ');
      }
    }
  }

  if (actionType === 'pc_status') {
    for (const [kw, stat] of Object.entries(PC_STATUS_MAP)) {
      if (new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i').test(t)) {
        pcStatus = stat;
        remainingText = remainingText.replace(new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'gi'), ' ');
      }
    }
  }

  for (const sw of STOP_WORDS) {
    remainingText = remainingText.replace(new RegExp(`\\b${sw}\\b`, 'gi'), ' ');
  }

  remainingText = remainingText.replace(/\s+/g, ' ').trim();

  // ── Cas Spécifiques ──
  let articleName: string | undefined = undefined;
  let pcHostname: string | undefined = undefined;

  if (['pc_panne', 'pc_status', 'pc_transfert'].includes(actionType)) {
    const pcMatch = originalText.match(/\b([a-z]+[0-9]+[a-z0-9]*)\b/i);
    if (pcMatch) {
      pcHostname = pcMatch[1].toUpperCase();
    } else if (remainingText.length > 0) {
      pcHostname = remainingText.toUpperCase().split(' ')[0];
    }
  } else if (actionType === 'site_change') {
    targetSiteRaw = remainingText;
  } else {
    articleName = remainingText;
  }

  // ── Calcul de confiance ──
  let confidence = 0;
  if (actionType !== 'unknown') {
    confidence = 0.8;
    if (quantity > 1 || matchedQuantityWord !== '') confidence += 0.1;
    if (articleName && articleName.length > 2) confidence += 0.05;
    if (['stock_transfert', 'pc_transfert'].includes(actionType) && targetSiteRaw) confidence += 0.1;
    if (actionType === 'pc_status' && pcStatus) confidence += 0.1;
  }

  return {
    rawText:     text,
    actionType,
    confidence,
    articleName: articleName || undefined,
    quantity,
    pcHostname,
    panneType,
    pcStatus,
    targetSiteRaw
  };
};
