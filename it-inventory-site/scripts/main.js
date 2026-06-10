const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
const navbar = document.querySelector('.navbar');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navAnchors.forEach((link) => link.classList.remove('active'));
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    });
  },
  { threshold: 0.3 }
);

sections.forEach((section) => sectionObserver.observe(section));

window.addEventListener('scroll', () => {
  if (!navbar) return;
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth > 768) return;
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const revealTargets = document.querySelectorAll('.feature-card, .gallery-row, .tutorial-step, .faq-item');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  },
  { threshold: 0.1 }
);

revealTargets.forEach((el) => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

function setupScreenImages(scope = document) {
  const images = scope.querySelectorAll('.screen-img');

  images.forEach((img) => {
    if (img.dataset.placeholderBound === 'true') return;
    img.dataset.placeholderBound = 'true';

    img.addEventListener('error', function onError() {
      const placeholder = document.createElement('div');
      const altText = this.alt || 'Capture ecran IT-Inventory';

      placeholder.className = 'screen-placeholder';
      placeholder.setAttribute('role', 'img');
      placeholder.setAttribute('aria-label', `Capture d'ecran a venir: ${altText}`);
      placeholder.innerHTML = '<i>📱</i><span>Screenshot<br>a ajouter</span>';

      this.replaceWith(placeholder);
    });
  });
}

window.setupScreenImages = setupScreenImages;
setupScreenImages();
