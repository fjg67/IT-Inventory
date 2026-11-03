import { useEffect, useRef } from 'react';

export interface PhotoPreviewItem {
  name: string;
  url: string;
}

export function PhotoPreview({
  photo,
  onClose,
}: {
  photo: PhotoPreviewItem | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !photo) return;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('.photo-preview__close')?.focus();
    return () => {
      if (dialog.open) dialog.close();
      returnFocus.current?.focus();
    };
  }, [photo]);

  if (!photo) return null;

  return (
    <dialog
      ref={dialogRef}
      className="photo-preview"
      aria-label={`Photo de ${photo.name}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="photo-preview__panel">
        <button className="photo-preview__close" type="button" onClick={onClose} aria-label="Fermer l’aperçu">×</button>
        <img src={photo.url} alt={`Photo agrandie de ${photo.name}`} />
        <strong>{photo.name}</strong>
      </div>
    </dialog>
  );
}
