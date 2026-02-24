// ============================================
// CONDITIONS D'UTILISATION - Contenu IT-Inventory
// Version 1.0 – 09 février 2026
// ============================================

export const TERMS_VERSION = '1.0';
export const TERMS_LAST_UPDATE = '2026-02-09';

export interface TermsSection {
  id: string;
  title: string;
  icon: string;
  content: string;
}

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: 'intro',
    title: 'Introduction',
    icon: 'information-outline',
    content: `Bienvenue dans IT-Inventory, l'application mobile de gestion de stock développée pour optimiser la gestion des stocks de consommables et accessoires informatiques.

Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'utilisation de l'application IT-Inventory (ci-après « l'Application ») mise à disposition par IT-Inventory SAS.

En accédant et en utilisant l'Application, vous reconnaissez avoir pris connaissance des présentes CGU et vous vous engagez à les respecter sans réserve. Si vous n'acceptez pas l'ensemble de ces conditions, vous êtes invité à ne pas utiliser l'Application.`,
  },
  {
    id: 'acceptance',
    title: 'Acceptation des conditions',
    icon: 'handshake-outline',
    content: `L'utilisation de l'Application implique l'acceptation pleine et entière des présentes Conditions Générales d'Utilisation.

Ces conditions s'appliquent à tout utilisateur de l'Application, qu'il soit administrateur, technicien ou tout autre profil autorisé.

En cochant la case « J'accepte les conditions d'utilisation » lors de votre première connexion, ou en continuant à utiliser l'Application, vous confirmez votre accord avec l'ensemble des dispositions ci-dessous.

Nous nous réservons le droit de modifier ces CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle par notification dans l'Application. La poursuite de l'utilisation après modification vaut acceptation des nouvelles conditions.`,
  },
  {
    id: 'usage',
    title: 'Utilisation du service',
    icon: 'cog-outline',
    content: `L'Application IT-Inventory est destinée exclusivement à un usage professionnel et offre les fonctionnalités suivantes :

• Gestion des stocks de consommables et accessoires informatiques
• Suivi des mouvements de stock (entrées, sorties, ajustements, transferts)
• Gestion multi-sites des inventaires
• Scan de codes-barres pour identification rapide des articles
• Génération de rapports, statistiques et alertes de stock
• Envoi de notifications et récapitulatifs par e-mail

Utilisation autorisée :
Vous vous engagez à utiliser l'Application uniquement dans le cadre de vos activités professionnelles légitimes, conformément aux règles internes de votre organisation.

Utilisation interdite :
Il est strictement interdit de :
• Utiliser l'Application à des fins illégales ou non autorisées
• Tenter d'accéder aux données d'autres utilisateurs ou d'autres sites non autorisés
• Modifier, décompiler, désassembler ou copier le code source de l'Application
• Utiliser des robots, scripts automatisés ou tout dispositif visant à surcharger les serveurs
• Perturber, interrompre ou tenter de compromettre le bon fonctionnement du service
• Transmettre des données fausses, trompeuses ou malveillantes via l'Application`,
  },
  {
    id: 'data',
    title: 'Protection des données (RGPD)',
    icon: 'shield-lock-outline',
    content: `Conformément au Règlement Général sur la Protection des Données (RGPD – Règlement UE 2016/679) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée, nous nous engageons à protéger vos données personnelles.

Données collectées :
• Informations d'identification : matricule, nom, prénom, adresse e-mail professionnelle
• Données d'utilisation : historique des mouvements de stock, actions effectuées
• Données techniques : logs de connexion, type d'appareil, version de l'Application
• Données de localisation du site : site(s) de rattachement

Finalité du traitement :
Les données sont collectées et traitées uniquement pour :
• Assurer le bon fonctionnement de l'Application
• Garantir la traçabilité des opérations de stock
• Générer des rapports et statistiques d'utilisation
• Envoyer des alertes et notifications liées au stock
• Améliorer l'expérience utilisateur

Base légale :
Le traitement repose sur l'exécution du contrat de travail et l'intérêt légitime de l'entreprise à gérer efficacement ses stocks.

Vos droits :
Conformément au RGPD, vous disposez des droits suivants :
• Droit d'accès : obtenir une copie de vos données personnelles
• Droit de rectification : corriger les données inexactes
• Droit à l'effacement : demander la suppression de vos données
• Droit à la portabilité : recevoir vos données dans un format structuré
• Droit d'opposition : vous opposer au traitement de vos données
• Droit à la limitation : restreindre le traitement dans certains cas

Pour exercer vos droits, contactez le Délégué à la Protection des Données à l'adresse : Florian.JOVEGARCIA-ext@ca-alsace-vosges.fr

Sécurité des données :
Nous mettons en œuvre toutes les mesures techniques et organisationnelles appropriées pour garantir la sécurité et la confidentialité de vos données (chiffrement, contrôle d'accès, sauvegardes).

Conservation :
Les données personnelles sont conservées pendant la durée du contrat de travail, puis archivées conformément aux obligations légales en vigueur (5 ans maximum après la fin de la relation contractuelle).

Transferts :
Les données sont hébergées au sein de l'Union européenne. Aucun transfert vers des pays tiers n'est effectué sans garanties appropriées.`,
  },
  {
    id: 'ip',
    title: 'Propriété intellectuelle',
    icon: 'copyright',
    content: `L'Application IT-Inventory, son code source, son architecture, son design, ses interfaces, sa documentation et tous les éléments qui la composent (textes, images, logos, icônes, sons) sont protégés par les lois relatives à la propriété intellectuelle.

Toute reproduction, représentation, modification, publication, adaptation, distribution ou exploitation totale ou partielle de l'Application, par quelque moyen que ce soit, est strictement interdite sans autorisation écrite préalable de IT-Inventory SAS.

Le nom « IT-Inventory », le logo et les éléments graphiques associés sont des marques déposées. Toute utilisation non autorisée constitue une contrefaçon sanctionnée par la loi.

L'utilisateur dispose d'un droit d'utilisation personnel, non exclusif, non transférable et révocable, strictement limité à l'usage professionnel autorisé.`,
  },
  {
    id: 'liability',
    title: 'Responsabilités',
    icon: 'alert-circle-outline',
    content: `Disponibilité du service :
Nous nous efforçons d'assurer une disponibilité maximale de l'Application 24h/24 et 7j/7, mais ne pouvons garantir un accès ininterrompu. Des opérations de maintenance, des mises à jour ou des incidents techniques peuvent occasionner des interruptions temporaires.

Limitations de responsabilité :
IT-Inventory SAS ne saurait être tenu responsable :
• Des interruptions techniques indépendantes de sa volonté (panne réseau, coupure serveur)
• De la perte de données résultant d'un usage inapproprié de l'Application
• Des dommages indirects liés à l'utilisation ou l'impossibilité d'utiliser l'Application
• Des erreurs de saisie effectuées par les utilisateurs
• De l'utilisation de l'Application sur des appareils non compatibles

Responsabilité de l'utilisateur :
Vous êtes personnellement responsable de :
• La confidentialité de vos identifiants de connexion
• L'exactitude et la véracité des données que vous saisissez
• Le respect des procédures internes de votre organisation
• La sécurité physique de l'appareil sur lequel l'Application est installée
• Toute action effectuée sous votre compte utilisateur`,
  },
  {
    id: 'changes',
    title: 'Modifications des CGU',
    icon: 'pencil-outline',
    content: `Nous nous réservons le droit de modifier les présentes Conditions Générales d'Utilisation à tout moment, afin de les adapter aux évolutions légales, réglementaires ou techniques.

Les utilisateurs seront informés de toute modification substantielle par :
• Une notification push dans l'Application
• Un bandeau d'information lors de la connexion
• Un e-mail envoyé à l'adresse professionnelle enregistrée (le cas échéant)

La version en vigueur est celle accessible dans l'Application au moment de la consultation. Nous vous invitons à consulter régulièrement les CGU.

La poursuite de l'utilisation de l'Application après la publication des modifications vaut acceptation pleine et entière des nouvelles conditions.

Historique des versions :
• Version 1.0 — 09 février 2026 : Version initiale`,
  },
  {
    id: 'contact',
    title: 'Contact',
    icon: 'email-outline',
    content: `Pour toute question, demande d'information ou réclamation concernant ces Conditions d'Utilisation ou l'Application IT-Inventory :

Support technique :
📧 Florian.JOVEGARCIA-ext@ca-alsace-vosges.fr

Protection des données (DPO) :
📧 Florian.JOVEGARCIA-ext@ca-alsace-vosges.fr

Droit applicable :
Les présentes CGU sont soumises au droit français.`,
  },
];
