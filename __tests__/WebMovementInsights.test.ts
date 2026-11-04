import {
  classifyMovementType,
  movementFlowByDay,
  summarizeMovements,
} from '../web/src/components/movements/movementInsights';
import type { MovementListItem } from '../web/src/types/inventory';

function movement(
  id: string,
  type: string,
  quantity: number,
  occurredAt = '2025-03-10T12:00:00.000Z',
): MovementListItem {
  return {
    id,
    type,
    quantity,
    reason: null,
    articleName: 'Câble',
    articleReference: 'CB-01',
    userName: 'Technicien',
    fromSiteName: 'Atelier',
    toSiteName: null,
    occurredAt,
  };
}

describe('movement insights', () => {
  it('normalizes French and English movement types', () => {
    expect(classifyMovementType('ENTRÉE')).toBe('ENTRY');
    expect(classifyMovementType('sortie')).toBe('EXIT');
    expect(classifyMovementType('transfert_arrivee')).toBe('TRANSFER');
    expect(classifyMovementType('UNKNOWN')).toBeNull();
  });

  it('keeps adjustment deltas signed and counts a transfer only once', () => {
    const summary = summarizeMovements([
      movement('entry', 'ENTRY', 4),
      movement('exit', 'EXIT', -3),
      movement('adjustment', 'ADJUSTMENT', -2),
      movement('transfer-out', 'TRANSFER', -6),
      movement('transfer-in', 'TRANSFER', 6),
    ]);

    expect(summary).toEqual({
      entryCount: 1,
      entryQuantity: 4,
      exitCount: 1,
      exitQuantity: 3,
      adjustmentCount: 1,
      adjustmentDelta: -2,
      transferCount: 1,
      transferQuantity: 6,
      netChange: -1,
    });
  });

  it('builds a UTC daily trend without double-counting incoming transfer rows', () => {
    const trend = movementFlowByDay([
      movement('entry', 'ENTRY', 4),
      movement('exit', 'EXIT', -3),
      movement('adjustment', 'ADJUSTMENT', 2),
      movement('transfer-out', 'TRANSFER', -6),
      movement('transfer-in', 'TRANSFER', 6),
      movement('old-entry', 'ENTRY', 1, '2025-02-01T10:00:00.000Z'),
    ], '7days', new Date('2025-03-10T18:00:00.000Z'));

    expect(trend).toHaveLength(7);
    expect(trend[6]).toEqual({
      date: '2025-03-10',
      entries: 1,
      exits: 1,
      adjustments: 1,
      transfers: 1,
    });
    expect(trend[0].date).toBe('2025-03-04');
  });
});
