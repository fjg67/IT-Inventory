import { createContext } from 'react';
import type { InvenBotBaseState, InvenBotOneShot, InvenBotState } from './invenBotQueue';
import type { InvenBotMotionPreference } from './motion';

export type InvenBotLook = { x: number; y: number; curious?: boolean } | null;
export type InvenBotBubbleMessage = { id: number; text: string };

export interface InvenBotContextValue {
  /** État affiché : one-shot en cours, sinon curiosité, sinon état de base. */
  state: InvenBotState;
  /** Change à chaque one-shot, même si le même état est rejoué. */
  eventId: number;
  base: InvenBotBaseState;
  look: InvenBotLook;
  bubble: InvenBotBubbleMessage | null;
  motion: InvenBotMotionPreference;
  firstName: string | null;
  play: (state: InvenBotOneShot, options?: { priority?: number; duration?: number }) => void;
  setBase: (state: InvenBotBaseState) => void;
  setLook: (look: InvenBotLook) => void;
  say: (text: string, options?: { priority?: number; duration?: number }) => void;
  dismissBubble: () => void;
  stop: () => void;
}

export type InvenBotActions = Pick<InvenBotContextValue, 'play' | 'setBase' | 'setLook' | 'say' | 'dismissBubble' | 'stop'>;

const noop = () => undefined;

export const InvenBotContext = createContext<InvenBotContextValue>({
  state: 'idle',
  eventId: 0,
  base: 'idle',
  look: null,
  bubble: null,
  motion: 'full',
  firstName: null,
  play: noop,
  setBase: noop,
  setLook: noop,
  say: noop,
  dismissBubble: noop,
  stop: noop,
});

/** Actions seules, références stables : s'y abonner ne re-rend pas à chaque changement d'état du bot. */
export const InvenBotActionsContext = createContext<InvenBotActions>({
  play: noop,
  setBase: noop,
  setLook: noop,
  say: noop,
  dismissBubble: noop,
  stop: noop,
});
