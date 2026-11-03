import type { AvailableTechnician } from '../types/auth';
import { apiGet, requireArray, requireRecord, requireString } from './apiClient';

function parseTechnicians(value: unknown): AvailableTechnician[] {
  const record = requireRecord(value);
  return requireArray(record.items, 'technicians').map((item) => {
    const technician = requireRecord(item);
    return {
      id: requireString(technician.id, 'id'),
      name: requireString(technician.name, 'name'),
      role: requireString(technician.role, 'role'),
    };
  });
}

export const technicianService = {
  getForActiveSite(signal?: AbortSignal): Promise<AvailableTechnician[]> {
    return apiGet('/api/technicians', parseTechnicians, signal);
  },
};
