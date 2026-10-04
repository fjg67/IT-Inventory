import { useState, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Voice from '@react-native-voice/voice';

export const useVoiceRecognition = () => {
  const [transcript, setTranscript]   = useState('');
  const [isListening, setIsListening] = useState(false);
  const [permission, setPermission]   = useState<'granted'|'denied'|'unknown'>('unknown');
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  useEffect(() => {
    Voice.onSpeechStart     = () => setIsListening(true);
    Voice.onSpeechEnd       = () => setIsListening(false);
    Voice.onSpeechResults   = (e) => {
      const best = e.value?.[0] ?? '';
      setTranscript(best);
    };
    Voice.onSpeechPartialResults = (e) => {
      // Mise à jour en temps réel pendant que l'utilisateur parle
      setTranscript(e.value?.[0] ?? '');
    };
    Voice.onSpeechError = (e) => {
      console.warn('Voice error:', e.error);
      setRecognitionError(e.error?.message ?? 'La reconnaissance vocale a échoué.');
      setIsListening(false);
    };

    return () => { 
      Voice.destroy().then(Voice.removeAllListeners); 
    };
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title:   'Contrôle vocal IT-Inventory',
            message: 'L\'application a besoin du micro pour les commandes vocales.',
            buttonPositive: 'Autoriser',
            buttonNegative: 'Refuser',
          }
        );
        const granted = result === PermissionsAndroid.RESULTS.GRANTED;
        setPermission(granted ? 'granted' : 'denied');
        return granted;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    // iOS gère ça différemment, mais l'app est principalement Android
    return true; 
  };

  const startListening = async () => {
    try {
      setTranscript('');
      setRecognitionError(null);
      setIsListening(true);
      await Voice.start('fr-FR'); // Langue : français
    } catch (e) {
      console.error("Erreur démarrage écoute:", e);
      setRecognitionError(e instanceof Error ? e.message : 'Impossible de démarrer le micro.');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error("Erreur arrêt écoute:", e);
    } finally {
      setIsListening(false);
    }
  };

  const cancelListening = async () => {
    try {
      await Voice.cancel();
      setIsListening(false);
      setTranscript('');
      setRecognitionError(null);
    } catch (e) {
      console.error("Erreur annulation écoute:", e);
    }
  };

  return {
    transcript, 
    isListening, 
    permission,
    recognitionError,
    requestPermission, 
    startListening, 
    stopListening, 
    cancelListening,
  };
};
