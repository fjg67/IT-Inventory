import { getSupabaseClient } from '@/api/supabase';
import { movementPushDispatchService } from '@/services/movementPushDispatchService';
import { getAssetsInStock, isTrackedWorkstation, workstationAssetService } from '@/services/workstationAssetService';

jest.mock('@/api/supabase', () => ({ getSupabaseClient: jest.fn() }));
jest.mock('@/services/movementPushDispatchService', () => ({
  movementPushDispatchService: { dispatchMovementCreated: jest.fn() },
}));

const rpc = jest.fn();

beforeEach(() => {
  rpc.mockReset();
  (getSupabaseClient as jest.Mock).mockReturnValue({ rpc });
  (movementPushDispatchService.dispatchMovementCreated as jest.Mock).mockReset().mockResolvedValue(undefined);
});

it('only tracks the four workstation references', () => {
  for (const reference of ['1800001', '1800002', '1800003', '1800004']) {
    expect(isTrackedWorkstation({ reference })).toBe(true);
  }
  expect(isTrackedWorkstation({ reference: '1800005' })).toBe(false);
  expect(isTrackedWorkstation({ reference: '1100002' })).toBe(false);
});

it('records each scanned asset using the atomic RPC', async () => {
  rpc.mockResolvedValue({ data: { assetCode: 'KSAOP123', quantity: 1, movementId: 'move-1' }, error: null });

  await expect(workstationAssetService.record('article-1', 'site-1', ' ksaop123 ', 'entree', 'user-1'))
    .resolves.toEqual({ assetCode: 'KSAOP123', quantity: 1, movementId: 'move-1' });
  expect(rpc).toHaveBeenCalledWith('record_workstation_asset', {
    p_article_id: 'article-1',
    p_site_id: 'site-1',
    p_asset_code: 'KSAOP123',
    p_direction: 'entree',
    p_user_id: 'user-1',
  });
  expect(movementPushDispatchService.dispatchMovementCreated).toHaveBeenCalledWith({
    movementId: 'move-1', senderUserId: 'user-1',
  });
});

it('surfaces duplicate or missing asset errors without reporting a movement', async () => {
  rpc.mockResolvedValue({ data: null, error: { message: 'Cet asset est déjà en stock' } });
  await expect(workstationAssetService.record('article-1', 'site-1', 'KSAOP123', 'entree', 'user-1'))
    .rejects.toThrow('Cet asset est déjà en stock');
  expect(movementPushDispatchService.dispatchMovementCreated).not.toHaveBeenCalled();
});

it('loads every recorded asset scan across pages for the selected site', async () => {
  const range = jest.fn()
    .mockResolvedValueOnce({
      data: Array.from({ length: 500 }, (_, index) => ({
        id: `move-${index}`, reason: `Asset PC-${index}`, type: 'ENTRY', createdAt: '2026-10-01T10:00:00Z',
      })),
      error: null,
    })
    .mockResolvedValueOnce({
      data: [{ id: 'last', reason: 'Asset PC-LAST', type: 'EXIT', createdAt: '2026-10-01T11:00:00Z' }],
      error: null,
    });
  const query: Record<string, jest.Mock> = {};
  for (const method of ['select', 'eq', 'like', 'order']) query[method] = jest.fn(() => query);
  query.range = range;
  const from = jest.fn(() => query);
  (getSupabaseClient as jest.Mock).mockReturnValue({ rpc, from });

  const history = await workstationAssetService.listHistory('article-1', 'site-1');

  expect(history).toHaveLength(501);
  expect(history[500]).toEqual({ id: 'last', code: 'PC-LAST', direction: 'sortie', createdAt: '2026-10-01T11:00:00Z' });
  expect(query.eq).toHaveBeenCalledWith('fromSiteId', 'site-1');
  expect(range.mock.calls).toEqual([[0, 499], [500, 999]]);
});

it('counts an asset once when it is entered, exited, then entered again', () => {
  const history = [
    { id: '3', code: 'PC-1', direction: 'entree' as const, createdAt: '2026-10-01T12:00:00Z' },
    { id: '2', code: 'PC-1', direction: 'sortie' as const, createdAt: '2026-10-01T11:00:00Z' },
    { id: '1', code: 'PC-1', direction: 'entree' as const, createdAt: '2026-10-01T10:00:00Z' },
    { id: '4', code: 'PC-2', direction: 'sortie' as const, createdAt: '2026-10-01T09:00:00Z' },
  ];
  expect(getAssetsInStock(history).map(item => item.code)).toEqual(['PC-1']);
  expect(history).toHaveLength(4);
});