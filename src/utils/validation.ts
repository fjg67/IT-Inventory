// ============================================
// VALIDATION UTILITIES - IT-Inventory Application
// ============================================

import { ERROR_MESSAGES } from '@/constants';
import { MouvementStockForm, TransfertForm, ArticleForm } from '@/types';

/**
 * Résultat de validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Valide qu'une valeur n'est pas vide
 */
export function isNotEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Valide un nombre positif
 */
export function isPositiveNumber(value: unknown): boolean {
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  }
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Valide un nombre positif ou zéro
 */
export function isNonNegativeNumber(value: unknown): boolean {
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  }
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Valide un entier positif
 */
export function isPositiveInteger(value: unknown): boolean {
  if (typeof value === 'string') {
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0 && Number.isInteger(num);
  }
  return typeof value === 'number' && !isNaN(value) && value > 0 && Number.isInteger(value);
}

/**
 * Valide une référence article (alphanumérique, tirets, underscores)
 */
export function isValidReference(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const pattern = /^[A-Za-z0-9\-_]+$/;
  return pattern.test(value.trim()) && value.trim().length >= 2;
}

/**
 * Valide un formulaire de mouvement
 */
export function validateMouvementForm(
  form: Partial<MouvementStockForm>,
  stockActuel: number,
): ValidationResult {
  const errors: Record<string, string> = {};

  // Article requis
  if (!form.articleId || form.articleId <= 0) {
    errors.articleId = 'Veuillez sélectionner un article';
  }

  // Site requis
  if (!form.siteId || form.siteId <= 0) {
    errors.siteId = 'Veuillez sélectionner un site';
  }

  // Type requis
  if (!form.type || !['entree', 'sortie', 'ajustement'].includes(form.type)) {
    errors.type = 'Type de mouvement invalide';
  }

  // Quantité requise et positive
  if (!isPositiveInteger(form.quantite)) {
    errors.quantite = ERROR_MESSAGES.INVALID_QUANTITY;
  } else if (form.type === 'sortie' && (form.quantite ?? 0) > stockActuel) {
    errors.quantite = `${ERROR_MESSAGES.STOCK_INSUFFICIENT} (Stock actuel: ${stockActuel})`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valide un formulaire de transfert
 */
export function validateTransfertForm(
  form: Partial<TransfertForm>,
  stockActuelDepart: number,
): ValidationResult {
  const errors: Record<string, string> = {};

  // Article requis
  if (!form.articleId || form.articleId <= 0) {
    errors.articleId = 'Veuillez sélectionner un article';
  }

  // Site départ requis
  if (!form.siteDepartId || form.siteDepartId <= 0) {
    errors.siteDepartId = 'Veuillez sélectionner le site de départ';
  }

  // Site arrivée requis
  if (!form.siteArriveeId || form.siteArriveeId <= 0) {
    errors.siteArriveeId = 'Veuillez sélectionner le site de destination';
  }

  // Sites différents
  if (form.siteDepartId && form.siteArriveeId && form.siteDepartId === form.siteArriveeId) {
    errors.siteArriveeId = 'Le site de destination doit être différent du site de départ';
  }

  // Quantité requise et positive
  if (!isPositiveInteger(form.quantite)) {
    errors.quantite = ERROR_MESSAGES.INVALID_QUANTITY;
  } else if ((form.quantite ?? 0) > stockActuelDepart) {
    errors.quantite = `${ERROR_MESSAGES.STOCK_INSUFFICIENT} (Stock disponible: ${stockActuelDepart})`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valide un formulaire d'article
 */
export function validateArticleForm(form: Partial<ArticleForm>): ValidationResult {
  const errors: Record<string, string> = {};

  // Référence requise et valide
  if (!form.reference || !form.reference.trim()) {
    errors.reference = 'La référence est requise';
  } else if (!isValidReference(form.reference)) {
    errors.reference = 'La référence doit contenir uniquement des lettres, chiffres, tirets et underscores';
  }

  // Nom requis
  if (!form.nom || !form.nom.trim()) {
    errors.nom = 'Le nom est requis';
  } else if (form.nom.trim().length < 2) {
    errors.nom = 'Le nom doit contenir au moins 2 caractères';
  }

  // Stock mini positif ou zéro
  if (form.stockMini !== undefined && !isNonNegativeNumber(form.stockMini)) {
    errors.stockMini = 'Le stock minimum doit être un nombre positif ou zéro';
  }

  // Unité requise
  if (!form.unite || !form.unite.trim()) {
    errors.unite = "L'unité est requise";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valide un code-barres
 */
export function isValidBarcode(barcode: string): boolean {
  if (!barcode || typeof barcode !== 'string') return false;
  const trimmed = barcode.trim();
  // EAN-13, EAN-8, UPC-A, Code 128, etc.
  return trimmed.length >= 4 && trimmed.length <= 128;
}

/**
 * Nettoie et normalise une chaîne
 */
export function sanitizeString(value: string): string {
  if (!value || typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Parse un nombre depuis une chaîne
 */
export function parseNumber(value: string | number): number | null {
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse un entier depuis une chaîne
 */
export function parseInteger(value: string | number): number | null {
  if (typeof value === 'number') {
    return isNaN(value) || !Number.isInteger(value) ? null : value;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}
