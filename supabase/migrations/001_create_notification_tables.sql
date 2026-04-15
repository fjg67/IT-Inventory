-- ============================================
-- StockPro v2.15 - Setup des tables de notification
-- ============================================
-- Exécutez ce SQL dans l'éditeur SQL de Supabase
-- ou via: supabase db push

-- ============================================
-- 1. TABLE: Campagnes d'email
-- ============================================
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name TEXT NOT NULL,
  success_count INT DEFAULT 0,
  failure_count INT DEFAULT 0,
  total_count INT DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  sent_at TIMESTAMP,
  errors JSONB, -- Stocke les erreurs en JSON
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

COMMENT ON TABLE email_campaigns IS 'Journalise les campagnes d''emission d''emails';

-- ============================================
-- 2. TABLE: Campagnes de notification push
-- ============================================
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

COMMENT ON TABLE notification_campaigns IS 'Journalise les campagnes de notifications push';

-- ============================================
-- 3. TABLE: Log des emails par utilisateur
-- ============================================
CREATE TABLE IF NOT EXISTS user_email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

COMMENT ON TABLE user_email_log IS 'Journal détaillé des emails envoyés par utilisateur';

CREATE INDEX IF NOT EXISTS idx_user_email_log_campaign 
  ON user_email_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_user_email_log_user 
  ON user_email_log(user_id);

-- ============================================
-- 4. TABLE: Log des notifications par utilisateur
-- ============================================
CREATE TABLE IF NOT EXISTS user_notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES notification_campaigns(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

COMMENT ON TABLE user_notification_log IS 'Journal détaillé des notifications push envoyées';

CREATE INDEX IF NOT EXISTS idx_user_notification_log_campaign 
  ON user_notification_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_log_user 
  ON user_notification_log(user_id);

-- ============================================
-- 5. INDEX pour les perfomances
-- ============================================
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at 
  ON email_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status 
  ON email_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_created_at 
  ON notification_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_status 
  ON notification_campaigns(status);

-- ============================================
-- 6. VUES UTILES
-- ============================================

-- Vue: Résumé des campagnes d'email
CREATE OR REPLACE VIEW email_campaigns_summary AS
SELECT 
  id,
  campaign_name,
  success_count,
  failure_count,
  total_count,
  ROUND(CAST(success_count AS NUMERIC) / NULLIF(total_count, 0) * 100, 2) as success_rate,
  status,
  sent_at,
  created_at,
  COALESCE(
    jsonb_array_length(errors), 
    0
  ) as error_count
FROM email_campaigns
ORDER BY created_at DESC;

-- Vue: Résumé des campagnes de notification
CREATE OR REPLACE VIEW notification_campaigns_summary AS
SELECT 
  id,
  campaign_name,
  success_count,
  failure_count,
  total_count,
  ROUND(CAST(success_count AS NUMERIC) / NULLIF(total_count, 0) * 100, 2) as success_rate,
  status,
  sent_at,
  created_at
FROM notification_campaigns
ORDER BY created_at DESC;

-- ============================================
-- 7. TRIGGERS pour mise à jour auto
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger sur email_campaigns
DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns;
CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger sur notification_campaigns
DROP TRIGGER IF EXISTS update_notification_campaigns_updated_at ON notification_campaigns;
CREATE TRIGGER update_notification_campaigns_updated_at
  BEFORE UPDATE ON notification_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. GRANT PERMISSIONS (adapter à votre config)
-- ============================================

-- Les utilisateurs authentifiés peuvent voir leurs propres logs
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_log ENABLE ROW LEVEL SECURITY;

-- Politique: Admins peuvent voir tout
CREATE POLICY admin_can_view_email_campaigns 
  ON email_campaigns FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY admin_can_view_notification_campaigns 
  ON notification_campaigns FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 9. EXEMPLE DE REQUÊTE POUR VÉRIFIER
-- ============================================

/*
-- Voir les 10 dernières campagnes d'email
SELECT * FROM email_campaigns_summary LIMIT 10;

-- Voir le taux de succès d'une campagne
SELECT 
  campaign_name,
  total_count,
  success_count,
  failure_count,
  success_rate,
  sent_at
FROM email_campaigns_summary
WHERE campaign_name = 'StockPro v2.15 Update';

-- Voir les erreurs d'une campagne
SELECT 
  campaign_name,
  errors
FROM email_campaigns
WHERE campaign_name = 'StockPro v2.15 Update'
  AND errors IS NOT NULL;

-- Voir les détails des emails qui ont échoué
SELECT 
  user_id,
  email,
  error_message,
  sent_at
FROM user_email_log
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;
*/

-- ============================================
-- ✅ SETUP COMPLÈTE !
-- ============================================
-- Les tables sont prêtes à recevoir les données
-- Vous pouvez maintenant exécuter:
-- 1. node scripts/send-update-emails.js
-- 2. curl pour la fonction send-update-notification
