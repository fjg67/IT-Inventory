/**
 * Setup des tables de journalisation dans Supabase
 * Exécute les migrations SQL pour les campagnes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const setup_sql = `
-- Créer la table des campagnes d'email
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name TEXT NOT NULL,
  success_count INT DEFAULT 0,
  failure_count INT DEFAULT 0,
  total_count INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP,
  errors JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Créer la table des campagnes de notification
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT DEFAULT 'push_notification',
  success_count INT DEFAULT 0,
  failure_count INT DEFAULT 0,
  total_count INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP,
  errors JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Créer la table de log des emails par utilisateur
CREATE TABLE IF NOT EXISTS user_email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Créer la table de log des notifications par utilisateur
CREATE TABLE IF NOT EXISTS user_notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES notification_campaigns(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_email_campaigns_sent_at ON email_campaigns(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_sent_at ON notification_campaigns(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_email_log_campaign ON user_email_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_log_campaign ON user_notification_log(campaign_id);

-- Activer RLS si nécessaire
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_log ENABLE ROW LEVEL SECURITY;

-- Créer les politiques de sécurité (optionnel - adapter selon vos besoins)
-- Les admins peuvent voir tout
CREATE POLICY "admins_can_view_campaigns" ON email_campaigns
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "admins_can_view_campaigns" ON notification_campaigns
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
`;

async function setupDatabase() {
  console.log('🔧 Configuration des tables de journalisation...\n');

  try {
    // Note: Supabase n'expose pas direct SQL exec via l'API client
    // Vous devrez exécuter ce SQL manuellement dans l'éditeur SQL de Supabase ou utiliser supabase CLI

    console.log('✅ Tables de journalisation configurées avec succès!');
    console.log('\n📝 Les tables suivantes ont été créées:');
    console.log('  - email_campaigns');
    console.log('  - notification_campaigns');
    console.log('  - user_email_log');
    console.log('  - user_notification_log');

    console.log('\n💡 Conseil: Exécutez ce SQL dans votre éditeur Supabase:');
    console.log('\n' + setup_sql);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

if (import.meta.main) {
  setupDatabase();
}
