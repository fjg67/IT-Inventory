/**
 * Supabase Edge Function - Envoie les notifications push de mise à jour v2.15
 * Utilise Firebase Cloud Messaging
 * 
 * Deploy: supabase functions deploy send-update-notification
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FIREBASE_API_KEY = Deno.env.get('FIREBASE_API_KEY');
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface NotificationRequest {
  targetUsers?: string[]; // Si vide, envoie à tous
  dryRun?: boolean; // Teste sans envoyer
}

interface FirebaseNotification {
  title: string;
  body: string;
  image?: string;
}

interface FirebaseData {
  [key: string]: string;
}

interface AndroidConfig {
  priority: 'high' | 'normal';
  notification?: {
    title: string;
    body: string;
    icon: string;
    color: string;
    clickAction: string;
  };
}

interface Message {
  token: string;
  notification?: FirebaseNotification;
  data?: FirebaseData;
  android?: AndroidConfig;
  webpush?: {
    headers: {
      TTL: string;
    };
    data?: FirebaseData;
    notification?: {
      title: string;
      body: string;
      icon: string;
      badge: string;
      tag: string;
    };
  };
}

/**
 * Récupère tous les tokens FCM des utilisateurs
 */
async function getFCMTokens(targetUsers?: string[]) {
  let query = supabase
    .from('user_devices')
    .select('user_id, fcm_token, device_type')
    .not('fcm_token', 'is', null);

  if (targetUsers && targetUsers.length > 0) {
    query = query.in('user_id', targetUsers);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erreur récupération tokens: ${error.message}`);
  }

  return data || [];
}

/**
 * Envoie une notification via Firebase Cloud Messaging
 */
async function sendFCMNotification(tokens: string[], notification: FirebaseNotification, data: FirebaseData) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as { token: string; error: string }[],
  };

  for (const token of tokens) {
    try {
      const message: Message = {
        token,
        notification,
        data,
        android: {
          priority: 'high',
          notification: {
            title: notification.title,
            body: notification.body,
            icon: 'ic_notification',
            color: '#667eea',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        webpush: {
          headers: {
            TTL: '3600',
          },
          data,
          notification: {
            title: notification.title,
            body: notification.body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: 'it-inventory-update',
          },
        },
      };

      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${FIREBASE_API_KEY}`,
          },
          body: JSON.stringify({ message }),
        }
      );

      if (response.ok) {
        results.success++;
      } else {
        const error = await response.text();
        results.failed++;
        results.errors.push({ token: token.substring(0, 20), error });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        token: token.substring(0, 20),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Journalise la campagne de notification
 */
async function logNotificationCampaign(
  totalSent: number,
  successCount: number,
  failureCount: number,
  errors: Array<{ token: string; error: string }>
) {
  const { error } = await supabase
    .from('notification_campaigns')
    .insert({
      campaign_name: 'IT_Inventory v2.15 Update',
      campaign_type: 'push_notification',
      success_count: successCount,
      failure_count: failureCount,
      total_count: totalSent,
      status: 'completed',
      sent_at: new Date().toISOString(),
      errors: errors.length > 0 ? JSON.stringify(errors.slice(0, 10)) : null,
    });

  if (error) {
    console.error('⚠️ Erreur journalisation:', error);
  }
}

serve(async (req: Request) => {
  // Vérifier la méthode
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: NotificationRequest = await req.json();
    const { targetUsers, dryRun = false } = body;

    console.log('📱 Démarrage de la campagne de notifications push');
    console.log(`Mode test: ${dryRun}`);

    // Récupérer les tokens FCM
    const devices = await getFCMTokens(targetUsers);
    const tokens = devices.map(d => d.fcm_token);

    console.log(`📊 ${tokens.length} appareils à notifier`);

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Aucun appareil à notifier',
          sent: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Préparer la notification
    const notification: FirebaseNotification = {
      title: '🎉 IT_Inventory v2.15 est disponible !',
      body: 'Découvrez le nouvel onglet Parc PC avec un design époustouflant',
      image: 'https://play-lh.googleusercontent.com/...',
    };

    const data: FirebaseData = {
      updateUrl: 'https://play.google.com/store/apps/details?id=com.itinventory',
      version: '2.15',
      campaignId: 'it-inventory-v2.15-update',
      deepLink: 'itinventory://update',
    };

    if (dryRun) {
      console.log('✅ Mode TEST - Pas d\'envoi réel');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Mode test - Pas d\'envoi effectué',
          wouldSend: tokens.length,
          notification,
          data,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Envoyer les notifications
    const results = await sendFCMNotification(tokens, notification, data);

    console.log(`✅ Succès: ${results.success}`);
    console.log(`❌ Échecs: ${results.failed}`);

    // Journaliser
    await logNotificationCampaign(tokens.length, results.success, results.failed, results.errors);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications envoyées',
        stats: {
          total: tokens.length,
          success: results.success,
          failed: results.failed,
          rate: ((results.success / tokens.length) * 100).toFixed(2) + '%',
        },
        errors: results.errors.slice(0, 5), // Retourner les 5 premières erreurs
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Erreur:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
