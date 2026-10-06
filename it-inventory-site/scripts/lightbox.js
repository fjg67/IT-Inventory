/* eslint-env browser */
/* global GUIDE_CAPTURES */

const captureDialog = document.getElementById('capture-dialog');
const dialogImage = document.getElementById('dialog-image');
let captureTrigger = null;

document.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const trigger = event.target.closest('[data-capture-open]');
  if (!trigger) return;
  const capture = GUIDE_CAPTURES[trigger.dataset.captureOpen];
  if (!capture || !capture.src) throw new Error('Capture non configurée.');
  captureTrigger = trigger;
  document.getElementById('capture-dialog-title').textContent = capture.title;
  document.getElementById('dialog-caption').textContent = `${
    capture.alt
  } · Capture Android, données masquées.${
    capture.note ? ` ${capture.note}` : ''
  }`;
  dialogImage.alt = capture.alt;
  dialogImage.src = capture.src;
  captureDialog.showModal();
});
dialogImage.addEventListener('error', () => {
  document.getElementById('dialog-caption').textContent =
    'Erreur : la capture ne peut pas être chargée. Vérifiez le fichier configuré.';
  console.error(`Impossible d’agrandir la capture : ${dialogImage.src}`);
});
document
  .getElementById('close-capture')
  .addEventListener('click', () => captureDialog.close());
captureDialog.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    captureDialog.close();
  }
});
captureDialog.addEventListener('click', event => {
  if (event.target !== captureDialog) return;
  const bounds = captureDialog.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  ) {
    captureDialog.close();
  }
});
captureDialog.addEventListener('close', () => {
  if (captureTrigger?.isConnected) captureTrigger.focus();
  dialogImage.removeAttribute('src');
});
