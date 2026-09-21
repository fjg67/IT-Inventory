import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { selectEffectiveSiteId } from '@/store/slices/siteSlice';
import { articleRepository } from '@/database/repositories/articleRepository';
import { getSupabaseClient, tables } from '@/api/supabase';

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

  const { transcript, isListening, startListening, stopListening, cancelListening, requestPermission, permission } = useVoiceRecognition();
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

  const stopAndParse = async () => {
    await stopListening();
    if (!transcript.trim()) {
      setState('idle');
      return;
    }

    setState('processing');

    const rawParsed = parseVoiceCommand(transcript);

    if (rawParsed.actionType === 'unknown' || rawParsed.confidence! < 0.4) {
      setState('error');
      setError({ code: 'PARSE_FAILED', message: `Je n'ai pas compris : "${transcript}"` });
      return;
    }

    // Résolution d'un article
    if (rawParsed.articleName && rawParsed.actionType !== 'site_change') {
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
    if (rawParsed.targetSiteRaw && ['stock_transfert', 'pc_transfert', 'site_change'].includes(rawParsed.actionType)) {
      const siteMatch = findBestSiteMatch(rawParsed.targetSiteRaw, sitesDisponibles);
      if (siteMatch) {
        rawParsed.targetSiteId = siteMatch.site.id;
        rawParsed.targetSiteLabel = siteMatch.site.nom;
      } else {
        setState('error');
        setError({ code: 'NOT_FOUND', message: `Le site de destination "${rawParsed.targetSiteRaw}" est introuvable.` });
        return;
      }
    }

    // Résolution d'un PC (recherche dynamique sur Supabase)
    if (rawParsed.pcHostname && ['pc_panne', 'pc_status', 'pc_transfert'].includes(rawParsed.actionType)) {
      try {
        const supabase = getSupabaseClient();
        const { data: pcRow, error: pcError } = await supabase
          .from('pc_portables')
          .select('id, hostname')
          .ilike('hostname', `%${rawParsed.pcHostname}%`)
          .limit(1)
          .maybeSingle();

        if (pcRow) {
          rawParsed.pcId = pcRow.id;
          rawParsed.pcHostname = pcRow.hostname;
        } else {
          setState('error');
          setError({ code: 'NOT_FOUND', message: `Le PC "${rawParsed.pcHostname}" est introuvable.` });
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
  };

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

  // Stop auto quand l'écoute se termine sans intervention
  useEffect(() => {
    if (!isListening && state === 'listening' && transcript.trim()) {
      stopAndParse();
    }
  }, [isListening]);

  return {
    state, isOpen, parsed, error, result, transcript,
    open, cancel, startVoice, stopAndParse,
    confirmAndExecute,
  };
};
