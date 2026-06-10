function renderStepScreen(step) {
  if (!step.screenshot) return '';

  return `
    <figure class="phone-frame phone-frame--small tutorial-step-media">
      <div class="phone-shell" role="button" tabindex="0" aria-label="Agrandir la capture ${step.screenLabel || step.title}">
        <div class="phone-btn phone-btn--vol"></div>
        <div class="phone-btn phone-btn--power"></div>
        <div class="phone-notch"></div>
        <div class="phone-screen">
          <img class="screen-img" src="${step.screenshot}" alt="${step.screenshotAlt || step.title}" loading="lazy">
          ${step.screenLabel ? `<span class="screen-badge">${step.screenLabel}</span>` : ''}
        </div>
      </div>
      <figcaption class="phone-caption">${step.screenLabel || 'Capture ecran'}</figcaption>
    </figure>
  `;
}

function renderChapter(chapterId) {
  const chapter = SCREENS_DATA[chapterId];
  if (!chapter) return;

  document.querySelectorAll('.tuto-tab').forEach((tab) => {
    const active = tab.dataset.chapter === chapterId;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });

  const content = document.getElementById('tutorial-content');
  if (!content) return;

  content.innerHTML = `
    <h3 class="tutorial-chapter-title">${chapter.icon} ${chapter.title}</h3>
    <div>
      ${chapter.steps
        .map(
          (step) => `
          <article class="tutorial-step">
            <div class="step-num">${step.num}</div>
            <div class="tutorial-step-body">
              <h4 class="step-title">${step.title}</h4>
              <p class="step-desc">${step.desc}</p>
              ${step.tip ? `<div class="step-tip"><span>💡</span><span>${step.tip}</span></div>` : ''}
              ${
                step.playLink
                  ? `<a class="step-play-link" href="${step.playLink}" target="_blank" rel="noopener noreferrer">Telecharger l'app sur Google Play</a>`
                  : ''
              }
            </div>
            ${renderStepScreen(step)}
          </article>
        `
        )
        .join('')}
    </div>
  `;

  if (typeof window.setupScreenImages === 'function') {
    window.setupScreenImages(content);
  }
}

document.querySelectorAll('.tuto-tab').forEach((tab) => {
  tab.addEventListener('click', () => renderChapter(tab.dataset.chapter));
});

renderChapter('install');
