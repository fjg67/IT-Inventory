class Lightbox {
  constructor() {
    this.overlay = null;
    this.init();
  }

  init() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'lightbox-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', "Capture d'ecran agrandie");
    this.overlay.innerHTML = `
      <button class="lightbox-close" type="button" aria-label="Fermer">✕</button>
      <figure class="lightbox-phone-shell">
        <img class="lightbox-img" src="" alt="">
        <figcaption class="lightbox-caption"></figcaption>
      </figure>
    `;

    document.body.appendChild(this.overlay);

    this.overlay.addEventListener('click', (event) => {
      if (event.target === this.overlay || event.target.classList.contains('lightbox-close')) {
        this.close();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close();
    });

    document.addEventListener('click', (event) => {
      const shell = event.target.closest('.phone-shell');
      if (!shell) return;

      const img = shell.querySelector('.screen-img');
      if (!img || !img.getAttribute('src')) return;

      const caption = shell.closest('figure')?.querySelector('figcaption')?.textContent?.trim() || '';
      this.open(img.getAttribute('src'), img.alt || '', caption);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const shell = document.activeElement;
      if (!shell || !shell.classList.contains('phone-shell')) return;
      const img = shell.querySelector('.screen-img');
      if (!img || !img.getAttribute('src')) return;
      event.preventDefault();
      const caption = shell.closest('figure')?.querySelector('figcaption')?.textContent?.trim() || '';
      this.open(img.getAttribute('src'), img.alt || '', caption);
    });
  }

  open(src, alt, caption) {
    const image = this.overlay.querySelector('.lightbox-img');
    const legend = this.overlay.querySelector('.lightbox-caption');

    image.src = src;
    image.alt = alt;
    legend.textContent = caption;

    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.overlay.querySelector('.lightbox-close').focus();
  }

  close() {
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Lightbox();
});
