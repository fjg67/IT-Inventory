This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

## Guide web IT-Inventory

Le dossier [it-inventory-site](./it-inventory-site) contient le guide de procédures
en français, au style inspiré du Crédit Agricole. Il est indépendant de
l'application React Native : aucun compte, accès à la base de données, outil de
compilation ou service tiers n'est nécessaire. Ouvrir
[index.html](./it-inventory-site/index.html) dans un navigateur récent, ou servir
ce dossier avec un serveur statique interne. Le guide propose la recherche,
des liens directs (`#procedure/mouvements` par exemple), des captures
agrandissables et l'impression de la procédure ouverte en PDF.

### Publication GitHub Pages

Adresse publique du guide : https://fjg67.github.io/IT-Inventory/

Le workflow [guide-pages.yml](./.github/workflows/guide-pages.yml) publie
uniquement le dossier `it-inventory-site` lors des modifications de ce dossier
sur `main`. Il peut aussi être lancé manuellement depuis l'onglet Actions.
Dans les paramètres du dépôt, **Pages > Source** doit être réglé sur
**GitHub Actions**. Le site étant public, ne publier que des captures
anonymisées et des informations autorisées à la diffusion.

### Captures de l'émulateur Android

Le guide intègre 18 captures PNG réalisées le 6 octobre 2026 sur l'émulateur
Android Pixel 10 Pro XL, avec l'interface chargée depuis le code du projet.
Les fichiers publiables sont dans
[assets/screens](./it-inventory-site/assets/screens). Les noms, sites,
identifiants, dates d'opérations et valeurs de stock visibles ont été masqués
avec des aplats opaques avant intégration. Les images ont été réduites à
900 pixels de large ; la déclaration de panne est recadrée sur son formulaire.
Les images brutes ne sont pas intégrées au dépôt.

Les formulaires de création, mouvements, ajustements, transferts et panne
ont uniquement été ouverts ou préparés, jamais validés. Les quantités saisies
dans les brouillons sont illustratives, pas issues d'un comptage. Les lectures
de références ont été simulées par l'événement du scanner de l'application ;
la caméra montre la scène virtuelle de l'émulateur. Aucun asset individuel
n'a été scanné pour modifier le stock. L'historique des assets affiché
préexistait aux captures et a uniquement été consulté.

Deux illustrations restent volontairement absentes : la connexion (pour ne
pas déconnecter la session existante) et la confirmation vocale (aucune
reconnaissance ni exécution vocale lancée). Leurs emplacements « Capture à
réaliser » restent explicites ; ils ne représentent pas des captures de
l'application. Les légendes précisent la provenance et les limites de chaque
écran. Avant diffusion, faire valider les procédures et les captures par le
responsable interne.

### Ajouter ou remplacer une capture

1. Anonymiser les captures (noms, identifiants, agences, données de stock
   sensibles, notifications et toute information personnelle) avec des masques
   opaques. Exporter en PNG sans métadonnées, à 900 pixels de large.
2. Placer les fichiers validés dans `it-inventory-site/assets/screens/`.
3. Dans [screens-data.js](./it-inventory-site/scripts/screens-data.js), remplacer
   `src: null` du repère concerné par un chemin relatif à la page, par exemple
   `src: 'assets/screens/accueil.png'`. Adapter aussi le texte `alt` au contenu
   réel. Adapter le champ `note` pour préciser le contexte (formulaire non
   validé, recadrage, lecture simulée, etc.). Retirer `pendingReason` lorsque
   l'image manquante est fournie. Les repères sont affichés sur les emplacements
   restant à illustrer.
4. Recharger le guide et vérifier chaque procédure, les images, leur
   agrandissement et le rendu imprimé. Les captures configurées mais
   introuvables affichent une erreur explicite.
5. Mettre à jour la date et les illustrations manquantes dans l'avertissement
   de la page. Après validation, adapter aussi la mention du pied de page.
   Ne présenter le guide comme officiel qu'après approbation.
6. Si une illustration manquante est ajoutée, adapter le nombre de captures et
   les repères encore en attente dans
   [guideContent.test.js](./__tests__/guideContent.test.js), puis relancer le test.

Les procédures sont définies dans `GUIDE_CHAPTERS` du même fichier. Vérifier
les textes lors des évolutions de l'application, en particulier les libellés,
les droits d'accès, les mouvements suivis par asset (enregistrés à chaque scan
accepté) et la confirmation explicite des commandes vocales.

Validation ciblée du contenu et des chemins locaux :

```sh
npm test -- __tests__/guideContent.test.js --runInBand --watch=false
```

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
