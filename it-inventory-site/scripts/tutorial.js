/* eslint-env browser */
/* global GUIDE_CHAPTERS, GUIDE_CAPTURES */

(() => {
  function guideElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function guideIcon(name) {
    const namespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(namespace, 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
  }

  function renderCapture(container, captureId) {
    const capture = GUIDE_CAPTURES[captureId];
    if (!capture) throw new Error(`Capture inconnue : ${captureId}`);
    container.replaceChildren();

    if (!capture.src) {
      const placeholder = guideElement('div', 'capture-placeholder');
      placeholder.append(
        guideIcon('image'),
        guideElement('strong', '', capture.title),
        guideElement('small', '', 'Capture à réaliser'),
        guideElement('span', 'capture-key', `Repère : ${captureId}`),
      );
      if (capture.pendingReason) {
        placeholder.append(guideElement('small', '', capture.pendingReason));
      }
      container.append(placeholder);
      return;
    }

    const button = guideElement('button', 'capture-open');
    button.type = 'button';
    button.setAttribute('aria-label', `Agrandir : ${capture.title}`);
    button.dataset.captureOpen = captureId;
    const image = guideElement('img', 'capture-image');
    image.alt = capture.alt;
    image.loading = container.closest('.hero') ? 'eager' : 'lazy';
    image.addEventListener('error', () => {
      console.error(
        `Impossible de charger la capture ${captureId} : ${capture.src}`,
      );
      const message = guideElement(
        'p',
        'capture-error',
        `Capture indisponible : ${capture.title}. Le fichier configuré est introuvable ou illisible. Merci de vérifier son chemin.`,
      );
      message.setAttribute('role', 'alert');
      container.replaceChildren(message);
    });
    image.src = capture.src;
    button.append(image, guideElement('span', '', 'Cliquer pour agrandir'));
    container.append(button);
  }

  function chapterLink(chapter, className, label) {
    const link = guideElement('a', className, label || chapter.shortTitle);
    link.href = `#procedure/${chapter.id}`;
    return link;
  }

  function renderChapter(chapter) {
    const content = document.getElementById('tutorial-content');
    const header = guideElement('header', 'chapter-header');
    const topline = guideElement('div', 'chapter-topline');
    const print = guideElement(
      'button',
      'button button-small button-outline',
      'Imprimer',
    );
    print.type = 'button';
    print.prepend(guideIcon('print'));
    print.addEventListener('click', () => window.print());
    topline.append(
      guideElement('span', 'chapter-category', chapter.category),
      print,
    );
    const title = guideElement('h3', '', chapter.title);
    title.id = 'chapter-title';
    title.tabIndex = -1;
    const meta = guideElement(
      'p',
      'chapter-meta',
      `${chapter.steps.length} étapes · Procédure pas à pas`,
    );
    meta.prepend(guideIcon(chapter.icon));
    header.append(
      topline,
      title,
      guideElement('p', 'chapter-description', chapter.description),
      meta,
    );
    const prerequisite = guideElement('div', 'prerequisite');
    prerequisite.append(
      guideElement('strong', '', 'Avant de commencer'),
      guideElement('p', '', chapter.prerequisite),
    );

    const steps = guideElement('ol', 'step-list');
    chapter.steps.forEach((step, index) => {
      const row = guideElement('li', 'tutorial-step');
      const number = guideElement(
        'span',
        'step-number',
        String(index + 1).padStart(2, '0'),
      );
      number.setAttribute('aria-hidden', 'true');
      const body = guideElement('div', 'step-body');
      body.append(
        guideElement('h4', '', step.title),
        guideElement('p', '', step.text),
      );
      if (step.tip) body.append(guideElement('aside', 'step-tip', step.tip));
      if (step.link) {
        const target = GUIDE_CHAPTERS.find(item => item.id === step.link);
        if (!target) throw new Error(`Procédure liée inconnue : ${step.link}`);
        const link = chapterLink(target, 'step-link', step.linkLabel);
        link.append(guideIcon('arrow'));
        body.append(link);
      }
      if (step.capture) {
        const capture = GUIDE_CAPTURES[step.capture];
        const figure = guideElement('figure', 'step-capture');
        const media = guideElement('div', 'capture-media');
        renderCapture(media, step.capture);
        figure.append(
          media,
          guideElement(
            'figcaption',
            '',
            capture.src
              ? `Capture Android · ${capture.title} · Données masquées${
                  capture.note ? ` — ${capture.note}` : ''
                }`
              : `À illustrer · ${capture.title}`,
          ),
        );
        body.append(figure);
      }
      row.append(number, body);
      steps.append(row);
    });

    const result = guideElement('div', 'chapter-result');
    const resultText = guideElement('div');
    resultText.append(
      guideElement('strong', '', 'Le résultat attendu'),
      guideElement('p', '', chapter.result),
    );
    result.append(guideIcon('check'), resultText);
    const footer = guideElement('nav', 'chapter-footer');
    footer.setAttribute('aria-label', 'Procédures précédente et suivante');
    const index = GUIDE_CHAPTERS.indexOf(chapter);
    if (index > 0) {
      const previous = chapterLink(
        GUIDE_CHAPTERS[index - 1],
        'previous-chapter',
      );
      previous.prepend(guideIcon('arrow'));
      footer.append(previous);
    }
    if (index < GUIDE_CHAPTERS.length - 1) {
      const next = chapterLink(GUIDE_CHAPTERS[index + 1], 'next-chapter');
      next.append(guideIcon('arrow'));
      footer.append(next);
    }
    content.replaceChildren(header, prerequisite, steps, result, footer);
  }

  window.ITInventoryGuide = {
    guideElement,
    guideIcon,
    renderCapture,
    chapterLink,
    renderChapter,
  };
})();
