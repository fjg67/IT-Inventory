import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { ArticleListItem } from '../types/inventory';
import type { AvailableSite } from '../types/auth';
import { apiMessage } from '../services/apiClient';
import { articleService } from '../services/articleService';
import { movementService, type StockMovementInput } from '../services/movementService';
import { siteService } from '../services/siteService';
import { ArticlePhoto } from '../components/articles/ArticlePhoto';
import { PhotoPreview, type PhotoPreviewItem } from '../components/articles/PhotoPreview';
import { StockGauge } from '../components/articles/StockGauge';
import { useInvenBotActions } from '../components/invenbot/useInvenBot';

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
const recentArticleIdsBySite = new Map<string, string[]>();
const maxRecentArticles = 5;
const operationBotState: Record<StockMovementInput['type'], 'receiving' | 'dispatching' | 'counting' | 'transferring'> = {
  ENTRY: 'receiving',
  EXIT: 'dispatching',
  ADJUSTMENT: 'counting',
  TRANSFER: 'transferring',
};

export function MovementCreateForm({
  siteId,
  onCancel,
  onSaved,
  onSavingChange,
}: {
  siteId: string;
  onCancel: () => void;
  onSaved: () => void;
  onSavingChange: (saving: boolean) => void;
}) {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [destinations, setDestinations] = useState<AvailableSite[]>([]);
  const [articleId, setArticleId] = useState('');
  const [type, setType] = useState<StockMovementInput['type'] | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [destinationSiteId, setDestinationSiteId] = useState('');
  const [search, setSearch] = useState('');
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const [recentArticleIds, setRecentArticleIds] = useState<string[]>(() => recentArticleIdsBySite.get(siteId) ?? []);
  const [previewPhoto, setPreviewPhoto] = useState<PhotoPreviewItem | null>(null);
  const [step, setStep] = useState<MovementStep>('article');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const botActions = useInvenBotActions();

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
  const activeOption = filteredArticles.find((article) => article.id === activeOptionId);
  const selectedArticleIsVisible = filteredArticles.some((article) => article.id === articleId);
  const activeArticleId = activeOption?.id ?? (selectedArticleIsVisible ? articleId : filteredArticles[0]?.id);
  const recentArticles = recentArticleIds
    .map((id) => articles.find((article) => article.id === id))
    .filter((article): article is ArticleListItem => article !== undefined);
  const parsedQuantity = Number(quantity);
  const projectedStock = type === null
    ? selectedArticle?.quantity ?? 0
    : type === 'ADJUSTMENT'
      ? parsedQuantity
      : type === 'ENTRY'
        ? (selectedArticle?.quantity ?? 0) + parsedQuantity
        : (selectedArticle?.quantity ?? 0) - parsedQuantity;
  const quantityValid = type !== null && Number.isSafeInteger(parsedQuantity) &&
    parsedQuantity >= (type === 'ADJUSTMENT' ? 0 : 1) &&
    ((type !== 'EXIT' && type !== 'TRANSFER') || parsedQuantity <= (selectedArticle?.quantity ?? 0));

  useEffect(() => {
    botActions.setBase(step === 'article' ? 'searching' : type ? operationBotState[type] : 'idle');
    return () => botActions.setBase('idle');
  }, [botActions.setBase, step, type]);

  useEffect(() => {
    if (typeof document === 'undefined' || step !== 'article' || !activeArticleId) return;
    document.getElementById(`movement-article-option-${activeArticleId}`)
      ?.scrollIntoView?.({ block: 'nearest' });
  }, [activeArticleId, step]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setRecentArticleIds(recentArticleIdsBySite.get(siteId) ?? []);
    Promise.all([
      articleService.getAll(siteId, { search: '', stock: 'all', scope: 'movement' }, controller.signal),
      siteService.getAvailableSites(controller.signal),
    ])
      .then(([availableArticles, sites]) => {
        if (controller.signal.aborted) return;
        setArticles(availableArticles);
        setArticleId((current) => current && availableArticles.some((article) => article.id === current)
          ? current
          : availableArticles[0]?.id || '');
        const childSites = sites.filter((site) => site.parentSiteId === siteId);
        setDestinations(childSites);
        setDestinationSiteId((current) => current || childSites[0]?.id || '');
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(apiMessage(cause));
          botActions.play('warning');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [botActions, siteId]);

  function selectArticle(article: ArticleListItem, clearSearch = false) {
    setArticleId(article.id);
    if (clearSearch) setSearch('');
    setActiveOptionId(article.id);
    const recent = [article.id, ...recentArticleIds.filter((id) => id !== article.id)].slice(0, maxRecentArticles);
    recentArticleIdsBySite.set(siteId, recent);
    setRecentArticleIds(recent);
    setError(null);
    botActions.play('found');
    botActions.say(`${article.name} sélectionné.`, { priority: 1 });
  }

  function handleArticleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (filteredArticles.length === 0) return;
      event.preventDefault();
      const currentIndex = filteredArticles.findIndex((article) => article.id === activeArticleId);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (currentIndex + direction + filteredArticles.length) % filteredArticles.length;
      setActiveOptionId(filteredArticles[nextIndex].id);
      return;
    }
    if (event.key === 'Escape' && search) {
      event.preventDefault();
      setSearch('');
      setActiveOptionId(null);
      return;
    }
    if (event.key !== 'Enter') return;

    event.preventDefault();
    const term = search.trim().toLocaleLowerCase();
    const exactScanMatch = term
      ? filteredArticles.find((article) =>
        article.barcode?.trim().toLocaleLowerCase() === term ||
        article.reference.trim().toLocaleLowerCase() === term)
      : undefined;
    const article = exactScanMatch ?? filteredArticles.find((item) => item.id === activeArticleId);
    if (article) {
      selectArticle(article);
      return;
    }
    botActions.play('confused');
    botActions.say('Aucun article ne correspond à ce code.', { priority: 1 });
  }

  function selectMovementType(nextType: StockMovementInput['type']) {
    setType(nextType);
    setQuantity(nextType === 'ADJUSTMENT' ? String(selectedArticle?.quantity ?? 0) : '1');
    setError(null);
    setStep('details');
    const label = movementOptions.find((option) => option.value === nextType)?.label ?? 'Opération';
    botActions.play(nextType === 'ADJUSTMENT' ? 'stamping' : nextType === 'TRANSFER' ? 'shipping' : 'found');
    botActions.say(`${label} : indique les détails du mouvement.`, { priority: 1 });
  }

  function changeQuantityBy(amount: number) {
    const minimum = type === 'ADJUSTMENT' ? 0 : 1;
    const current = Number.isSafeInteger(parsedQuantity) ? parsedQuantity : minimum;
    const maximum = type === 'EXIT' || type === 'TRANSFER' ? selectedArticle?.quantity : undefined;
    const next = Math.max(minimum, current + amount);
    setQuantity(String(maximum === undefined ? next : Math.min(maximum, next)));
    setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedArticle) {
      setError('Sélectionnez un article avant de continuer.');
      setStep('article');
      botActions.play('warning');
      return;
    }
    if (!type) {
      setError('Choisissez un type de mouvement avant de continuer.');
      setStep('type');
      botActions.play('warning');
      return;
    }
    if (!quantityValid) {
      setError(type === 'ADJUSTMENT'
        ? 'Le stock compté doit être un entier positif ou nul.'
        : type === 'EXIT' || type === 'TRANSFER'
          ? 'La quantité doit être positive et ne peut pas dépasser le stock disponible.'
          : 'La quantité doit être un entier supérieur à zéro.');
      botActions.play('warning');
      return;
    }
    if (type === 'TRANSFER' && !destinationSiteId) {
      setError('Aucun site de destination autorisé n’est disponible.');
      botActions.play('warning');
      return;
    }
    setSaving(true);
    onSavingChange(true);
    setError(null);
    try {
      await movementService.create({
        articleId,
        type,
        quantity: parsedQuantity,
        reason: reason.trim(),
        ...(type === 'TRANSFER' ? { destinationSiteId } : {}),
      });
      botActions.play('success');
      botActions.say('Mouvement enregistré.', { priority: 2 });
      onSaved();
    } catch (cause) {
      setError(apiMessage(cause));
      botActions.play('warning');
      botActions.say('Le mouvement n’a pas pu être enregistré.', { priority: 2 });
    } finally {
      setSaving(false);
      onSavingChange(false);
    }
  }

  return (
    <section className="panel movement-create-panel" aria-labelledby="movement-create-heading">
      <header className="movement-create-header">
        <div><span className="eyebrow">OPÉRATION DE STOCK</span><h3 id="movement-create-heading">Nouveau mouvement</h3></div>
      </header>
      <div className="movement-create-scroll">
        <p className="notice notice--warning movement-create-warning">
          Le profil technicien est sélectionné dans la session partagée, sans vérification individuelle du titulaire.
        </p>
        <ol className="movement-create-steps" aria-label="Étapes du mouvement">
          {stepLabels.map((item, index) => {
            const activeIndex = stepLabels.findIndex((entry) => entry.id === step);
            const current = index === activeIndex;
            const completed = index < activeIndex;
            return (
              <li
                className={`movement-create-step${current ? ' movement-create-step--current' : ''}${completed ? ' movement-create-step--completed' : ''}`}
                key={item.id}
              >
                <button
                  type="button"
                  onClick={() => { if (completed && !saving) { setError(null); setStep(item.id); } }}
                  disabled={!completed || saving}
                  aria-current={current ? 'step' : undefined}
                  aria-label={completed ? `${item.label}, terminée. Revenir à cette étape.` : undefined}
                >
                  <span aria-hidden="true">{completed ? '✓' : index + 1}</span>{item.label}
                </button>
              </li>
            );
          })}
        </ol>
        {loading ? (
          <div className="loading-card"><span className="spinner spinner--green" aria-hidden="true" />Chargement des articles et sites autorisés…</div>
        ) : (
          <form id="movement-create-form" className="movement-create-form" onSubmit={(event) => void submit(event)}>
          {step === 'article' && (
            <div className="movement-create-stage">
              <label className="movement-create-field">
                <span>Article, référence ou code-barres</span>
                <input
                  id="movement-article-query"
                  name="movement-article-query"
                  type="search"
                  role="combobox"
                  aria-describedby="movement-article-search-help"
                  aria-autocomplete="list"
                  aria-controls="movement-article-options"
                  aria-expanded={filteredArticles.length > 0}
                  aria-activedescendant={activeArticleId ? `movement-article-option-${activeArticleId}` : undefined}
                  value={search}
                  onChange={(event) => { setSearch(event.currentTarget.value); setActiveOptionId(null); }}
                  onKeyDown={handleArticleSearchKeyDown}
                  placeholder="Référence ou code-barres"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  disabled={saving}
                  autoFocus
                />
              </label>
              <p className="movement-create-help" id="movement-article-search-help">
                Scannez un code-barres ou recherchez par nom ou référence. Flèches pour parcourir, Entrée pour sélectionner.
              </p>
              {recentArticles.length > 0 && (
                <div className="movement-create-recents" aria-label="Articles récemment sélectionnés">
                  <span>Récemment utilisés</span>
                  <div>
                    {recentArticles.map((article) => (
                      <button
                        key={article.id}
                        type="button"
                        aria-pressed={article.id === articleId}
                        onClick={() => selectArticle(article, true)}
                        disabled={saving}
                      >
                        {article.reference} · {article.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {filteredArticles.length ? (
                <div id="movement-article-options" className="movement-create-articles" role="listbox" aria-label="Articles disponibles">
                  {filteredArticles.map((article, index) => (
                    <button
                      id={`movement-article-option-${article.id}`}
                      className={`movement-create-article${article.id === articleId ? ' movement-create-article--selected' : ''}${article.id === activeArticleId ? ' movement-create-article--active' : ''}`}
                      type="button"
                      role="option"
                      aria-selected={article.id === articleId}
                      aria-posinset={index + 1}
                      aria-setsize={filteredArticles.length}
                      tabIndex={-1}
                      key={article.id}
                      onClick={() => selectArticle(article)}
                      onMouseMove={() => setActiveOptionId(article.id)}
                      disabled={saving}
                    >
                      <ArticlePhoto name={article.name} imageUrl={article.imageUrl} />
                      <span><strong>{article.name}</strong><small>{article.reference}{article.location ? ` · ${article.location}` : ''}</small></span>
                      <span className="movement-create-stock">{article.quantity} <small>{article.unit}</small><StockGauge quantity={article.quantity} minimumStock={article.minimumStock} /></span>
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
                {selectedArticle && (
                  <>
                    <ArticlePhoto
                      name={selectedArticle.name}
                      imageUrl={selectedArticle.imageUrl}
                      onPreview={(name, url) => setPreviewPhoto({ name, url })}
                    />
                    <div className="movement-create-selected__details">
                      <span>Article sélectionné</span>
                      <strong>{selectedArticle.name}</strong>
                      <small>{selectedArticle.reference}{selectedArticle.location ? ` · ${selectedArticle.location}` : ''}</small>
                      <span className="movement-create-selected__stock">
                        Stock disponible : {selectedArticle.quantity} {selectedArticle.unit}
                        <StockGauge quantity={selectedArticle.quantity} minimumStock={selectedArticle.minimumStock} />
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="movement-create-type-grid" role="group" aria-label="Type de mouvement">
                {movementOptions.map((option) => {
                  const requiresStock = option.value === 'EXIT' || option.value === 'TRANSFER';
                  const stockEmpty = requiresStock && (selectedArticle?.quantity ?? 0) <= 0;
                  const descriptionId = `movement-type-disabled-${option.value.toLocaleLowerCase('fr-FR')}`;
                  return (
                    <button
                      className={`movement-create-type${type === option.value ? ' movement-create-type--selected' : ''}${stockEmpty ? ' movement-create-type--disabled' : ''}`}
                      type="button"
                      key={option.value}
                      onClick={() => selectMovementType(option.value)}
                      disabled={saving || stockEmpty}
                      aria-describedby={stockEmpty ? descriptionId : undefined}
                      aria-pressed={type === option.value}
                    >
                      <strong>{option.label}</strong><span>{option.description}</span>
                      {stockEmpty && <small id={descriptionId}>Stock vide : rien à {option.value === 'EXIT' ? 'sortir' : 'transférer'}.</small>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'details' && type && (
            <>
              <div className="movement-create-selected movement-create-field--wide">
                {selectedArticle && (
                  <>
                    <ArticlePhoto
                      name={selectedArticle.name}
                      imageUrl={selectedArticle.imageUrl}
                      onPreview={(name, url) => setPreviewPhoto({ name, url })}
                    />
                    <div className="movement-create-selected__details">
                      <span>{movementOptions.find((option) => option.value === type)?.label}</span>
                      <strong>{selectedArticle.name}</strong>
                      <small>{selectedArticle.reference}{selectedArticle.location ? ` · ${selectedArticle.location}` : ''}</small>
                      <span className="movement-create-selected__stock">
                        Stock actuel : {selectedArticle.quantity} {selectedArticle.unit}
                        <StockGauge quantity={selectedArticle.quantity} minimumStock={selectedArticle.minimumStock} />
                      </span>
                    </div>
                  </>
                )}
              </div>
              <label className="movement-create-field">
                <span>{type === 'ADJUSTMENT' ? 'Stock réel compté' : 'Quantité'}</span>
                <span className="movement-create-quantity">
                  <button
                    className="movement-create-quantity__step"
                    type="button"
                    aria-label="Diminuer la quantité"
                    onClick={() => changeQuantityBy(-1)}
                    disabled={saving || !quantityValid || parsedQuantity <= (type === 'ADJUSTMENT' ? 0 : 1)}
                  >
                    −
                  </button>
                  <input
                    className="movement-create-quantity__input"
                    type="number"
                    min={type === 'ADJUSTMENT' ? 0 : 1}
                    max={type === 'EXIT' || type === 'TRANSFER' ? selectedArticle?.quantity : undefined}
                    step="1"
                    inputMode="numeric"
                    value={quantity}
                    onChange={(event) => { setQuantity(event.currentTarget.value); setError(null); }}
                    required
                    disabled={saving}
                    autoFocus
                  />
                  <button
                    className="movement-create-quantity__step"
                    type="button"
                    aria-label="Augmenter la quantité"
                    onClick={() => changeQuantityBy(1)}
                    disabled={saving || !quantityValid && !Number.isSafeInteger(parsedQuantity) || ((type === 'EXIT' || type === 'TRANSFER') && parsedQuantity >= (selectedArticle?.quantity ?? 0))}
                  >
                    +
                  </button>
                </span>
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
          </form>
        )}
      </div>
      <footer className="movement-create-actions">
        <button
          className="button button--subtle"
          type="button"
          onClick={step === 'article' ? onCancel : () => { setError(null); setStep(step === 'details' ? 'type' : 'article'); }}
          disabled={saving}
        >
          {step === 'article' ? 'Annuler' : 'Retour'}
        </button>
        {step === 'article' && (
          <button className="button button--primary" type="button" onClick={() => { setError(null); setStep('type'); }} disabled={!selectedArticle || loading || saving}>
            Continuer
          </button>
        )}
        {step === 'type' && (
          <button className="button button--primary" type="button" disabled>
            Choisir une opération
          </button>
        )}
        {step === 'details' && (
          <button className="button button--primary" type="submit" form="movement-create-form" disabled={saving || loading || !selectedArticle || !type || !quantityValid || (type === 'TRANSFER' && destinations.length === 0)}>
            {saving ? 'Enregistrement…' : 'Confirmer le mouvement'}
          </button>
        )}
      </footer>
      <PhotoPreview photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />
    </section>
  );
}
