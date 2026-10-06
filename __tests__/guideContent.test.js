/** @jest-environment node */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const sharp = require('sharp');

const sitePath = path.join(__dirname, '..', 'it-inventory-site');
const context = { window: {} };
vm.runInNewContext(
  fs.readFileSync(path.join(sitePath, 'scripts', 'screens-data.js'), 'utf8'),
  context,
);
const chapters = context.window.GUIDE_CHAPTERS;
const captures = context.window.GUIDE_CAPTURES;
const html = fs.readFileSync(path.join(sitePath, 'index.html'), 'utf8');

it('provides ten unique procedures with prerequisites, steps and expected results', () => {
  expect(chapters).toHaveLength(10);
  const ids = chapters.map(chapter => chapter.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const chapter of chapters) {
    expect(chapter.id).toMatch(/^[a-z0-9-]+$/);
    for (const field of [
      'title',
      'shortTitle',
      'description',
      'prerequisite',
      'result',
      'category',
    ]) {
      expect(chapter[field].trim().length).toBeGreaterThan(0);
    }
    expect(html).toContain(`id="i-${chapter.icon}"`);
    expect(chapter.steps.length).toBeGreaterThanOrEqual(3);
    for (const step of chapter.steps) {
      expect(step.title.trim().length).toBeGreaterThan(0);
      expect(step.text.trim().length).toBeGreaterThan(0);
      if (step.link) expect(ids).toContain(step.link);
      if (step.capture) expect(captures[step.capture]).toBeDefined();
    }
  }
});

it('uses explicit pending captures or real local files, never broken placeholder URLs', () => {
  const referenced = new Set(['accueil']);
  chapters.forEach(chapter =>
    chapter.steps.forEach(step => {
      if (step.capture) referenced.add(step.capture);
    }),
  );
  for (const [id, capture] of Object.entries(captures)) {
    expect(referenced.has(id)).toBe(true);
    expect(capture.title.trim().length).toBeGreaterThan(0);
    expect(capture.alt.trim().length).toBeGreaterThan(0);
    if (capture.src !== null) {
      expect(capture.src).toMatch(
        /^assets\/screens\/[a-zA-Z0-9._/-]+\.(png|jpe?g|webp)$/,
      );
      const resolved = path.resolve(sitePath, capture.src);
      expect(
        resolved.startsWith(
          path.join(sitePath, 'assets', 'screens') + path.sep,
        ),
      ).toBe(true);
      expect(fs.existsSync(resolved)).toBe(true);
    }
  }
});

it('loads only existing local resources and valid procedure deep links', () => {
  const resources = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)];
  for (const [, resource] of resources) {
    expect(resource).not.toMatch(/^https?:/);
    expect(fs.existsSync(path.join(sitePath, resource))).toBe(true);
  }
  for (const [, id] of html.matchAll(/href="#procedure\/([^"]+)"/g)) {
    expect(chapters.some(chapter => chapter.id === id)).toBe(true);
  }
});

it('provides eighteen readable PNG captures and explicitly explains pending screens', async () => {
  const configured = Object.entries(captures).filter(
    ([, capture]) => capture.src !== null,
  );
  expect(configured).toHaveLength(18);
  for (const [id, capture] of Object.entries(captures)) {
    if (capture.src === null) {
      expect(['connexion', 'vocal']).toContain(id);
      expect(capture.pendingReason.trim().length).toBeGreaterThan(0);
      continue;
    }
    const metadata = await sharp(path.join(sitePath, capture.src)).metadata();
    expect(metadata.format).toBe('png');
    expect(metadata.width).toBe(900);
    expect(metadata.height).toBeGreaterThan(1000);
    expect(metadata.exif).toBeUndefined();
  }
  const adjustment = chapters.find(chapter => chapter.id === 'ajustement');
  expect(adjustment.steps[1].capture).toBe('ajustement');
  expect(adjustment.steps[2].capture).toBe('ajustement-recapitulatif');
});
