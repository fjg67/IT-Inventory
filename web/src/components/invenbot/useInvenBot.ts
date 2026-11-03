import { useContext } from 'react';
import { InvenBotActionsContext, InvenBotContext } from './invenBotContext';

export function useInvenBot() {
  return useContext(InvenBotContext);
}

/** Actions stables (play, say, setBase, setLook…) sans abonnement à l'état du bot. */
export function useInvenBotActions() {
  return useContext(InvenBotActionsContext);
}
