/* eslint-env browser */
/* global GUIDE_CHAPTERS */

(() => {
  const { guideIcon, renderCapture, chapterLink, renderChapter } =
    window.ITInventoryGuide;
  const chapterNav = document.getElementById('chapter-nav');
  const search = document.getElementById('guide-search');
  const mobileToggle = document.querySelector('.mobile-guide-toggle');
  const guideLayout = document.querySelector('.guide-layout');
  const assistantMessage = document.getElementById('assistant-message');
  const assistantAvatar = document.querySelector('.assistant-avatar');
  let activeChapter = GUIDE_CHAPTERS[0];

  class InvenBotAnimationEngine {
    constructor(element) {
      this.element = element;
      this.state = 'idle';
      this.timer = null;
      this.stateTimer = null;
      this.visible = false;
      this.reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      );
      this.microAnimations = ['breathe', 'peek', 'tilt'];

      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(entries => {
          this.visible = entries[0].isIntersecting;
          this.update();
        });
        this.observer.observe(element);
      } else {
        this.visible = true;
      }

      document.addEventListener('visibilitychange', () => this.update());
      this.reducedMotion.addEventListener?.('change', () => this.update());
      this.update();
    }

    setState(state) {
      window.clearTimeout(this.stateTimer);
      this.state = state;
      this.element.dataset.state = state;
      this.update();
    }

    setStateFor(state, duration, fallbackState) {
      this.setState(state);
      this.stateTimer = window.setTimeout(
        () => this.setState(fallbackState),
        duration,
      );
    }

    update() {
      window.clearTimeout(this.timer);
      delete this.element.dataset.microAnimation;

      if (
        this.state !== 'idle' ||
        !this.visible ||
        document.hidden ||
        this.reducedMotion.matches
      ) {
        return;
      }

      this.timer = window.setTimeout(() => {
        if (
          this.state !== 'idle' ||
          !this.visible ||
          document.hidden ||
          this.reducedMotion.matches
        ) {
          return;
        }

        const index = Math.floor(Math.random() * this.microAnimations.length);
        this.element.dataset.microAnimation = this.microAnimations[index];
        this.timer = window.setTimeout(() => {
          delete this.element.dataset.microAnimation;
          this.update();
        }, 900);
      }, 3200 + Math.random() * 2600);
    }
  }

  const invenBot = new InvenBotAnimationEngine(assistantAvatar);

  function setAssistantMessage(message) {
    assistantMessage.textContent = message;
  }

  function normalizeSearch(value) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('fr')
      .trim();
  }

  function filterChapters() {
    const words = normalizeSearch(search.value).split(/\s+/).filter(Boolean);
    let matches = 0;
    chapterNav.querySelectorAll('a').forEach((link, index) => {
      const chapter = GUIDE_CHAPTERS[index];
      const haystack = normalizeSearch(
        [
          chapter.title,
          chapter.shortTitle,
          chapter.description,
          chapter.keywords,
          ...chapter.steps.map(
            step => `${step.title} ${step.text} ${step.tip || ''}`,
          ),
        ].join(' '),
      );
      const matched = words.every(word => haystack.includes(word));
      link.hidden = !matched;
      if (matched) matches++;
    });
    document.getElementById('chapter-count').textContent = String(matches);
    document.getElementById('search-status').textContent = words.length
      ? matches
        ? `${matches} procédure${matches > 1 ? 's' : ''} trouvée${
            matches > 1 ? 's' : ''
          }.`
        : 'Aucune procédure trouvée. Essayez « scan », « stock » ou « PC ».'
      : '';
    guideLayout.classList.toggle('is-searching', words.length > 0);
    if (words.length) {
      invenBot.setState('searching');
      setAssistantMessage(
        matches
          ? `${matches} procédure${matches > 1 ? 's' : ''} repérée${
              matches > 1 ? 's' : ''
            }.`
          : 'Essayons un autre mot-clé.',
      );
    } else {
      invenBot.setState('idle');
      setAssistantMessage('Choisissez une procédure, je vous accompagne.');
    }
    if (words.length) {
      chapterNav.classList.add('open');
      mobileToggle.setAttribute('aria-expanded', 'true');
    }
  }

  function selectChapter(chapter, moveFocus, animate = false) {
    activeChapter = chapter;
    renderChapter(chapter);
    if (animate) {
      invenBot.setStateFor(
        'checking',
        850,
        search.value.trim() ? 'searching' : 'idle',
      );
    }
    setAssistantMessage('Voici le parcours, étape par étape.');
    chapterNav.querySelectorAll('a').forEach(link => {
      if (link.href.endsWith(`#procedure/${chapter.id}`))
        link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.title = `${chapter.shortTitle} · IT-Inventory, guide pratique`;
    if (moveFocus) {
      document.getElementById('chapter-title').focus({ preventScroll: true });
      document.getElementById('guide').scrollIntoView({ block: 'start' });
      chapterNav.classList.remove('open');
      mobileToggle.setAttribute('aria-expanded', 'false');
    }
  }

  function handleRoute(moveFocus) {
    const hash = window.location.hash;
    const status = document.getElementById('route-status');
    status.hidden = true;
    if (!hash.startsWith('#procedure/')) return;
    const id = hash.slice('#procedure/'.length);
    const chapter = GUIDE_CHAPTERS.find(item => item.id === id);
    if (!chapter) {
      status.textContent =
        'Cette procédure n’existe pas. Choisissez une procédure dans le menu.';
      status.hidden = false;
      document.getElementById('guide').scrollIntoView({ block: 'start' });
      return;
    }
    selectChapter(chapter, moveFocus, chapter !== activeChapter);
  }

  GUIDE_CHAPTERS.forEach(chapter => {
    const link = chapterLink(chapter, 'chapter-link');
    link.prepend(guideIcon(chapter.icon));
    chapterNav.append(link);
  });
  selectChapter(activeChapter, false);
  filterChapters();
  handleRoute(true);
  document
    .querySelectorAll('[data-capture]')
    .forEach(container => renderCapture(container, container.dataset.capture));
  search.addEventListener('input', filterChapters);
  mobileToggle.addEventListener('click', () => {
    const open = mobileToggle.getAttribute('aria-expanded') !== 'true';
    mobileToggle.setAttribute('aria-expanded', String(open));
    chapterNav.classList.toggle('open', open);
  });
  window.addEventListener('hashchange', () => handleRoute(true));
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest('a[href^="#procedure/"]');
    if (link && link.hash === window.location.hash) {
      event.preventDefault();
      selectChapter(activeChapter, true, true);
    }
  });
})();
