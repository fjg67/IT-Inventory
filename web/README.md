# IT-Inventory Web

Application métier Web séparée de l’application React Native. Démarrage local :

```sh
cd web
npm install
npm run dev
```

Le socle utilise React, TypeScript et Vite. En développement, les chemins `/api`
sont relayés vers Supabase local (`http://127.0.0.1:54321`) par défaut; définir
`API_PROXY_TARGET` pour utiliser une autre instance Supabase locale. Ne placez
aucune clé de service dans une variable `VITE_*`.

## Contrat de l’API métier

Le front Web ne vérifie pas lui-même le mot de passe partagé.
L’Edge Function Supabase `web-api` porte l’authentification et les contrôles
d’accès. Les sessions sont transportées dans un cookie `HttpOnly`, `Secure` en
production et `SameSite=Strict`.

- `GET /api/auth/session` : renvoie `401` si aucune session, sinon un JSON
  `{ "authMode": "shared", "user": { "id", "name", "role", "permissions": [] }, "activeSite": null }`.
- `POST /api/auth/login` : reçoit `{ "password" }`, valide le mot de passe
  partagé côté serveur et crée une session sans identité individuelle.
- `POST /api/auth/logout` : invalide la session serveur et le cookie.
- `GET /api/sites` : renvoie les sites actifs disponibles pour une session
  partagée avec leur hiérarchie parent/enfant. Le sélecteur présente d’abord
  Strasbourg Général ou Agence, puis les sous-sites de Strasbourg Général.
- `POST /api/auth/site` : reçoit `{ "siteId" }` et associe le site choisi à la
  session partagée.
- `GET /api/technicians` : renvoie les profils actifs du site sélectionné.
- `POST /api/auth/technician` : reçoit `{ "technicianId" }`, vérifie que le profil
  est actif et associé au site, puis l’associe à la session côté serveur.
- `GET /api/dashboard?siteId=…` : vérifie le site choisi dans la session et renvoie
  les totaux calculés depuis les données réelles :
  `{ "totalArticles": 0, "lowStockArticles": 0, "movementsToday": 0, "recentMovements": [{ "id", "type", "articleName", "quantity", "siteName", "userName", "occurredAt" }] }`.
- `GET /api/articles?siteId=…&search=…&stock=all&page=0&pageSize=25` : vérifie le site
  choisi dans la session, recherche aussi par code-barres et accepte `stock=low`
  pour filtrer les références dont la quantité est inférieure au seuil minimum.
  Le paramètre facultatif `scope=movement` limite le stock au site actif et
  exclut les articles PC du sélecteur d’opérations.
  La route renvoie
  `{ "items": [{ "id", "reference", "name", "family": null, "quantity": 0, "minimumStock": 0, "unit", "location": null, "barcode": null, "imageUrl": null }], "total": 0, "page": 0, "pageSize": 25 }`.
  `imageUrl` est l’URL de la photo associée à l’article dans l’application
  mobile, ou `null` si aucune photo n’est enregistrée. La liste affiche une
  icône lorsque la photo manque ou ne peut pas être chargée. Une ancienne
  version de l’API sans ce champ conserve la liste, avec un avertissement.
  L’interface peut exporter toutes les références correspondant aux filtres
  en CSV UTF-8 séparé par des points-virgules.
- `GET /api/movements?siteId=…&period=30days&type=all&page=0&pageSize=25` :
  renvoie l’historique paginé du site choisi, filtrable par période et type
  (`ENTRY`, `EXIT`, `ADJUSTMENT`, `TRANSFER`). L’interface permet également
  d’exporter l’ensemble des résultats filtrés en CSV UTF-8 séparé par des
  points-virgules.
- `POST /api/movements` : enregistre une entrée, une sortie, un ajustement ou
  un transfert atomique. Le serveur utilise le site et le technicien de la
  session, vérifie le stock disponible et limite les transferts au site actif
  et à ses sous-sites. `quantity` est une quantité positive pour entrée/sortie/
  transfert, et le nouveau stock compté pour un ajustement. La migration
  `023_web_stock_movements.sql` crée la fonction transactionnelle appelée par
  cette route.
- `GET /api/computers?siteId=…&search=…&state=all&page=0&pageSize=25` :
  renvoie le parc PC détecté dans le stock du site choisi et de ses sous-sites
  actifs, avec recherche, filtre par état, compteurs et pagination. La réponse
  contient `{ "items": [{ "id", "name", "hostname", "reference", "barcode", "brand", "model", "allocation", "location", "state", "quantity", "updatedAt" }], "total": 0, "page": 0, "pageSize": 25, "counts": { "total": 0, "a_chaud": 0, "a_reusiner": 0, "en_usinage": 0, "disponible": 0, "en_panne": 0, "envoye": 0 } }`.
  L’interface permet d’exporter toutes les lignes correspondant à la recherche
  et à l’état sélectionnés en CSV UTF-8 séparé par des points-virgules.
  Les six états sont affichés séparément avec leurs compteurs. Le libellé
  marque/modèle est normalisé sans doubler une marque déjà présente dans le
  modèle, y compris dans le CSV, qui conserve ses colonnes Marque et Modèle.
- `GET /api/stock-map?siteId=…` : renvoie les quantités des références
  configurées sur les armoires du plan mobile, agrégées pour le site choisi et
  ses sous-sites actifs : `{ "items": [{ "reference": "1000023", "quantity": 0 }] }`.
  L’interface permet de retrouver visuellement un article par nom, référence
  ou niveau dans les deux armoires sans masquer les autres emplacements.
- `GET /api/analytics?siteId=…&period=30days` : renvoie les indicateurs
  d’activité sur 7, 30 ou 90 jours, la série quotidienne et les dix articles
  les plus mouvementés. Le calcul est limité aux 10 000 mouvements les plus
  récents de la période; `partial` indique si ce plafond a été atteint.

Les requêtes envoient les cookies avec `credentials: "include"`. Les routes
POST vérifient l’origine configurée contre les protections CSRF. Les sessions
sont validées côté serveur et les API métier limitent les données au site
choisi. Les permissions renvoyées au client adaptent uniquement la navigation.
Les exemples JSON décrivent les formes attendues, pas des données de
démonstration. Les migrations `021` et `022` et la version de `web-api` qui
prend en charge la connexion partagée, les mouvements, le Parc PC, le Scanner,
la Cartographie, l’Analyse avancée et les Paramètres sont déployées sur le
projet Supabase lié.

## Authentification Supabase et installation locale

Le flux Web reprend la connexion mobile par mot de passe partagé, puis demande
de choisir un site et un profil technicien. La sélection du profil permet
d’attribuer les opérations à son identifiant, mais ne vérifie pas que la
personne devant l’écran est bien ce technicien. Le secret est lu uniquement
depuis `WEB_SHARED_PASSWORD` dans
l’environnement serveur de l’Edge Function; il ne doit jamais être ajouté à
une variable `VITE_*`, au bundle Web ou à un fichier versionné. Comme ce
secret est partagé et utilisé par l’application mobile, il ne permet pas
d’identifier une personne. Après authentification, le Web demande de choisir
un site actif. Cette connexion ne
représente pas un compte individuel et donne accès en lecture aux modules
Dashboard, Articles, Mouvements, Parc PC, Scanner, Cartographie et Analyse
avancée et Paramètres des sites disponibles; elle ne doit pas être utilisée comme contrôle
d’accès individuel ni pour attribuer des actions à un technicien. La fonction
crée une session opaque côté serveur et stocke uniquement son empreinte dans un
cookie `HttpOnly`. Les tentatives sont limitées par adresse réseau après cinq
échecs pendant quinze minutes.

Pour tester en local :

1. Installer et démarrer le Supabase CLI localement (`supabase start`).
2. Recréer la base locale et appliquer les migrations (`supabase db reset`).
   La migration initiale crée le sous-ensemble de tables nécessaire au socle
   Web; elle ne reconstruit pas tout le schéma de production et ne copie aucun
   compte ni stock.
3. Créer un fichier local non versionné `supabase/functions/.env.local` avec
   les origines exactes du navigateur et le secret serveur
   `WEB_SHARED_PASSWORD`; fournir la clé publique anon sous
   `VITE_SUPABASE_ANON_KEY` dans `web/.env.local`. Ne jamais mettre le secret
   partagé dans une variable `VITE_*`.
4. Démarrer les fonctions avec
   `supabase functions serve web-api --env-file supabase/functions/.env.local --no-verify-jwt`
   et le Web (`cd web && npm run dev`).

La base locale ne contient aucun compte ni stock de production. N’y copiez pas
de données réelles pour tester. Le fichier `web/.env.local` du poste de
développement pointe actuellement vers le projet Supabase en ligne; il est
ignoré par Git. Pour revenir à Supabase local, définir
`API_PROXY_TARGET=http://127.0.0.1:54321` et utiliser la clé anon locale.
`supabase db push` n’est pas nécessaire.

### Important : historique de migrations du projet lié

L’historique distant contient 17 migrations datées de février 2026, absentes
du dossier local. Les scripts historiques récupérés définissent l’ancien
schéma en minuscules (`sites`, `articles`, `techniciens`) et des politiques RLS
qui autorisent l’accès `anon`; le schéma actuel utilise notamment
`Site`, `Article` et `User`. Ils ne doivent donc pas être rejoués sur la base
actuelle. Le dossier local contient aussi une migration qui remet certains
stocks à zéro. Ne lancez pas `supabase db push` ni `supabase migration repair`
tant qu’une migration de référence sans effets sur les données n’a pas été
préparée et relue. La comparaison de l’historique et du schéma est en lecture
seule; aucune migration n’a été poussée vers le projet lié.

La migration `022_add_web_shared_access.sql` ajoute au stockage de session le
mode d’authentification partagé et le site sélectionné. Elle a été exécutée
manuellement sur le projet lié; ne la rejouez pas et ne la poussez pas avec
`supabase db push`.

Pour la production, hébergez le Web et l’Edge Function derrière la même
origine (reverse proxy `/api` vers `/functions/v1/web-api/api`). Les cookies
de session inter-sites ne sont pas pris en charge; n’exposez pas le rôle
`service_role` au navigateur. Le projet Supabase lié autorise actuellement
uniquement `http://127.0.0.1:5173` et `http://localhost:5173` pour le test
local. Avant d’ouvrir le Web sur un domaine de production, remplacez
`WEB_APP_ORIGINS` par les origines exactes de ce domaine. Aucune migration
supplémentaire ne doit être poussée avec `supabase db push` tant que
l’historique distant n’a pas été réconcilié. La session partagée sélectionne
un site actif puis un profil technicien; le serveur limite les requêtes de données à ce site et à ses
sous-sites actifs. Dashboard, Articles et Parc PC restent en lecture seule. Le journal des mouvements permet
d’enregistrer les entrées, sorties, ajustements et transferts. La clé anon
peut être présente
dans le bundle Web; elle n’accorde aucun accès privilégié. La clé
`service_role` reste exclusivement dans l’environnement serveur Supabase.

## Déploiement de l’application Web sur Cloudflare Pages

Le guide statique reste publié séparément sur GitHub Pages. L’application de
gestion se déploie sur `https://it-inventory-web.pages.dev/`; le projet
Cloudflare sert le front et relaie `/api/*` vers l’Edge Function Supabase avec
`functions/api/[[path]].ts`. Cette même origine est nécessaire aux cookies
`HttpOnly; SameSite=Strict` de la session.

La GitHub Action `.github/workflows/web-cloudflare-pages.yml` construit le
front à chaque changement de `web/`. Pour activer son déploiement :

1. Créer un nouveau projet Cloudflare Pages nommé `it-inventory-web` avec
   `main` comme branche de production (Direct Upload convient; la GitHub Action
   publie les builds). Il est volontairement distinct du projet existant
   `it-inventory.pages.dev`.
2. Créer un jeton API Cloudflare limité à l’édition de Pages et ajouter
   `CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_ACCOUNT_ID` aux secrets Actions du
   dépôt. Définir aussi la variable Actions `CLOUDFLARE_PAGES_ENABLED` à
   `true`. Sans ce réglage, l’action vérifie le build mais ne publie rien.
3. Dans les secrets de l’Edge Function `web-api`, ajouter exactement
   `https://it-inventory-web.pages.dev` à `WEB_APP_ORIGINS`, en conservant
   toutes les origines déjà autorisées. Le proxy transmet cette origine au
   serveur qui vérifie les protections CORS/CSRF. Déployer ou redémarrer
   `web-api` si nécessaire pour appliquer le secret.
4. Vérifier la connexion, la sélection du site et une requête de données sur le
   domaine Pages. Le proxy force `Cache-Control: no-store`; aucune clé
   `service_role` ni aucun mot de passe n’est envoyé dans le bundle.

Le projet Supabase est configuré comme variable publique d’URL dans
`web/wrangler.jsonc`; il ne contient aucun secret. La clé anon du navigateur est
facultative pour cette Edge Function (`verify_jwt = false`). Ne pas configurer
la clé `service_role` dans les variables Cloudflare du front.

Les routes d’authentification, Dashboard et Articles sont implémentées dans
l’Edge Function. Le Dashboard reprend les indicateurs présents dans la vue
mobile; il n’ajoute pas de décompte de parc informatique sans source métier
correspondante.

## État de la Phase 1

- Layout adaptatif desktop/mobile, navigation filtrée par permissions serveur,
  sélecteur de site actif et InvenBot réutilisé depuis le guide.
- Préférence système Reduce Motion, navigation clavier et états d’erreur explicites.
- Authentification Web par secret partagé côté Edge Function avec sessions
  HttpOnly, choix de site et validation d’origine.
- Clients API partagés, validation des réponses, Dashboard et liste Articles
  raccordés aux endpoints documentés; aucun chiffre ou statut fictif n’est affiché.
- Historique paginé des mouvements avec filtres par type et période, raccordé
  à l’endpoint de lecture de `web-api`, avec export CSV selon les filtres actifs.
- Module Parc PC avec recherche, états, compteurs, pagination et export CSV,
  raccordé à l’endpoint de données réelles.
- Scanner d’articles avec recherche par code-barres, référence et nom, saisie
  manuelle et lecture caméra native lorsque le navigateur la prend en charge.
- Cartographie en lecture seule des deux armoires et de leurs niveaux, avec
  quantités du site réel, seuils correct/faible/rupture et emplacements libres.
- Analyse avancée des mouvements sur 7, 30 ou 90 jours, avec indicateurs,
  évolution quotidienne et classement des articles actifs.
- Paramètres Web avec informations de session, liste des accès disponibles,
  déconnexion et préférence de réduction des animations enregistrée dans le
  navigateur.
- Les endpoints Web et leurs contrôles de session/site sont implémentés dans
  l’Edge Function.
- Création de mouvements Web avec contrôle serveur du profil sélectionné et
  migration SQL transactionnelle pour mettre à jour le stock et son journal
  ensemble. Le formulaire reprend un parcours guidé en trois étapes, avec
  recherche d’article, aperçu du stock après opération et contrôle de quantité.

La migration `023_web_stock_movements.sql` a été exécutée manuellement dans
Supabase. En raison de la divergence de l’historique distant, ne lancez pas
`supabase db push`. Les changements locaux récents de `web-api` devront être
redéployés pour que le paramètre `scope=movement` et les photos des articles
soient disponibles sur le service distant.

## Validation des photos d’articles

Depuis la racine du dépôt :

```sh
npm test -- --runInBand __tests__/WebApiArticlePhotos.test.ts __tests__/WebArticlePhotos.test.tsx
npm run build --prefix web
```

Les tests couvrent l’association photo/article, les filtres de stock et le
périmètre des mouvements, les contrôles de session/site, les photos absentes
ou cassées et la compatibilité avec une ancienne version de l’API.

## Validation des listes Parc PC et Articles

```sh
npm test -- --runInBand __tests__/WebComputers.test.tsx __tests__/WebArticlePhotos.test.tsx __tests__/WebInvenBotQueue.test.ts
npm run build --prefix web
```

Le panneau partagé utilise `components/data/useStickyTable.ts` pour mesurer
l’en-tête du site et la barre d’outils avec `ResizeObserver`. Le titre du
tableau reste sous cette barre, sans conteneur de défilement intermédiaire
sur desktop. Vérifier également le scroll et le repli de la barre d’outils
au redimensionnement dans le navigateur.

La chaîne d’atelier présente les cinq étapes du cycle et la dérivation
« En panne ». Ses boutons filtrent les mêmes données que le sélecteur d’état.
Les accessoires du technicien et les états `hot`, `inspecting`, `repairing`,
`ready`, `shipping` et `fixing-alert` se vérifient avec `?bot=debug`.
Le convoyeur est limité à trois colis, suspendu hors écran ou onglet masqué,
et désactivé sur mobile ou avec les animations réduites/désactivées.

Les listes partagent la recherche, la pagination, les skeletons et les toasts
dans `components/data/`. La saisie reste locale à la barre d’outils : elle ne
relance ni requête ni rendu des lignes avant validation. Les tests couvrent
également cette isolation, les dates relatives, le CSV et l’annulation des
requêtes précédentes.
