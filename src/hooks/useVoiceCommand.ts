import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { articleRepository } from '@/database/repositories/articleRepository';

import { useVoiceRecognition } from './useVoiceRecognition';
import { useVoiceAction } from './useVoiceAction';
import { parseVoiceCommand } from '@/services/nlp/commandParser';
import { findBestArticleMatch, findArticleSuggestions, findBestSiteMatch } from '@/services/nlp/articleFuzzyMatcher';
import { ParsedVoiceCommand, VoiceError, VoiceModalState } from '@/types/voice.types';
import { Article } from '@/types/models';

export const useVoiceCommand = () => {
  const [state, setState]       = useState<VoiceModalState>('idle');
  const [parsed, setParsed]     = useState<ParsedVoiceCommand | null>(null);
  const [error, setError]       = useState<VoiceError | null>(null);
  const [result, setResult]     = useState<string | null>(null);
  const [isOpen, setIsOpen]     = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);

  const { transcript, isListening, recognitionError, startListening, stopListening, cancelListening, requestPermission, permission } = useVoiceRecognition();
  const { executeCommand } = useVoiceAction();

  // On récupère le contexte via Redux
  const activeSiteId = useSelector((state: RootState) => selectEffectiveSiteId(state as any));
  const currentUser = useSelector((state: RootState) => state.auth.currentTechnicien);
  const sitesDisponibles = useSelector((state: RootState) => state.site.sitesDisponibles);

  // Charger les articles du site au montage ou changement de site
  useEffect(() => {
    if (activeSiteId) {
      articleRepository.findAll(activeSiteId, 0, 5000)
        .then(res => setArticles(res.data))
        .catch(err => console.error("Erreur chargement articles pour NLP:", err));
    }
  }, [activeSiteId]);

  const open = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        setError({ code: 'NO_PERMISSION', message: 'Permission micro refusée.' });
        return;
      }
    }
    setIsOpen(true);
    setState('idle');
  };

  const startVoice = async () => {
    setState('listening');
    setError(null);
    setParsed(null);
    await startListening();
  };

  const stopAndParse = useCallback(async () => {
    await stopListening();
    if (!transcript.trim()) {
      setState('error');
      setError({ code: 'PARSE_FAILED', message: 'Je n’ai pas entendu de commande. Parle un peu plus fort puis réessaie.' });
      return;
    }

    setState('processing');

    const rawParsed = parseVoiceCommand(transcript);
    const actionType = rawParsed.actionType;

    const movementActions = ['stock_entree', 'stock_sortie', 'stock_ajustement', 'stock_transfert'];
    if (actionType && movementActions.includes(actionType) && !rawParsed.articleName?.trim()) {
      const actionLabel = actionType === 'stock_entree' ? 'une entrée' : actionType === 'stock_sortie' ? 'une sortie' : 'un mouvement';
      setState('error');
      setError({
        code: 'PARSE_FAILED',
        message: `J’ai compris ${actionLabel} de ${rawParsed.quantity ?? 1}, mais il me manque le nom de l’article. Réessaie en disant par exemple : « Ajoute 5 souris au stock ».`,
      });
      return;
    }

    if (actionType === 'unknown' || !actionType || rawParsed.confidence! < 0.4) {
      setState('error');
      setError({ code: 'PARSE_FAILED', message: `Je n'ai pas compris : "${transcript}"` });
      return;
    }

    // Résolution d'un article
    if (rawParsed.articleName && actionType !== 'site_change' && actionType !== 'pc_available_query' && actionType !== 'pc_loan') {
      if (articles.length === 0) {
        setState('error');
        setError({ code: 'NETWORK', message: `Les articles du site ne sont pas encore chargés.` });
        return;
      }

      const match = findBestArticleMatch(rawParsed.articleName, articles);
      if (match) {
        rawParsed.articleId    = String(match.article.id);
        rawParsed.articleLabel = match.article.nom;
        rawParsed.confidence   = rawParsed.confidence! * match.score;
      } else {
        const suggestions = findArticleSuggestions(rawParsed.articleName, articles);
        setState('error');
        setError({
          code:        'NOT_FOUND',
          message:     `Article "${rawParsed.articleName}" non trouvé.`,
          suggestions: suggestions.map(a => a.nom),
        });
        return;
      }
    }

    // Résolution d'un site cible (pour transferts et changement de site)
    const targetSiteRaw = rawParsed.targetSiteRaw;
    if (targetSiteRaw && ['stock_transfert', 'pc_transfert', 'site_change'].includes(actionType)) {
      const siteMatch = findBestSiteMatch(targetSiteRaw, sitesDisponibles);
      if (siteMatch) {
        rawParsed.targetSiteId = siteMatch.site.id;
        rawParsed.targetSiteLabel = siteMatch.site.nom;
      } else {
        setState('error');
        setError({ code: 'NOT_FOUND', message: `Le site de destination "${targetSiteRaw}" est introuvable.` });
        return;
      }
    }

    // Résolution d'un PC (recherche dynamique sur Supabase)
    const pcHostname = rawParsed.pcHostname;
    if (pcHostname && ['pc_panne', 'pc_status', 'pc_transfert', 'pc_loan'].includes(actionType)) {
      try {
        const hostname = pcHostname;
        const pc = await articleRepository.findByReferenceOrBarcode(hostname, activeSiteId!);
        if (pc) {
          rawParsed.pcId = String(pc.id);
          rawParsed.pcHostname = pc.nom;
        } else {
          setState('error');
          setError({ code: 'NOT_FOUND', message: `Le PC "${hostname}" est introuvable.` });
          return;
        }
      } catch (err) {
        console.error("Erreur résolution PC:", err);
      }
    }

    const finalParsed: ParsedVoiceCommand = {
      ...rawParsed as ParsedVoiceCommand,
      siteId:       activeSiteId!,
      executedBy:   currentUser?.id!,
    };

    setParsed(finalParsed);
    setState('confirm');
  }, [activeSiteId, articles, currentUser?.id, sitesDisponibles, stopListening, transcript]);

  const confirmAndExecute = async () => {
    if (!parsed) return;
    setState('executing');

    const resultAction = await executeCommand(parsed);

    if (resultAction.success) {
      setResult(resultAction.message);
      setState('success');
      // Retour automatique après 3s
      setTimeout(() => {
        if (isOpen) {
          setState('idle');
          setIsOpen(false);
        }
      }, 3000);
    } else {
      setState('error');
      setError({ code: 'NETWORK', message: resultAction.message });
    }
  };

  const cancel = async () => {
    await cancelListening();
    setState('idle');
    setIsOpen(false);
  };

  useEffect(() => {
    if (state !== 'listening' || !recognitionError) return;
    setState('error');
    setError({ code: 'NETWORK', message: `La reconnaissance vocale a échoué : ${recognitionError}` });
  }, [recognitionError, state]);

  // Laisser arriver le dernier résultat iOS avant de lancer l'analyse.
  useEffect(() => {
    if (isListening || state !== 'listening' || recognitionError) return;
    const timeout = setTimeout(() => {
      stopAndParse();
    }, 400);
    return () => clearTimeout(timeout);
  }, [isListening, recognitionError, state, stopAndParse, transcript]);

  return {
    state, isOpen, parsed, error, result, transcript,
    open, cancel, startVoice, stopListening, stopAndParse,
    confirmAndExecute,
  };
};
