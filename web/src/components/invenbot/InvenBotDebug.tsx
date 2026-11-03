import { InvenBot } from './InvenBot';
import { InvenBotProvider } from './InvenBotProvider';
import { InvenBotStage } from './InvenBotStage';
import { applyInvenBotMotionPreference, type InvenBotMotionPreference } from './motion';
import type { InvenBotBaseState, InvenBotOneShot } from './invenBotQueue';
import { useInvenBot } from './useInvenBot';

export function isInvenBotDebug(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('bot') === 'debug';
  } catch {
    return false;
  }
}

const oneShots: Array<[InvenBotOneShot, string]> = [
  ['wave', 'Coucou'],
  ['success', 'Succès'],
  ['warning', 'Alerte'],
  ['laugh', 'Rire'],
  ['celebrate', 'Salto'],
  ['confused', 'Perplexe'],
  ['found', 'Trouvé'],
  ['shipping', 'Expédier'],
];
const bases: InvenBotBaseState[] = ['idle', 'checking', 'warning', 'sleep', 'searching', 'typing', 'exporting',
  'hot', 'inspecting', 'repairing', 'ready', 'fixing-alert'];
const motions: InvenBotMotionPreference[] = ['full', 'reduced', 'off'];

/** Panneau de debug, visible uniquement avec ?bot=debug. */
export function InvenBotDebugPanel() {
  const bot = useInvenBot();
  return (
    <aside className="invenbot-debug" aria-label="Debug InvenBot">
      <strong>InvenBot · debug</strong>
      <small>état : {bot.state} · base : {bot.base} · animations : {bot.motion}</small>
      <div>
        {oneShots.map(([state, label]) => (
          <button type="button" key={state} onClick={() => bot.play(state)}>{label}</button>
        ))}
      </div>
      <div>
        {bases.map((state) => (
          <button type="button" key={state} aria-pressed={bot.base === state} onClick={() => bot.setBase(state)}>base : {state}</button>
        ))}
      </div>
      <div>
        <button type="button" aria-pressed={bot.look !== null} onClick={() => bot.setLook(bot.look ? null : { x: 0.8, y: 0.6 })}>Curieux</button>
        <button type="button" onClick={() => bot.say('25 références sous le seuil, on regarde ?')}>Bulle</button>
        {motions.map((value) => (
          <button type="button" key={value} aria-pressed={bot.motion === value} onClick={() => applyInvenBotMotionPreference(value)}>{value}</button>
        ))}
      </div>
    </aside>
  );
}

/** Banc d'essai accessible sans connexion (App, ?bot=debug). */
export function InvenBotPlayground() {
  return (
    <InvenBotProvider userName="Florian">
      <main className="invenbot-playground">
        <section className="dashboard-hero invenbot-playground__hero">
          <div className="dashboard-hero__copy">
            <span className="eyebrow">INVENBOT · BANC D’ESSAI</span>
            <h2>InvenBot 2.0</h2>
            <p>Bougez la souris, cliquez sur le bot (5 fois pour le salto) et déclenchez chaque état.</p>
          </div>
          <div className="dashboard-hero__visual">
            <InvenBotStage workshop className="dashboard-hero__mascot" bubbleClassName="dashboard-hero__bubble-slot" />
          </div>
        </section>
        <div className="invenbot-playground__row">
          <span><InvenBot size="small" state="sleep" /> small · sleep</span>
          <span><InvenBot size="small" state="checking" /> small · checking</span>
          <span><InvenBot size="small" state="searching" /> small · searching</span>
          <span><InvenBot size="small" state="exporting" /> small · exporting</span>
          <span><InvenBot size="small" workshop state="hot" /> hot</span>
          <span><InvenBot size="small" workshop state="inspecting" /> inspecting</span>
          <span><InvenBot size="small" workshop state="repairing" /> repairing</span>
          <span><InvenBot size="small" workshop state="ready" /> ready</span>
          <span><InvenBot size="small" workshop state="shipping" eventId={1} /> shipping</span>
          <span><InvenBot size="small" workshop state="fixing-alert" /> fixing-alert</span>
          <span><InvenBot size="mini" /> mini</span>
          <span><InvenBot size="small" variant="png" /> png</span>
        </div>
        <InvenBotDebugPanel />
      </main>
    </InvenBotProvider>
  );
}
