# ⚡ Démarrage Rapide - Notifications StockPro v2.15

## 🚀 En 5 minutes

### Étape 1 : Préparer l'environnement
```bash
# Copier la configuration
cp .env.example .env

# Éditer .env avec vos données
# Gmail: EMAIL_USER et EMAIL_PASSWORD
# SendGrid: SENDGRID_API_KEY
# Supabase: SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
```

### Étape 2 : Installer les dépendances
```bash
npm install -g supabase
npm install dotenv @supabase/supabase-js nodemailer

# Si vous utilisez SendGrid:
npm install @sendgrid/mail
```

### Étape 3 : Créer les tables (UNE SEULE FOIS)
```bash
# Option A: Supabase CLI
supabase db push

# Option B: Copier-coller le SQL
# 1. Aller dans https://app.supabase.com
# 2. Projet > SQL Editor > New Query
# 3. Copier le contenu de: supabase/migrations/001_create_notification_tables.sql
# 4. Exécuter
```

### Étape 4a : Envoyer les EMAILS
```bash
# Mode test (simulation, n'envoie rien)
DRY_RUN=true node scripts/send-update-emails.js

# Mode réel (envoie vraiment)
node scripts/send-update-emails.js
```

### Étape 4b : Envoyer les NOTIFICATIONS PUSH
```bash
# Mode test
curl -X POST https://your-project.supabase.co/functions/v1/send-update-notification \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'

# Mode réel
curl -X POST https://your-project.supabase.co/functions/v1/send-update-notification \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

---

## 📧 Configuration Email

### Gmail (Gratuit)
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=hjcb pcde mtnz aqyw  # Mot de passe app (16 caractères)
```
[Créer un mot de passe app](https://myaccount.google.com/apppasswords)

### SendGrid (Gratuit jusqu'à 100 emails/jour)
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

---

## 📱 Configuration Firebase (Notifications Push)

1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Créer/Sélectionner votre projet
3. Projet Settings > Service Accounts
4. Copier les clés dans `.env`

---

## 📊 Vérifier les résultats

### Dans Supabase
```sql
-- Emails
SELECT * FROM email_campaigns ORDER BY created_at DESC LIMIT 5;

-- Notifications
SELECT * FROM notification_campaigns ORDER BY created_at DESC LIMIT 5;

-- Voir les erreurs
SELECT error_message, COUNT(*) 
FROM user_email_log 
WHERE status = 'failed'
GROUP BY error_message;
```

---

## ❓ Problèmes courants

| Problème | Solution |
|----------|----------|
| "Invalid credentials" | Vérifier `.env` - pas d'espaces autour des = |
| "ECONNREFUSED" | Vérifier les variables Supabase |
| Emails non reçus | Vérifier le dossier spam |
| Notifications pas affichées | FCM tokens expirés - tester sur un appareil récent |

---

## 📚 Documentation complète

Voir [NOTIFICATION_GUIDE.md](./NOTIFICATION_GUIDE.md) pour les détails complets.

---

## ✨ Template HTML

Le template est automatiquement utilié pour les emails.
Le personnaliser : `email-templates/update-notification.html`

---

## 🎯 Procédure recommandée

1. ✅ Configurer `.env`
2. ✅ Tester en mode dry-run
3. ✅ Vérifier avec 5 utilisateurs
4. ✅ Envoyer à tous les utilisateurs
5. ✅ Vérifier les logs dans Supabase

---

**🚀 C'est prêt ! Allez-y !**
