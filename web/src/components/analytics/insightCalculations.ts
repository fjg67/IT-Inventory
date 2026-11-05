import type { AnalyticsDay, AnalyticsSummary } from '../../types/inventory';

const numberFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const averageFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const fullDateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeZone: 'UTC' });

export interface AnalyticsInsight {
  id: string;
  title: string;
  value: string;
  detail: string;
  tone: 'neutral' | 'caution';
}

export interface AnalyticsInsights {
  items: AnalyticsInsight[];
  analystMessage: string;
  botState: 'inspecting' | 'searching' | 'warning';
  dayCount: number;
  movementCount: number;
}

export function buildAnalyticsInsights(result: AnalyticsSummary): AnalyticsInsights {
  const { trend } = result;
  const movementCount = trend.reduce((sum, day) => sum + dailyTotal(day), 0);
  const activeDays = trend.filter((day) => dailyTotal(day) > 0).length;

  if (trend.length === 0) {
    return {
      items: [
        {
          id: 'daily-series',
          title: 'Tendance quotidienne',
          value: 'Indisponible',
          detail: 'Aucun détail par jour n’a été renvoyé pour cette période.',
          tone: 'caution',
        },
        {
          id: 'period-total',
          title: 'Total de la période',
          value: numberFormat.format(result.totalMovements),
          detail: 'Mouvements comptabilisés dans le résumé du site.',
          tone: 'neutral',
        },
        {
          id: 'interpretation',
          title: 'Lecture',
          value: 'À confirmer',
          detail: 'Impossible de comparer le rythme journalier sans série quotidienne.',
          tone: 'caution',
        },
      ],
      analystMessage: 'Je ne peux pas établir de tendance quotidienne : le résumé ne contient aucun détail par jour. Le total reste visible, mais il manque la série nécessaire pour comparer l’activité.',
      botState: 'warning',
      dayCount: 0,
      movementCount,
    };
  }

  if (movementCount === 0 && (result.totalMovements > 0 || result.partial)) {
    const limitation = result.partial
      ? 'Les résultats sont partiels; une tendance quotidienne vide ne confirme pas une absence d’activité.'
      : `Le résumé comptabilise ${numberFormat.format(result.totalMovements)} mouvements, mais la série quotidienne est vide.`;
    return {
      items: [
        {
          id: 'daily-series',
          title: 'Tendance quotidienne',
          value: 'À vérifier',
          detail: limitation,
          tone: 'caution',
        },
        {
          id: 'period-total',
          title: 'Total du résumé',
          value: numberFormat.format(result.totalMovements),
          detail: 'Mouvements comptabilisés dans le résumé du site.',
          tone: 'neutral',
        },
        {
          id: 'interpretation',
          title: 'Lecture',
          value: 'Absence non confirmée',
          detail: 'La série reçue ne permet pas de conclure sur l’activité quotidienne.',
          tone: 'caution',
        },
      ],
      analystMessage: `Je ne peux pas conclure à une absence d’activité : ${limitation}`,
      botState: 'warning',
      dayCount: trend.length,
      movementCount,
    };
  }

  if (movementCount === 0) {
    return {
      items: [
        {
          id: 'peak-day',
          title: 'Jour le plus actif',
          value: 'Aucune activité',
          detail: `Aucun mouvement sur les ${numberFormat.format(trend.length)} jours détaillés.`,
          tone: 'neutral',
        },
        {
          id: 'active-days',
          title: 'Jours actifs',
          value: `0 / ${numberFormat.format(trend.length)}`,
          detail: 'Aucune journée ne contient de mouvement dans la série.',
          tone: 'neutral',
        },
        {
          id: 'other-movements',
          title: 'Ajustements et transferts',
          value: '0 ligne',
          detail: 'Aucune ligne de ces types dans la série quotidienne.',
          tone: 'neutral',
        },
      ],
      analystMessage: `Aucun mouvement n’apparaît dans les ${numberFormat.format(trend.length)} jours détaillés. Les tendances se dessineront lorsque de nouvelles opérations seront enregistrées.`,
      botState: 'searching',
      dayCount: trend.length,
      movementCount,
    };
  }

  const peakDay = findPeakDay(trend);
  const otherMovements = trend.reduce((sum, day) => sum + day.adjustments + day.transfers, 0);
  const otherShare = Math.round((otherMovements / movementCount) * 100);
  const pace = result.partial ? null : comparePace(trend);
  const items: AnalyticsInsight[] = [
    {
      id: 'peak-day',
      title: 'Jour le plus actif',
      value: formatDate(peakDay.date),
      detail: `${numberFormat.format(dailyTotal(peakDay))} ligne${dailyTotal(peakDay) === 1 ? '' : 's'} de mouvement enregistrée${dailyTotal(peakDay) === 1 ? '' : 's'}.`,
      tone: 'neutral',
    },
    result.partial
      ? {
          id: 'recent-pace',
          title: 'Rythme récent',
          value: 'Lecture partielle',
          detail: 'Les mouvements les plus anciens ont été tronqués; la comparaison des deux moitiés serait incomplète.',
          tone: 'caution',
        }
      : {
          id: 'recent-pace',
          title: 'Rythme récent',
          value: pace?.value ?? 'Non calculable',
          detail: pace?.detail ?? 'La période ne contient pas assez de jours pour comparer le rythme.',
          tone: 'neutral',
        },
    {
      id: 'other-movements',
      title: 'Ajustements et transferts',
      value: `${numberFormat.format(otherMovements)} / ${numberFormat.format(movementCount)}`,
      detail: otherMovements > 0
        ? `${numberFormat.format(otherMovements)} lignes, soit ${numberFormat.format(otherShare)} % de la série quotidienne.`
        : 'Aucune ligne d’ajustement ou de transfert dans la série quotidienne.',
      tone: 'neutral',
    },
  ];

  const peakSentence = `Le ${formatDate(peakDay.date)}, la série compte le plus de mouvements : ${numberFormat.format(dailyTotal(peakDay))}.`;
  const activeSentence = `${numberFormat.format(activeDays)} jour${activeDays === 1 ? '' : 's'} actif${activeDays === 1 ? '' : 's'} sur ${numberFormat.format(trend.length)}.`;
  const paceSentence = result.partial
    ? 'La période est partielle; je ne compare pas les deux moitiés.'
    : pace?.detail ?? 'Le rythme ne peut pas être comparé sur cette durée.';

  return {
    items,
    analystMessage: `${peakSentence} ${activeSentence} ${paceSentence} Ces tendances comptent des lignes de mouvement, pas des quantités journalières.`,
    botState: result.partial ? 'warning' : 'inspecting',
    dayCount: trend.length,
    movementCount,
  };
}

function comparePace(days: AnalyticsDay[]): { value: string; detail: string } | null {
  if (days.length < 2) return null;
  const split = Math.floor(days.length / 2);
  const earlier = days.slice(0, split);
  const recent = days.slice(split);
  const earlierAverage = averageCount(earlier);
  const recentAverage = averageCount(recent);
  const comparison = `${averageFormat.format(earlierAverage)} / jour au début, ${averageFormat.format(recentAverage)} / jour ensuite.`;

  if (earlierAverage === 0 && recentAverage === 0) return { value: 'Stable', detail: `Aucune activité dans les deux moitiés. ${comparison}` };
  if (earlierAverage === 0) return { value: 'Reprise', detail: `Des mouvements apparaissent dans la seconde moitié. ${comparison}` };
  if (recentAverage === 0) return { value: 'Aucun mouvement récent', detail: `Aucun mouvement dans la seconde moitié. ${comparison}` };

  const change = (recentAverage - earlierAverage) / earlierAverage;
  if (change >= 0.2) return { value: `+${numberFormat.format(Math.round(change * 100))} %`, detail: `Le volume de mouvements par jour a augmenté en seconde moitié. ${comparison}` };
  if (change <= -0.2) return { value: `−${numberFormat.format(Math.round(Math.abs(change) * 100))} %`, detail: `Le volume de mouvements par jour a diminué en seconde moitié. ${comparison}` };
  return { value: 'Stable', detail: `Le rythme est resté proche entre les deux moitiés. ${comparison}` };
}

function averageCount(days: AnalyticsDay[]): number {
  return days.reduce((sum, day) => sum + dailyTotal(day), 0) / days.length;
}

function findPeakDay(days: AnalyticsDay[]): AnalyticsDay {
  return days.reduce((peak, day) => dailyTotal(day) > dailyTotal(peak) ? day : peak);
}

function dailyTotal(day: AnalyticsDay): number {
  return day.entries + day.exits + day.adjustments + day.transfers;
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : fullDateFormat.format(date);
}
