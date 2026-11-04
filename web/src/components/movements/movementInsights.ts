import type { MovementListItem } from '../../types/inventory';

export type MovementFilterType = 'all' | 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'TRANSFER';
export type MovementFlowType = Exclude<MovementFilterType, 'all'>;

export interface MovementFlowDay {
  date: string;
  entries: number;
  exits: number;
  adjustments: number;
  transfers: number;
}

export interface MovementInsights {
  entryCount: number;
  entryQuantity: number;
  exitCount: number;
  exitQuantity: number;
  adjustmentCount: number;
  adjustmentDelta: number;
  transferCount: number;
  transferQuantity: number;
  netChange: number;
}

export function classifyMovementType(type: string): MovementFlowType | null {
  switch (type.toLocaleUpperCase('fr-FR')) {
    case 'ENTRY':
    case 'ENTREE':
    case 'ENTRÉE':
      return 'ENTRY';
    case 'EXIT':
    case 'SORTIE':
      return 'EXIT';
    case 'ADJUSTMENT':
    case 'AJUSTEMENT':
      return 'ADJUSTMENT';
    case 'TRANSFER':
    case 'TRANSFERT':
    case 'TRANSFERT_DEPART':
    case 'TRANSFERT_ARRIVEE':
      return 'TRANSFER';
    default:
      return null;
  }
}

export function summarizeMovements(items: MovementListItem[]): MovementInsights {
  const summary: MovementInsights = {
    entryCount: 0,
    entryQuantity: 0,
    exitCount: 0,
    exitQuantity: 0,
    adjustmentCount: 0,
    adjustmentDelta: 0,
    transferCount: 0,
    transferQuantity: 0,
    netChange: 0,
  };

  for (const item of items) {
    const type = classifyMovementType(item.type);
    if (type === 'ENTRY') {
      summary.entryCount += 1;
      summary.entryQuantity += Math.abs(item.quantity);
      summary.netChange += Math.abs(item.quantity);
    } else if (type === 'EXIT') {
      summary.exitCount += 1;
      summary.exitQuantity += Math.abs(item.quantity);
      summary.netChange -= Math.abs(item.quantity);
    } else if (type === 'ADJUSTMENT') {
      summary.adjustmentCount += 1;
      summary.adjustmentDelta += item.quantity;
      summary.netChange += item.quantity;
    } else if (type === 'TRANSFER' && item.quantity < 0) {
      summary.transferCount += 1;
      summary.transferQuantity += Math.abs(item.quantity);
    }
  }

  return summary;
}

export function movementFlowByDay(
  items: MovementListItem[],
  period: '7days' | '30days' | 'all',
  now = new Date(),
): MovementFlowDay[] {
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  const dayCount = period === '7days' ? 7 : 30;
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (dayCount - 1));
  const counts = new Map<string, MovementFlowDay>();

  for (const item of items) {
    const type = classifyMovementType(item.type);
    if (!type || (type === 'TRANSFER' && item.quantity >= 0)) continue;
    const date = new Date(item.occurredAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = date.toISOString().slice(0, 10);
    const day = counts.get(key) ?? { date: key, entries: 0, exits: 0, adjustments: 0, transfers: 0 };
    if (type === 'ENTRY') day.entries += 1;
    else if (type === 'EXIT') day.exits += 1;
    else if (type === 'ADJUSTMENT') day.adjustments += 1;
    else day.transfers += 1;
    counts.set(key, day);
  }

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return counts.get(key) ?? { date: key, entries: 0, exits: 0, adjustments: 0, transfers: 0 };
  });
}
