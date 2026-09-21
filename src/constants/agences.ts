export const EDS_AGENCES: Record<string, string> = {
  // --- HAUT-RHIN (68) ---
  '312': 'WITTELSHEIM',
  '313': 'GUEBWILLER',
  '314': 'SOULTZ',
  '315': 'ENSISHEIM',
  '316': 'MULHOUSE',
  '317': 'RIEDISHEIM',
  '318': 'RIXHEIM',
  '319': 'SIERENTZ',
  '320': 'HESINGUE',
  '321': 'BLOTZHEIM',
  '322': 'HABSHEIM',
  '323': 'ORBEY',
  '324': 'KAYSERSBERG', // Probable
  '325': 'RIBEAUVILLE', // Probable
  '305': 'COLMAR',
  '306': 'SAINTE MARIE AUX MINES',

  // --- BAS-RHIN (67) ---
  '331': 'SARRE UNION',
  '332': 'DRULINGEN',
  '333': 'PHALSBOURG',
  '334': 'SAVERNE',
  '335': 'MARMOUTIER',
  '336': 'WASSELONNE',
  '337': 'TRUCHTERSHEIM',
  '338': 'STRASBOURG HAUTEPIERRE',
  '339': 'STRASBOURG CRONENBOURG',
  '340': 'SCHILTIGHEIM',
  '341': 'BISCHHEIM',
  '342': 'VENDENHEIM',
  '343': 'BRUMATH',
  '344': 'HAGUENAU',
  '345': 'BISCHWILLER',
  '346': 'SOULTZ SOUS FORETS',
  '347': 'WISSEMBOURG',
  '348': 'SELTZ',
  '349': 'LAUTERBOURG',
  '350': 'ILLKIRCH',
  '351': 'GEISPOLSHEIM',
  '352': 'ERSTEIN',
  '353': 'BENFELD',
  '354': 'SELESTAT',
  '355': 'MARCKOLSHEIM',
  '845': 'STRASBOURG ROBERTSAU',
  '846': 'STRASBOURG HOMME DE FER',
  '847': 'STRASBOURG NEUDORF',
  '848': 'HOENHEIM',
  '849': 'DAMBACH LA VILLE',

  // --- VOSGES (88) ---
  '603': 'EPINAL',
  '604': 'SAINT DIE',
  '605': 'REMIREMONT',
  '606': 'NEUFCHATEAU',
  '607': 'VITTEL',
  '608': 'GOLBEY',
  '609': 'THAON LES VOSGES',
  '610': 'RAMBERVILLERS',
  '611': 'CHARMES',
  '612': 'MIRECOURT',
  '613': 'CONTREXEVILLE',
  '614': 'DARNEY',
  '615': 'BRUYERES',
  '616': 'RAON L ETAPE',
  '617': 'SENONES',
  '618': 'GERARDMER',
  '619': 'LA BRESSE',
  '620': 'LE THILLOT',

  // Exemples
  '872': 'AGENCE 872',
};

export const getNomAgenceParEDS = (eds: string): string | null => {
  if (!eds) return null;
  const cleanEds = eds.replace(/^0+/, '');
  return EDS_AGENCES[cleanEds] || null;
};
