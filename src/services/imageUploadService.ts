// ============================================
// IMAGE UPLOAD SERVICE - IT-Inventory Application
// Upload d'images vers Supabase Storage
// ============================================

import { Platform } from 'react-native';
import { getSupabaseClient } from '@/api/supabase';
import RNFS from 'react-native-fs';

const BUCKET_NAME = 'article-photos';

/**
 * Vérifie et crée le bucket si nécessaire
 */
async function ensureBucketExists(): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets ?? []).some((b: { name: string }) => b.name === BUCKET_NAME);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5 MB max
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
    if (error && !error.message.includes('already exists')) {
      console.warn('[ImageUpload] Impossible de créer le bucket:', error.message);
    }
  }
}

/**
 * Génère un nom de fichier unique pour l'image
 */
function generateFileName(articleRef: string): string {
  const timestamp = Date.now();
  const safeRef = articleRef.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safeRef}_${timestamp}.jpg`;
}

/**
 * Vérifie si une URI est une URL distante (déjà uploadée)
 */
export function isRemoteUrl(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

/**
 * Upload une image locale vers Supabase Storage
 * @param localUri URI locale de l'image (file://...)
 * @param articleRef Référence de l'article (pour nommer le fichier)
 * @returns URL publique de l'image uploadée
 */
export async function uploadArticleImage(
  localUri: string,
  articleRef: string,
): Promise<string> {
  // Si c'est déjà une URL distante, pas besoin d'uploader
  if (isRemoteUrl(localUri)) {
    return localUri;
  }

  const supabase = getSupabaseClient();

  // S'assurer que le bucket existe
  await ensureBucketExists();

  const fileName = generateFileName(articleRef);
  const filePath = `articles/${fileName}`;

  // Lire le fichier en base64
  const cleanUri = Platform.OS === 'android'
    ? localUri.replace('file://', '')
    : localUri;

  const base64Data = await RNFS.readFile(cleanUri, 'base64');

  // Convertir base64 en ArrayBuffer pour l'upload
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Upload vers Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, bytes.buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Erreur upload image: ${uploadError.message}`);
  }

  // Obtenir l'URL publique
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Supprime une image de Supabase Storage
 * @param publicUrl URL publique de l'image
 */
export async function deleteArticleImage(publicUrl: string): Promise<void> {
  if (!isRemoteUrl(publicUrl)) return;

  const supabase = getSupabaseClient();

  // Extraire le chemin du fichier depuis l'URL
  const match = publicUrl.match(/article-photos\/(.+)$/);
  if (!match) return;

  const filePath = match[1];
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.warn('[ImageUpload] Erreur suppression image:', error.message);
  }
}
