import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { ArticleListItem } from '../types/inventory';
import type { AvailableSite } from '../types/auth';
import { apiMessage } from '../services/apiClient';
import { articleService } from '../services/articleService';
import { movementService, type StockMovementInput } from '../services/movementService';
import { siteService } from '../services/siteService';

const movementOptions: { value: StockMovementInput['type']; label: string; description: string }[] = [
  { value: 'ENTRY', label: 'Entrée', description: 'Ajouter au stock' },
  { value: 'EXIT', label: 'Sortie', description: 'Retirer du stock' },
  { value: 'ADJUSTMENT', label: 'Ajustement', description: 'Saisir le stock compté' },
  { value: 'TRANSFER', label: 'Transfert', description: 'Déplacer vers un site' },
];

type MovementStep = 'article' | 'type' | 'details';
const stepLabels: { id: MovementStep; label: string }[] = [
  { id: 'article', label: 'Article' },
  { id: 'type', label: 'Opération' },
  { id: 'details', label: 'Détails' },
];

export function MovementCreateForm({
  siteId,
  onCancel,
  onSaved,
}: {
  siteId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [destinations, setDestinations] = useState<AvailableSite[]>([]);
  const [articleId, setArticleId] = useState('');
  const [type, setType] = useState<StockMovementInput['type']>('ENTRY');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [destinationSiteId, setDestinationSiteId] = useState('');
  const [search, setSearch] = useState('');
  const [step, setStep] = useState<MovementStep>('article');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedArticle = articles.find((article) => article.id === articleId);
  const filteredArticles = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return articles;
    return articles.filter((article) =>
      `${article.reference} ${article.name} ${article.barcode ?? ''}`
        .toLocaleLowerCase()
        .includes(term),
    );
  }, [articles, search]);
  const parsedQuantity = Number(quantity);
  const projectedStock = type === 'ADJUSTMENT'
    ? parsedQuantity
    : type === 'ENTRY'
      ? (selectedArticle?.quantity ?? 0) + parsedQuantity
      : (selectedArticle?.quantity ?? 0) - parsedQuantity;
  const quantityValid = Number.isSafeInteger(parsedQuantity) &&
    parsedQuantity >= (type === 'ADJUSTMENT' ? 0 : 1) &&
    ((type !== 'EXIT' && type !== 'TRANSFER') || parsedQuantity <= (selectedArticle?.quantity ?? 0));

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    Promise.all([
      articleService.getAll(siteId, { search: '', stock: 'all', scope: 'movement' }, controller.signal),
      siteService.getAvailableSites(controller.signal),
    ])
      .then(([availableArticles, sites]) => {
        if (controller.signal.aborted) return;
        setArticles(availableArticles);
        setArticleId((current) => current || availableArticles[0]?.id || '');
        const childSites = sites.filter((site) => site.parentSiteId === siteId);
        setDestinations(childSites);
        setDestinationSiteId((current) => current || childSites[0]?.id || '');
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(apiMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [siteId]);

  function selectMovementType(nextType: StockMovementInput['type']) {
    setType(nextType);
    setQuantity(nextType === 'ADJUSTMENT' ? String(selectedArticle?.quantity ?? 0) : '1');
    setError(null);
    setStep('details');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedArticle) {
      setError('Sélectionnez un article avant de continuer.');
      setStep('article');
      return;
    }
    if (!quantityValid) {
      setError(type === 'ADJUSTMENT'
        ? 'Le stock compté doit être un entier positif ou nul.'
        : type === 'EXIT' || type === 'TRANSFER'
          ? 'La quantité doit être positive et ne peut pas dépasser le stock disponible.'
          : 'La quantité doit être un entier supérieur à zéro.');
      return;
    }
    if (type === 'TRANSFER' && !destinationSiteId) {
      setError('Aucun site de destination autorisé n’est disponible.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await movementService.create({
        articleId,
        type,
        quantity: parsedQuantity,
        reason: reason.trim(),
        ...(type === 'TRANSFER' ? { destinationSiteId } : {}),
      });
      onSaved();
    } catch (cause) {
      setError(apiMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel movement-create-panel" aria-labelledby="movement-create-heading">
      <div className="panel__heading">
        <div><span className="eyebrow">OPÉRATION DE STOCK</span><h3 id="movement-create-heading">Nouveau mouvement</h3></div>
      </div>
      <p className="notice notice--warning movement-create-warning">
        Le profil technicien est sélectionné dans la session partagée, sans vérification individuelle du titulaire.
      </p>
      <ol className="movement-create-steps" aria-label="Étapes du mouvement">
        {stepLabels.map((item, index) => {
          const activeIndex = stepLabels.findIndex((entry) => entry.id === step);
          return (
            <li className={index <= activeIndex ? 'movement-create-step movement-create-step--active' : 'movement-create-step'} key={item.id}>
              <span>{index + 1}</span>{item.label}
            </li>
          );
        })}
      </ol>
      {loading ? (
        <div className="loading-card"><span className="spinner spinner--green" aria-hidden="true" />Chargement des articles et sites autorisés…</div>
      ) : (
        <form className="movement-create-form" onSubmit={(event) => void submit(event)}>
          {step === 'article' && (
            <div className="movement-create-stage">
              <label className="movement-create-field">
                <span>Rechercher un article par nom, référence ou code-barres</span>
                <input type="search" value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Ex. câble HDMI" disabled={saving} autoFocus />
              </label>
              {filteredArticles.length ? (
                <div className="movement-create-articles" role="radiogroup" aria-label="Articles disponibles">
                  {filteredArticles.map((article) => (
                    <button
                      className={article.id === articleId ? 'movement-create-article movement-create-article--selected' : 'movement-create-article'}
                      type="button"
                      role="radio"
                      aria-checked={article.id === articleId}
                      key={article.id}
                      onClick={() => { setArticleId(article.id); setError(null); }}
                      disabled={saving}
                    >
                      <span><strong>{article.name}</strong><small>{article.reference}{article.location ? ` · ${article.location}` : ''}</small></span>
                      <span className="movement-create-stock">{article.quantity} <small>{article.unit}</small></span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="movement-create-empty">{articles.length ? 'Aucun article ne correspond à la recherche.' : 'Aucun article disponible sur ce site.'}</p>
              )}
            </div>
          )}

          {step === 'type' && (
            <div className="movement-create-stage">
              <div className="movement-create-selected">
                <span>Article sélectionné</span>
                <strong>{selectedArticle?.name}</strong>
                <small>{selectedArticle?.reference} · Stock disponible : {selectedArticle?.quantity} {selectedArticle?.unit}</small>
              </div>
              <div className="movement-create-type-grid" role="group" aria-label="Type de mouvement">
                {movementOptions.map((option) => (
                  <button className="movement-create-type" type="button" key={option.value} onClick={() => selectMovementType(option.value)} disabled={saving}>
                    <strong>{option.label}</strong><span>{option.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && (
            <>
              <div className="movement-create-selected movement-create-field--wide">
                <span>{movementOptions.find((option) => option.value === type)?.label} · {selectedArticle?.reference}</span>
                <strong>{selectedArticle?.name}</strong>
                <small>Stock actuel : {selectedArticle?.quantity} {selectedArticle?.unit}</small>
              </div>
              <label className="movement-create-field">
                <span>{type === 'ADJUSTMENT' ? 'Stock réel compté' : 'Quantité'}</span>
                <input type="number" min={type === 'ADJUSTMENT' ? 0 : 1} max={type === 'EXIT' || type === 'TRANSFER' ? selectedArticle?.quantity : undefined} step="1" value={quantity} onChange={(event) => { setQuantity(event.currentTarget.value); setError(null); }} required disabled={saving} autoFocus />
              </label>
              {type === 'TRANSFER' && (
                <label className="movement-create-field">
                  <span>Site de destination</span>
                  <select value={destinationSiteId} onChange={(event) => setDestinationSiteId(event.currentTarget.value)} required disabled={saving || destinations.length === 0}>
                    {destinations.length === 0 && <option value="">Aucun site rattaché disponible</option>}
                    {destinations.map((site) => <option value={site.id} key={site.id}>{site.name}</option>)}
                  </select>
                </label>
              )}
              <div className={`movement-create-preview${projectedStock < 0 ? ' movement-create-preview--danger' : ''}`} aria-live="polite">
                <span>Stock après opération</span>
                <strong>{Number.isFinite(projectedStock) ? Math.max(0, projectedStock) : '—'} {selectedArticle?.unit}</strong>
                {(type === 'EXIT' || type === 'TRANSFER') && parsedQuantity > (selectedArticle?.quantity ?? 0) && <small>Stock insuffisant pour cette opération.</small>}
              </div>
              <label className="movement-create-field movement-create-field--wide">
                <span>Motif (facultatif)</span>
                <textarea value={reason} onChange={(event) => setReason(event.currentTarget.value)} maxLength={500} rows={2} disabled={saving} />
              </label>
            </>
          )}
          {error && <p className="movement-create-error" role="alert">{error}</p>}
          <div className="movement-create-actions">
            <button className="button button--subtle" type="button" onClick={step === 'article' ? onCancel : () => { setError(null); setStep(step === 'details' ? 'type' : 'article'); }} disabled={saving}>
              {step === 'article' ? 'Annuler' : 'Retour'}
            </button>
            {step === 'article' && <button className="button" type="button" onClick={() => { setError(null); setStep('type'); }} disabled={!selectedArticle || saving}>Continuer</button>}
            {step === 'details' && <button className="button" type="submit" disabled={saving || !selectedArticle || !quantityValid || (type === 'TRANSFER' && destinations.length === 0)}>
              {saving ? 'Enregistrement…' : 'Confirmer le mouvement'}
            </button>}
          </div>
        </form>
      )}
    </section>
  );
}
