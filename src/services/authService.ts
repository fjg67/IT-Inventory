// ============================================
// AUTH SERVICE - Connexion premium Supabase
// IT-Inventory Application
// ============================================

// bcryptjs : comparaison mot de passe (nécessite npm install bcryptjs)
import * as bcrypt from 'bcryptjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient, tables } from '@/api/supabase';
import { LoginAttempts } from '@/utils/loginAttempts';

const SESSION_KEY = '@it-inventory/auth';
const USER_SESSION_KEY = '@it-inventory/user_session';

// Identifiants de test (à utiliser uniquement en dev)
// Identifiant : administrateur  |  Mot de passe : !*A1Z2E3R4T5!

export interface TechnicienLogin {
  id: string;
  matricule: string;
  nom: string;
  prenom?: string;
  email?: string;
  role?: string;
  actif: boolean;
}

export interface LoginResult {
  success: true;
  technicien: TechnicienLogin;
}

export interface LoginError {
  success: false;
  error: string;
}

export type LoginResponse = LoginResult | LoginError;

export const AuthService = {
  async login(matricule: string, password: string): Promise<LoginResponse> {
    const locked = await LoginAttempts.isLocked(matricule);
    if (locked.locked) {
      return {
        success: false,
        error: `Trop de tentatives. Réessayez dans ${locked.remainingMinutes} minute(s).`,
      };
    }

    try {
      const supabase = getSupabaseClient();
      const matriculeTrim = matricule.trim();

      // Requête sur la table User (colonnes: id, technicianId, name, password)
      let result = await supabase
        .from(tables.techniciens)
        .select('id, technicianId, name, password')
        .eq('technicianId', matriculeTrim)
        .maybeSingle();

      const { data: row, error } = result;

      if (error) {
        console.error('[AuthService] Supabase error:', error);
        await LoginAttempts.recordAttempt(matricule);
        return {
          success: false,
          error: 'Erreur de connexion au serveur.',
        };
      }

      const hash = (row as any)?.password;
      if (!row || !hash) {
        await LoginAttempts.recordAttempt(matricule);
        return { success: false, error: 'Identifiant ou mot de passe incorrect.' };
      }

      const isValid = bcrypt.compareSync(password, hash);
      if (!isValid) {
        await LoginAttempts.recordAttempt(matricule);
        return { success: false, error: 'Identifiant ou mot de passe incorrect.' };
      }

      await LoginAttempts.resetAttempts(matricule);

      const technicien: TechnicienLogin = {
        id: row.id,
        matricule: (row as any).technicianId,
        nom: (row as any).name,
        actif: true,
      };

      return { success: true, technicien };
    } catch (e) {
      console.error('[AuthService] Login error:', e);
      await LoginAttempts.recordAttempt(matricule);
      return { success: false, error: 'Une erreur est survenue.' };
    }
  },

  async saveSession(technicien: TechnicienLogin, rememberMe: boolean): Promise<void> {
    if (rememberMe) {
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(technicien));
    } else {
      await AsyncStorage.removeItem(USER_SESSION_KEY);
    }
  },

  async getStoredSession(): Promise<TechnicienLogin | null> {
    const raw = await AsyncStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  async clearSession(): Promise<void> {
    await AsyncStorage.removeItem(USER_SESSION_KEY);
  },
};
