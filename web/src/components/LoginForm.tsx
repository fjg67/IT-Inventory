import { useState, type FormEvent } from 'react';
import { InvenBot } from './InvenBot';

export function LoginForm({
  onSubmit,
  busy,
  error,
  serviceError,
}: {
  onSubmit: (password: string) => Promise<void>;
  busy: boolean;
  error: string | null;
  serviceError: string | null;
}) {
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(password);
  }

  return (
    <main className="login-panel">
      <div className="login-panel__top">
        <BrandInline />
        <span className="secure-label">
          <span className="secure-label__dot" />
          Accès sécurisé
        </span>
      </div>

      <div className="login-panel__content">
        <div className="login-intro">
          <InvenBot size="small" state={error ? 'warning' : busy ? 'checking' : 'idle'} />
          <p className="eyebrow">VOTRE ESPACE DE GESTION</p>
          <h1>Content de vous revoir.</h1>
          <p className="login-intro__copy">
            Saisissez le mot de passe partagé pour accéder à votre espace de travail.
          </p>
        </div>

        {serviceError && (
          <div className="notice notice--warning" role="status">
            <span className="notice__icon" aria-hidden="true">!</span>
            <span>{serviceError}</span>
          </div>
        )}
        {error && (
          <div className="notice notice--error" role="alert">
            <span className="notice__icon" aria-hidden="true">!</span>
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Mot de passe</span>
            <span className="field__control">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="10" width="14" height="11" rx="2.5" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
              </svg>
              <input
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Votre mot de passe"
                type="password"
                required
                disabled={busy}
              />
            </span>
          </label>

          <button className="button button--primary login-form__submit" type="submit" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Vérification des accès…
              </>
            ) : (
              <>
                Se connecter
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4 10h12m-5-5 5 5-5 5" />
                </svg>
              </>
            )}
          </button>
        </form>

        <p className="login-panel__privacy">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 2.5 16 5v4.2c0 4-2.5 6.7-6 8.3-3.5-1.6-6-4.3-6-8.3V5l6-2.5Z" />
            <path d="m7.5 9.8 1.7 1.7 3.4-3.6" />
          </svg>
          Votre session est protégée par votre organisation.
        </p>
      </div>

      <p className="login-panel__foot">© IT-Inventory · Gestion de stock informatique</p>
    </main>
  );
}

function BrandInline() {
  return (
    <span className="brand brand--compact">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="m16 3 12 6.5v13L16 29 4 22.5v-13L16 3Z" />
          <path d="M16 16v13M4.5 10 16 16l11.5-6M10 6.3l12 6.5v6" />
        </svg>
      </span>
      <span className="brand__name">IT-Inventory<span>.</span></span>
    </span>
  );
}
