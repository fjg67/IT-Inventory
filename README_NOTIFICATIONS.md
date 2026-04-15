# 📨 Système de Notifications StockPro v2.15

Infrastructure complète d'envoi d'emails et de notifications push pour annoncer la v2.15 aux utilisateurs.

## 📁 Structure des fichiers

```
├── QUICK_START_NOTIFICATIONS.md          # ⚡ Démarrage en 5 minutes
├── NOTIFICATION_GUIDE.md                 # 📖 Guide complet (détails)
├── README_NOTIFICATIONS.md               # 📄 Ce fichier
├── .env.example                          # ⚙️  Template de configuration
├── package-notifications.json            # 📦 Scripts npm
├── email-templates/
│   └── update-notification.html         # 🎨 Template HTML email
├── scripts/
│   ├── send-update-emails.js            # 📧 Envoyer les emails
│   └── validate-notification-setup.js   # ✅ Valider la config
└── supabase/
    ├── functions/
    │   └── send-update-notification/
    │       └── index.ts                 # 📱 Fonction push (Supabase)
    └── migrations/
        └── 001_create_notification_tables.sql  # 📊 Base de données
```

## 🚀 Choix rapide

### Vous avez 5 minutes ?
→ Voir **[QUICK_START_NOTIFICATIONS.md](QUICK_START_NOTIFICATIONS.md)**

### Vous avez 30 minutes ?
→ Voir **[NOTIFICATION_GUIDE.md](NOTIFICATION_GUIDE.md)**

### Vous voulez tout savoir ?
→ Lire ce document entièrement

---

## ✨ Fonctionnalités

### 📧 Emails
- ✅ Template HTML responsive et professionnel
- ✅ Envoi batch avec personnalisation (prénom de l'utilisateur)
- ✅ Support Gmail + SendGrid
- ✅ Gestion des limites de débit (500ms entre les emails)
- ✅ Logging complet dans Supabase
- ✅ Mode dry-run pour tester sans envoyer

### 📱 Notifications Push
- ✅ Firebase Cloud Messaging (FCM)
- ✅ Fonction serverless Supabase
- ✅ Support Android + Web
- ✅ Ciblage par utilisateur ou broadcast
- ✅ Mode dry-run pour simulation
- ✅ Logging complet des résultats

### 📊 Base de données
- ✅ 4 tables pour l'audit
- ✅ 2 vues pour l'analytics
- ✅ Row-Level Security (RLS)
- ✅ Indexes pour performance
- ✅ Triggers pour updated_at automatique

---

## 🎯 Étapes de mise en place

### 1️⃣ Configuration (< 2 min)

```bash
# Copier le template
cp .env.example .env

# Éditer .env
nano .env  # Macros/Linux
# ou
notepad .env  # Windows
```

**À remplir:**
- `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`
- `EMAIL_USER` + `EMAIL_PASSWORD` (Gmail) OU `SENDGRID_API_KEY`
- `FIREBASE_API_KEY` + `FIREBASE_PROJECT_ID` (pour push)

### 2️⃣ Dépendances (< 1 min)

```bash
npm install dotenv @supabase/supabase-js nodemailer
# ou si SendGrid:
npm install @sendgrid/mail
```

### 3️⃣ Base de données (< 5 min)

Supabase SQL Editor:
1. Créer une nouvelle Query
2. Copier le contenu de `supabase/migrations/001_create_notification_tables.sql`
3. Exécuter

Résultat: 4 tables + 2 vues créées

### 4️⃣ Validation (< 1 min)

```bash
node scripts/validate-notification-setup.js
```

Vérifier que tout est vert ✅

### 5️⃣ Test (< 2 min)

```bash
# Mode simulation (ne rien envoyer réellement)
DRY_RUN=true node scripts/send-update-emails.js

# Voir le résultat dans Supabase:
# SELECT * FROM email_campaigns ORDER BY created_at DESC;
```

### 6️⃣ Envoyer pour VRAI (quelques minutes)

```bash
node scripts/send-update-emails.js
```

Attend ~3-5 minutes pour 200+ utilisateurs (500ms de délai entre chaque)

---

## 📞 Architecture

### Email Workflow
```
node send-update-emails.js
    ↓
Fetch users from Supabase
    ↓
For each user (batch):
    ├─ Load HTML template
    ├─ Replace {first_name}
    ├─ Send via Gmail/SendGrid
    ├─ Log to email_campaigns
    ├─ Wait 500ms
    └─ Continue
    ↓
Command complete + report
```

### Push Workflow
```
curl → Supabase Function
    ↓
Fetch FCM tokens from user_devices
    ↓
For each device (batch):
    ├─ Build FCM payload
    ├─ POST to Firebase API
    ├─ Log to notification_campaigns
    └─ Continue
    ↓
Return success/failure stats
```

---

## 🔧 Configuration détaillée

### Gmail (Gratuit)

1. Aller sur https://myaccount.google.com/apppasswords
2. Sélectionner "Mail" et "Windows" (ou autre OS)
3. Copier le mot de passe généré (16 caractères)
4. Dans `.env`:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=hjcb pcde mtnz aqyw
   ```

### SendGrid (Gratuit jusqu'à 100/jour)

1. Créer compte https://sendgrid.com
2. API Keys → Create API Key → Full Access
3. Copier la clé
4. Dans `.env`:
   ```env
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```

### Firebase (Gratuit)

1. https://console.firebase.google.com
2. Créer/Sélectionner projet
3. Project Settings → Service Accounts
4. Generate private key
5. Copier `project_id` et `private_key`
6. Dans `.env`:
   ```env
   FIREBASE_API_KEY=AIza...
   FIREBASE_PROJECT_ID=my-project-id
   ```

---

## 🎨 Template Email

Le template est en `email-templates/update-notification.html`

**Sections:**
- 📌 Header avec gradient (couleurs marque)
- 👋 Salutation personnalisée avec prénom
- ✨ Mise en avant de la nouvelle feature PC
- 🎯 Grille de bénéfices (4 cartes)
- 🔘 Bouton CTA → Play Store
- 📋 Liste des features supplémentaires

**Personnaliser:**
- Couleurs: Chercher `#667eea` (primary) et `#764ba2` (secondary)
- Texte: Éditer le HTML directement
- Images: Remplacer les URLs `https://...`

Le script remplace automatiquement:
- `{first_name}` → prénom de l'utilisateur

---

## 📉 Monitoring

### Voir les résultats

```sql
-- Emails
SELECT campaign_name, success_count, failure_count, 
       ROUND(100.0 * success_count / total_count, 1) as success_pct
FROM email_campaigns 
ORDER BY created_at DESC;

-- Notifications
SELECT campaign_name, success_count, failure_count,
       ROUND(100.0 * success_count / total_count, 1) as success_pct
FROM notification_campaigns
ORDER BY created_at DESC;
```

### Erreurs

```sql
-- Emails échoués
SELECT user_id, email, status, error_message
FROM user_email_log
WHERE status = 'failed'
LIMIT 20;

-- Notifications échoués
SELECT user_id, device_id, status, error_message
FROM user_notification_log
WHERE status = 'failed'
LIMIT 20;
```

---

## ⚠️ Problèmes et solutions

| Problème | Cause | Solution |
|----------|-------|----------|
| "Invalid credentials" | `.env` mal configuré | Vérifier pas d'espaces. Utiliser `nano .env` |
| "ECONNREFUSED" | Supabase URL invalide | Copier URL complète depuis Supabase |
| Erreur "401 Unauthorized" | Clé de service role invalide | Régénérer la clé dans Supabase |
| Emails en dossier spam | Reputation domaine neuf | Inclure lien unsubscribe (futur) |
| Notifications pas reçues | FCM tokens expirés | Tester sur appareil avec app ouverte récemment |
| Le script s'arrête après 10 emails | Mode test ? | Vérifier `DRY_RUN` dans .env |

---

## 🔒 Sécurité

### Clés stockées
- ✅ `.env` (LOCAL) - **NE PAS pusher sur Git**
- ✅ Supabase - Utilisé `SUPABASE_SERVICE_ROLE_KEY` (clé secrète)
- ✅ Firebase - Utilisé via REST API sécurisée

### RLS (Row-Level Security)
- Tables de logs accessibles SEULEMENT par `admin` ou `service_role`
- Utilisateurs lambda ne peuvent pas lire les logs
- Pour modifier: Vous devez être connecté en tant que admin ou invoquer via Edge Function

---

## 📝 Scripts npm

```bash
# Vérifier que tout est configuré
npm run check                      # ou npm run start

# Installer/configurer
npm run install:emails
npm run install:sendgrid
npm run setup:env

# Envoyer
npm run send:emails                # VRAI envoi
npm run send:emails:test           # DRY RUN (simulation)

# Push
npm run deploy:notification-function

# Base de données
npm run db:setup
npm run db:reset

# Voir les logs
npm run logs:emails                # Commande SELECT à copier
npm run logs:notifications

# Documentation
npm run help                       # NOTIFICATION_GUIDE.md
npm run quick-start               # QUICK_START_NOTIFICATIONS.md
```

---

## 📞 Support

### Documentation
- **Démarrage rapide**: [QUICK_START_NOTIFICATIONS.md](QUICK_START_NOTIFICATIONS.md)
- **Guide complet**: [NOTIFICATION_GUIDE.md](NOTIFICATION_GUIDE.md)
- **Ce document**: README_NOTIFICATIONS.md

### Ressources
- [Supabase Docs](https://supabase.com/docs)
- [Firebase FCM](https://firebase.google.com/docs/cloud-messaging)
- [Nodemailer](https://nodemailer.com)
- [SendGrid](https://sendgrid.com/docs)

---

## ✅ Checklist avant d'envoyer

- [ ] `.env` créé et rempli
- [ ] `npm run check` passe (aucune ❌)
- [ ] Migration SQL exécutée dans Supabase
- [ ] `npm run send:emails:test` fait DRY RUN réussi
- [ ] 5+ emails de test reçus ou vérifiés sur sandbox
- [ ] Bouton CTA pointe vers le bon Play Store
- [ ] Vous êtes prêt à envoyer à TOUS les utilisateurs

---

## 🎯 Statistiques attendues

Pour ~200-250 utilisateurs:
- **Durée**: 3-5 minutes (500ms entre les envois)
- **Taux de succès**: 95-99%
- **Taux de rebond**: <2% (adresses invalides)
- **Spam**: <1% (bien configurer authentification)

Pour les push:
- **Succès**: 50-70% (dépend des devices actifs)
- **Durée**: <30 secondes

---

## 🚀 Prochaines étapes

Après l'envoi v2.15:

1. **Analytics**: Voir combien de clics sur Play Store
2. **AB Tests**: Essayer différentes variantes du template
3. **Automatisation**: Scheduler les envois (Cron Supabase)
4. **Notifications**: Ajouter in-app notifications
5. **Unsubscribe**: Implémenter lien de désinscription

---

**Créé pour**: StockPro v2.15 Launch Campaign
**Dernière mise à jour**: 2024
**État**: Prêt pour production ✅
