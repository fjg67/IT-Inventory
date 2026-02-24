# Documentation Onboarding StockPro

## Introduction

Ce module implémente une page de bienvenue premium pour l'application StockPro, conçue spécifiquement pour les terminaux Zebra TC22 sous Android 13.

## Installation

Les dépendances suivantes ont été installées :

```bash
npm install react-native-reanimated react-native-linear-gradient react-native-svg react-native-vector-icons react-native-swiper lottie-react-native
```

> **IMPORTANT**: Comme des dépendances natives (reanimated, vector-icons, linear-gradient) ont été ajoutées, vous devez redémarrer le serveur Metro avec le cache vidé et reconstruire l'application :

```bash
npm start -- --reset-cache
# Dans un autre terminal :
npx react-native run-android
```

La configuration des polices vectorielles a été ajoutée à `android/app/build.gradle`.

## Structure des Fichiers

```
src/
├── screens/
│   └── Onboarding/
│       ├── OnboardingScreen.tsx        // Écran principal (Swiper)
│       ├── slides/
│       │   ├── WelcomeSlide.tsx        // Slide 1: Bienvenue
│       │   ├── ScanSlide.tsx           // Slide 2: Scan Rapide
│       │   ├── TraceabilitySlide.tsx   // Slide 3: Traçabilité
│       │   └── MultiSiteSlide.tsx      // Slide 4: Multi-sites
│       └── components/
│           ├── SlideIndicator.tsx      // Indicateurs (dots)
│           └── OnboardingButton.tsx    // Boutons premium
└── constants/
    └── onboardingTheme.ts              // Thème spécifique (Couleurs, Typo)
```

## Slides

### 1. Bienvenue

- **Icone**: Cube outline (MaterialCommunityIcons), animé avec un effet de pulsation.
- **Titre**: "Bienvenue sur GestStock IT"
- **Description**: Présentation générale de l'application.
- **Animation**: Entrée fluide du texte et pulsation continue de l'icône.

### 2. Scan Rapide

- **Icone**: Scanner QR (MaterialIcons).
- **Animation**: Une ligne de scan se déplace de haut en bas sur l'icône, simulant la lecture d'un code-barres.

### 3. Traçabilité Complète

- **Icone**: Liste de vérification dynamique.
- **Animation**: Les éléments de la liste (checkmarks + lignes) apparaissent séquentiellement avec un effet de rebond (spring).

### 4. Gestion Multi-sites

- **Icone**: Réseau d'entrepôts.
- **Animation**: Un hub central apparaît, suivi de ses satellites connectés, illustrant la connectivité.

## Fonctionnalités Clés

- **React Native Reanimated**: Utilisé pour toutes les animations fluides (entrées, boucles, interactions).
- **Linear Gradient**: Fond dégradé premium (Bleu nuit).
- **Glassmorphism**: Effets de transparence et lueurs subtiles.
- **Navigation**: Intégré au `RootStack` comme écran de démarrage par défaut pour les utilisateurs non connectés.

## Notes Techniques

- Les icônes utilisent `react-native-vector-icons` (MaterialIcons et MaterialCommunityIcons).
- Le thème est centralisé dans `onboardingTheme.ts` pour faciliter les ajustements.
- Les composants sont typés en TypeScript.
