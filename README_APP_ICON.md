# Icône de l’application (logo)

L’icône affichée sur le téléphone (lanceur Android / iOS) est générée à partir de **`src/assets/images/logo.png`**.

## Générer les icônes

1. Ouvrir un terminal (PowerShell ou CMD) **à la racine du projet**.
2. Installer la dépendance (une seule fois) :
   ```bash
   npm install
   ```
3. Lancer la génération :
   ```bash
   npm run generate-app-icon
   ```

Le script met à jour :
- **Android** : `android/app/src/main/res/mipmap-*/ic_launcher.png` et `ic_launcher_round.png` (48 à 192 px).
- **iOS** : `ios/StockProApp/Images.xcassets/AppIcon.appiconset/` (40 à 1024 px) et `Contents.json`.

Ensuite, recompiler l’app pour voir la nouvelle icône sur l’appareil ou l’émulateur.
