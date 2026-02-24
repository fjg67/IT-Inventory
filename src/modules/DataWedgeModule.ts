// ============================================
// DATAWEDGE MODULE - IT-Inventory Application
// Intégration scanner Zebra TC22
// ============================================

import { NativeModules, DeviceEventEmitter, Platform } from 'react-native';
import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch } from '@/store';
import { setBarcode, setScanning } from '@/store/slices/scanSlice';

// Configuration DataWedge
const DATAWEDGE_CONFIG = {
  PROFILE_NAME: 'IT-InventoryApp',
  INTENT_ACTION: 'com.it-inventory.SCAN',
  INTENT_CATEGORY: 'android.intent.category.DEFAULT',
  INTENT_DELIVERY: 'broadcast',
  SCANNER_INPUT_PLUGIN: {
    plugin_name: 'BARCODE',
    enabled: true,
    scanner_selection: 'auto',
    decoder_params: {
      // Activer les types de codes-barres courants
      decoder_ean13: true,
      decoder_ean8: true,
      decoder_upca: true,
      decoder_upce0: true,
      decoder_code128: true,
      decoder_code39: true,
      decoder_code93: true,
      decoder_datamatrix: true,
      decoder_qrcode: true,
    },
  },
  INTENT_OUTPUT_PLUGIN: {
    plugin_name: 'INTENT',
    enabled: true,
    intent_output_enabled: true,
    intent_action: 'com.it-inventory.SCAN',
    intent_category: 'android.intent.category.DEFAULT',
    intent_delivery: 2, // Broadcast
  },
};

// Actions DataWedge API
const DW_API = {
  ACTION: 'com.symbol.datawedge.api.ACTION',
  RESULT_ACTION: 'com.symbol.datawedge.api.RESULT_ACTION',
  SOFT_SCAN_TRIGGER: 'com.symbol.datawedge.api.SOFT_SCAN_TRIGGER',
  CREATE_PROFILE: 'com.symbol.datawedge.api.CREATE_PROFILE',
  SET_CONFIG: 'com.symbol.datawedge.api.SET_CONFIG',
  GET_VERSION_INFO: 'com.symbol.datawedge.api.GET_VERSION_INFO',
  SCANNER_STATUS: 'com.symbol.datawedge.api.SCANNER_STATUS',
  ENUMERATE_SCANNERS: 'com.symbol.datawedge.api.ENUMERATE_SCANNERS',
};

// Interface pour les données de scan
export interface ScanData {
  barcode: string;
  symbology: string;
  timestamp: number;
}

// Type du listener
type ScanListener = (data: ScanData) => void;

/**
 * Service DataWedge pour gérer le scanner Zebra
 */
class DataWedgeService {
  private listeners: ScanListener[] = [];
  private isInitialized = false;
  private profileCreated = false;

  /**
   * Initialise le service DataWedge
   */
  async init(): Promise<void> {
    if (this.isInitialized || Platform.OS !== 'android') {
      return;
    }

    console.log('[DataWedge] Initialisation...');

    try {
      // Écouter les intents de scan
      DeviceEventEmitter.addListener(DATAWEDGE_CONFIG.INTENT_ACTION, this.handleScanIntent);
      
      // Écouter aussi le broadcast standard
      DeviceEventEmitter.addListener('datawedge_scan', this.handleScanIntent);

      // Créer le profil DataWedge
      await this.createProfile();

      this.isInitialized = true;
      console.log('[DataWedge] Initialisé avec succès');
    } catch (error) {
      console.error('[DataWedge] Erreur initialisation:', error);
    }
  }

  /**
   * Crée le profil DataWedge pour l'application
   */
  private async createProfile(): Promise<void> {
    if (this.profileCreated) return;

    try {
      // Envoyer l'intent pour créer le profil
      this.sendIntent(DW_API.ACTION, {
        [DW_API.CREATE_PROFILE]: DATAWEDGE_CONFIG.PROFILE_NAME,
      });

      // Configurer le profil
      const profileConfig = {
        PROFILE_NAME: DATAWEDGE_CONFIG.PROFILE_NAME,
        PROFILE_ENABLED: 'true',
        CONFIG_MODE: 'UPDATE',
        PLUGIN_CONFIG: [
          // Configuration du scanner
          {
            PLUGIN_NAME: 'BARCODE',
            RESET_CONFIG: 'true',
            PARAM_LIST: {
              scanner_selection: 'auto',
              scanner_input_enabled: 'true',
            },
          },
          // Configuration de l'output Intent
          {
            PLUGIN_NAME: 'INTENT',
            RESET_CONFIG: 'true',
            PARAM_LIST: {
              intent_output_enabled: 'true',
              intent_action: DATAWEDGE_CONFIG.INTENT_ACTION,
              intent_category: DATAWEDGE_CONFIG.INTENT_CATEGORY,
              intent_delivery: '2', // Broadcast
            },
          },
        ],
        APP_LIST: [
          {
            PACKAGE_NAME: 'com.it-inventoryapp',
            ACTIVITY_LIST: ['*'],
          },
        ],
      };

      this.sendIntent(DW_API.ACTION, {
        [DW_API.SET_CONFIG]: profileConfig,
      });

      this.profileCreated = true;
      console.log('[DataWedge] Profil créé:', DATAWEDGE_CONFIG.PROFILE_NAME);
    } catch (error) {
      console.error('[DataWedge] Erreur création profil:', error);
    }
  }

  /**
   * Envoie un intent à DataWedge
   */
  private sendIntent(action: string, extras: Record<string, unknown>): void {
    try {
      const { SendIntentAndroid } = NativeModules;
      if (SendIntentAndroid) {
        SendIntentAndroid.sendBroadcast(action, extras);
      }
    } catch (error) {
      console.error('[DataWedge] Erreur envoi intent:', error);
    }
  }

  /**
   * Gère les intents de scan reçus
   */
  private handleScanIntent = (intent: any): void => {
    const barcode = intent?.data || intent?.['com.symbol.datawedge.data_string'];
    const symbology = intent?.symbology || intent?.['com.symbol.datawedge.label_type'] || 'UNKNOWN';

    if (barcode) {
      const scanData: ScanData = {
        barcode: barcode.trim(),
        symbology,
        timestamp: Date.now(),
      };

      console.log('[DataWedge] Scan reçu:', scanData);

      // Notifier tous les listeners
      this.listeners.forEach((listener) => {
        try {
          listener(scanData);
        } catch (error) {
          console.error('[DataWedge] Erreur listener:', error);
        }
      });
    }
  };

  /**
   * Démarre un scan manuel (software trigger)
   */
  startScan(): void {
    console.log('[DataWedge] Démarrage scan...');
    this.sendIntent(DW_API.ACTION, {
      [DW_API.SOFT_SCAN_TRIGGER]: 'START_SCANNING',
    });
  }

  /**
   * Arrête le scan en cours
   */
  stopScan(): void {
    console.log('[DataWedge] Arrêt scan...');
    this.sendIntent(DW_API.ACTION, {
      [DW_API.SOFT_SCAN_TRIGGER]: 'STOP_SCANNING',
    });
  }

  /**
   * Bascule l'état du scan
   */
  toggleScan(): void {
    this.sendIntent(DW_API.ACTION, {
      [DW_API.SOFT_SCAN_TRIGGER]: 'TOGGLE_SCANNING',
    });
  }

  /**
   * Ajoute un listener pour les scans
   */
  addListener(listener: ScanListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Supprime tous les listeners
   */
  removeAllListeners(): void {
    this.listeners = [];
  }

  /**
   * Nettoie le service
   */
  destroy(): void {
    DeviceEventEmitter.removeAllListeners(DATAWEDGE_CONFIG.INTENT_ACTION);
    DeviceEventEmitter.removeAllListeners('datawedge_scan');
    this.removeAllListeners();
    this.isInitialized = false;
  }
}

// Instance singleton
export const dataWedgeService = new DataWedgeService();

/**
 * Hook React pour utiliser le scanner
 */
export const useBarcodeScanner = () => {
  const dispatch = useAppDispatch();
  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;

    // Initialiser DataWedge
    dataWedgeService.init();

    // Ajouter le listener
    const unsubscribe = dataWedgeService.addListener((scanData) => {
      if (isActiveRef.current) {
        dispatch(setBarcode(scanData.barcode));
      }
    });

    return () => {
      isActiveRef.current = false;
      unsubscribe();
    };
  }, [dispatch]);

  const startScanning = useCallback(() => {
    dispatch(setScanning(true));
    dataWedgeService.startScan();
  }, [dispatch]);

  const stopScanning = useCallback(() => {
    dispatch(setScanning(false));
    dataWedgeService.stopScan();
  }, [dispatch]);

  const toggleScanning = useCallback(() => {
    dataWedgeService.toggleScan();
  }, []);

  return {
    startScanning,
    stopScanning,
    toggleScanning,
  };
};

export default dataWedgeService;
