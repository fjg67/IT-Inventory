import { Article, Site } from '@/types/models';

// ─── Distance de Levenshtein ──────────────────────────────────────────────
export const levenshtein = (a: string, b: string): number => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[m][n];
};

export const similarity = (a: string, b: string): number => {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
};

// ─── Normalisation ─────────────────────────────────────────────────────────
export const normalize = (s: string): string => {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Sans accents
    .replace(/['’]/g, ' ')                            // Remplace les apostrophes par des espaces (ex: "l'écran" -> "l ecran")
    .replace(/[^a-z0-9\s]/g, '')                      // Uniquement alphanumérique
    .replace(/\b(s|x)\b/g, '')                        // Retirer les s/x isolés suite au nettoyage
    .replace(/(s|x)$/g, '')                           // Retirer les s/x à la fin des mots pour pluriels simples
    .trim();
};

// ─── Recherche d'Articles ─────────────────────────────────────────────────
export interface ArticleMatchResult {
  article: Article;
  score:   number;
  exact:   boolean;
}

export const findBestArticleMatch = (
  spokenName: string,
  articles: Article[],
  minScore = 0.50
): ArticleMatchResult | null => {
  if (!spokenName || spokenName.trim() === '') return null;
  const normalizedSpoken = normalize(spokenName);

  const scored = articles.map(article => {
    const normalizedLabel = normalize(article.nom);

    // 1. Score Levenshtein global
    const fullScore = similarity(normalizedSpoken, normalizedLabel);

    // 2. Jaccard Index (Chevauchement des mots)
    const spokenWords  = normalizedSpoken.split(' ').filter(w => w.length > 2);
    const articleWords = normalizedLabel.split(' ').filter(w => w.length > 2);
    
    let wordScore = 0;
    let exactWordMatchCount = 0;
    
    if (spokenWords.length > 0 && articleWords.length > 0) {
      wordScore = spokenWords.reduce((acc, word) => {
        const bestWordMatch = Math.max(...articleWords.map(aw => similarity(word, aw)));
        if (bestWordMatch > 0.85) exactWordMatchCount++;
        return acc + (bestWordMatch > 0.65 ? bestWordMatch : 0);
      }, 0) / Math.max(spokenWords.length, 1);
    }

    // Boost si un mot clé très précis de l'article est prononcé parfaitement
    // ex: "sacoche" dans "sacoche pour ordinateur"
    const exactWordBoost = (exactWordMatchCount > 0 && articleWords.length > 0) 
      ? (exactWordMatchCount / articleWords.length) * 0.3 
      : 0;

    // Score combiné : on donne beaucoup plus de poids au wordScore (70%) 
    // car "sacoche" vs "sacoche pour ordinateur" a un mauvais fullScore mais un très bon wordScore
    let combinedScore = fullScore * 0.3 + wordScore * 0.7 + exactWordBoost;
    
    // Plafond à 1.0
    combinedScore = Math.min(1.0, combinedScore);

    const isExactSubstring = normalizedLabel.includes(normalizedSpoken) || normalizedSpoken.includes(normalizedLabel);

    return {
      article,
      score: Math.max(fullScore, combinedScore),
      exact: isExactSubstring && exactWordMatchCount > 0,
    };
  });

  // Trier par score décroissant
  scored.sort((a, b) => {
    if (a.exact && !b.exact) return -1;
    if (!a.exact && b.exact) return 1;
    return b.score - a.score;
  });

  const best = scored[0];
  return best && (best.score >= minScore || best.exact) ? best : null;
};

// Trouver les suggestions si aucun match exact
export const findArticleSuggestions = (
  spokenName: string,
  articles: Article[],
  count = 3
): Article[] => {
  if (!spokenName || spokenName.trim() === '') return [];
  const normalized = normalize(spokenName);
  
  return articles
    .map(a => {
      const normalizedLabel = normalize(a.nom);
      // Utiliser une métrique rapide pour les suggestions
      const score = similarity(normalized, normalizedLabel);
      return { article: a, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(r => r.article);
};

// ─── Recherche de Sites ───────────────────────────────────────────────────
export interface SiteMatchResult {
  site: Site;
  score: number;
}

export const findBestSiteMatch = (
  spokenName: string,
  sites: Site[],
  minScore = 0.50
): SiteMatchResult | null => {
  if (!spokenName || spokenName.trim() === '') return null;
  const normalizedSpoken = normalize(spokenName);

  const scored = sites.map(site => {
    const normalizedLabel = normalize(site.nom);
    const score = similarity(normalizedSpoken, normalizedLabel);
    
    return { site, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  
  return best && best.score >= minScore ? best : null;
};
