// ============================================
// FAQ CONTENT - IT-Inventory Aide & Support
// ============================================

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

export interface FAQCategory {
  id: string;
  icon: string;
  title: string;
  color: string;
  description: string;
}

export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'getting_started',
    icon: 'rocket-launch-outline',
    title: 'Démarrage',
    color: '#3B82F6',
    description: 'Premiers pas avec IT-Inventory',
  },
  {
    id: 'features',
    icon: 'cog-outline',
    title: 'Fonctionnalités',
    color: '#8B5CF6',
    description: 'Utiliser les fonctions de l\'app',
  },
  {
    id: 'troubleshooting',
    icon: 'wrench-outline',
    title: 'Dépannage',
    color: '#F59E0B',
    description: 'Résoudre les problèmes courants',
  },
  {
    id: 'account',
    icon: 'account-circle-outline',
    title: 'Compte & Sécurité',
    color: '#10B981',
    description: 'Gérer votre compte',
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  // ===== DÉMARRAGE =====
  {
    id: 'first-login',
    question: 'Comment me connecter pour la première fois ?',
    answer: `Pour vous connecter à IT-Inventory :\n\n1. Ouvrez l'application IT-Inventory\n2. Entrez votre identifiant\n3. Saisissez votre mot de passe\n4. Cochez « Se souvenir de moi » si vous le souhaitez\n5. Appuyez sur « Se connecter »\n\nSi vous n'avez pas encore de compte, contactez votre administrateur pour obtenir vos identifiants.`,
    category: 'getting_started',
    keywords: ['connexion', 'login', 'première', 'matricule', 'mot de passe', 'compte'],
  },
  {
    id: 'choose-site',
    question: 'Comment sélectionner mon site de travail ?',
    answer: `Après votre connexion, vous devez sélectionner votre site de travail :\n\n1. La liste des sites disponibles s'affiche automatiquement\n2. Appuyez sur le site souhaité\n3. Confirmez la sélection\n\nVous pouvez changer de site à tout moment depuis les Réglages, section « Site actif ».`,
    category: 'getting_started',
    keywords: ['site', 'sélection', 'choisir', 'travail', 'agence'],
  },
  {
    id: 'navigate-app',
    question: 'Comment naviguer dans l\'application ?',
    answer: `L'application comporte 5 onglets principaux en bas de l'écran :\n\n• Accueil : Tableau de bord avec statistiques et alertes\n• Articles : Liste et gestion de tous vos articles\n• Scan : Scanner rapide de codes-barres\n• Mouvements : Historique et création de mouvements\n• Réglages : Paramètres et préférences\n\nAppuyez sur un onglet pour accéder à la section correspondante.`,
    category: 'getting_started',
    keywords: ['navigation', 'onglet', 'menu', 'accueil', 'barre'],
  },
  {
    id: 'scan-article',
    question: 'Comment scanner un article ?',
    answer: `Pour scanner un article avec le code-barres :\n\n1. Allez dans l'onglet « Scan » ou appuyez sur l'icône de scan dans un formulaire\n2. La caméra s'active automatiquement\n3. Positionnez le code-barres dans le cadre bleu\n4. Le scan se fait automatiquement dès que le code est détecté\n5. L'article correspondant s'affiche\n\nAstuces :\n• Assurez-vous d'avoir suffisamment de lumière\n• Maintenez l'appareil stable à 15-20 cm du code-barres\n• Le code-barres doit être bien visible et non endommagé`,
    category: 'getting_started',
    keywords: ['scan', 'scanner', 'code-barres', 'caméra', 'article', 'barcode'],
  },
  {
    id: 'understand-dashboard',
    question: 'Comment lire le tableau de bord ?',
    answer: `Le tableau de bord affiche 3 indicateurs clés :\n\n• Articles en stock : Nombre total d'articles référencés\n• Alertes stock : Articles dont le stock est inférieur au seuil minimum\n• Mouvements aujourd'hui : Nombre de mouvements effectués dans la journée avec une courbe sur 7 jours\n\nLes alertes stock sont importantes : elles indiquent les articles à réapprovisionner rapidement.`,
    category: 'getting_started',
    keywords: ['tableau de bord', 'dashboard', 'statistiques', 'alertes', 'indicateurs'],
  },

  // ===== FONCTIONNALITÉS =====
  {
    id: 'create-movement',
    question: 'Comment créer un mouvement de stock ?',
    answer: `Pour créer un mouvement de stock :\n\n1. Allez dans l'onglet « Mouvements »\n2. Appuyez sur « + Nouveau mouvement »\n3. Scannez ou recherchez l'article concerné\n4. Sélectionnez le type de mouvement :\n   • Entrée : réception de stock\n   • Sortie : utilisation/distribution\n   • Ajustement : correction d'inventaire\n5. Indiquez la quantité\n6. Ajoutez un commentaire si nécessaire\n7. Validez le mouvement\n\nLe stock de l'article est mis à jour automatiquement.`,
    category: 'features',
    keywords: ['mouvement', 'entrée', 'sortie', 'ajustement', 'stock', 'créer'],
  },
  {
    id: 'create-article',
    question: 'Comment ajouter un nouvel article ?',
    answer: `Pour créer un nouvel article :\n\n1. Allez dans l'onglet « Articles »\n2. Appuyez sur « + Nouvel article »\n3. Remplissez les informations obligatoires :\n   • Référence (ou scannez un code-barres)\n   • Nom de l'article\n   • Code famille et famille\n   • Type et sous-type\n4. Renseignez les informations optionnelles :\n   • Marque, emplacement, description\n   • Stock initial et stock minimum\n   • Photo de l'article\n5. Sélectionnez les sites concernés\n6. Appuyez sur « Créer l'article »`,
    category: 'features',
    keywords: ['article', 'créer', 'ajouter', 'nouveau', 'référence', 'produit'],
  },
  {
    id: 'transfer-stock',
    question: 'Comment transférer du stock entre sites ?',
    answer: `Pour effectuer un transfert inter-sites :\n\n1. Allez dans « Mouvements »\n2. Sélectionnez « Transfert » comme type\n3. Choisissez l'article à transférer\n4. Sélectionnez le site de destination\n5. Indiquez la quantité à transférer\n6. Validez le transfert\n\nLe stock est automatiquement déduit du site source et ajouté au site de destination.`,
    category: 'features',
    keywords: ['transfert', 'site', 'inter-sites', 'déplacer', 'envoyer'],
  },
  {
    id: 'search-article',
    question: 'Comment rechercher un article ?',
    answer: `Plusieurs méthodes pour trouver un article :\n\n• Recherche par texte : Utilisez la barre de recherche dans l'onglet Articles pour chercher par nom ou référence\n• Recherche par scan : Scannez le code-barres de l'article\n• Filtres : Filtrez par famille, type, emplacement ou état de stock\n• Tri : Triez par nom, référence, stock ou date\n\nLa recherche est instantanée et fonctionne même hors connexion.`,
    category: 'features',
    keywords: ['recherche', 'chercher', 'trouver', 'filtre', 'tri', 'article'],
  },
  {
    id: 'stock-alerts',
    question: 'Comment fonctionnent les alertes de stock ?',
    answer: `Les alertes de stock vous préviennent quand un article est en stock bas :\n\n• Un article est en alerte quand son stock actuel est inférieur ou égal à son stock minimum\n• Le stock minimum est configurable pour chaque article\n• Les alertes apparaissent sur le tableau de bord\n• Un email récapitulatif est envoyé automatiquement chaque matin à 6h\n\nPour modifier le seuil d'alerte, éditez l'article et changez la valeur « Stock minimum ».`,
    category: 'features',
    keywords: ['alerte', 'stock bas', 'minimum', 'seuil', 'notification', 'email'],
  },
  {
    id: 'view-history',
    question: 'Comment consulter l\'historique des mouvements ?',
    answer: `Pour consulter l'historique :\n\n1. Allez dans l'onglet « Mouvements »\n2. Tous les mouvements récents sont listés\n3. Utilisez les filtres pour affiner :\n   • Par type (entrée, sortie, ajustement, transfert)\n   • Par date\n   • Par article\n\nVous pouvez aussi voir l'historique d'un article spécifique depuis sa fiche détaillée.`,
    category: 'features',
    keywords: ['historique', 'mouvements', 'liste', 'consulter', 'passé'],
  },
  {
    id: 'edit-article',
    question: 'Comment modifier un article existant ?',
    answer: `Pour modifier un article :\n\n1. Allez dans l'onglet « Articles »\n2. Trouvez et appuyez sur l'article à modifier\n3. Sur la fiche détaillée, appuyez sur « Modifier »\n4. Modifiez les champs souhaités\n5. Appuyez sur « Mettre à jour »\n\nNote : la référence d'un article ne peut pas être modifiée après création.`,
    category: 'features',
    keywords: ['modifier', 'éditer', 'changer', 'mettre à jour', 'article'],
  },
  {
    id: 'multi-sites',
    question: 'Comment gérer plusieurs sites ?',
    answer: `La gestion multi-sites vous permet de :\n\n• Voir le stock par site séparément\n• Transférer des articles entre sites\n• Filtrer les mouvements par site\n• Recevoir des alertes par site\n\nPour changer de site actif :\n1. Allez dans « Réglages »\n2. Section « Site actif »\n3. Sélectionnez le site souhaité\n\nChaque mouvement est automatiquement associé au site actif.`,
    category: 'features',
    keywords: ['multi-sites', 'sites', 'agence', 'changer', 'gérer'],
  },

  // ===== DÉPANNAGE =====
  {
    id: 'scan-not-working',
    question: 'Le scanner ne fonctionne pas, que faire ?',
    answer: `Si le scanner ne fonctionne pas, essayez ces solutions :\n\n1. Vérifiez les permissions caméra : Allez dans les paramètres Android > Applications > IT-Inventory > Autorisations > Caméra\n2. Nettoyez la lentille de la caméra\n3. Assurez-vous d'avoir suffisamment de lumière\n4. Vérifiez que le code-barres n'est pas endommagé ou flou\n5. Redémarrez l'application\n6. Redémarrez l'appareil si nécessaire\n\nSi le problème persiste après ces étapes, contactez le support technique.`,
    category: 'troubleshooting',
    keywords: ['scanner', 'scan', 'caméra', 'marche pas', 'problème', 'bug'],
  },
  {
    id: 'sync-error',
    question: 'Erreur de synchronisation, comment résoudre ?',
    answer: `En cas d'erreur de synchronisation :\n\n1. Vérifiez votre connexion Wi-Fi ou réseau mobile\n2. Vérifiez l'indicateur de connexion dans les Réglages\n3. Allez dans Réglages > Synchronisation\n4. Appuyez sur « Forcer la synchronisation »\n5. Attendez la fin de la synchronisation\n\nSi l'erreur persiste :\n• Notez le message d'erreur affiché\n• Fermez et rouvrez l'application\n• Contactez le support avec le détail de l'erreur\n\nVos données locales ne sont pas perdues en cas d'erreur de sync.`,
    category: 'troubleshooting',
    keywords: ['synchronisation', 'sync', 'erreur', 'connexion', 'réseau'],
  },
  {
    id: 'app-slow',
    question: 'L\'application est lente, comment l\'accélérer ?',
    answer: `Pour améliorer les performances :\n\n1. Fermez les autres applications en arrière-plan\n2. Redémarrez l'application IT-Inventory\n3. Vérifiez l'espace de stockage disponible sur l'appareil\n4. Assurez-vous que l'application est à jour\n5. Redémarrez l'appareil\n\nSur les terminaux Zebra TC22, l'application est optimisée pour fonctionner de manière fluide. Si les lenteurs persistent, contactez le support.`,
    category: 'troubleshooting',
    keywords: ['lent', 'lenteur', 'performance', 'rapide', 'vitesse', 'accélérer'],
  },
  {
    id: 'data-not-showing',
    question: 'Mes données ne s\'affichent pas correctement',
    answer: `Si vos données ne s'affichent pas :\n\n1. Tirez l'écran vers le bas pour rafraîchir (pull-to-refresh)\n2. Vérifiez que vous êtes sur le bon site actif\n3. Vérifiez votre connexion réseau\n4. Forcez une synchronisation depuis les Réglages\n5. Déconnectez-vous puis reconnectez-vous\n\nLes données sont stockées localement, donc elles restent accessibles même hors connexion. Si le problème persiste, contactez le support.`,
    category: 'troubleshooting',
    keywords: ['données', 'affichage', 'vide', 'manquant', 'pas affiche'],
  },
  {
    id: 'app-crash',
    question: 'L\'application se ferme toute seule',
    answer: `Si l'application se ferme inopinément :\n\n1. Rouvrez l'application normalement\n2. Si le crash se répète, redémarrez l'appareil\n3. Vérifiez que l'application est à jour\n4. Vérifiez l'espace de stockage disponible (min. 100 Mo recommandé)\n5. Videz le cache de l'application : Paramètres Android > Applications > IT-Inventory > Stockage > Vider le cache\n\nVos données ne sont pas perdues en cas de crash. Si le problème persiste, contactez le support en précisant quand le crash se produit.`,
    category: 'troubleshooting',
    keywords: ['crash', 'ferme', 'plante', 'bug', 'erreur', 'force'],
  },
  {
    id: 'barcode-not-found',
    question: 'Code-barres scanné mais article non trouvé',
    answer: `Si un code-barres est scanné mais l'article n'est pas trouvé :\n\n• L'article n'existe peut-être pas encore dans la base\n• La référence associée au code-barres peut différer\n\nSolutions :\n1. Vérifiez manuellement dans la liste des articles\n2. Créez un nouvel article avec ce code-barres comme référence\n3. Vérifiez que vous êtes sur le bon site\n\nLe code-barres scanné s'affiche toujours à l'écran pour vérification.`,
    category: 'troubleshooting',
    keywords: ['code-barres', 'non trouvé', 'introuvable', 'barcode', 'scan'],
  },

  // ===== COMPTE & SÉCURITÉ =====
  {
    id: 'change-site',
    question: 'Comment changer de site actif ?',
    answer: `Pour changer de site :\n\n1. Allez dans l'onglet « Réglages »\n2. Dans la section « Site actif », vous voyez votre site actuel\n3. Appuyez sur « Changer » ou sur le site affiché\n4. Sélectionnez le nouveau site dans la liste\n5. Confirmez le changement\n\nTous les mouvements et données affichés seront désormais liés au nouveau site sélectionné.`,
    category: 'account',
    keywords: ['site', 'changer', 'actif', 'agence', 'sélection'],
  },
  {
    id: 'logout',
    question: 'Comment me déconnecter ?',
    answer: `Pour vous déconnecter :\n\n1. Allez dans l'onglet « Réglages »\n2. Descendez en bas de la page\n3. Appuyez sur « Se déconnecter »\n4. Confirmez la déconnexion\n\nAttention : assurez-vous que vos données sont synchronisées avant de vous déconnecter. Les données non synchronisées pourraient être perdues.`,
    category: 'account',
    keywords: ['déconnexion', 'logout', 'sortir', 'quitter', 'session'],
  },
  {
    id: 'forgotten-password',
    question: 'J\'ai oublié mon mot de passe',
    answer: `Si vous avez oublié votre mot de passe :\n\n1. Sur l'écran de connexion, appuyez sur « Mot de passe oublié »\n2. Contactez votre administrateur système\n3. L'administrateur pourra réinitialiser votre mot de passe\n\nPour des raisons de sécurité, les mots de passe ne peuvent être réinitialisés que par un administrateur habilité.\n\nConseils de sécurité :\n• Utilisez un mot de passe unique et complexe\n• Ne partagez jamais vos identifiants\n• Changez votre mot de passe régulièrement`,
    category: 'account',
    keywords: ['mot de passe', 'oublié', 'réinitialiser', 'password', 'perdu'],
  },
  {
    id: 'data-privacy',
    question: 'Comment sont protégées mes données ?',
    answer: `La sécurité de vos données est notre priorité :\n\n• Chiffrement : Toutes les communications sont chiffrées (HTTPS/TLS)\n• Authentification : Accès sécurisé par matricule et mot de passe\n• Hébergement : Données hébergées dans l'Union Européenne\n• Conformité RGPD : Respect total du règlement européen\n• Accès limité : Chaque utilisateur n'accède qu'aux données de ses sites autorisés\n\nPour plus de détails, consultez les Conditions d'Utilisation dans les Réglages.`,
    category: 'account',
    keywords: ['données', 'sécurité', 'confidentialité', 'RGPD', 'protection', 'vie privée'],
  },
];

// Recherche dans la FAQ
export const searchFAQ = (query: string): FAQItem[] => {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  return FAQ_ITEMS.filter(item => {
    const inQuestion = item.question.toLowerCase().includes(q);
    const inAnswer = item.answer.toLowerCase().includes(q);
    const inKeywords = item.keywords.some(kw => kw.toLowerCase().includes(q));
    return inQuestion || inAnswer || inKeywords;
  }).slice(0, 8);
};

// Obtenir les items d'une catégorie
export const getFAQByCategory = (categoryId: string): FAQItem[] =>
  FAQ_ITEMS.filter(item => item.category === categoryId);

// Questions populaires (top 5)
export const getPopularFAQ = (): FAQItem[] =>
  FAQ_ITEMS.filter(item =>
    ['scan-article', 'create-movement', 'scan-not-working', 'stock-alerts', 'sync-error'].includes(item.id),
  );
