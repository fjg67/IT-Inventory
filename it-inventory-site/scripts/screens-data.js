/* eslint-env browser */

// Add only anonymized, approved screenshots. Paths are relative to index.html.
window.GUIDE_CAPTURES = {
  accueil: {
    src: 'assets/screens/accueil.png',
    title: 'Accueil',
    alt: 'Accueil IT-Inventory avec les indicateurs et le stock actif',
  },
  connexion: {
    src: null,
    title: 'Connexion',
    alt: 'Formulaire de connexion IT-Inventory',
    pendingReason:
      'À capturer dans une session de démonstration, sans déconnecter le compte utilisé pour les autres écrans.',
  },
  sites: {
    src: 'assets/screens/sites.png',
    title: 'Choix du site',
    alt: 'Sélection du site et du stock à gérer',
  },
  articles: {
    src: 'assets/screens/articles.png',
    title: 'Liste des articles',
    alt: 'Recherche et liste des articles du stock actif',
  },
  article: {
    src: 'assets/screens/article.png',
    title: 'Fiche article',
    alt: 'Détail d’un article, quantité et historique',
  },
  ajout: {
    src: 'assets/screens/ajout.png',
    title: 'Nouvel article',
    alt: 'Formulaire de création d’un article',
    note: 'Formulaire vierge, aucun article créé.',
  },
  scanner: {
    src: 'assets/screens/scanner.png',
    title: 'Scanner',
    alt: 'Scanner de codes-barres de l’application',
    note: 'La caméra affiche la scène virtuelle de l’émulateur.',
  },
  resultat: {
    src: 'assets/screens/resultat.png',
    title: 'Résultat du scan',
    alt: 'Article reconnu et choix de l’action après un scan',
    note: 'Lecture de référence simulée via l’événement du scanner ; aucun mouvement exécuté.',
  },
  mouvement: {
    src: 'assets/screens/mouvement.png',
    title: 'Type et quantité',
    alt: 'Saisie du type de mouvement et de la quantité',
    note: 'Entrée préparée à titre d’illustration, non validée.',
  },
  ajustement: {
    src: 'assets/screens/ajustement.png',
    title: 'Quantité finale de l’ajustement',
    alt: 'Type Ajustement sélectionné et saisie de la quantité finale',
    note: 'Quantité illustrative ; aucun comptage ni ajustement enregistré.',
  },
  'ajustement-recapitulatif': {
    src: 'assets/screens/ajustement-recapitulatif.png',
    title: 'Aperçu de l’ajustement',
    alt: 'Aperçu du stock avant et après l’ajustement, avant validation',
    note: 'Ajustement préparé à titre d’illustration, non validé.',
  },
  'selection-article': {
    src: 'assets/screens/selection-article.png',
    title: 'Sélection de l’article du mouvement',
    alt: 'Recherche d’un article dans le formulaire de nouveau mouvement',
  },
  recapitulatif: {
    src: 'assets/screens/recapitulatif.png',
    title: 'Récapitulatif',
    alt: 'Vérification du mouvement avant validation',
    note: 'Entrée préparée à titre d’illustration, non validée.',
  },
  historique: {
    src: 'assets/screens/historique.png',
    title: 'Historique des flux',
    alt: 'Liste des mouvements de stock enregistrés',
  },
  assets: {
    src: 'assets/screens/assets.png',
    title: 'Scan des assets',
    alt: 'Suivi des identifiants assets avec résultat et compteur de session',
    note: 'Session ouverte après lecture simulée de la référence ; aucun asset individuel scanné.',
  },
  'assets-historique': {
    src: 'assets/screens/assets-historique.png',
    title: 'Historique des assets',
    alt: 'Liste des identifiants assets scannés et de leurs mouvements',
    note: 'Historique existant consulté en lecture seule ; identifiants et dates masqués.',
  },
  transfert: {
    src: 'assets/screens/transfert.png',
    title: 'Transfert inter-sites',
    alt: 'Choix du site de destination et quantité à transférer',
    note: 'Article sélectionné et sites proposés ; aucun transfert validé.',
  },
  pc: {
    src: 'assets/screens/pc.png',
    title: 'Parc PC',
    alt: 'Vue d’ensemble du parc PC et catégories de statut',
  },
  panne: {
    src: 'assets/screens/panne.png',
    title: 'Déclaration de panne',
    alt: 'Formulaire de déclaration d’une panne de PC',
    note: 'Capture recadrée sur le formulaire vierge ; aucune panne déclarée.',
  },
  vocal: {
    src: null,
    title: 'Confirmation vocale',
    alt: 'Récapitulatif d’une commande vocale avec Confirmer et Annuler',
    pendingReason:
      'À capturer avec une commande de démonstration. Aucune reconnaissance vocale ni exécution déclenchée pour cette série.',
  },
};

window.GUIDE_CHAPTERS = [
  {
    id: 'demarrage',
    icon: 'book',
    category: 'PREMIERS PAS',
    title: 'Prendre en main l’application',
    shortTitle: 'Première connexion',
    description:
      'Connectez-vous, choisissez votre stock et repérez les actions essentielles.',
    keywords:
      'installation installer connexion compte identifiant mot de passe accueil débuter',
    prerequisite:
      'L’application installée depuis le canal validé par votre organisation et un compte fourni par votre administrateur.',
    steps: [
      {
        title: 'Se connecter à son compte',
        text: 'Ouvrez IT-Inventory, saisissez votre identifiant et votre mot de passe, puis appuyez sur « Se connecter ». En cas d’accès refusé, contactez votre administrateur.',
        capture: 'connexion',
      },
      {
        title: 'Choisir son espace et son site',
        text: 'Si un choix d’espace de travail est proposé, sélectionnez celui qui vous concerne. Choisissez ensuite le site ou le stock à consulter et gérer pour cette session.',
        capture: 'sites',
        tip: 'Les sites proposés dépendent de votre compte. Vérifiez le lieu choisi avant de poursuivre.',
      },
      {
        title: 'Se repérer sur l’accueil',
        text: 'Consultez les indicateurs et les actions rapides. La navigation donne accès aux Articles, au Scanner, aux PC et aux Flux. La zone « Stock actif » rappelle le contexte de vos opérations.',
        capture: 'accueil',
      },
    ],
    result:
      'Vous êtes connecté et le stock actif correspond à votre lieu de travail.',
  },
  {
    id: 'articles',
    icon: 'box',
    category: 'GESTION DU STOCK',
    title: 'Rechercher et consulter un article',
    shortTitle: 'Consulter les articles',
    description:
      'Retrouvez une référence et consultez sa fiche avant toute intervention.',
    keywords:
      'article recherche référence famille filtre quantité consultation détail historique',
    prerequisite: 'Être connecté et avoir sélectionné le bon stock actif.',
    steps: [
      {
        title: 'Ouvrir les Articles',
        text: 'Accédez à « Articles » dans la navigation. Saisissez le nom ou la référence dans la recherche. Utilisez les filtres disponibles pour affiner la liste.',
        capture: 'articles',
      },
      {
        title: 'Contrôler la fiche',
        text: 'Ouvrez l’article correspondant. Vérifiez son nom, sa référence, la quantité sur le site et le seuil de stock minimum. Consultez son historique pour comprendre les derniers changements.',
        capture: 'article',
        tip: 'Un nom proche ne suffit pas : comparez aussi la référence de l’article au matériel physique.',
      },
      {
        title: 'Choisir la bonne suite',
        text: 'Pour enregistrer une réception ou une distribution, utilisez un mouvement de stock. Pour un équipement suivi par asset, passez par le scanner et scannez chaque identifiant.',
        link: 'mouvements',
        linkLabel: 'Voir la procédure des mouvements',
      },
    ],
    result:
      'L’article est identifié et son stock sur le site concerné a été vérifié.',
  },
  {
    id: 'ajout-article',
    icon: 'box',
    category: 'GESTION DU STOCK',
    title: 'Créer un nouvel article',
    shortTitle: 'Ajouter un article',
    description:
      'Renseignez une fiche propre et évitez les références en double.',
    keywords:
      'créer création nouveau ajout article référence famille type photo',
    prerequisite:
      'Disposer des droits de création et des informations de référence du matériel.',
    steps: [
      {
        title: 'Vérifier que l’article n’existe pas',
        text: 'Dans « Articles », recherchez la référence et le nom du matériel. Si une fiche existe déjà, utilisez-la plutôt que de créer un doublon.',
        capture: 'articles',
      },
      {
        title: 'Renseigner la nouvelle fiche',
        text: 'Ouvrez l’action d’ajout d’article. Renseignez les champs obligatoires du formulaire : référence, nom, classification et sites concernés. Complétez la marque, l’emplacement ou la photo si nécessaire.',
        capture: 'ajout',
      },
      {
        title: 'Contrôler et créer',
        text: 'Relisez la référence, les sites sélectionnés, le stock initial et le seuil minimum. Validez la création, puis recherchez l’article pour contrôler les informations enregistrées.',
        tip: 'Les champs et actions disponibles peuvent varier selon vos droits. Ne contournez pas une restriction de votre compte.',
      },
    ],
    result:
      'La nouvelle fiche apparaît dans les articles du site concerné, avec les bonnes informations.',
  },
  {
    id: 'scanner',
    icon: 'scan',
    category: 'SUR LE TERRAIN',
    title: 'Scanner et identifier le matériel',
    shortTitle: 'Scanner un code-barres',
    description:
      'Passez du code-barres à la bonne fiche, puis choisissez votre action.',
    keywords:
      'scan scanner caméra camera code barre lecture recherche consultation',
    prerequisite:
      'Autoriser l’accès à la caméra sur le téléphone et vérifier le stock actif.',
    steps: [
      {
        title: 'Ouvrir le Scanner',
        text: 'Ouvrez « Scanner » dans la navigation ou utilisez une action de scan proposée par l’application. Si le téléphone demande l’accès à la caméra, autorisez-le pour cette fonction.',
        capture: 'scanner',
      },
      {
        title: 'Présenter le code-barres',
        text: 'Placez le code dans la zone de lecture, avec un éclairage suffisant et un téléphone stable. Attendez le résultat sans multiplier les scans.',
        tip: 'Si le code reste illisible, nettoyez l’étiquette ou utilisez la recherche par référence pour un article classique.',
      },
      {
        title: 'Vérifier le résultat et choisir l’action',
        text: 'Contrôlez le nom et la référence reconnus. Choisissez la consultation, l’entrée ou la sortie selon votre besoin. Pour les équipements suivis par asset, poursuivez avec le scan de chaque identifiant.',
        capture: 'resultat',
        link: 'assets',
        linkLabel: 'Comprendre le scan des assets',
      },
    ],
    result:
      'Le matériel reconnu correspond au matériel physique et vous avez choisi l’action adaptée.',
  },
  {
    id: 'mouvements',
    icon: 'flux',
    category: 'GESTION DU STOCK',
    title: 'Enregistrer une entrée ou une sortie',
    shortTitle: 'Entrées et sorties',
    description:
      'Enregistrez une réception ou une distribution et contrôlez le nouveau stock.',
    keywords:
      'mouvement entrée sortie réception distribution quantité flux historique',
    prerequisite:
      'Le bon site actif, un article identifié et la quantité réelle à enregistrer.',
    steps: [
      {
        title: 'Sélectionner l’article',
        text: 'Depuis les Flux (historique des mouvements), ouvrez l’action de nouveau mouvement. Recherchez l’article par nom ou référence, ou scannez son code-barres.',
        capture: 'selection-article',
      },
      {
        title: 'Choisir le type et la quantité',
        text: 'Choisissez « Entrée » pour une réception ou « Sortie » pour une distribution. Renseignez le nombre d’unités concernées, puis continuez. Une sortie ne peut pas dépasser le stock disponible.',
        capture: 'mouvement',
        tip: 'Pour les équipements suivis par asset, utilisez « Scanner les assets » : une quantité saisie seule ne remplace pas les identifiants individuels.',
      },
      {
        title: 'Relire et valider',
        text: 'Vérifiez l’article, le site, le type, la quantité et le stock projeté. Ajoutez un commentaire utile si nécessaire, puis validez. Attendez la confirmation de l’application.',
        capture: 'recapitulatif',
      },
      {
        title: 'Vérifier l’enregistrement',
        text: 'Consultez l’historique des Flux et le nouveau stock. En cas d’erreur, lisez le message et vérifiez l’historique avant de réessayer pour éviter un doublon.',
        capture: 'historique',
      },
    ],
    result:
      'Le mouvement est visible dans l’historique et le stock reflète la quantité reçue ou distribuée.',
  },
  {
    id: 'ajustement',
    icon: 'flux',
    category: 'GESTION DU STOCK',
    title: 'Corriger un stock après comptage',
    shortTitle: 'Ajuster un stock',
    description:
      'Remplacez la quantité théorique par la quantité réellement comptée.',
    keywords:
      'ajustement correction inventaire compter comptage écart stock quantité',
    prerequisite:
      'Un comptage physique fiable et l’accord ou les droits requis pour corriger le stock.',
    steps: [
      {
        title: 'Comparer le stock physique à la fiche',
        text: 'Comptez les unités présentes sur le site. Vérifiez la référence et consultez la quantité actuelle avant de décider d’un ajustement.',
        capture: 'article',
      },
      {
        title: 'Saisir le stock final',
        text: 'Créez un mouvement sur l’article et choisissez « Ajustement ». Saisissez la quantité finale réellement présente, et non la différence à ajouter ou retirer.',
        capture: 'ajustement',
        tip: 'Exemple : la fiche indique 12 unités, mais vous en comptez 9. Saisissez 9, et non −3. Ce parcours ne remplace pas le suivi individuel des assets.',
      },
      {
        title: 'Justifier et vérifier',
        text: 'Ajoutez un commentaire expliquant le comptage et l’écart. L’application exige un commentaire d’au moins 5 caractères lorsque la quantité finale saisie est de 10 ou plus. Relisez le récapitulatif, validez, puis vérifiez la fiche et l’historique.',
        capture: 'ajustement-recapitulatif',
      },
    ],
    result:
      'La quantité enregistrée correspond au comptage physique et la correction est traçable.',
  },
  {
    id: 'assets',
    icon: 'scan',
    category: 'SUR LE TERRAIN',
    title: 'Suivre les équipements par asset',
    shortTitle: 'Scanner les assets',
    description:
      'Enregistrez chaque équipement individuellement, sans saisie globale.',
    keywords:
      'asset assets identifiant équipement poste suivi numéro série scan entrée sortie',
    prerequisite:
      'Un article suivi par asset, ses étiquettes individuelles et le bon stock actif.',
    steps: [
      {
        title: 'Identifier la référence',
        text: 'Dans « Scanner », scannez la référence de l’article suivi. Vérifiez le matériel reconnu puis choisissez « Entrée » ou « Sortie ».',
        capture: 'resultat',
      },
      {
        title: 'Scanner chaque asset',
        text: 'Scannez l’identifiant de chaque équipement. Chaque scan accepté est enregistré immédiatement : contrôlez son message de résultat et le compteur de la session avant de passer au suivant.',
        capture: 'assets',
        tip: 'Il ne s’agit pas d’un panier à valider à la fin. Un scan accepté modifie déjà le stock. Ne scannez pas de nouveau un asset pour « confirmer ».',
      },
      {
        title: 'Contrôler la session',
        text: 'Comparez le compteur aux équipements traités. Utilisez « Tous les assets scannés » pour contrôler les enregistrements, puis quittez la session. Si un scan est refusé, lisez le message avant de continuer.',
        capture: 'assets-historique',
      },
    ],
    result:
      'Chaque équipement traité possède son enregistrement individuel et le stock correspond aux scans acceptés.',
  },
  {
    id: 'sites-transferts',
    icon: 'site',
    category: 'MULTI-SITES',
    title: 'Changer de site et transférer du stock',
    shortTitle: 'Sites et transferts',
    description:
      'Sélectionnez le bon contexte et tracez les déplacements entre stocks.',
    keywords:
      'site stock actif changer transfert départ source destination agence',
    prerequisite:
      'Connaître le site source, le site de destination, l’article et la quantité à déplacer.',
    steps: [
      {
        title: 'Changer le stock actif',
        text: 'Touchez « Changer » dans la zone « Stock actif » de la barre du bas. Sélectionnez le site ou le stock souhaité, puis vérifiez le nom affiché avant une nouvelle opération.',
        capture: 'sites',
        tip: 'Changer de site ne transfère aucun matériel : cela change uniquement le contexte de consultation et de travail.',
      },
      {
        title: 'Préparer le transfert',
        text: 'Ouvrez l’action de transfert de stock. Recherchez ou scannez l’article, vérifiez le site de départ et sélectionnez un site de destination différent.',
        capture: 'transfert',
      },
      {
        title: 'Vérifier puis valider',
        text: 'Renseignez la quantité à déplacer et un commentaire si nécessaire. Contrôlez les deux sites et l’aperçu du stock, puis utilisez « Valider le transfert ». Vérifiez ensuite les quantités sur les deux sites et l’historique.',
        tip: 'Le transfert de stock ne remplace pas les parcours dédiés au transfert des PC ou des équipements suivis individuellement.',
      },
    ],
    result:
      'Le stock a diminué sur le site source et augmenté sur le site de destination.',
  },
  {
    id: 'parc-pc',
    icon: 'laptop',
    category: 'ÉQUIPEMENTS',
    title: 'Consulter le parc PC et déclarer une panne',
    shortTitle: 'Gérer le parc PC',
    description: 'Retrouvez un ordinateur et suivez son état opérationnel.',
    keywords:
      'pc ordinateur portable parc hostname statut panne disponible usinage envoyé',
    prerequisite:
      'Connaître l’identifiant du PC et disposer des droits nécessaires pour modifier son état.',
    steps: [
      {
        title: 'Retrouver le PC',
        text: 'Ouvrez « PC » dans la navigation. Recherchez le poste et utilisez les filtres de statut si nécessaire. Vérifiez son identifiant et son site avant toute action.',
        capture: 'pc',
      },
      {
        title: 'Lire son statut',
        text: 'Les statuts permettent de distinguer les PC « À chaud », « À reusiner », « En usinage », « Disponible », « Envoyé » et « En panne ». Ne changez le statut que si l’état réel du poste le justifie.',
      },
      {
        title: 'Déclarer une panne',
        text: 'Ouvrez l’action de déclaration de panne sur le PC concerné. Renseignez les informations demandées, notamment le type, la priorité et la description. Contrôlez puis confirmez, et vérifiez l’état du poste.',
        capture: 'panne',
        tip: 'Décrivez le symptôme observé et les vérifications déjà réalisées. Ne renseignez pas de mot de passe dans le commentaire.',
      },
    ],
    result:
      'Le bon PC est identifié et son état reflète la situation constatée.',
  },
  {
    id: 'commande-vocale',
    icon: 'mic',
    category: 'ASSISTANCE',
    title: 'Utiliser une commande vocale',
    shortTitle: 'Commande vocale',
    description:
      'Dictez une action, puis gardez le contrôle en vérifiant sa confirmation.',
    keywords: 'voix vocal vocale microphone dicter confirmer annuler assistant',
    prerequisite: 'L’accès au microphone autorisé et un stock actif vérifié.',
    steps: [
      {
        title: 'Ouvrir le contrôle vocal',
        text: 'Depuis l’accueil, touchez le bouton microphone. Autorisez l’accès si nécessaire et énoncez votre demande en précisant le matériel, la quantité et le site lorsque cela s’applique.',
      },
      {
        title: 'Relire l’action interprétée',
        text: 'Vérifiez le type d’action et tous les détails affichés : article ou PC, quantité, site de destination, personne, date de retour ou statut selon la demande.',
        capture: 'vocal',
        tip: 'Une commande comprise n’est pas forcément une commande correcte. Comparez toujours le récapitulatif à votre intention.',
      },
      {
        title: 'Confirmer ou annuler',
        text: 'Appuyez sur « Confirmer » uniquement si tous les détails sont corrects. Sinon, choisissez « Annuler » et reformulez. Aucune action n’est exécutée sans votre confirmation ; après confirmation, vérifiez le résultat dans l’application.',
      },
    ],
    result:
      'L’action voulue a été confirmée explicitement et son résultat a été contrôlé.',
  },
];
