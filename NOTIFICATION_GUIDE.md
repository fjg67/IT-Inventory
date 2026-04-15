# 🚀 Guide d'envoi - StockPro v2.15 Update

Ce guide vous explique comment envoyer les notifications de mise à jour à tous vos utilisateurs via :
1. **Emails** (méthode 1)
2. **Notifications Push** (méthode 3)

---

## 📋 Prérequis

### Option 1 : Email HTML
- ✅ Template créé : `email-templates/update-notification.html`
- Service d'email : Gmail, SendGrid, ou autre SMTP

### Option 3 : Notifications Push
- ✅ Firebase Cloud Messaging (FCM) configuré
- Tokens FCM stockés dans la table `user_devices`

---

## 🔧 Installation

### 1. Cloner les fichiers

```bash
# Scripts d'envoi d'emails
scripts/send-update-emails.js

# Fonction cloud Supabase pour les notifications
supabase/functions/send-update-notification/index.ts

# Template HTML
email-templates/update-notification.html
```

### 2. Installer les dépendances

#### Pour les emails (Node.js):
```bash
npm install dotenv @supabase/supabase-js nodemailer
# OU si vous utilisez SendGrid:
npm install @sendgrid/mail
```

#### Pour les notifications push (Supabase):
```bash
supabase functions deploy send-update-notification
```

---

## 📧 Méthode 1 : Envoyer les Emails

### Étape 1 : Configurer les variables d'environnement

Créer un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Remplir les valeurs :

**Avec Gmail:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

EMAIL_SERVICE=smtp
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_REPLY_TO=support@yourdomain.com
```

**Avec SendGrid:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.your_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Étape 2 : Tester l'envoi (optionnel)

```bash
# Mode test - N'envoie pas réellement
node scripts/send-update-emails.js --dry-run
```

### Étape 3 : Lancer l'envoi

```bash
node scripts/send-update-emails.js
```

**Résultat attendu:**
```
📋 Récupération des utilisateurs...
✅ 245 utilisateurs trouvés

📧 Envoi des emails (délai: 500ms entre chaque)...

✅ [1/245] Email envoyé à user1@example.com
✅ [2/245] Email envoyé à user2@example.com
...

📊 RÉSUMÉ DE LA CAMPAGNE
✅ Succès: 243
❌ Échecs: 2
📈 Taux de réussite: 99.18%

✅ Résultats journalisés dans la base de données
```

---

## 📱 Méthode 3 : Envoyer les Notifications Push

### Étape 1 : Configurer Firebase

Ajouter à votre `.env` :

```env
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your-firebase-project-id
```

### Étape 2 : Déployer la fonction Supabase

```bash
supabase functions deploy send-update-notification
```

### Étape 3 : Tester en mode dry-run

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-update-notification \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{
    "dryRun": true
  }'
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Mode test - Pas d'envoi effectué",
  "wouldSend": 245,
  "notification": {...},
  "data": {...}
}
```

### Étape 4 : Envoyer les notifications réelles

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-update-notification \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{
    "dryRun": false
  }'
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Notifications envoyées",
  "stats": {
    "total": 245,
    "success": 240,
    "failed": 5,
    "rate": "98.00%"
  }
}
```

### Ciblé un groupe d'utilisateurs (optionnel)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-update-notification \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUsers": ["user_id_1", "user_id_2", "user_id_3"]
  }'
```

---

## 📊 Suivi des campagnes

### Tables de journalisation créées automatiquement

#### 1. `email_campaigns`
```sql
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name TEXT,
  success_count INT,
  failure_count INT,
  total_count INT,
  status TEXT,
  sent_at TIMESTAMP,
  errors JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

#### 2. `notification_campaigns`
```sql
CREATE TABLE notification_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name TEXT,
  campaign_type TEXT,
  success_count INT,
  failure_count INT,
  total_count INT,
  status TEXT,
  sent_at TIMESTAMP,
  errors JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

### Consulter les résultats dans Supabase

```sql
-- Voir tous les envois d'emails
SELECT * FROM email_campaigns ORDER BY sent_at DESC;

-- Voir tous les envois de notifications push
SELECT * FROM notification_campaigns ORDER BY sent_at DESC;

-- Historique complet par utilisateur
SELECT * FROM user_email_log WHERE campaign_id = 'xxx';
```

---

## ⚠️ Recommandations

### Avant d'envoyer à TOUS les utilisateurs:

1. **Testez d'abord** avec un petit groupe
2. **Vérifiez les templates** (surtout le lien Play Store)
3. **Vérifiez votre quota** d'emails/SMS
4. **Programmez les envois** pendant les heures creuses
5. **Attendez les confirmations** avant d'envoyer massivement

### Limites à respecter:

- Gmail : ~500 emails/jour (compte personnel)
- SendGrid : Selon votre plan
- Firebase FCM : Illimitié pour les notifications push
- Supabase : Limites selon votre abonnement

---

## 🐛 Dépannage

### L'email n'est pas envoyé

**Problème**: Authentification Gmail échouée
**Solution**: 
1. Activer l'authentification 2FA
2. Créer un mot de passe d'application
3. Utiliser ce mot de passe dans `.env`

**Problème**: "Invalid credentials"
**Solution**: Vérifier les espaces/caractères spéciaux dans `.env`

### Les notifications push ne s'affichent pas

**Problème**: Tokens FCM expirés ou invalides
**Solution**: 
1. Vérifier que l'app récupère bien les tokens
2. Nettoyer les vieux tokens
3. Tester avec un appareil récent

**Problème**: Firebase non configuré
**Solution**: Vérifier `google-services.json` dans l'app Android

---

## 📞 Support

Besoin d'aide? Vérifiez:
1. Les logs du terminal
2. Les tables `email_campaigns` et `notification_campaigns`
3. La console Supabase pour les erreurs de fonction
4. La console Firebase pour les erreurs FCM

---

## 🎉 Résultat

Une fois les envois complétés:

✅ Tous les utilisateurs reçoivent la notification  
✅ Historique complet dans Supabase  
✅ Taux de succès mesuré  
✅ Lien direct vers le Play Store  

**Félicitations! Votre campagne de mise à jour est prête! 🚀**
