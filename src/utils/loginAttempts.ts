// ============================================
// LOGIN ATTEMPTS - Protection brute force
// IT-Inventory Application
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const STORAGE_PREFIX = '@it-inventory/login_attempts_';

export interface LockStatus {
  locked: boolean;
  remainingMinutes?: number;
}

export const LoginAttempts = {
  async recordAttempt(matricule: string): Promise<number> {
    const key = `${STORAGE_PREFIX}${matricule}`;
    const data = await AsyncStorage.getItem(key);
    const attempts = data ? JSON.parse(data) : { count: 0, timestamp: Date.now() };
    attempts.count += 1;
    attempts.timestamp = Date.now();
    await AsyncStorage.setItem(key, JSON.stringify(attempts));
    return attempts.count;
  },

  async resetAttempts(matricule: string): Promise<void> {
    await AsyncStorage.removeItem(`${STORAGE_PREFIX}${matricule}`);
  },

  async isLocked(matricule: string): Promise<LockStatus> {
    const key = `${STORAGE_PREFIX}${matricule}`;
    const data = await AsyncStorage.getItem(key);
    if (!data) return { locked: false };
    const attempts = JSON.parse(data);
    const timeSinceLastAttempt = Date.now() - attempts.timestamp;
    if (attempts.count >= MAX_ATTEMPTS && timeSinceLastAttempt < LOCKOUT_DURATION) {
      return {
        locked: true,
        remainingMinutes: Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 60000),
      };
    }
    if (timeSinceLastAttempt >= LOCKOUT_DURATION) {
      await this.resetAttempts(matricule);
    }
    return { locked: false };
  },
};
